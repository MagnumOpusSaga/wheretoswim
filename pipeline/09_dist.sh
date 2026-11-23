#!/bin/bash
# Kokoaa julkaisukansion dist/ ja zipin. Aja projektin juuresta.
set -e
cd worker && npx -y esbuild@0.24.0 main.js --bundle --format=esm --target=es2022 --outfile=_worker.js --log-level=warning && cd ..
rm -rf dist && mkdir -p dist/data
cp site/index.html site/og.png site/favicon.ico site/favicon.svg site/apple-touch-icon.png site/icon-48.png site/icon-192.png site/icon-512.png site/site.webmanifest dist/
cp site/sitemap*.xml dist/
cp site/static/* dist/
cp worker/_worker.js dist/
cp site/data/sites.json site/data/today.json site/data/basemap.json site/data/avanto.json site/data/idx.txt site/data/countries.json site/data/warm.json dist/data/
cp -r site/data/g site/data/towns dist/data/
cp -r site/pages/* dist/
echo "tiedostoja: $(find dist -type f | wc -l)"
if [ -z "$CI" ]; then
  rm -f /home/claude/wheretoswim-site.zip
  (cd dist && zip -qr /home/claude/wheretoswim-site.zip .)
  echo "zip: $(stat -c %s /home/claude/wheretoswim-site.zip) tavua"
fi
