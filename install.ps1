# =====================================================================
#   Congregation Tools - 1-Click Automated PowerShell Installer
#   Usage: irm https://raw.githubusercontent.com/sm-o3/congregation-tools/main/install.ps1 | iex
# =====================================================================

$ErrorActionPreference = "Stop"

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
$isRepoDir = (Test-Path "package.json") -and (Get-Content "package.json" -Raw | Select-String "congregation-tools" -Quiet)

if (-not $isRepoDir) {
    $installDir = Join-Path (Get-Location) "Cong-Tools"
    Write-Host "[*] Setting up in: $installDir" -ForegroundColor Cyan

    if (Test-Path $installDir) {
        Set-Location $installDir
    } else {
        if (Get-Command git -ErrorAction SilentlyContinue) {
            Write-Host "[*] Cloning repository from GitHub..." -ForegroundColor Cyan
            git clone https://github.com/sm-o3/congregation-tools.git Cong-Tools
            Set-Location Cong-Tools
        } else {
            Write-Host "[*] Downloading Congregation Tools package..." -ForegroundColor Cyan
            $zipPath = Join-Path $env:TEMP "cong-tools.zip"
            $extractPath = Join-Path $env:TEMP "cong-tools-extract"

            if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
            if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }

            Invoke-WebRequest -Uri "https://github.com/sm-o3/congregation-tools/archive/refs/heads/main.zip" -OutFile $zipPath
            Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
            
            Move-Item -Path (Join-Path $extractPath "congregation-tools-main") -Destination $installDir
            Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
            Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue

            Set-Location $installDir
        }
    }
}

# 3. Setup environment configuration
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[OK] Configuration template created (.env)" -ForegroundColor Green
    }
}

# 4. Install Dependencies
Write-Host "[*] Installing dependencies (npm install)..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] npm install encountered an error. Please check your internet connection." -ForegroundColor Red
    return
}

# 5. Create Desktop Shortcut for easy 1-click launching later
try {
    $wshShell = New-Object -ComObject WScript.Shell
    $desktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
    $shortcutPath = Join-Path $desktopPath "Congregation Tools.lnk"
    $shortcut = $wshShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = (Join-Path (Get-Location) "start-windows.bat")
    $shortcut.WorkingDirectory = (Get-Location)
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
Write-Host "Starting local development server..." -ForegroundColor Cyan
Write-Host "Opening http://localhost:5173 in your default browser..." -ForegroundColor Cyan
Write-Host ""

Start-Process "http://localhost:5173"
npm run dev
