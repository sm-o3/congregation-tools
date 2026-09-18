#!/usr/bin/env bash
# =====================================================================
#   Congregation Tools - 1-Click Automated Terminal Installer
#   Usage: curl -fsSL https://raw.githubusercontent.com/sm-o3/congregation-tools/main/install.sh | bash
# =====================================================================

set -e

echo ""
echo -e "\033[1;36m========================================================\033[0m"
echo -e "\033[1;36m    Congregation Tools - Automated 1-Click Setup        \033[0m"
echo -e "\033[1;36m========================================================\033[0m"
echo ""

# 1. Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo -e "\033[1;33m[!] Node.js is not installed on your system.\033[0m"
    echo "Please install Node.js (v18 or higher):"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "👉 On macOS with Homebrew: \033[1;32mbrew install node\033[0m"
        echo -e "👉 Or download from: \033[1;34mhttps://nodejs.org/\033[0m"
    else
        echo -e "👉 On Ubuntu/Debian: \033[1;32msudo apt update && sudo apt install -y nodejs npm\033[0m"
        echo -e "👉 Or download from: \033[1;34mhttps://nodejs.org/\033[0m"
    fi
    exit 1
fi

echo -e "\033[1;32m[OK] Node.js detected: $(node -v)\033[0m"
echo -e "\033[1;32m[OK] npm detected: $(npm -v)\033[0m"

# 2. Check directory / Download repository
if [[ ! -f "package.json" ]] || ! grep -q "congregation-tools" "package.json" 2>/dev/null; then
    INSTALL_DIR="$(pwd)/Cong-Tools"
    echo -e "\033[1;34m[*] Setting up in: $INSTALL_DIR\033[0m"

    if [ -d "$INSTALL_DIR" ]; then
        cd "$INSTALL_DIR"
    else
        if command -v git >/dev/null 2>&1; then
            echo -e "\033[1;34m[*] Cloning repository from GitHub...\033[0m"
            git clone https://github.com/sm-o3/congregation-tools.git Cong-Tools
            cd Cong-Tools
        else
            echo -e "\033[1;34m[*] Downloading package archive...\033[0m"
            curl -fsSL https://github.com/sm-o3/congregation-tools/archive/refs/heads/main.zip -o /tmp/cong-tools.zip
            unzip -q /tmp/cong-tools.zip -d /tmp/cong-tools-extract
            mv /tmp/cong-tools-extract/congregation-tools-main "$INSTALL_DIR"
            rm -rf /tmp/cong-tools.zip /tmp/cong-tools-extract
            cd "$INSTALL_DIR"
        fi
    fi
fi

# 3. Environment file setup
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "\033[1;32m[OK] Configuration template created (.env)\033[0m"
    fi
fi

# 4. Make all helper scripts executable
chmod +x scripts/*.sh scripts/*.command scripts/*.mjs 2>/dev/null || true

# 5. Install Dependencies
echo -e "\033[1;34m[*] Installing dependencies (npm install)...\033[0m"
npm install

echo ""
echo -e "\033[1;32m========================================================\033[0m"
echo -e "\033[1;32m    [SUCCESS] Congregation Tools is Ready!              \033[0m"
echo -e "\033[1;32m========================================================\033[0m"
echo ""

read -p "Would you like to run the automated Firebase setup wizard to configure your congregation now? (Y/n): " runWizard
if [[ -z "$runWizard" || "$runWizard" =~ ^[Yy]$ ]]; then
    node scripts/setup-congregation.mjs
else
    echo ""
    echo -e "\033[1;36mStarting local development server...\033[0m"
    echo -e "\033[1;36mOpening http://localhost:5173 in your browser...\033[0m"
    echo ""

    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "http://localhost:5173" 2>/dev/null || true
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "http://localhost:5173" 2>/dev/null || true
    fi

    npm run dev
fi
