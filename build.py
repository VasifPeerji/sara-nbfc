#!/usr/bin/env python3
"""
SARA build script.

Concatenates src/ modules plus one edition config into a single, self-contained
HTML file with no build-time or run-time JavaScript dependencies.

    python build.py                 # builds every edition in editions/
    python build.py base            # builds editions/base.js  -> sara.html
    python build.py aglink          # builds editions/aglink.js -> sara_aglink.html

An edition is a single JS file that assigns `window.SARA_EDITION = {...}`.
Everything a customer-specific build needs lives in that one file.
"""

import base64
import json
import re
import sys
from urllib.parse import quote
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
EDITIONS = ROOT / "editions"

# Explicit ordering. Filenames are prefixed to match, but the list is the truth.
CSS_FILES = [
    "01-tokens.css",
    "02-base.css",
    "03-shell.css",
    "04-sidebar.css",
    "05-chat.css",
    "06-artifact.css",
    "07-modals.css",
    "08-login.css",
    "09-responsive.css",
    "10-print.css",
    "12-journeys.css",
    "13-operator-shell.css",   # Windows + Chrome chrome and the pointer
    "15-operator-lending.css",  # the Operator overlay: the lending platform and rails
    "16-router.css",           # intent routing: badges and run cards
    "17-analytics.css",        # the Usage panel
    "18-diagrams.css",         # workings, distributions and chains
]

JS_FILES = [
    "19-logos.js",
    "20-icons.js",
    "21-util.js",
    "22-state.js",
    "23-markdown.js",
    "24-retrieval.js",
    "25-llm.js",
    "26-charts.js",
    "26b-diagrams.js",     # lending workings, distributions and chains
    "27-artifacts.js",
    "28-panel.js",
    "29-chat.js",
    "30-sidebar.js",
    "31-login.js",
    "32-settings.js",
    "33-palette.js",
    "34-export.js",
    "36-library.js",
    "37-models.js",
    "38-files.js",
    "39-web.js",
    "43-journeys.js",
    "45-operator-lending.js",  # apps, screens and anchors
    "44-operator-shell.js",  # the machine; reads the two tables above
    "46-router.js",          # intent routing; reads Journeys and the Operator
    "47-analytics.js",       # what actually happened in the demo
    "40-init.js",          # always last: it boots against the finished set
]

BODY_FILE = "50-body.html"

# Anything matching these in src/ means the output would need the network to work.
NETWORK_PATTERNS = [
    (re.compile(r"<script[^>]+src\s*=", re.I), "external <script src>"),
    (re.compile(r"<link[^>]+rel=[\"']?stylesheet", re.I), "external stylesheet"),
    (re.compile(r"url\(\s*[\"']?https?://", re.I), "remote CSS url()"),
    (re.compile(r"<img[^>]+src\s*=\s*[\"']https?://", re.I), "remote <img>"),
]

# Hosts the app is allowed to talk to at runtime, and why. Anything else that
# appears at a fetch call site is a build warning: a single-file product that
# quietly grew a new outbound dependency is exactly the thing an enterprise
# security review catches and we do not.
#
# Provider endpoints are not listed individually because they are chosen at
# runtime from the provider registry; the registry itself is the record.
ALLOWED_RUNTIME_HOSTS = {
    "api.openai.com":        "LLM provider (default) and image generation",
    "en.wikipedia.org":      "web search: reference",
    "api.duckduckgo.com":    "web search: instant answers",
    "api.openalex.org":      "web search: research literature",
    "api.crossref.org":      "web search: DOI registry",
    "api.stackexchange.com": "web search: technical Q&A",
    "hn.algolia.com":        "web search: industry discussion",
    "r.jina.ai":             "web search: optional full-page read",
}

# Hosts that only ever appear in a link the reader may click, never in a
# fetch. Search results point anywhere on the web by design, so this is not a
# security boundary; it exists so the check above can stay strict about what
# the file actually calls.
LINK_ONLY_HOSTS = {
    "news.ycombinator.com": "fallback link for a Hacker News item with no article URL",
}


MIME = {".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif"}


LOGO_BASE = (0, 107, 217)   # the blue the supplied Sara mark is drawn in


def tint_logo(raw: bytes, accent: str, base=LOGO_BASE):
    """Re-tint a flat two-tone logo to the edition's accent colour.

    The mark is one solid colour plus white plus transparency, so every pixel
    sits somewhere on the line between the base colour and white. Solving for
    that blend factor and re-mixing against the new accent preserves the
    antialiasing exactly, which a hue rotation does not.

    Returns (bytes, note). Falls back to the original if Pillow is missing.
    """
    try:
        from PIL import Image
    except ImportError:
        return raw, "  logoTint requested but Pillow is not installed; shipping the original colour"

    import io as _io
    accent_rgb = tuple(int(accent.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    im = Image.open(_io.BytesIO(raw)).convert("RGBA")
    px = im.load()
    w, h = im.size

    bx, by, bz = base
    dx, dy, dz = 255 - bx, 255 - by, 255 - bz
    denom = float(dx * dx + dy * dy + dz * dz) or 1.0

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            # how far along base -> white this pixel sits
            t = ((r - bx) * dx + (g - by) * dy + (b - bz) * dz) / denom
            t = 0.0 if t < 0 else 1.0 if t > 1 else t
            px[x, y] = (
                int(round(accent_rgb[0] + (255 - accent_rgb[0]) * t)),
                int(round(accent_rgb[1] + (255 - accent_rgb[1]) * t)),
                int(round(accent_rgb[2] + (255 - accent_rgb[2]) * t)),
                a,
            )

    out = _io.BytesIO()
    im.save(out, format="PNG", optimize=True)
    return out.getvalue(), f"  logo re-tinted to {accent}"


def inline_logo(edition_js: str, edition_name: str, accent: str):
    """Replace `logoFile: "path"` in an edition with an inlined data URI.

    Keeps the output a single self-contained file while letting the edition
    source reference a real asset on disk. Missing files are reported rather
    than silently producing a logo-less build.
    """
    m = re.search(r'logoFile\s*:\s*"([^"]+)"\s*,?', edition_js)
    if not m:
        return edition_js, None, None, None
    rel = m.group(1)
    path = (ROOT / rel) if not Path(rel).is_absolute() else Path(rel)
    if not path.exists():
        return (edition_js.replace(m.group(0), ""),
                f"  LOGO MISSING: drop the file at {rel} and rebuild to use it everywhere", None, None)
    mime = MIME.get(path.suffix.lower())
    if not mime:
        return edition_js.replace(m.group(0), ""), f"  unsupported logo type: {rel}", None, None
    raw = path.read_bytes()
    original = f"data:{mime};base64," + base64.b64encode(raw).decode("ascii")
    tint_note = None
    tinted = False
    if re.search(r'logoTint\s*:\s*true', edition_js):
        raw, tint_note = tint_logo(raw, accent)
        tinted = True
    data = base64.b64encode(raw).decode("ascii")
    uri = f"data:{mime};base64,{data}"
    kb = len(data) / 1024
    note = f"  inlined logo {rel} ({kb:.0f} KB base64)"
    if tint_note:
        note += chr(10) + tint_note
    if kb > 400:
        note += "  <- large; consider an SVG or a smaller PNG"
    return (edition_js.replace(m.group(0), f'logo: "{uri}",'), note, uri,
            original if tinted else None)


def inline_assets(edition_js: str):
    """Replace `asset: "path"` anywhere in an edition with an inlined data URI.

    Use case steps can carry a real screenshot or photograph, and the product
    still has to ship as one file. Same trick as the logo, generalised: the
    edition references a path on disk, the build swallows it. A missing file
    is reported rather than silently producing a broken image.
    """
    notes, total = [], 0

    def swap(match):
        nonlocal total
        rel = match.group(1)
        path = (ROOT / rel) if not Path(rel).is_absolute() else Path(rel)
        if not path.exists():
            notes.append(f"  ASSET MISSING: {rel}")
            return 'src: "",'
        mime = MIME.get(path.suffix.lower())
        if not mime:
            notes.append(f"  unsupported asset type: {rel}")
            return 'src: "",'
        data = base64.b64encode(path.read_bytes()).decode("ascii")
        kb = len(data) / 1024
        total += kb
        notes.append(f"  inlined asset {rel} ({kb:.0f} KB base64)")
        return f'src: "data:{mime};base64,{data}",'

    # Only a path with a known image extension is an asset. Without
    # this guard the pattern also swallows any ordinary `asset:` field
    # an edition happens to use — a diagram naming the plant it draws,
    # for instance — and replaces it with an empty src, silently.
    out = re.sub(r'asset\s*:\s*"([^"]+\.(?:png|svg|jpe?g|webp|gif))"\s*,?',
                 swap, edition_js, flags=re.I)
    if total > 900:
        notes.append(f"  <- {total:.0f} KB of inlined assets; consider SVG visuals instead")
    return out, notes


def check_syntax(label: str, js: str) -> list:
    """Parse the concatenated JavaScript before shipping it.

    A single mismatched quote anywhere in the bundle produces a blank page and
    no console error worth reading, because the parse fails before anything
    runs. Node is already required by the test suite, so use it; if it is not
    on the path, say so rather than pretending the check passed.
    """
    import subprocess
    import tempfile

    try:
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False,
                                         encoding="utf-8") as fh:
            fh.write(js)
            tmp = fh.name
        res = subprocess.run(["node", "--check", tmp],
                             capture_output=True, text=True, timeout=60)
        Path(tmp).unlink(missing_ok=True)
    except FileNotFoundError:
        return ["  node not on the path, so the bundle was not syntax checked"]
    except Exception as err:                              # noqa: BLE001
        return [f"  could not syntax check {label}: {err}"]

    if res.returncode == 0:
        return []
    detail = (res.stderr or "").strip().splitlines()
    keep = [l for l in detail if "SyntaxError" in l or ".js:" in l][:2]
    return [f"  SYNTAX ERROR in {label}: " + " ".join(keep or ["see node --check"])]


def check_script_blocks(html: str, expected: int) -> list:
    """Verify the HTML parser will see the script blocks we intended.

    check_syntax() validates the JavaScript, which is not the same thing. The
    studio embeds a whole SARA as a JSON string, and that string contains
    </script> tags: the HTML parser does not care that they sit inside a
    string, so the first one ends the block early and everything after it is
    parsed as markup. The result is a blank page with an empty console, and
    perfectly valid JavaScript.

    Counting <script> is the wrong measure, because unescaped opening tags
    inside the embedded string are harmless. What matters is how many blocks
    the parser pairs up, and whether each one still parses.
    """
    blocks = re.findall(r"<script>(.*?)</script>", html, re.S)
    if len(blocks) != expected:
        return [f"  SCRIPT BLOCKS: parser sees {len(blocks)}, expected {expected}. "
                "An embedded </script> is almost certainly ending a block early."]
    return []


def read(path: Path) -> str:
    if not path.exists():
        raise SystemExit(f"ERROR: missing source file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def check_offline_safety(name: str, text: str) -> list:
    warnings = []
    for pattern, label in NETWORK_PATTERNS:
        for match in pattern.finditer(text):
            line = text[: match.start()].count("\n") + 1
            warnings.append(f"  {name}:{line}  {label}")
    return warnings


def provider_hosts(src_text: str) -> set:
    """Hosts from the provider registry.

    These are legitimately reachable — the user picks one in the model
    picker — so they are derived from the registry rather than duplicated by
    hand, which would go stale the first time a provider is added.
    """
    hosts = set()
    for match in re.finditer(r'base\s*:\s*"https?://([a-z0-9.\-]+)', src_text, re.I):
        hosts.add(match.group(1).lower())
    return hosts


def collect_hosts(name: str, text: str, allowed: set) -> tuple:
    """Every host this source could reach, and any that is not allow-listed.

    Deliberately not proximity-based. A URL assembled in a constant and
    fetched forty lines later is still an outbound dependency, and the whole
    point of this check is that a single-file product cannot grow one
    unnoticed.
    """
    seen, warnings = set(), []
    for match in re.finditer(r"https?://([a-z0-9.\-]+)", text, re.I):
        host = match.group(1).lower()
        if host.endswith(("."  , "-")) or "." not in host:
            continue
        seen.add(host)
        if host not in allowed:
            line = text[: match.start()].count("\n") + 1
            warnings.append(f"  {name}:{line}  UNDECLARED outbound host {host}")
    return seen, warnings


def build(edition_name: str) -> Path:
    edition_path = EDITIONS / f"{edition_name}.js"
    edition_js = read(edition_path)
    warnings = []

    css_parts = []
    for fname in CSS_FILES:
        text = read(SRC / fname)
        warnings += check_offline_safety(fname, text)
        css_parts.append(f"/* ===== {fname} ===== */\n{text.strip()}")

    allowed = (set(ALLOWED_RUNTIME_HOSTS) | set(LINK_ONLY_HOSTS)
               | provider_hosts(read(SRC / "25-llm.js")))
    js_parts, hosts_seen = [], set()
    for fname in JS_FILES:
        text = read(SRC / fname)
        warnings += check_offline_safety(fname, text)
        seen, host_warnings = collect_hosts(fname, text, allowed)
        hosts_seen |= seen
        warnings += host_warnings
        js_parts.append(f"/* ===== {fname} ===== */\n{text.strip()}")

    body = read(SRC / BODY_FILE)
    warnings += check_offline_safety(BODY_FILE, body)
    warnings += check_syntax(f"{edition_name} bundle", chr(10).join(js_parts))
    # The edition ships in the same page and is the file that changes most,
    # so it is the one most likely to carry an unterminated string. Checking
    # only src/ let a broken edition through to a blank page with nothing
    # useful in the console, which is the exact failure this guard exists for.
    warnings += check_syntax(f"the {edition_name} edition", edition_js)

    # Pull display metadata out of the edition for <title> and the loading screen.
    def field(pattern, default):
        m = re.search(pattern, edition_js)
        return m.group(1) if m else default

    product = field(r"name\s*:\s*[\"']([^\"']+)[\"']\s*,\s*\n?\s*version", "SARA")
    company = field(r"company\s*:\s*\{[^}]*?name\s*:\s*[\"']([^\"']+)[\"']", "Enterprise")
    accent = field(r"accent\s*:\s*[\"'](#[0-9a-fA-F]{3,8})[\"']", "#4d7cfe")
    slug = field(r"slug\s*:\s*[\"']([\w.-]+)[\"']", "app")
    edition_js, logo_note, logo_uri, logo_original = inline_logo(edition_js, edition_name, accent)
    edition_js, asset_notes = inline_assets(edition_js)

    # Resolve the theme before the stylesheet is applied, so the very first
    # painted frame is already correct. Doing this in 40-init.js would be too
    # late: the boot splash would flash the wrong colour first, which is the
    # single most visible way a handed-over file can look unfinished.
    #
    # It deliberately duplicates the rule in resolvedTheme(): that is the price
    # of having no flash. test_core.js cross-checks the two so they cannot
    # drift, and the storage key must match Store.key() exactly.
    theme_boot = (
        "<script>(function(){try{"
        'var p=(JSON.parse(localStorage.getItem("sara_' + slug + '_prefs")||"{}")||{}).theme||"system";'
        'var d=p==="dark"||(p!=="light"&&(typeof matchMedia!=="function"||'
        'matchMedia("(prefers-color-scheme: dark)").matches));'
        'document.documentElement.setAttribute("data-theme",d?"dark":"light");'
        "}catch(e){}})();</script>"
    )

    # The untinted original travels with the file so the browser can re-tint if
    # the edition block is later swapped for one with a different accent. That
    # is the whole point of the paste-into-the-HTML workflow: without it a new
    # customer gets their colours everywhere except the logo. Costs one extra
    # copy of a small PNG; buys a re-skin that needs no Python at all.
    logo_boot = ""
    if logo_original:
        logo_boot = ("<script>"
                     f'window.SARA_LOGO_SOURCE={logo_original!r};'
                     f'window.SARA_LOGO_BAKED="{accent}";'
                     f"window.SARA_LOGO_BASE={list(LOGO_BASE)};"
                     "</script>").replace("'", '"')

    if logo_uri:
        favicon = f'<link rel="icon" href="{logo_uri}">'
        boot_mark = f'<div class="boot-mark has-logo"><img class="brand-img" src="{logo_uri}" alt=""></div>'
    else:
        # a plain accent tile, so the tab is never the browser's blank page icon
        svg = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>"
               f"<rect width='32' height='32' rx='8' fill='{accent}'/></svg>")
        favicon = '<link rel="icon" href="data:image/svg+xml,' + quote(svg) + '">'
        boot_mark = '<div class="boot-mark"></div>'

    html = f"""<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark light">
<meta name="description" content="{product} — enterprise knowledge assistant for {company}.">
<meta name="robots" content="noindex,nofollow">
<title>{product} · {company}</title>
{favicon}
{theme_boot}
{logo_boot}
<style>
{chr(10).join(css_parts)}
</style>
</head>
<body class="booting">
<div id="boot" class="boot">{boot_mark}<div class="boot-name">{product}</div><div class="boot-bar"><i></i></div></div>
{body.strip()}
<script>
/* ==================================================================
   SARA EDITION: BEGIN  ({edition_name})

   Everything customer-specific lives between this line and SARA EDITION: END.
   To re-skin this file for another organisation, replace only that block.
   Nothing above or below it ever changes.
   ================================================================== */
{edition_js.strip()}
/* ===== SARA EDITION: END ===== */
</script>
<script>
{chr(10).join(js_parts)}
</script>
</body>
</html>
"""

    # theme bootstrap, optional logo source, the edition, and the product code
    warnings += check_script_blocks(html, 4 if logo_boot else 3)

    out_name = "sara.html" if edition_name == "base" else f"sara_{edition_name}.html"
    out_path = ROOT / out_name
    out_path.write_text(html, encoding="utf-8")

    size_kb = len(html.encode("utf-8")) / 1024
    status = "OK" if not warnings else f"{len(warnings)} WARNING(S)"
    print(f"  {out_name:<28} {size_kb:7.1f} KB   accent {accent}   [{status}]")
    if logo_note:
        print(logo_note)
    for note in asset_notes:
        print(note)
    for w in warnings:
        print(w)

    # The outbound surface, stated every build. A customer's security review
    # asks for exactly this list, and it should never be assembled by reading
    # the source under time pressure.
    search = sorted(h for h in hosts_seen if h in ALLOWED_RUNTIME_HOSTS and h != "api.openai.com")
    print(f"  outbound: {len(hosts_seen)} hosts referenced "
          f"({len(hosts_seen) - len(search) - 1} provider endpoints, chosen at runtime)")
    print(f"            search/read: {', '.join(search) if search else 'none'}")
    return out_path


# ==================================================================
# The studio: an internal tool for building customer editions without
# touching JavaScript. It borrows SARA's own provider layer, model picker,
# icons and utilities rather than reimplementing them, so a key set in the
# studio is the same store and the same 25 providers.
# ==================================================================

STUDIO = ROOT / "studio"

STUDIO_CSS = [
    (SRC, "01-tokens.css"),      # the same tokens, so a colour previewed
                                 # in the studio is the colour that ships
    (STUDIO, "01-studio.css"),
]

STUDIO_SHARED = [
    "19-logos.js",
    "20-icons.js",
    "21-util.js",
    "25-llm.js",                 # 25 providers, adapters, key store
]

STUDIO_JS = [
    "10-fields.js",
    "20-ui.js",
    "30-site.js",
    "40-generate.js",
    "50-build.js",
    "70-init.js",                # last: it boots
]


def build_studio(embed: str = "base"):
    """Build sara-studio.html.

    A copy of the current base SARA is embedded so the tool works with no
    setup at all: fill the form, press build, download. A different base can
    still be loaded from disk inside the studio.
    """
    if not STUDIO.exists():
        raise SystemExit("ERROR: studio/ not found")


def has_studio() -> bool:
    """The studio is an internal re-skinning tool, not part of the product.

    This vertical ships the built SARA on its own, so a missing studio/ is a
    normal state rather than a build failure.
    """
    return STUDIO.exists()

    warnings = []
    css_parts = []
    for base_dir, fname in STUDIO_CSS:
        text = read(base_dir / fname)
        warnings += check_offline_safety(fname, text)
        css_parts.append(f"/* ===== {fname} ===== */\n{text.strip()}")

    # the borrowed model picker and modal chrome need their styles
    for fname in ("02-base.css", "07-modals.css"):
        text = read(SRC / fname)
        css_parts.append(f"/* ===== {fname} ===== */\n{text.strip()}")

    allowed = (set(ALLOWED_RUNTIME_HOSTS) | set(LINK_ONLY_HOSTS)
               | provider_hosts(read(SRC / "25-llm.js")))
    js_parts, hosts_seen = [], set()

    for fname in STUDIO_SHARED:
        text = read(SRC / fname)
        seen, host_warnings = collect_hosts(fname, text, allowed)
        hosts_seen |= seen
        warnings += host_warnings
        js_parts.append(f"/* ===== src/{fname} ===== */\n{text.strip()}")

    # 37-models.js is loaded after the studio's own shim defines Config and S
    shim = read(STUDIO / "70-init.js")
    del shim

    for fname in STUDIO_JS:
        text = read(STUDIO / fname)
        warnings += check_offline_safety(fname, text)
        seen, host_warnings = collect_hosts(fname, text, allowed)
        hosts_seen |= seen
        warnings += host_warnings
        if fname == "70-init.js":
            models = read(SRC / "37-models.js")
            js_parts.append(f"/* ===== studio/{fname} (shim) ===== */\n"
                            + text.split("const Studio = (function()")[0].strip())
            js_parts.append(f"/* ===== src/37-models.js ===== */\n{models.strip()}")
            js_parts.append("/* ===== studio/70-init.js (boot) ===== */\n"
                            + "const Studio = (function()"
                            + text.split("const Studio = (function()", 1)[1].strip())
        else:
            js_parts.append(f"/* ===== studio/{fname} ===== */\n{text.strip()}")

    body = read(STUDIO / "60-body.html")
    warnings += check_offline_safety("60-body.html", body)
    warnings += check_syntax("the studio bundle", chr(10).join(js_parts))

    # embed a SARA to build on, plus the untinted logo for the studio's own mark
    sara_name = "sara.html" if embed == "base" else f"sara_{embed}.html"
    sara_path = ROOT / sara_name
    embedded = ""
    if sara_path.exists():
        html_text = sara_path.read_text(encoding="utf-8")
        if "SARA EDITION: BEGIN" in html_text:
            # The embedded SARA contains its own </script> tags. Inside a
            # <script> block the HTML parser does not care that they sit in a
            # JSON string: the first one it sees ends the block and the rest of
            # the studio is parsed as markup. Escaping the slash keeps the
            # string identical to JavaScript and invisible to the parser.
            payload = json.dumps(html_text).replace("</", "<\\/")
            embedded = f"<script>window.SARA_BASE_HTML={payload};</script>"
        else:
            warnings.append(f"  {sara_name} has no edition markers; studio will need a file loading by hand")
    else:
        warnings.append(f"  {sara_name} not found; build it first so the studio can embed it")

    logo = ""
    logo_path = ROOT / "assets" / "sara" / "sara-icon.png"
    if logo_path.exists():
        data = base64.b64encode(logo_path.read_bytes()).decode("ascii")
        logo = f'<script>window.SARA_LOGO_SOURCE="data:image/png;base64,{data}";</script>'

    html = f"""<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="robots" content="noindex,nofollow">
<title>SARA Studio</title>
<style>
{chr(10).join(css_parts)}
</style>
</head>
<body>
{body.strip()}
{logo}
{embedded}
<script>
{chr(10).join(js_parts)}
</script>
</body>
</html>
"""

    # three blocks: the logo, the embedded SARA, and the studio's own code
    warnings += check_script_blocks(html, 3)

    out_path = ROOT / "sara-studio.html"
    out_path.write_text(html, encoding="utf-8")
    size_kb = len(html.encode("utf-8")) / 1024
    status = "OK" if not warnings else f"{len(warnings)} WARNING(S)"
    print(f"  {'sara-studio.html':<28} {size_kb:7.1f} KB   embeds {sara_name}   [{status}]")
    for w in warnings:
        print(w)
    return out_path


def main():
    if not SRC.exists():
        raise SystemExit("ERROR: src/ not found")
    if not EDITIONS.exists():
        raise SystemExit("ERROR: editions/ not found")

    args = [a for a in sys.argv[1:] if a != "--studio"]
    studio_only = "--studio" in sys.argv[1:] and not args

    if studio_only:
        if not has_studio():
            raise SystemExit("ERROR: studio/ not found")
        print("Building SARA Studio")
        build_studio()
        print("Done.")
        return

    names = args or sorted(p.stem for p in EDITIONS.glob("*.js"))
    if not names:
        raise SystemExit("ERROR: no editions found in editions/")

    print("Building SARA")
    for name in names:
        build(name)
    # the studio embeds a built SARA, so it is built last when present
    if has_studio():
        build_studio()
    print("Done.")


if __name__ == "__main__":
    main()
