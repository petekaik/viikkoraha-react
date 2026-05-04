#!/usr/bin/env bash
# Viikkoraha — Deploy GitHub Pagesiin
#
# 1. Varmista .env-tiedosto (tarvitaan VITE_GOOGLE_CLIENT_ID / VITE_GOOGLE_API_KEY)
# 2. Aja testit
# 3. Buildaa (Vite lukee .env automaattisesti)
# 4. Kopioi dist/ → petekaik.github.io-repon viikkoraha/-hakemistoon
# 5. Commit + push petekaik.github.io
#
# Käyttö: ./scripts/deploy.sh [--env-file=.env.production]

set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --env-file=*) ENV_FILE="${1#*=}"; shift ;;
        --env-file)   ENV_FILE="$2"; shift 2 ;;
        *) echo "❌ Tuntematon argumentti: $1"; exit 1 ;;
    esac
done

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE puuttuu. Luo se .env.example-pohjasta tai anna --env-file=<polku>."
    echo "   cp .env.example .env   # ja täytä VITE_GOOGLE_CLIENT_ID + VITE_GOOGLE_API_KEY"
    exit 1
fi

# Tarkista, että vaaditut muuttujat löytyvät
MISSING=0
grep -qE '^VITE_GOOGLE_CLIENT_ID=.+' "$ENV_FILE" || { echo "❌ $ENV_FILE: VITE_GOOGLE_CLIENT_ID puuttuu tai on tyhjä."; MISSING=1; }
grep -qE '^VITE_GOOGLE_API_KEY=.+' "$ENV_FILE" || { echo "❌ $ENV_FILE: VITE_GOOGLE_API_KEY puuttuu tai on tyhjä."; MISSING=1; }
[ "$MISSING" -eq 1 ] && exit 1

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
