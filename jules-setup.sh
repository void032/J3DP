#!/usr/bin/env bash
set -e

echo "=== Node / npm versions ==="
node -v && npm -v

# Skip install if package.json doesn't exist yet (scaffold tasks)
if [ -f "package.json" ]; then
  echo "=== Installing dependencies ==="
  npm install

  echo "=== Verifying stack packages ==="
  node -e "require.resolve('three')"   && echo "✅ three"
  node -e "require.resolve('gsap')"    && echo "✅ gsap"
  node -e "require.resolve('animejs')" && echo "✅ animejs"
  node -e "require.resolve('vite')"    && echo "✅ vite"

  echo "=== Checking banned patterns ==="
  BANNED=("OrbitControls" "EffectComposer" "BloomPass" "TextGeometry" "react" "vue")
  for p in "${BANNED[@]}"; do
    if grep -rn "$p" src/ --include="*.js" -i 2>/dev/null | grep -v "//" > /dev/null 2>&1; then
      echo "❌ Banned pattern found: $p"
      grep -rn "$p" src/ --include="*.js" -i | head -3
    fi
  done

  echo "=== Build check ==="
  npm run build
else
  echo "⚠️  No package.json found — scaffold task detected, skipping install/build"
fi

echo "=== Setup done ==="