#!/usr/bin/env bash
# Viikkoraha — Deploy GitHub Pagesiin
#
# 1. Aja testit
# 2. Buildaa
# 3. Pushaa dist/ → gh-pages branch
#
# Käyttö: ./scripts/deploy.sh

set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE="${DEPLOY_REMOTE:-origin}"
BRANCH="${DEPLOY_BRANCH:-gh-pages}"

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

CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
COMMIT_MSG="deploy: $(date -u +'%Y-%m-%d %H:%M UTC') — $(git rev-parse --short HEAD)"

# Rakenna gh-pages commit dist/-kansiosta orphan-branchilla
TMP_BRANCH="gh-pages-deploy-$$"
git checkout --orphan "$TMP_BRANCH"
git rm -rf --quiet . 2>/dev/null || true
cp -r dist/* .
git add -A
git commit -m "$COMMIT_MSG"

echo "  Push $REMOTE/$BRANCH..."
git push "$REMOTE" "$TMP_BRANCH:$BRANCH" --force

# Palaa ja siivoa
git checkout "$CURRENT_BRANCH"
git branch -D "$TMP_BRANCH"

echo ""
echo "✅ Deploy valmis: https://gitpages.morgeweb.com/viikkoraha/"
