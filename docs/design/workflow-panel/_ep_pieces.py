"""_ep_pieces.py — the countable PIECES an endpoint form is built from (leftovers piece 7: how common each piece is).

One function, read by two scripts: `gen-endpoint-facts.py` tallies the pieces over this app's endpoints, and
`gen-pieces-digest.py` tallies the same keys over the four study apps into a small committed digest (their feeds live
under ~/.cache, outside the repo). A piece is (family, key, words): the key is what is counted, the words are what a
reader sees. Nothing here grades — a count says how ordinary a piece is in an app, never whether it is good."""
from __future__ import annotations

SWITCH_WORDS = {"binding": "picks an implementation by a binding", "value": "picks a value from a setting", "flag": "a setting turns a check on or off"}
CATCH_WORDS = {"translate": "turns a failure into its own answer", "pass-through": "lets a failure pass through a catch", "swallow": "swallows a failure", "rollback": "rolls back on a failure"}


def pieces_of(ep: dict) -> list[tuple[str, str, str]]:
    """Every countable piece of one endpoint form, each once: (family, key, words)."""
    out: dict[str, tuple[str, str, str]] = {}

    def put(family: str, key: str, words: str) -> None:
        out.setdefault(f"{family}:{key}", (family, f"{family}:{key}", words))

    if ep.get("method"):
        put("method", str(ep["method"]), f"a {ep['method']}")
    for r in (ep.get("produced") or []) + (ep.get("framework_exits") or []) + (ep.get("returns") or []):
        if r.get("status") is not None:
            put("status", str(r["status"]), f"can answer {r['status']}")
    if ep.get("framework_exits"):
        put("body", "reads", "reads a request body")
    for w in ep.get("switches") or []:
        k = w.get("kind") or "unknown"
        put("switch", k, SWITCH_WORDS.get(k, f"a {k} switch"))
    for c in (ep.get("failure") or {}).get("catches") or []:
        k = c.get("outcome") or "unknown"
        put("catch", k, CATCH_WORDS.get(k, f"a catch that ends in {k}"))
    for r in (ep.get("responses") or {}).values():
        if isinstance(r, dict) and r.get("media"):
            md = r["media"]      # `unknown` and `n/a` are the feed's own state words, said in full
            put("media", md, "an answer whose type the reading could not tell" if md == "unknown" else "an answer with no body" if md == "n/a" else f"answers as {md}")
    rate = ep.get("rate") or {}
    names = sorted({str(l.get("limiter") or l.get("class") or "?") for l in rate.get("limits") or []})
    put("rate", "+".join(names) if names else "none", ("limited by " + " and ".join(names)) if names else "no rate limit read")
    rep = ep.get("repeat") or {}
    if rep.get("key"):
        put("repeat", "key", "reads a repeat key")
    for cl in rep.get("claims") or []:
        for idiom in cl.get("idioms") or []:
            put("repeat", "idiom:" + idiom, f"claims its key with {idiom}")
    auth = ep.get("auth") or {}
    for sc in auth.get("schemes") or []:
        put("auth", "scheme:" + str(sc.get("scheme")), f"asks for a {sc.get('scheme')} login")
    if not (auth.get("schemes") or auth.get("gates")):
        put("auth", "none", "no login read")
    if auth.get("provisions"):
        put("auth", "provisions", "its login check can create a row")
    return sorted(out.values(), key=lambda t: t[1])


def tally(endpoints: dict) -> dict[str, int]:
    """key → how many endpoint forms carry it."""
    n: dict[str, int] = {}
    for ep in endpoints.values():
        for _, key, _ in pieces_of(ep):
            n[key] = n.get(key, 0) + 1
    return dict(sorted(n.items()))


def word_for(n: int, of: int) -> str:
    """The plain word for a count — a rule, stated once: the norm = at least 9 in 10 · common = more than 1 in 10 · rare = at most 1 in 10 · only here = 1."""
    if of <= 0:
        return "not measured"
    if n <= 1:
        return "only here"
    share = n / of
    return "the norm" if share >= 0.9 else ("rare" if share <= 0.1 else "common")


def proof_rank(endpoints: dict, ID: str) -> dict:
    """How much of this endpoint a test names, against the others: endings a test names · endings the code can produce · its place."""
    rows = {k: (sum(1 for r in (e.get("produced") or []) if r.get("tests")), len(e.get("produced") or [])) for k, e in endpoints.items()}
    mine = rows.get(ID) or (0, 0)
    tested = sorted(t for t, _ in rows.values())
    ahead, ties = sum(1 for t, _ in rows.values() if t > mine[0]), sum(1 for t, _ in rows.values() if t == mine[0])
    return {"tested": mine[0], "produced": mine[1], "rank": 1 + ahead, "rank_to": ahead + ties, "ties": ties, "of": len(rows),
            "median_tested": tested[len(tested) // 2] if tested else 0, "most_tested": tested[-1] if tested else 0, "none": sum(1 for t in tested if t == 0),
            "app": {"tested": sum(t for t, _ in rows.values()), "produced": sum(p for _, p in rows.values())},
            "rule": "ranked by how many of its produced endings a test names; endpoints that tie share the places from `rank` to `rank_to`"}


def common_block(fj: dict, ID: str, digest: dict | None, app: str) -> dict:
    """`feedwide.pieces` for one endpoint: each piece it carries with its count in this app and in the other study apps,
    the pieces nearly every endpoint carries and this one does not, and the rate-tier split."""
    eps = fj.get("endpoints") or {}
    of = len(eps)
    counts = tally(eps)
    mine = pieces_of(eps.get(ID) or {})
    others = []
    for name, a in sorted(((digest or {}).get("apps") or {}).items()):
        if name != app:
            others.append((name, a))

    def elsewhere(key: str) -> list[dict]:
        return [{"app": name, "state": a.get("state"), "n": (a.get("pieces") or {}).get(key, 0) if a.get("state") == "present" else None,
                 "of": a.get("endpoints"), "why": a.get("why")} for name, a in others]
    rows = [{"family": fam, "key": key, "words": words, "n": counts.get(key, 0), "of": of, "share": round(100 * counts.get(key, 0) / of) if of else None,
             "word": word_for(counts.get(key, 0), of), "elsewhere": elsewhere(key)} for fam, key, words in mine]
    rows.sort(key=lambda r: (r["n"], r["key"]))
    have = {r["key"] for r in rows}
    words_of = {}
    for ep in eps.values():
        for _, key, words in pieces_of(ep):
            words_of.setdefault(key, words)
    missing = [{"key": k, "words": words_of.get(k, k), "n": n, "of": of, "share": round(100 * n / of)} for k, n in counts.items() if k not in have and of and n / of >= 0.9]
    tiers = sorted(((k.split(":", 1)[1], n) for k, n in counts.items() if k.startswith("rate:")), key=lambda kv: -kv[1])
    return {"of": of, "rows": rows, "missing_norms": missing, "rate_tiers": [{"tier": t, "n": n} for t, n in tiers],
            "by_word": {w: sum(1 for r in rows if r["word"] == w) for w in ("only here", "rare", "common", "the norm")},
            "digest": "present" if digest else "not_emitted",
            "rule": "the norm = at least 9 endpoints in 10 carry it · rare = at most 1 in 10 · only here = this endpoint alone · common = everything between; a count, never a grade"}
