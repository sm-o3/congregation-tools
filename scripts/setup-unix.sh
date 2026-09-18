#!/usr/bin/env bash
# Congregation Tools - 1-Click Setup (Linux / macOS)

set -e
cd "$(dirname "$0")/.."

echo "========================================================"
echo "  Congregation Tools - Initial Setup"
echo "========================================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js (v18 or newer) from https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js detected: $(node -v)"
echo "[OK] npm detected: $(npm -v)"
echo ""

# Setup environment configuration
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "[INFO] Creating .env from .env.example..."
        cp .env.example .env
        echo "[OK] .env file created. Edit it with your Firebase credentials."
    fi
fi

# Install dependencies
echo "[INFO] Installing project dependencies..."
npm install

# Make scripts executable
chmod +x scripts/*.sh scripts/*.command scripts/*.mjs 2>/dev/null || true

echo ""
echo "========================================================"
echo "  [SUCCESS] Dependencies Installed!"
echo "========================================================"
echo ""
read -p "Would you like to run the automated Firebase setup wizard now? (Y/N): " runWizard
if [[ "$runWizard" =~ ^[Yy]$ ]]; then
    node scripts/setup-congregation.mjs
else
    echo ""
    echo "You can configure your congregation anytime by running:"
    echo "  npm run setup"
    echo ""
    echo "To start the app:"
    echo "  ./scripts/start-unix.sh  : Local server (http://localhost:5173)"
    echo "  ./scripts/deploy-unix.sh : Deploy to Firebase Hosting"
    echo ""
fi
