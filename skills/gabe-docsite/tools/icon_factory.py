"""PixelLab batch icon generator for the D96 catalog baseline (Phase 49).

Reads data/icons/manifest.json (a list of icon jobs), generates each missing icon via
the PixelLab pixflux HTTP API, and writes PNGs under apps/web/public/generated-icons/.
Maintains a GENERATION LEDGER at data/icons/ledger.json — every API call that reaches
the provider counts (success, retry, or reject) against the hard budget (D96-rev:
≤1500 generations; the account's prepaid plan is 2000/month).

Manifest entry:
    { "id": "dish:chile-empanadas-de-pino", "out": "prepared/chile/chile-empanadas-de-pino.png",
      "prompt": "Chilean baked empanada...", "width": 64, "height": 64,
      "negative": "text, letters, watermark, blurry, photo, frame, border" }

Behavior:
- RESUMABLE: jobs whose output file already exists are skipped (use --redo <id> to force).
- Budget: --budget (default 1500) is checked BEFORE each call; the script stops cleanly
  at the cap and reports what remains.
- Concurrency: --workers (default 2) — PixelLab enforces a per-account MAX CONCURRENT
  JOBS limit; exceeding it 429s. CRITICAL (learned 2026-06-11): an HTTP timeout on our
  side ORPHANS the server-side job, which keeps occupying a concurrency slot — orphans
  saturate the account and deadlock all later requests. Therefore the call timeout is
  LONG (600s — never abandon a slow job) and 429 means "slots busy": wait 60s and retry
  without burning ledger (a 429 never reached the model).
- Ledger counts: 2xx (generated) and timeouts/5xx (unknown server-side state —
  conservative). 4xx are NOT counted (the model never ran).
- Key: env PIXELLAB_SECRET (never logged).

Usage (repo root):
    PIXELLAB_SECRET=... python3 scripts/icon_factory.py            # full run
    PIXELLAB_SECRET=... python3 scripts/icon_factory.py --limit 6  # probe
"""

from __future__ import annotations

import argparse
import base64
import concurrent.futures as cf
import json
import os
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

REPO = Path(__file__).resolve().parents[1]
MANIFEST = REPO / "data" / "icons" / "manifest.json"
LEDGER = REPO / "data" / "icons" / "ledger.json"
OUT_ROOT = REPO / "apps" / "web" / "public" / "generated-icons"
API = "https://api.pixellab.ai/v1/generate-image-pixflux"
ICON_STYLE_PATH = REPO / "data" / "icons" / "icon-style.json"


def _load_icon_style() -> dict[str, Any]:
    """The CANONICAL chip-icon style (data/icons/icon-style.json) — the single source of truth so
    every generation matches the existing ingredient set instead of drifting to a richer / over-
    rendered ('high-resolution-looking') style. Falls back to the medium house defaults if absent."""
    defaults = {
        "width": 32, "height": 32, "no_background": True,
        "outline": "selective outline", "shading": "medium shading", "detail": "medium detail",
        "text_guidance_scale": 8,
        "negative": "text, letters, watermark, blurry, photo, frame, border",
    }
    try:
        return {**defaults, **json.loads(ICON_STYLE_PATH.read_text())}
    except (OSError, ValueError):
        return defaults


STYLE = _load_icon_style()

_lock = threading.Lock()


def _load_ledger() -> dict[str, Any]:
    if LEDGER.exists():
        return json.loads(LEDGER.read_text())
    return {"generations_used": 0, "jobs": {}}


def _save_ledger(ledger: dict[str, Any]) -> None:
    LEDGER.write_text(json.dumps(ledger, indent=1, ensure_ascii=False))


def _call_pixellab(secret: str, job: dict[str, Any]) -> bytes:
    # Defaults come from the canonical STYLE (data/icons/icon-style.json) so generations don't drift;
    # a job may still override any single field explicitly (e.g. a DISH sets width/height 64).
    payload = {
        "description": job["prompt"],
        "negative_description": job.get("negative", STYLE["negative"]),
        "image_size": {
            "width": job.get("width", STYLE["width"]),
            "height": job.get("height", STYLE["height"]),
        },
        "no_background": job.get("no_background", STYLE["no_background"]),
        "outline": job.get("outline", STYLE["outline"]),
        "shading": job.get("shading", STYLE["shading"]),
        "detail": job.get("detail", STYLE["detail"]),
        "text_guidance_scale": job.get("text_guidance_scale", STYLE["text_guidance_scale"]),
    }
    # curl with TCP keepalive (PROVEN fix, 2026-06-11): generations run 1-3+ min with ZERO
    # bytes on the wire while the GPU works — the WSL2 NAT silently drops idle mappings,
    # so a plain urllib request "never returns" even though the server completed it.
    # --keepalive-time 15 sends TCP keepalive probes that hold the mapping open.
    # 900s max-time: never abandon a slow job (abandonment orphans the server-side job,
    # which occupies one of the account's scarce concurrency slots).
    proc = subprocess.run(
        [
            "curl", "-s", "--http1.1", "--keepalive-time", "15", "--max-time", "900",
            "-X", "POST", API,
            "-H", f"Authorization: Bearer {secret}",
            "-H", "Content-Type: application/json",
            "-d", json.dumps(payload),
            "-w", "\n%{http_code}",
        ],
        capture_output=True, text=True, timeout=920,
    )
    out = proc.stdout.rsplit("\n", 1)
    status = out[1].strip() if len(out) == 2 else "000"
    if status != "200":
        if status in {"000", ""}:
            raise TimeoutError(f"curl exit {proc.returncode}, no response")
        raise urllib.error.HTTPError(API, int(status), out[0][:200], None, None)  # type: ignore[arg-type]
    body = json.loads(out[0])
    b64 = body["image"]["base64"]
    return base64.b64decode(b64)


def _run_job(
    secret: str, job: dict[str, Any], ledger: dict[str, Any], budget: int,
) -> str:
    out_path = OUT_ROOT / job["out"]
    job_id = job["id"]
    busy_waits = 0
    attempt = 0
    while attempt < 2:
        with _lock:
            if ledger["generations_used"] >= budget:
                return "budget_exhausted"
        try:
            png = _call_pixellab(secret, job)
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_bytes(png)
            with _lock:
                ledger["generations_used"] += 1  # the model ran: count it
                ledger["jobs"][job_id] = {"status": "ok", "attempts": attempt + 1}
                _save_ledger(ledger)
            return "ok"
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                # Concurrency slots busy (possibly our own orphans draining) — the model
                # never ran, so NO ledger burn. Wait and retry, up to ~30 min per job.
                busy_waits += 1
                if busy_waits > 30:
                    with _lock:
                        ledger["jobs"][job_id] = {"status": "busy_gave_up", "attempts": attempt}
                        _save_ledger(ledger)
                    return "busy_gave_up"
                time.sleep(60)
                continue
            # Other 4xx = payload/account problem; model never ran — no burn, no retry.
            with _lock:
                ledger["jobs"][job_id] = {"status": f"http_{exc.code}", "attempts": attempt + 1}
                _save_ledger(ledger)
            if exc.code < 500:
                return f"http_{exc.code}"
            # 5xx: server-side state unknown — count conservatively, one retry.
            attempt += 1
            with _lock:
                ledger["generations_used"] += 1
                ledger["jobs"][job_id] = {"status": f"http_{exc.code}", "attempts": attempt}
                _save_ledger(ledger)
            time.sleep(15)
        except Exception as exc:  # timeout/network — job may be orphaned server-side
            attempt += 1
            with _lock:
                ledger["generations_used"] += 1  # unknown server state: count it
                ledger["jobs"][job_id] = {"status": f"error:{type(exc).__name__}", "attempts": attempt}
                _save_ledger(ledger)
            if attempt >= 2:
                return f"error:{type(exc).__name__}"
            # An orphan may now hold a slot — give it time to finish before retrying.
            time.sleep(120)
    return "error:retries_exhausted"


def main() -> int:
    global OUT_ROOT, LEDGER
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--budget", type=int, default=1500)
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--limit", type=int, default=0, help="only run the first N missing jobs")
    parser.add_argument("--redo", action="append", default=[], help="job id to regenerate")
    parser.add_argument("--manifest", type=str, default=str(MANIFEST), help="manifest json path")
    parser.add_argument("--out-root", type=str, default=str(OUT_ROOT), help="output dir for PNGs")
    parser.add_argument("--ledger", type=str, default=str(LEDGER), help="ledger json path")
    args = parser.parse_args()

    secret = os.environ.get("PIXELLAB_SECRET", "").strip()
    if not secret:
        print("PIXELLAB_SECRET not set", file=sys.stderr)
        return 2
    OUT_ROOT = Path(args.out_root)
    LEDGER = Path(args.ledger)
    OUT_ROOT.mkdir(parents=True, exist_ok=True); LEDGER.parent.mkdir(parents=True, exist_ok=True)
    jobs: list[dict[str, Any]] = json.loads(Path(args.manifest).read_text())
    ledger = _load_ledger()

    pending = [
        j for j in jobs
        if j["id"] in args.redo or not (OUT_ROOT / j["out"]).exists()
    ]
    if args.limit:
        pending = pending[: args.limit]
    print(
        f"jobs: {len(jobs)} total, {len(pending)} pending | "
        f"ledger: {ledger['generations_used']} generations used | budget: {args.budget}"
    )
    if not pending:
        print("Nothing to do.")
        return 0

    results: dict[str, int] = {}
    done = 0
    with cf.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(_run_job, secret, j, ledger, args.budget): j for j in pending}
        for fut in cf.as_completed(futures):
            status = fut.result()
            results[status] = results.get(status, 0) + 1
            done += 1
            if done % 25 == 0 or status != "ok":
                print(f"[{done}/{len(pending)}] {futures[fut]['id']}: {status} "
                      f"(used {ledger['generations_used']})", flush=True)

    print(f"\nDONE. results: {results} | generations used: {ledger['generations_used']}")
    failed = [jid for jid, j in ledger["jobs"].items() if j["status"] != "ok"]
    if failed:
        print(f"failed jobs ({len(failed)}): {failed[:20]}{'…' if len(failed) > 20 else ''}")
    return 0 if results.get("ok", 0) == len(pending) else 1


if __name__ == "__main__":
    raise SystemExit(main())
