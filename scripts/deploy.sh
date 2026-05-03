#!/usr/bin/env bash
# Viikkoraha — Deploy GitHub Pagesiin
#
# 1. Aja testit
# 2. Buildaa
# 3. Kopioi dist/ → petekaik.github.io-repon viikkoraha/-hakemistoon
# 4. Commit + push petekaik.github.io
#
# Käyttö: ./scripts/deploy.sh

set -euo pipefail
cd "$(dirname "$0")/.."

PAGES_DIR="${PAGES_DIR:-$HOME/projects/petekaik.github.io}"
DEPLOY_PATH="$PAGES_DIR/viikkoraha"

echo "═══ 1. TESTIT ═══"
npm test

echo ""
echo "═══ 2. BUILD ═══"
npm run build

echo ""
echo "═══ 3. DEPLOY ═══"

# Varmista puhdas työhakemisto
if ! git diff-index --quiet HEAD --; then
    echo "❌ Työhakemistossa on commitoimattomia muutoksia. Committaa tai stashaa."
    exit 1
fi

# Tarkista, ettei pages-repossa ole commitoimattomia muutoksia
if ! git -C "$PAGES_DIR" diff-index --quiet HEAD --; then
    echo "❌ Pages-repossa ($PAGES_DIR) on commitoimattomia muutoksia. Siivoa ensin."
    exit 1
fi

# Varmista, että pages-repo on master-branchilla
PAGES_BRANCH=$(git -C "$PAGES_DIR" symbolic-ref --short HEAD)
if [ "$PAGES_BRANCH" != "master" ]; then
    echo "❌ Pages-repo ei ole master-branchilla (nykyinen: $PAGES_BRANCH)"
    exit 1
fi

# Pullaa uusin tila pages-repoon
git -C "$PAGES_DIR" pull --ff-only origin master

# Kopioi build-tiedostot
rm -rf "$DEPLOY_PATH"
cp -r dist "$DEPLOY_PATH"

COMMIT_MSG="Deploy Viikkoraha: $(date -u +'%Y-%m-%d %H:%M UTC') — $(
    cd "$PAGES_DIR" && git rev-parse --short HEAD
)"

# Commit + push pages-repossa
git -C "$PAGES_DIR" add "$DEPLOY_PATH"
git -C "$PAGES_DIR" commit -m "$COMMIT_MSG"
git -C "$PAGES_DIR" push origin master

echo ""
echo "✅ Deploy valmis: https://gitpages.morgeweb.com/viikkoraha/"
