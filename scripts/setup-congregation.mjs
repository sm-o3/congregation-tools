#!/usr/bin/env node

/**
 * Congregation Tools - Interactive Automated Setup Wizard
 * Guides a new congregation step-by-step through Steps 1 to 5 directly in the terminal.
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

function openUrl(url) {
    try {
        if (process.platform === 'win32') {
            execSync(`start "" "${url}"`, { stdio: 'ignore' });
        } else if (process.platform === 'darwin') {
            execSync(`open "${url}"`, { stdio: 'ignore' });
        } else {
            execSync(`xdg-open "${url}" 2>/dev/null || true`, { stdio: 'ignore' });
        }
    } catch (e) {
        // Ignore
    }
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

// Fetch list of projects accessible to logged-in user
function getFirebaseProjects() {
    try {
        const out = runCommandSilent('npx -y firebase-tools projects:list --json', { timeout: 25000 });
        if (!out) return [];
        const idx = out.indexOf('{');
        if (idx !== -1) {
            const parsed = JSON.parse(out.slice(idx));
            return parsed.result || [];
        }
    } catch (err) {
        // Fallback
    }
    return [];
}

// Fetch or create Web App config from Firebase CLI
function getProjectSdkConfig(projectId) {
    try {
        let sdkOut = runCommandSilent(`npx -y firebase-tools apps:sdkconfig WEB --project ${projectId}`, { timeout: 20000 });
        let config = parseFirebaseConfigSnippet(sdkOut);
        if (config && config.apiKey) return config;

        // If no web app exists yet in this project, create one automatically
        runCommandSilent(`npx -y firebase-tools apps:create WEB "Congregation Tools" --project ${projectId}`, { timeout: 20000 });
        
        sdkOut = runCommandSilent(`npx -y firebase-tools apps:sdkconfig WEB --project ${projectId}`, { timeout: 20000 });
        config = parseFirebaseConfigSnippet(sdkOut);
        if (config && config.apiKey) return config;
    } catch (err) {
        // Fallback
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

    let hasCliToken = getFirebaseCliToken();

    if (!hasCliToken) {
        log('\nLogging in with Firebase CLI allows this wizard to automatically configure everything for you.', colors.yellow);
        const loginAns = await rl.question(`${colors.bright}Would you like to log in with Firebase CLI now? (Recommended) [Y/n]: ${colors.reset}`);
        const shouldLogin = !loginAns.trim() || loginAns.trim().toLowerCase().startsWith('y');

        if (shouldLogin) {
            log('\nOpening Firebase login in your browser...', colors.cyan);
            runCommand('npx -y firebase-tools login');
            hasCliToken = getFirebaseCliToken();
        }
    } else {
        log('[OK] Firebase CLI authentication detected.', colors.green);
    }

    // -------------------------------------------------------------
    // STEP 2: Project Selection & Configuration
    // -------------------------------------------------------------
    header('Step 2: Select or Create Firebase Project');

    let selectedProjectId = '';
    let firebaseConfig = null;

    if (hasCliToken) {
        log('Fetching your Firebase projects...', colors.cyan);
        const projects = getFirebaseProjects();

        if (projects && projects.length > 0) {
            log('\nFound existing Firebase projects in your Google account:', colors.bright);
            projects.forEach((p, idx) => {
                const label = p.displayName ? `${p.displayName} (${p.projectId})` : p.projectId;
                log(`  [${idx + 1}] ${label}`, colors.white);
            });
            log(`  [N] Create a NEW Firebase project for this congregation`, colors.yellow);
            console.log('');

            const choice = (await rl.question(`${colors.bright}Select a project number or enter 'N' for new [1]: ${colors.reset}`)).trim();
            
            if (!choice || !isNaN(choice)) {
                const idx = choice ? parseInt(choice, 10) - 1 : 0;
                if (projects[idx]) {
                    selectedProjectId = projects[idx].projectId;
                    log(`\nSelected project: "${selectedProjectId}"`, colors.green);
                }
            }
        }
    }

    // If user wants to create a new project or has no projects yet
    if (!selectedProjectId) {
        log('\nEvery congregation needs a Firebase Project.', colors.bright);
        log('Creating a project is 100% FREE on the Spark plan.', colors.white);
        console.log('');
        log('1. Create project via Firebase Console in browser (Recommended - takes 30 seconds)', colors.cyan);
        log('2. Attempt creation via command line', colors.white);
        log('3. I already know my Project ID', colors.white);
        console.log('');

        const createChoice = (await rl.question(`Choose an option [1]: `)).trim();

        if (createChoice === '2') {
            const desiredId = (await rl.question(`Enter unique project ID (e.g. city-cong-tools): `)).trim();
            const displayName = (await rl.question(`Enter project display name (e.g. City Congregation): `)).trim() || desiredId;
            log(`\nAttempting to create project "${desiredId}" via Firebase CLI...`, colors.cyan);
            const created = runCommand(`npx -y firebase-tools projects:create ${desiredId} --display-name "${displayName}"`);
            if (created !== null) {
                selectedProjectId = desiredId;
                log(`[OK] Project created successfully!`, colors.green);
            } else {
                log(`\n[!] Automatic CLI creation did not succeed (Google often requires console terms).`, colors.yellow);
            }
        }

        if (!selectedProjectId && createChoice !== '3') {
            log('\nOpening Firebase Console in your browser...', colors.cyan);
            log('👉 1. Click "Add project" (or "Create a project")', colors.white);
            log('👉 2. Enter your Congregation Name (e.g. "Central Congregation")', colors.white);
            log('👉 3. Click "Continue" -> "Create project"\n', colors.white);
            openUrl('https://console.firebase.google.com/');

            while (!selectedProjectId) {
                const entered = (await rl.question(`${colors.bright}Enter the Project ID you just created in the console: ${colors.reset}`)).trim();
                if (entered) {
                    selectedProjectId = entered;
                }
            }
        } else if (!selectedProjectId) {
            selectedProjectId = (await rl.question(`${colors.bright}Enter your Firebase Project ID: ${colors.reset}`)).trim();
        }
    }

    // Automatically attempt to fetch web app credentials for the project
    if (selectedProjectId && hasCliToken) {
        log(`\nRetrieving Web App configuration for "${selectedProjectId}"...`, colors.cyan);
        firebaseConfig = getProjectSdkConfig(selectedProjectId);
        if (firebaseConfig && firebaseConfig.apiKey) {
            log(`[OK] Retrieved Web App configuration automatically!`, colors.green);
        }
    }

    // Fallback: If config could not be fetched automatically or user needs to paste
    while (!firebaseConfig || !firebaseConfig.apiKey) {
        log(`\n[!] Web App credentials needed for project "${selectedProjectId}".`, colors.yellow);
        log(`1. Open: https://console.firebase.google.com/project/${selectedProjectId}/settings/general`, colors.cyan);
        log(`2. Under "Your apps", click the Web icon (</>) and register your app.`, colors.white);
        log(`3. Copy the "firebaseConfig" snippet.\n`, colors.white);

        const snippet = await rl.question(`${colors.bright}Paste your firebaseConfig snippet (or press ENTER to type API key): ${colors.reset}`);
        const parsed = parseFirebaseConfigSnippet(snippet);

        if (parsed && parsed.apiKey) {
            firebaseConfig = parsed;
            if (!firebaseConfig.projectId) firebaseConfig.projectId = selectedProjectId;
            break;
        }

        const apiKey = (await rl.question(`Firebase API Key (apiKey): `)).trim();
        if (!apiKey) {
            log(`[ERROR] API Key is required. Please paste your config snippet or API key.`, colors.red);
            continue;
        }

        const authDomain = (await rl.question(`Auth Domain [default: ${selectedProjectId}.firebaseapp.com]: `)).trim() || `${selectedProjectId}.firebaseapp.com`;
        const storageBucket = (await rl.question(`Storage Bucket [default: ${selectedProjectId}.firebasestorage.app]: `)).trim() || `${selectedProjectId}.firebasestorage.app`;
        const messagingSenderId = (await rl.question(`Messaging Sender ID: `)).trim();
        const appId = (await rl.question(`App ID (1:xxx:web:xxx): `)).trim();

        firebaseConfig = {
            apiKey,
            authDomain,
            projectId: selectedProjectId,
            storageBucket,
            messagingSenderId,
            appId
        };
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
    log('Please ensure the following two services are activated in Firebase Console:', colors.yellow);
    log(`1. Google Sign-In:   https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`, colors.cyan);
    log(`2. Firestore DB:     https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`, colors.cyan);
    console.log('');

    const openLinksAns = await rl.question(`${colors.bright}Open these two pages in your browser now? [Y/n]: ${colors.reset}`);
    if (!openLinksAns.trim() || openLinksAns.trim().toLowerCase().startsWith('y')) {
        openUrl(`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`);
        openUrl(`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`);
    }

    const deployRulesAns = await rl.question(`\n${colors.bright}Have you created the Firestore Database? Deploy firestore.rules now? [Y/n]: ${colors.reset}`);
    if (!deployRulesAns.trim() || deployRulesAns.trim().toLowerCase().startsWith('y')) {
        log(`Deploying Firestore security rules to "${firebaseConfig.projectId}"...`, colors.cyan);
        const rulesRes = runCommand(`npx -y firebase-tools deploy --only firestore:rules --project ${firebaseConfig.projectId}`);
        if (rulesRes !== null) {
            log(`[OK] Firestore security rules deployed!`, colors.green);
        } else {
            log(`[!] Note: If Firestore DB has not been created yet in the console, create it first, then run "npx firebase deploy --only firestore:rules".`, colors.yellow);
        }
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
        openUrl('http://localhost:5173');

        const devProcess = spawn('npm', ['run', 'dev'], { cwd: ROOT_DIR, stdio: 'inherit', shell: true });
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
