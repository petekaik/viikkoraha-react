#!/usr/bin/env bash
#
# Viikkoraha Full CI/CD Pipeline
# ===============================
# Vaihe 1: Yksikkötestit dev-ympäristössä
# Vaihe 2: Build + dev-smoke (preview-server)
# Vaihe 3: Deploy GitHub Pagesiin
# Vaihe 4: UAT — tuotannon smoke-testit
#
# Käyttö:  npm run deploy

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$HOME/projects/viikkoraha"
PAGES_DIR="$HOME/projects/petekaik.github.io"
PREVIEW_PORT=4173
DEPLOY_URL="https://gitpages.morgeweb.com/viikkoraha"

echo -e "${YELLOW}══════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Viikkoraha CI/CD Pipeline${NC}"
echo -e "${YELLOW}══════════════════════════════════════════${NC}"

# ── Vaihe 1: Yksikkötestit ──
echo -e "\n${YELLOW}[1/4] Yksikkötestit (dev-ympäristö)...${NC}"
cd "$PROJECT_DIR"
npx vitest run --config vitest.dev.config.js
echo -e "${GREEN}✓ Yksikkötestit OK${NC}"

# ── Vaihe 2: Build + dev-smoke (preview) ──
echo -e "\n${YELLOW}[2/4] Build + dev-smoke (preview)...${NC}"
cd "$PROJECT_DIR"
git checkout master
git pull origin master
npm run build

# Käynnistä preview-server taustalla
npx vite preview --port $PREVIEW_PORT --host 0.0.0.0 &
PREVIEW_PID=$!
echo -e "  Preview-server käynnistetty (PID $PREVIEW_PID)"

# Odota että preview on valmis
for i in $(seq 1 15); do
  if curl -s -o /dev/null "http://localhost:$PREVIEW_PORT/viikkoraha/"; then
    break
  fi
  sleep 1
done

npx vitest run --config vitest.dev-smoke.config.js
echo -e "${GREEN}✓ Dev-smoke OK${NC}"

kill "$PREVIEW_PID" 2>/dev/null || true

# ── Vaihe 3: Deploy ──
echo -e "\n${YELLOW}[3/4] Deploy GitHub Pagesiin...${NC}"

rm -rf "$PAGES_DIR/viikkoraha/"*
cp -R dist/* "$PAGES_DIR/viikkoraha/"

cd "$PAGES_DIR"
git add -A
git commit -m "Deploy Viikkoraha: $(date '+%Y-%m-%d %H:%M')" || echo "  (ei uusia muutoksia)"
git push origin master
echo -e "${GREEN}✓ Deploy valmis${NC}"

# ── Vaihe 4: UAT ──
echo -e "\n${YELLOW}[4/4] UAT — tuotannon smoke-testit...${NC}"
echo -e "  Odotetaan GitHub Pagesin päivittymistä (10s)..."
sleep 10

cd "$PROJECT_DIR"
npx vitest run --config vitest.smoke.config.js
echo -e "${GREEN}✓ UAT OK${NC}"

# ── Valmis ──
echo -e "\n${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Kaikki vaiheet onnistuneesti läpi${NC}"
echo -e "${GREEN}  🔗 $DEPLOY_URL${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
