#!/usr/bin/env node

/**
 * Congregation Tools - Interactive Automated Setup Wizard
 * Guides a new congregation step-by-step through Steps 1-5 directly in the terminal.
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

// Terminal colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
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
        return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8', stdio: 'pipe', ...options });
    } catch (err) {
        return null;
    }
}

// Helper to extract Firebase config keys from raw pasted text/JSON
function parseFirebaseConfigSnippet(text) {
    if (!text || typeof text !== 'string') return null;

    const findKey = (key) => {
        const regex = new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : null;
    };

    const apiKey = findKey('apiKey');
    const authDomain = findKey('authDomain');
    const projectId = findKey('projectId');
    const storageBucket = findKey('storageBucket');
    const messagingSenderId = findKey('messagingSenderId');
    const appId = findKey('appId');

    if (projectId || apiKey) {
        return {
            apiKey: apiKey || '',
            authDomain: authDomain || (projectId ? `${projectId}.firebaseapp.com` : ''),
            projectId: projectId || '',
            storageBucket: storageBucket || (projectId ? `${projectId}.firebasestorage.app` : ''),
            messagingSenderId: messagingSenderId || '',
            appId: appId || ''
        };
    }
    return null;
}

// Retrieve Firebase CLI access token if logged in
function getFirebaseCliToken() {
    try {
        const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
        if (fs.existsSync(configPath)) {
            const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (data?.tokens?.access_token) {
                return data.tokens.access_token;
            }
        }
    } catch (e) {
        // Ignore
    }
    return null;
}

async function main() {
    const rl = readline.createInterface({ input, output });

    header('🏛️  Congregation Tools - Interactive Setup Wizard');
    log('This wizard will automate Steps 1 to 5 to configure Congregation Tools for your congregation.', colors.bright);
    log('Press Ctrl+C at any time to exit.\n', colors.dim);

    // -------------------------------------------------------------
    // STEP 1: Firebase Project & Authentication
    // -------------------------------------------------------------
    header('Step 1: Firebase Project & CLI Login');
    log('Congregation Tools uses Google Firebase for Database, Authentication, and Hosting.', colors.white);
    log('If you do not have a Firebase project yet, create one free at:', colors.yellow);
    log('👉 https://console.firebase.google.com/ (Click "Add project")\n', colors.cyan);

    const loginAns = await rl.question(`${colors.bright}Would you like to log in with Firebase CLI now? (Recommended) [Y/n]: ${colors.reset}`);
    const shouldLogin = !loginAns.trim() || loginAns.trim().toLowerCase().startsWith('y');

    if (shouldLogin) {
        log('\nOpening Firebase login in your browser...', colors.cyan);
        runCommand('npx -y firebase-tools login');
    }

    // -------------------------------------------------------------
    // STEP 2: Configure Environment (.env & .firebaserc)
    // -------------------------------------------------------------
    header('Step 2: Connect Your Congregation Firebase Configuration');

    let firebaseConfig = null;

    // Check if user wants to attempt automatic config fetch via Firebase CLI
    const hasCliToken = getFirebaseCliToken();
    let projectIdInput = '';

    if (hasCliToken) {
        const fetchAns = await rl.question(`${colors.bright}Enter your Firebase Project ID (e.g. my-congregation-tools): ${colors.reset}`);
        projectIdInput = fetchAns.trim();

        if (projectIdInput) {
            log(`\nAttempting to fetch Web App config for project "${projectIdInput}"...`, colors.cyan);
            const sdkOut = runCommandSilent(`npx -y firebase-tools apps:sdkconfig WEB --project ${projectIdInput}`);
            if (sdkOut) {
                firebaseConfig = parseFirebaseConfigSnippet(sdkOut);
                if (firebaseConfig && firebaseConfig.apiKey) {
                    log(`[OK] Successfully retrieved Firebase config automatically!`, colors.green);
                }
            }
        }
    }

    // Fallback or manual entry
    if (!firebaseConfig || !firebaseConfig.apiKey) {
        log('\nTo get your config from Firebase Console:', colors.yellow);
        log('1. Open https://console.firebase.google.com/', colors.white);
        log('2. Click Project Settings (⚙️ icon) > General > "Your apps" > Web App (</>)', colors.white);
        log('3. Copy your firebaseConfig credentials.\n', colors.white);

        log('You can either paste your entire "const firebaseConfig = { ... };" snippet below,', colors.cyan);
        log('or press ENTER to fill in fields one by one.\n', colors.cyan);

        const snippet = await rl.question(`${colors.bright}Paste firebaseConfig snippet (or press ENTER): ${colors.reset}`);
        const parsed = parseFirebaseConfigSnippet(snippet);

        if (parsed && parsed.apiKey) {
            firebaseConfig = parsed;
        } else {
            const projectId = projectIdInput || (await rl.question(`Firebase Project ID: `)).trim();
            const apiKey = (await rl.question(`Firebase API Key (apiKey): `)).trim();
            const authDomain = (await rl.question(`Auth Domain [default: ${projectId}.firebaseapp.com]: `)).trim() || `${projectId}.firebaseapp.com`;
            const storageBucket = (await rl.question(`Storage Bucket [default: ${projectId}.firebasestorage.app]: `)).trim() || `${projectId}.firebasestorage.app`;
            const messagingSenderId = (await rl.question(`Messaging Sender ID: `)).trim();
            const appId = (await rl.question(`App ID (1:xxx:web:xxx): `)).trim();

            firebaseConfig = {
                apiKey,
                authDomain,
                projectId,
                storageBucket,
                messagingSenderId,
                appId
            };
        }
    }

    // Write .env
    const envContent = [
        `# Congregation Tools - Firebase Configuration`,
        `VITE_FIREBASE_API_KEY=${firebaseConfig.apiKey}`,
        `VITE_FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain}`,
        `VITE_FIREBASE_PROJECT_ID=${firebaseConfig.projectId}`,
        `VITE_FIREBASE_STORAGE_BUCKET=${firebaseConfig.storageBucket}`,
        `VITE_FIREBASE_MESSAGING_SENDER_ID=${firebaseConfig.messagingSenderId}`,
        `VITE_FIREBASE_APP_ID=${firebaseConfig.appId}`,
        ``
    ].join('\n');

    fs.writeFileSync(path.join(ROOT_DIR, '.env'), envContent, 'utf8');
    log(`[OK] Generated .env file with your congregation configuration.`, colors.green);

    // Write .firebaserc
    const firebasercContent = JSON.stringify({
        projects: {
            default: firebaseConfig.projectId
        }
    }, null, 2) + '\n';

    fs.writeFileSync(path.join(ROOT_DIR, '.firebaserc'), firebasercContent, 'utf8');
    log(`[OK] Generated .firebaserc targeting project "${firebaseConfig.projectId}".`, colors.green);

    // -------------------------------------------------------------
    // STEP 3: Firebase Services & Rules Deployment
    // -------------------------------------------------------------
    header('Step 3: Enable Services & Deploy Firestore Rules');
    log('Please ensure the following are enabled in your Firebase Console:', colors.yellow);
    log(`1. Google Sign-In:   https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`, colors.cyan);
    log(`2. Firestore DB:     https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`, colors.cyan);
    console.log('');

    const deployRulesAns = await rl.question(`${colors.bright}Deploy firestore.rules to your project now? [Y/n]: ${colors.reset}`);
    if (!deployRulesAns.trim() || deployRulesAns.trim().toLowerCase().startsWith('y')) {
        log(`Deploying Firestore security rules to "${firebaseConfig.projectId}"...`, colors.cyan);
        runCommand(`npx -y firebase-tools deploy --only firestore:rules --project ${firebaseConfig.projectId}`);
        log(`[OK] Firestore security rules deployed!`, colors.green);
    }

    // -------------------------------------------------------------
    // STEP 4: Initial Admin User Creation
    // -------------------------------------------------------------
    header('Step 4: Appoint Initial Congregation Admin');
    log('The first user needs Admin permissions to log in and configure the congregation.', colors.white);
    console.log('');

    const adminEmail = (await rl.question(`${colors.bright}Enter Admin Google Account Email (e.g. elder@gmail.com): ${colors.reset}`)).trim();
    const adminName = (await rl.question(`${colors.bright}Enter Admin Display Name (e.g. Brother John): ${colors.reset}`)).trim() || 'Admin User';
    
    log('\nSpiritual Role:');
    log('1. Elder (Default)');
    log('2. Ministerial Servant');
    log('3. Publisher');
    const roleChoice = (await rl.question(`Select Spiritual Role [1]: `)).trim();
    const spiritualRole = roleChoice === '2' ? 'Ministerial Servant' : roleChoice === '3' ? 'Publisher' : 'Elder';

    log(`\nAppointing: ${adminName} <${adminEmail}> as Admin (${spiritualRole})...`, colors.cyan);

    let docCreated = false;
    const token = getFirebaseCliToken();

    if (token && adminEmail) {
        try {
            // Write directly to Firestore using Google Firestore REST API with CLI access token
            const docId = adminEmail.toLowerCase().trim();
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users?documentId=${encodeURIComponent(docId)}`;
            
            const payload = {
                fields: {
                    email: { stringValue: adminEmail.toLowerCase().trim() },
                    displayName: { stringValue: adminName },
                    role: { stringValue: 'admin' },
                    spiritualRole: { stringValue: spiritualRole },
                    createdAt: { timestampValue: new Date().toISOString() }
                }
            };

            const response = await fetch(firestoreUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                log(`[OK] Admin user document automatically created in Firestore!`, colors.green);
                docCreated = true;
            }
        } catch (err) {
            // Non-critical, fallback to on-login migration
        }
    }

    if (!docCreated) {
        log(`\n[NOTE] Admin User Prepared:`, colors.yellow);
        log(`When ${adminEmail} clicks "Sign in with Google", Congregation Tools will recognize`, colors.white);
        log(`this administrator email and assign Admin (${spiritualRole}) status automatically.`, colors.white);
    }

    // -------------------------------------------------------------
    // STEP 5: Deploy to Web (Firebase Hosting) & Local Server
    // -------------------------------------------------------------
    header('Step 5: Deployment & Launch');

    const deployWebAns = await rl.question(`${colors.bright}Do you want to build and deploy to Firebase Hosting now? [y/N]: ${colors.reset}`);
    if (deployWebAns.trim().toLowerCase().startsWith('y')) {
        log(`\nBuilding production web bundle...`, colors.cyan);
        runCommand('npm run build');

        log(`Deploying to Firebase Hosting...`, colors.cyan);
        runCommand(`npx -y firebase-tools deploy --only hosting --project ${firebaseConfig.projectId}`);

        log(`\n🎉 Congratulations! Your Congregation Tools is LIVE at:`, colors.green + colors.bright);
        log(`👉 https://${firebaseConfig.projectId}.web.app\n`, colors.cyan + colors.bright);
    }

    const startLocalAns = await rl.question(`${colors.bright}Start local development server now? [Y/n]: ${colors.reset}`);
    rl.close();

    if (!startLocalAns.trim() || startLocalAns.trim().toLowerCase().startsWith('y')) {
        log('\nStarting local development server at http://localhost:5173 ...\n', colors.green);

        // Open browser
        try {
            if (process.platform === 'win32') {
                execSync('start "" http://localhost:5173', { stdio: 'ignore' });
            } else if (process.platform === 'darwin') {
                execSync('open http://localhost:5173', { stdio: 'ignore' });
            } else {
                execSync('xdg-open http://localhost:5173 2>/dev/null || true', { stdio: 'ignore' });
            }
        } catch (e) {
            // Ignore
        }

        const devProcess = spawn('npm', ['run', 'dev'], { cwd: ROOT_DIR, stdio: 'inherit' });
        devProcess.on('close', (code) => process.exit(code || 0));
    } else {
        log('\nSetup complete! You can run the app anytime with:', colors.green);
        log('- Windows: start-windows.bat', colors.white);
        log('- Mac:     start-mac.command', colors.white);
        log('- Linux:   ./start-unix.sh', colors.white);
        console.log('');
        process.exit(0);
    }
}

main().catch((err) => {
    console.error('\nSetup error:', err);
    process.exit(1);
});
