#!/usr/bin/env bash
# Runs every regression test against the studio folder. Usage: tests/run.sh
set -u; cd "$(dirname "$0")/.."; (python3 -m http.server 8766 >/dev/null 2>&1 &) ; sleep 1; fail=0
for t in smoke props_db p1 p2 p2b p2c p3a p3b p3c; do echo "== $t"; out=$(node tests/$t.js 2>&1); echo "$out" | grep -v '^ok' ; echo "$out" | grep -q 'FAIL\|Error' && fail=1; done
rm -f qa.html tests/out.pptx tests/out.pdf; exit $fail
