#!/usr/bin/env node

/**
 * Congregation Tools - 1-Click Codebase Updater
 * Pulls the latest code from GitHub, updates dependencies, and optionally redeploys.
 */

import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function log(msg = '', color = colors.reset) {
    console.log(`${color}${msg}${colors.reset}`);
}

function header(title) {
    console.log('');
    log('========================================================================', colors.cyan);
    log(`  ${title}`, colors.bright + colors.cyan);
    log('========================================================================', colors.cyan);
    console.log('');
}

function runCommand(cmd, options = {}) {
    try {
        return execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit', ...options });
    } catch (err) {
        return null;
    }
}

function runCommandSilent(cmd, options = {}) {
    try {
        return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], ...options });
    } catch (err) {
        return null;
    }
}

function openUrl(url) {
    try {
        if (process.platform === 'win32') {
            execSync(`start "" "${url}"`, { stdio: 'ignore' });
        } else if (process.platform === 'darwin') {
            execSync(`open "${url}"`, { stdio: 'ignore' });
        } else {
            execSync(`xdg-open "${url}" 2>/dev/null || true`, { stdio: 'ignore' });
        }
    } catch (e) {}
}

// Copy directory recursively while preserving ignored files (.env, node_modules)
function copyDirPreserveConfig(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        // Never overwrite local configuration or dependencies
        if (entry.name === '.env' || entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
            continue;
        }

        if (entry.isDirectory()) {
            copyDirPreserveConfig(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

async function main() {
    const rl = readline.createInterface({ input, output });

    header('🔄  Congregation Tools - Codebase Updater');
    log('Checking for the latest updates from GitHub...\n', colors.bright);

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const isGitRepo = fs.existsSync(path.join(ROOT_DIR, '.git'));
    const hasGitCmd = runCommandSilent('git --version') !== null;

    let updatedViaGit = false;

    if (isGitRepo && hasGitCmd) {
        log('[*] Git repository detected. Pulling latest commits...', colors.cyan);
        
        // Stash any accidental local modifications to tracked files
        const statusOut = runCommandSilent('git status --porcelain');
        let stashed = false;
        if (statusOut && statusOut.trim()) {
            log('[*] Preserving local changes...', colors.dim);
            runCommandSilent('git stash');
            stashed = true;
        }

        const pullResult = runCommand('git pull origin main');
        if (stashed) {
            runCommandSilent('git stash pop');
        }

        if (pullResult !== null) {
            log('\n[OK] Git update completed successfully!', colors.green);
            updatedViaGit = true;
        } else {
            log('\n[!] Git pull encountered an issue. Falling back to archive download...', colors.yellow);
        }
    }

    // Fallback if not a git repository or git pull failed
    if (!updatedViaGit) {
        log('[*] Downloading latest release archive from GitHub...', colors.cyan);
        const tempDir = os.tmpdir();
        const zipPath = path.join(tempDir, 'cong-tools-update.zip');
        const extractPath = path.join(tempDir, 'cong-tools-update-extract');

        try {
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            if (fs.existsSync(extractPath)) fs.rmSync(extractPath, { recursive: true, force: true });

            // Download latest zip using curl or node fetch
            const zipUrl = 'https://github.com/sm-o3/congregation-tools/archive/refs/heads/main.zip';
            const response = await fetch(zipUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            fs.writeFileSync(zipPath, Buffer.from(arrayBuffer));

            log('[*] Unpacking updated files...', colors.cyan);
            if (process.platform === 'win32') {
                execSync(`powershell -command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${extractPath}' -Force"`, { stdio: 'ignore' });
            } else {
                execSync(`unzip -q "${zipPath}" -d "${extractPath}"`, { stdio: 'ignore' });
            }

            const extractedRoot = path.join(extractPath, 'congregation-tools-main');
            if (fs.existsSync(extractedRoot)) {
                copyDirPreserveConfig(extractedRoot, ROOT_DIR);
                log('[OK] Files updated while keeping your .env credentials safe.', colors.green);
            }

            // Cleanup
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            if (fs.existsSync(extractPath)) fs.rmSync(extractPath, { recursive: true, force: true });
        } catch (downloadErr) {
            log(`\n[ERROR] Failed to download update: ${downloadErr.message}`, colors.red);
            log('Please check your internet connection or git status.', colors.white);
            process.exit(1);
        }
    }

    // Update dependencies
    log('\n[*] Updating dependencies (npm install)...', colors.cyan);
    runCommand(`${npmCmd} install`);

    // Make scripts executable on Unix/macOS
    if (process.platform !== 'win32') {
        runCommandSilent('chmod +x scripts/*.sh scripts/*.command scripts/*.mjs scripts/*.js 2>/dev/null || true');
    }

    log('\n========================================================', colors.green);
    log('  [SUCCESS] Codebase is up to date!', colors.bright + colors.green);
    log('========================================================\n', colors.green);

    // Prompt to redeploy to Firebase Hosting
    const deployAns = await rl.question(`${colors.bright}Deploy updated version to Firebase Hosting now? [y/N]: ${colors.reset}`);
    if (deployAns.trim().toLowerCase().startsWith('y')) {
        log('\nBuilding updated web bundle...', colors.cyan);
        runCommand(`${npmCmd} run build`);

        log('Deploying to Firebase Hosting...', colors.cyan);
        runCommand('npx -y firebase-tools deploy --only hosting');
        log('\n[OK] Hosting redeployment complete!', colors.green);
    }

    // Prompt to start local dev server
    const startAns = await rl.question(`\n${colors.bright}Start local development server now? [Y/n]: ${colors.reset}`);
    rl.close();

    if (!startAns.trim() || startAns.trim().toLowerCase().startsWith('y')) {
        log('\nStarting local development server at http://localhost:5173 ...\n', colors.green);
        openUrl('http://localhost:5173');

        const devProcess = spawn(npmCmd, ['run', 'dev'], { cwd: ROOT_DIR, stdio: 'inherit', shell: true });
        devProcess.on('close', (code) => process.exit(code || 0));
    } else {
        log('\nDone! You can launch the app anytime with start script.\n', colors.cyan);
        process.exit(0);
    }
}

main().catch((err) => {
    console.error('\nUpdate error:', err);
    process.exit(1);
});
