# =====================================================================
#   Congregation Tools - 1-Click Automated PowerShell Installer
#   Usage: irm https://raw.githubusercontent.com/sm-o3/congregation-tools/main/install.ps1 | iex
# =====================================================================

$ErrorActionPreference = "Stop"

# Allow script execution for current PowerShell process (bypasses Restricted policy without needing Admin)
try {
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
} catch {
    # Fallback to Unrestricted in process scope
    try { Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force } catch {}
}

# Use npm.cmd on Windows to prevent npm.ps1 execution policy block
$npmCmd = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { "npm.cmd" } else { "npm" }

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    Congregation Tools - Automated 1-Click Setup        " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check for Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Node.js is not detected on your system." -ForegroundColor Yellow
    
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "[*] Attempting automatic installation via winget..." -ForegroundColor Cyan
        try {
            winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
            # Refresh PATH in current process
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        } catch {
            Write-Host "[!] Automatic install failed." -ForegroundColor Yellow
        }
    }

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host ""
        Write-Host "[ERROR] Node.js is required to run Congregation Tools." -ForegroundColor Red
        Write-Host "Please download and install Node.js (LTS version) from:" -ForegroundColor White
        Write-Host "👉 https://nodejs.org/" -ForegroundColor Cyan
        Write-Host "After installing, re-run this command." -ForegroundColor Yellow
        return
    }
}

$nodeVer = node -v
Write-Host "[OK] Node.js detected: $nodeVer" -ForegroundColor Green

# 2. Check directory / Download repository
$isRepoDir = (Test-Path -LiteralPath "package.json") -and (Get-Content -LiteralPath "package.json" -Raw | Select-String "congregation-tools" -Quiet)

if (-not $isRepoDir) {
    $currentPath = (Get-Location).Path
    $installDir = Join-Path $currentPath "Cong-Tools"
    Write-Host "[*] Setting up in: $installDir" -ForegroundColor Cyan

    if (Test-Path -LiteralPath $installDir) {
        Set-Location -LiteralPath $installDir
    } else {
        if (Get-Command git -ErrorAction SilentlyContinue) {
            Write-Host "[*] Cloning repository from GitHub..." -ForegroundColor Cyan
            git clone https://github.com/sm-o3/congregation-tools.git "$installDir"
            Set-Location -LiteralPath $installDir
        } else {
            Write-Host "[*] Downloading Congregation Tools package..." -ForegroundColor Cyan
            $tempDir = [System.IO.Path]::GetTempPath()
            $zipPath = Join-Path $tempDir "cong-tools.zip"
            $extractPath = Join-Path $tempDir "cong-tools-extract"

            if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
            if (Test-Path -LiteralPath $extractPath) { Remove-Item -LiteralPath $extractPath -Recurse -Force }

            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri "https://github.com/sm-o3/congregation-tools/archive/refs/heads/main.zip" -OutFile $zipPath
            
            Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force
            
            if (-not (Test-Path -LiteralPath $installDir)) {
                New-Item -ItemType Directory -Path $installDir -Force | Out-Null
            }

            # Copy extracted files recursively into $installDir (avoids 8.3 short-name & Move-Item path issues with spaces)
            $sourceContent = Join-Path $extractPath "congregation-tools-main"
            Get-ChildItem -LiteralPath $sourceContent -Force | ForEach-Object {
                Copy-Item -LiteralPath $_.FullName -Destination $installDir -Recurse -Force
            }

            Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
            Remove-Item -LiteralPath $extractPath -Recurse -Force -ErrorAction SilentlyContinue

            Set-Location -LiteralPath $installDir
        }
    }
}

# 3. Setup environment configuration
if (-not (Test-Path -LiteralPath ".env")) {
    if (Test-Path -LiteralPath ".env.example") {
        Copy-Item -LiteralPath ".env.example" -Destination ".env"
        Write-Host "[OK] Configuration template created (.env)" -ForegroundColor Green
    }
}

# 4. Install Dependencies
Write-Host "[*] Installing dependencies ($npmCmd install)..." -ForegroundColor Cyan
& $npmCmd install

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm install encountered an error. Please check your internet connection." -ForegroundColor Red
    return
}

# 5. Create Desktop Shortcut for easy 1-click launching later
try {
    $currentDir = (Get-Location).Path
    $wshShell = New-Object -ComObject WScript.Shell
    $desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
    $shortcutPath = Join-Path $desktopPath "Congregation Tools.lnk"
    $shortcut = $wshShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = (Join-Path $currentDir "start-windows.bat")
    $shortcut.WorkingDirectory = $currentDir
    $shortcut.Description = "Launch Congregation Tools"
    $shortcut.Save()
    Write-Host "[OK] Created Desktop shortcut: 'Congregation Tools'" -ForegroundColor Green
} catch {
    # Non-critical, continue
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "    [SUCCESS] Congregation Tools is Ready!              " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

$runWizard = Read-Host "Would you like to run the automated Firebase setup wizard to configure your congregation now? (Y/n)"
if ([string]::IsNullOrWhiteSpace($runWizard) -or $runWizard.Trim().ToLower().StartsWith("y")) {
    node scripts\setup-congregation.mjs
} else {
    Write-Host ""
    Write-Host "Starting local development server..." -ForegroundColor Cyan
    Write-Host "Opening http://localhost:5173 in your default browser..." -ForegroundColor Cyan
    Write-Host ""
    Start-Process "http://localhost:5173"
    & $npmCmd run dev
}
