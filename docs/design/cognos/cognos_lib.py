"""cognos_lib.py — shared by the Cognos page builders: the kit's three blocks (copied, never retyped),
the lucide icons, and the sketch scoper (an SVG <style> is document-wide; every rule is scoped per sketch)."""
import json, re, html, pathlib
KIT = pathlib.Path("/home/khujta/.claude/skills/gabe-artifact/assets/artifact-chrome.html").read_text(encoding="utf-8")
# ── the kit, three blocks, copied ──────────────────────────────────────────────────────────────
def block(a, b):
    i = KIT.index(a); j = KIT.index(b, i)
    return KIT[i:j]
BLOCK1 = block("<!-- ══ BLOCK 1", "</style>") + "</style>"
BLOCK2 = block("<!-- ══ BLOCK 2", "<!-- ══ BLOCK 3")
BLOCK3 = block("<!-- ══ BLOCK 3", "</script>") + "</script>"
# reduced-motion: the kit KILLS animations (`animation:none`), which would leave an agent sketch whose
# base state is its start frame as a blank card. Sketch elements are excluded here and instead JUMP to
# their finished frame (below) — the contract's "finished state, never an empty frame".
old = "@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }"
assert old in BLOCK1
BLOCK1 = BLOCK1.replace(old, "@media (prefers-reduced-motion: reduce) { *:not(svg[data-fx] *):not(svg[data-fx]) { transition: none !important; animation: none !important; } }")

E = lambda s: html.escape(str(s), quote=True)

# ── lucide icons for the section pills (inlined: the CSP blocks icon CDNs) ──────────────────────
ICO = {
  "target": '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  "route": '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  "orbit": '<circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><path d="M10.4 21.9a10 10 0 0 0 9.941-15.416"/><path d="M13.5 2.1a10 10 0 0 0-9.841 15.416"/>',
  "alert": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  "bars": '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
  "layout": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
  "gavel": '<path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>',
  "eyeoff": '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
  "sparkles": '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
  "replay": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  "check": '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 5-5"/>',
  "x": '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6"/><path d="m15 9-6 6"/>',
}
def ico(name, cls=""):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true"%s>%s</svg>' % ((' class="%s"' % cls) if cls else "", ICO[name]))

# ── sketch scoping ────────────────────────────────────────────────────────────────────────────
def scope_sketch(svg, slug):
    """scope every CSS rule to this svg, rename keyframes + ids; set data-fx on the root."""
    svg = svg.strip()
    # root data-fx
    m = re.match(r"<svg\b([^>]*)>", svg, re.S)
    attrs = m.group(1)
    attrs = re.sub(r'\s+data-fx="[^"]*"', "", attrs)
    attrs = re.sub(r"\s+data-fx='[^']*'", "", attrs)
    attrs = re.sub(r'\s+preserveAspectRatio="[^"]*"', "", attrs)
    svg = "<svg%s data-fx=\"%s\" preserveAspectRatio=\"xMinYMid meet\">" % (attrs, slug) + svg[m.end():]   # left-anchored in its frame (H1)
    # ids
    ids = set(re.findall(r'\bid="([^"]+)"', svg))
    for i in sorted(ids, key=len, reverse=True):
        ni = slug + "-" + i
        svg = svg.replace('id="%s"' % i, 'id="%s"' % ni)
        svg = svg.replace("url(#%s)" % i, "url(#%s)" % ni)
        svg = svg.replace('href="#%s"' % i, 'href="#%s"' % ni)
    # styles
    def scope_css(css):
        kfs = re.findall(r"@keyframes\s+([\w-]+)", css)
        for k in sorted(set(kfs), key=len, reverse=True):
            css = re.sub(r"@keyframes\s+%s\b" % re.escape(k), "@keyframes k_%s_%s" % (slug, k), css)
        # rename keyframe references inside animation declarations
        def fix_decl(mm):
            d = mm.group(0)
            for k in sorted(set(kfs), key=len, reverse=True):
                d = re.sub(r"(?<![\w-])%s(?![\w-])" % re.escape(k), "k_%s_%s" % (slug, k), d)
            return d
        css = re.sub(r"animation(?:-name)?\s*:[^;}]+", fix_decl, css)
        # prefix selectors of every non-@ rule at depth 0 (and inside @media)
        out, i, depth_prefix = [], 0, 'svg[data-fx="%s"]' % slug
        def prefix_sel(sel):
            parts = [p.strip() for p in sel.split(",") if p.strip()]
            res = []
            for p in parts:
                # an agent that scoped its own rules wrote `[data-fx] .bead` / `svg[data-fx="x"] .bead`: strip that
                # token, the page's prefix replaces it (left in place it demands a SECOND data-fx descendant → frozen)
                p = re.sub(r'^(?:svg)?\[data-fx(?:=[^\]]*)?\]\s*', "", p).strip() or "svg"
                if p in ("svg", ":root", ":host"): res.append(depth_prefix)
                elif p.startswith("svg") and (len(p) == 3 or p[3] in ".[: >"): res.append(depth_prefix + p[3:])
                else: res.append(depth_prefix + " " + p)
            return ", ".join(res)
        def walk(block_text):
            res = ""; pos = 0
            while True:
                j = block_text.find("{", pos)
                if j < 0: res += block_text[pos:]; break
                head = block_text[pos:j]
                # find matching brace
                k, d = j, 0
                while k < len(block_text):
                    if block_text[k] == "{": d += 1
                    elif block_text[k] == "}":
                        d -= 1
                        if d == 0: break
                    k += 1
                body = block_text[j + 1:k]
                h = head.strip()
                if h.startswith("@keyframes"):
                    res += head + "{" + body + "}"
                elif h.startswith("@media") or h.startswith("@supports"):
                    res += head + "{" + walk(body) + "}"
                elif h.startswith("@"):
                    res += head + "{" + body + "}"
                else:
                    lead = head[:len(head) - len(head.lstrip())]
                    res += lead + prefix_sel(h) + "{" + body + "}"
                pos = k + 1
            return res
        return walk(css)
    svg = re.sub(r"<style[^>]*>(.*?)</style>", lambda mm: "<style>" + scope_css(mm.group(1)) + "</style>", svg, flags=re.S)
    # the motion gate fingerprints opacity, transforms, dashes and colours — not fill-opacity. The request
    # sketch brightens its pins by fill-opacity alone, so the gate read it as frozen; the same fade by opacity
    # is visually identical on a filled pin and measurable.
    svg = re.sub(r"\{([^{}]*?)fill-opacity:([\d.]+)\}", lambda mm: "{" + mm.group(1) + "opacity:" + mm.group(2) + "}", svg)
    return svg

