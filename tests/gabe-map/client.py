#!/usr/bin/env python3
"""A minimal MCP stdio test client for the gabe-map battery (and manual probing).

Every read has a deadline (a hung pipe fails the battery instead of hanging the doctor). Speaks the
subset the server implements: initialize → notifications/initialized → (answers the server's
roots/list) → tools/list → tools/call. Never used by the server itself.

  client.py <server.py> <root> list                       # tool names
  client.py <server.py> <root> call <tool> '<json args>'   # prints the result text
  client.py <server.py> <root> raw '<json-rpc line>' ...   # sends raw lines after the handshake, prints replies
Env: CLIENT_PROTOCOL (default 2025-11-25) · CLIENT_NO_INIT=1 (skip the handshake) · CLIENT_TIMEOUT (s, default 20)
"""
from __future__ import annotations
import json
import os
import select
import subprocess
import sys
import time

TIMEOUT = float(os.environ.get("CLIENT_TIMEOUT", "20"))


class Client:
    def __init__(self, server: str, root: str | None = None, env: dict | None = None, cwd: str | None = None):
        e = dict(os.environ)
        e.pop("CLAUDE_PROJECT_DIR", None)
        if root:
            e["CLAUDE_PROJECT_DIR"] = root
        if env:
            e.update(env)
        self.p = subprocess.Popen([sys.executable, server], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE, env=e, cwd=cwd or os.getcwd())
        self.buf = b""
        self.next_id = 0
        self.root = root
        self.server_requests: list[dict] = []
        self.stderr_tail = b""

    def send_raw(self, line: str):
        self.p.stdin.write((line.rstrip("\n") + "\n").encode("utf-8"))
        self.p.stdin.flush()

    def send(self, obj: dict):
        self.send_raw(json.dumps(obj))

    def read_line(self, timeout: float = TIMEOUT) -> dict | None:
        deadline = time.time() + timeout
        while True:
            if b"\n" in self.buf:
                line, self.buf = self.buf.split(b"\n", 1)
                if line.strip():
                    try:
                        return json.loads(line)
                    except json.JSONDecodeError:
                        return {"_raw": line.decode("utf-8", "replace")}
                continue
            rem = deadline - time.time()
            if rem <= 0:
                return None
            r, _, _ = select.select([self.p.stdout], [], [], min(rem, 0.5))
            if r:
                chunk = os.read(self.p.stdout.fileno(), 65536)
                if not chunk:
                    return None
                self.buf += chunk
            elif self.p.poll() is not None and not self.buf:
                return None

    def request(self, method: str, params: dict | None = None, id_=None, timeout: float = TIMEOUT) -> dict | None:
        """Send a request and return ITS response, answering any server→client request on the way."""
        if id_ is None:
            self.next_id += 1
            id_ = self.next_id
        msg = {"jsonrpc": "2.0", "id": id_, "method": method}
        if params is not None:
            msg["params"] = params
        self.send(msg)
        deadline = time.time() + timeout
        while time.time() < deadline:
            m = self.read_line(deadline - time.time())
            if m is None:
                return None
            if "method" in m and "id" in m:                 # a server request (roots/list)
                self.server_requests.append(m)
                if m["method"] == "roots/list":
                    roots = [{"uri": "file://" + self.root}] if self.root else []
                    self.send({"jsonrpc": "2.0", "id": m["id"], "result": {"roots": roots}})
                else:
                    self.send({"jsonrpc": "2.0", "id": m["id"], "error": {"code": -32601, "message": "unsupported"}})
                continue
            if m.get("id") == id_:
                return m
        return None

    def initialize(self, protocol: str | None = None) -> dict | None:
        protocol = protocol or os.environ.get("CLIENT_PROTOCOL", "2025-11-25")
        r = self.request("initialize", {"protocolVersion": protocol, "capabilities": {"roots": {"listChanged": True}},
                                        "clientInfo": {"name": "gabe-map-battery", "version": "0"}})
        self.send({"jsonrpc": "2.0", "method": "notifications/initialized"})
        # give the server a moment to ask for roots, and answer it
        m = self.read_line(1.0)
        if m and "method" in m and "id" in m and m["method"] == "roots/list":
            self.server_requests.append(m)
            roots = [{"uri": "file://" + self.root}] if self.root else []
            self.send({"jsonrpc": "2.0", "id": m["id"], "result": {"roots": roots}})
        elif m is not None:
            self.buf = json.dumps(m).encode() + b"\n" + self.buf
        return r

    def tools(self) -> list[dict]:
        r = self.request("tools/list") or {}
        return (r.get("result") or {}).get("tools") or []

    def call(self, name: str, args: dict | None = None) -> tuple[str, bool, dict | None]:
        r = self.request("tools/call", {"name": name, "arguments": args or {}}, timeout=TIMEOUT * 3)
        if r is None:
            return "", True, None
        if "error" in r:
            return json.dumps(r["error"]), True, r
        res = r.get("result") or {}
        text = "".join(c.get("text", "") for c in res.get("content") or [] if c.get("type") == "text")
        return text, bool(res.get("isError")), r

    def close(self):
        try:
            self.p.stdin.close()
            self.p.wait(timeout=5)
        except Exception:
            self.p.kill()
        try:
            self.stderr_tail = self.p.stderr.read()[-4000:]
        except Exception:
            pass


def parse_text(text: str) -> dict | None:
    """The server's text = one header line + JSON; return the JSON."""
    nl = text.find("\n")
    try:
        return json.loads(text[nl + 1:]) if nl >= 0 else None
    except json.JSONDecodeError:
        return None


def main(argv: list[str]) -> int:
    if len(argv) < 3:
        sys.stderr.write(__doc__)
        return 1
    server, root, mode = argv[0], argv[1], argv[2]
    c = Client(server, root if root != "-" else None)
    try:
        if not os.environ.get("CLIENT_NO_INIT"):
            init = c.initialize()
            if init is None:
                print("no initialize reply", file=sys.stderr)
                return 2
        if mode == "list":
            for t in c.tools():
                print(t["name"], "—", t.get("description", "")[:100])
        elif mode == "call":
            text, is_err, _ = c.call(argv[3], json.loads(argv[4]) if len(argv) > 4 else {})
            print(text)
            if is_err:
                print("[isError]", file=sys.stderr)
        elif mode == "raw":
            for line in argv[3:]:
                c.send_raw(line)
                m = c.read_line(5)
                print(json.dumps(m) if m is not None else "<no reply>")
        else:
            return 1
    finally:
        c.close()
        if c.stderr_tail and os.environ.get("CLIENT_SHOW_STDERR"):
            sys.stderr.write(c.stderr_tail.decode("utf-8", "replace"))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
