#!/usr/bin/env bash
# Jules Environment Setup Script
# Paste this into: Jules → Repo → Configuration → Initial Setup

set -e

# --- Node version check ---
echo "=== Node / npm versions ==="
node -v
npm -v

# --- Install dependencies ---
echo "=== Installing dependencies ==="
npm install

# --- Verify critical packages are present ---
echo "=== Verifying stack packages ==="
node -e "require.resolve('three')"              && echo "✅ three"
node -e "require.resolve('gsap')"               && echo "✅ gsap"
node -e "require.resolve('animejs')"            && echo "✅ animejs"
node -e "require.resolve('vite')"               && echo "✅ vite"

# --- Audit RAF allocations (catch new THREE.* inside update functions) ---
echo "=== Auditing RAF allocations ==="
if grep -rn "new THREE\." src/ --include="*.js" | grep -E "update\s*\(|requestAnimationFrame|RAF"; then
  echo "⚠️  WARNING: Possible Three.js allocations near RAF/update functions — review manually"
else
  echo "✅ No obvious RAF allocations detected"
fi

# --- Check for banned patterns ---
echo "=== Checking banned patterns ==="
BANNED_PATTERNS=(
  "OrbitControls"
  "EffectComposer"
  "BloomPass"
  "TextGeometry"
  "addEventListener.*scroll"
  "react"
  "vue"
)
FAILED=0
for pattern in "${BANNED_PATTERNS[@]}"; do
  if grep -rn "$pattern" src/ --include="*.js" --include="*.ts" -i 2>/dev/null | grep -v "//.*$pattern" | grep -v "NEVER\|NOT\|Don't\|no " > /dev/null 2>&1; then
    echo "❌ Banned pattern found: $pattern"
    grep -rn "$pattern" src/ --include="*.js" -i | head -3
    FAILED=1
  fi
done
if [ $FAILED -eq 0 ]; then
  echo "✅ No banned patterns detected"
fi

# --- Build check ---
echo "=== Running build ==="
npm run build

echo ""
echo "=== Setup complete ==="
echo "Build output in dist/. Dev server: npm run dev"