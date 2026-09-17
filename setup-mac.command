#!/bin/bash
# Congregation Tools - 1-Click Setup (macOS)
cd "$(dirname "$0")"
bash setup-unix.sh
read -n 1 -s -r -p "Press any key to close this window..."
echo ""
