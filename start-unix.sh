#!/usr/bin/env bash
# Congregation Tools - Start Server (Linux / macOS)

set -e

# If dependencies are not installed yet, run setup first
if [ ! -d "node_modules" ]; then
    echo "[INFO] Dependencies not found. Running setup..."
    bash setup-unix.sh
fi

echo "========================================================"
echo "  Starting Congregation Tools Server..."
echo "  Local URL: http://localhost:5173"
echo "  Press Ctrl+C to stop the server."
echo "========================================================"
echo ""

# Attempt to open default browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173 &> /dev/null &
elif command -v open &> /dev/null; then
    open http://localhost:5173 &> /dev/null &
fi

npm run dev
