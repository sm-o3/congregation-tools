#!/usr/bin/env bash
# Congregation Tools - 1-Click Updater (Linux / macOS)

set -e
cd "$(dirname "$0")/.."

echo "========================================================"
echo "  Updating Congregation Tools..."
echo "========================================================"
echo ""

node scripts/update.mjs
