#!/usr/bin/env python3
"""probe — one handshake + tools/list + map_status against a root, through a minimal stdio client.

  probe.py [--server gabe-map|gabe-kdbp] [root]     (root defaults to the current directory)

Prints the tool names and the map_status text the server returns. Read-only; emits nothing
(GABE_MAP_NO_EMIT is set for the child). Exit 0 when the server answered, 2 when it did not.
"""
from __future__ import annotations
import json
import os
import select
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))


def main() -> int:
    argv = sys.argv[1:]
    server_name = "gabe-map"
    if "--server" in argv:
        i = argv.index("--server"); server_name = argv[i + 1]; argv = argv[:i] + argv[i + 2:]
    server = os.path.join(HERE, "server.py") if server_name == "gabe-map" else os.path.join(HERE, "..", "..", server_name, "scripts", "server.py")
    first_tool = "map_status" if server_name == "gabe-map" else "kdbp_snapshot"
    root = os.path.abspath(argv[0] if argv else os.getcwd())
    env = dict(os.environ, CLAUDE_PROJECT_DIR=root, GABE_MAP_NO_EMIT="1")
    p = subprocess.Popen([sys.executable, server], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=env)
    buf = b""

    def send(o):
        p.stdin.write((json.dumps(o) + "\n").encode()); p.stdin.flush()

    def recv(timeout=15.0):
        nonlocal buf
        end = time.time() + timeout
        while time.time() < end:
            if b"\n" in buf:
                line, buf = buf.split(b"\n", 1)
                if line.strip():
                    return json.loads(line)
                continue
            r, _, _ = select.select([p.stdout], [], [], 0.3)
            if r:
                chunk = os.read(p.stdout.fileno(), 65536)
                if not chunk:
                    return None
                buf += chunk
        return None

    def ask(method, params=None, id_=1):
        send({"jsonrpc": "2.0", "id": id_, "method": method, **({"params": params} if params is not None else {})})
        while True:
            m = recv()
            if m is None:
                return None
            if "method" in m and "id" in m:          # the server's roots/list
                send({"jsonrpc": "2.0", "id": m["id"], "result": {"roots": [{"uri": "file://" + root}]}})
                continue
            if m.get("id") == id_:
                return m

    try:
        init = ask("initialize", {"protocolVersion": "2025-11-25", "capabilities": {"roots": {"listChanged": True}},
                                  "clientInfo": {"name": "gabe-map-probe", "version": "0"}}, 1)
        if not init or "result" not in init:
            print("probe: no initialize reply"); return 2
        send({"jsonrpc": "2.0", "method": "notifications/initialized"})
        tools = ask("tools/list", None, 2) or {}
        names = [t["name"] for t in (tools.get("result") or {}).get("tools") or []]
        print("tools: %d (%s)" % (len(names), " · ".join(names)))
        st = ask("tools/call", {"name": first_tool, "arguments": {"root": root}}, 3) or {}
        text = "".join(c.get("text", "") for c in ((st.get("result") or {}).get("content") or []))
        print(text)
        return 0
    finally:
        try:
            p.stdin.close(); p.wait(timeout=5)
        except Exception:
            p.kill()


if __name__ == "__main__":
    sys.exit(main())
