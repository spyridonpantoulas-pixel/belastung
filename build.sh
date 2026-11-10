#!/bin/bash
# Setzt index.html aus den Teilen in src/ zusammen.
#   ./build.sh           baut index.html neu
#   ./build.sh --check   prüft nur, ob index.html zum Stand in src/ passt (für die automatische Prüfung)
set -e
D="$(cd "$(dirname "$0")" && pwd)"
node --check "$D/src/app.js"
TMP="$(mktemp)"
cat "$D/src/head.html" "$D/src/style.css" "$D/src/vendor-react.html" "$D/src/app.js" "$D/src/tail.html" > "$TMP"
if [ "$1" = "--check" ]; then
  if cmp -s "$TMP" "$D/index.html"; then echo "index.html passt zu src/"; rm -f "$TMP"; exit 0; fi
  echo "FEHLER: index.html passt nicht zu src/ – bitte ./build.sh ausführen und index.html mit hochladen."; rm -f "$TMP"; exit 1
fi
mv "$TMP" "$D/index.html"
chmod 644 "$D/index.html"
echo "index.html gebaut: $(wc -c < "$D/index.html") Bytes"
