#!/usr/bin/env python3
"""
Run every suite, in the order that fails cheapest first.

    python run_tests.py            # every suite
    python run_tests.py router     # just the ones whose name contains "router"
    python run_tests.py -q         # totals only

There is no framework here on purpose. Each suite is a plain node script
that prints its own report and exits non-zero on a failure, so any one of
them can be run on its own while working on the thing it covers, and this
file only has to collect them.

The order below is deliberate. A broken edition file or a broken build
fails in seconds; the two large suites take longer, so they run last and
nobody waits on them to be told about a syntax error.
"""

import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# cheapest and most fundamental first: if the edition itself is broken,
# everything after this is noise
ORDER = [
    "test_core",       # retrieval, access control, markdown, artifacts
    "test_calc",       # deterministic computation
    "test_engine",     # the guided-task step types
    "test_render",     # renderer safety and class collisions
    "test_markers",    # source markers in a streamed answer
    "test_files",      # the library and the file readers
    "test_web",        # the keyless search layer
    "test_analytics",  # what the demo actually recorded
    "test_router",     # intent routing with no model
    "test_operator",   # every step anchor against its rendered screen
    "test_journeys",   # the sixteen guided tasks
    "test_nbfc",       # the edition: roles, corpus, cards, scopes
]


def suites(pattern):
    found = sorted(p.stem for p in (ROOT / "test").glob("test_*.js"))
    ordered = [s for s in ORDER if s in found] + [s for s in found if s not in ORDER]
    if pattern:
        ordered = [s for s in ordered if pattern in s]
    return ordered


def run(name, quiet):
    started = time.time()
    proc = subprocess.run(
        ["node", str(ROOT / "test" / f"{name}.js")],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    took = time.time() - started
    out = (proc.stdout or "") + (proc.stderr or "")

    checks = 0
    for line in out.splitlines():
        # "all 1883 checks passed" or "570 passed, 3 FAILED"
        for token in ("all ", " passed,"):
            if token in line:
                for word in line.replace(",", " ").split():
                    if word.isdigit():
                        checks = max(checks, int(word))
                        break
                break

    ok = proc.returncode == 0
    mark = "ok  " if ok else "FAIL"
    print(f"  {mark}  {name:<16} {checks:>6} checks   {took:5.1f}s")
    if not ok and not quiet:
        # only the failures, not the whole run: a passing suite prints a
        # section heading per group and none of it is worth reading here
        printing = False
        for line in out.splitlines():
            if "FAILED" in line:
                printing = True
            if printing:
                print("        " + line)
    return ok, checks


def main():
    args = [a for a in sys.argv[1:] if a not in ("-q", "--quiet")]
    quiet = len(args) != len(sys.argv[1:])
    pattern = args[0] if args else ""

    names = suites(pattern)
    if not names:
        print(f"no suite matches {pattern!r}")
        return 1

    print(f"\n  Running {len(names)} suite(s)\n")
    total, failed = 0, []
    started = time.time()
    for name in names:
        ok, checks = run(name, quiet)
        total += checks
        if not ok:
            failed.append(name)

    print("\n  " + "-" * 52)
    if failed:
        print(f"  {total:,} checks, {len(failed)} suite(s) FAILED: {', '.join(failed)}")
        print("  " + "-" * 52 + "\n")
        return 1
    print(f"  {total:,} checks passed in {time.time() - started:.1f}s")
    print("  " + "-" * 52 + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
