#!/usr/bin/env bash
# Congregation Tools - Deploy to Firebase Hosting (Linux / macOS)

set -e
cd "$(dirname "$0")/.."

echo "========================================================"
echo "  Building and Deploying to Firebase Hosting..."
echo "========================================================"
echo ""

echo "[INFO] Running production build..."
npm run build

echo ""
echo "[INFO] Deploying build to Firebase Hosting..."
npx -y firebase-tools deploy --only hosting

echo ""
echo "========================================================"
echo "  [SUCCESS] Application successfully deployed!"
echo "========================================================"
echo ""
