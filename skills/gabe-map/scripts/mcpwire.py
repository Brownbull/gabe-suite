#!/usr/bin/env python3
"""mcpwire — the suite's stdio MCP framework (stdlib only), shared by gabe-map and gabe-kdbp.

A server = a NAME + a VERSION + a tools module exposing TOOLS (list of {name, description,
inputSchema, annotations}), INSTRUCTIONS (the routing block) and call(name, args, roots) →
(result_dict, is_error). Everything else — framing, routing by shape, version negotiation,
roots, one-text-channel results, pre-initialize handling — lives here once.

Wire laws (verified against Claude Code 2.1.257/258; design record docs/design/gabe-map/README.md §5):
- newline-delimited JSON-RPC 2.0 on the ORIGINAL fd 1; fd 1 itself is re-pointed at stderr at startup
  so nothing else (prints, children) can corrupt the wire; stderr = log (GABE_MAP_LOG=1 verbose).
- routing by SHAPE: method+id → request · method, no id → notification (never answered) · id, no
  method → a response to OUR request (roots/list). Unknown method → -32601 with the id echoed
  verbatim (string ids preserved — `server/discover` arrives first under auto negotiation); a
  malformed line is logged and skipped; EOF → exit 0.
- initialize echoes the client's protocolVersion when supported, else 2025-11-25; `instructions`
  carries the routing block (the discovery surface — schemas are always deferred by the harness).
- tools/call returns ONE text block (the harness hides text when structuredContent is present).
- nothing heavy before initialize is answered; data loads lazily on the first call.
"""
from __future__ import annotations
import json
import os
import sys
import traceback
from urllib.parse import unquote, urlparse

SUPPORTED = ("2025-11-25", "2025-06-18")
LATEST = SUPPORTED[0]


def log(msg: str) -> None:
    if os.environ.get("GABE_MAP_LOG"):
        sys.stderr.write("mcpwire: %s\n" % msg)


class Wire:
    """Owns the real stdout fd; everything else writes to stderr."""

    def __init__(self):
        self.fd = os.dup(1)
        os.dup2(2, 1)                       # fd 1 → stderr for prints and children
        sys.stdout = sys.stderr

    def send(self, obj: dict) -> None:
        data = (json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n").encode("utf-8")
        view = memoryview(data)
        while view:
            n = os.write(self.fd, view)
            view = view[n:]


def _err(id_, code, message, data=None):
    e = {"code": code, "message": message}
    if data is not None:
        e["data"] = data
    return {"jsonrpc": "2.0", "id": id_, "error": e}


def _result(id_, result):
    return {"jsonrpc": "2.0", "id": id_, "result": result}


def render(server: str, name: str, result: dict) -> str:
    head = "%s · %s" % (server, name)
    st = result.get("map")
    if st:
        head += " · " + st
    elif result.get("present") is False:
        head += " · no map" if server == "gabe-map" else " · no .kdbp"
    return head + "\n" + json.dumps(result, indent=1, ensure_ascii=False, default=str)


class Server:
    def __init__(self, name: str, version: str, tools):
        self.name, self.version, self.tools = name, version, tools
        self.wire = Wire()
        self.initialized = False
        self.roots: list[str] = []
        self.client_caps: dict = {}
        self.srv_id = 0

    # ── server → client requests ──
    def request_roots(self):
        if not isinstance(self.client_caps.get("roots"), dict):
            return
        self.srv_id += 1
        self.wire.send({"jsonrpc": "2.0", "id": "srv-%d" % self.srv_id, "method": "roots/list"})

    def on_response(self, msg: dict):
        if str(msg.get("id", "")).startswith("srv-") and "result" in msg:
            roots = []
            for r in (msg["result"] or {}).get("roots") or []:
                uri = r.get("uri") or ""
                if uri.startswith("file://"):
                    roots.append(unquote(urlparse(uri).path))
            if roots:
                self.roots = roots
                log("roots: %s" % roots)
        elif "error" in msg:
            log("client error reply: %s" % msg.get("error"))

    # ── client → server ──
    def on_request(self, msg: dict):
        id_, method, params = msg.get("id"), msg.get("method"), msg.get("params") or {}
        if not isinstance(params, dict):
            params = {}
        if method == "ping":
            return self.wire.send(_result(id_, {}))
        if method == "initialize":
            req = params.get("protocolVersion")
            ver = req if req in SUPPORTED else LATEST
            self.client_caps = params.get("capabilities") or {}
            return self.wire.send(_result(id_, {
                "protocolVersion": ver,
                "capabilities": {"tools": {}},
                "serverInfo": {"name": self.name, "version": self.version},
                "instructions": self.tools.INSTRUCTIONS}))
        if not self.initialized:
            if method in ("tools/list", "tools/call"):
                return self.wire.send(_err(id_, -32602, "server not initialized"))
            return self.wire.send(_err(id_, -32601, "method not found (pre-initialize): %s" % method))
        if method == "tools/list":
            return self.wire.send(_result(id_, {"tools": [
                {"name": t["name"], "description": t["description"], "inputSchema": t["inputSchema"], "annotations": t["annotations"]}
                for t in self.tools.TOOLS]}))
        if method == "tools/call":
            name = params.get("name")
            if not isinstance(name, str) or name not in self.tools.BY_NAME:
                return self.wire.send(_err(id_, -32602, "unknown tool: %r" % (name,)))
            args = params.get("arguments") or {}
            if not isinstance(args, dict):
                return self.wire.send(_err(id_, -32602, "arguments must be an object"))
            try:
                result, is_error = self.tools.call(name, args, self.roots)
            except Exception as exc:  # a tool body bug must never kill the server
                log("tool %s crashed: %s\n%s" % (name, exc, traceback.format_exc()))
                result, is_error = {"tool": name, "error": "%s: %s" % (type(exc).__name__, exc)}, True
            text = render(self.name, name, result)
            return self.wire.send(_result(id_, {"content": [{"type": "text", "text": text}], "isError": bool(is_error)}))
        return self.wire.send(_err(id_, -32601, "method not found: %s" % method))

    def on_notification(self, msg: dict):
        if msg.get("method") == "notifications/initialized":
            self.initialized = True
            self.request_roots()
        elif msg.get("method") == "notifications/roots/list_changed":
            self.request_roots()

    def serve(self):
        stdin = os.fdopen(0, "rb", buffering=0)
        buf = b""
        while True:
            chunk = stdin.read(65536)
            if not chunk:
                break
            buf += chunk
            while b"\n" in buf:
                line, buf = buf.split(b"\n", 1)
                self.handle_line(line)
        if buf.strip():
            self.handle_line(buf)

    def handle_line(self, raw: bytes):
        line = raw.strip(b"\r\n \t")
        if not line:
            return
        try:
            msg = json.loads(line.decode("utf-8", errors="replace"))
        except Exception:
            log("unparseable line skipped (%d bytes)" % len(line))
            return
        if isinstance(msg, list):                       # batches: 2025-03-26 only — not accepted here
            log("batch ignored")
            return
        if not isinstance(msg, dict):
            return
        try:
            if "method" in msg and "id" in msg:
                self.on_request(msg)
            elif "method" in msg:
                self.on_notification(msg)
            elif "id" in msg:
                self.on_response(msg)
        except Exception as exc:
            log("handler crash: %s\n%s" % (exc, traceback.format_exc()))
            if "id" in msg and "method" in msg:
                try:
                    self.wire.send(_err(msg.get("id"), -32603, "internal error: %s" % type(exc).__name__))
                except OSError:
                    pass


def main(name: str, version: str, tools) -> int:
    try:
        Server(name, version, tools).serve()
    except (BrokenPipeError, KeyboardInterrupt):
        pass
    return 0
