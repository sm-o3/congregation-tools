// Script to add initial admin user to Firestore
// Run this with: npm run add-admin or node add-admin-user.js

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env if available
function loadEnv() {
    const envPath = path.resolve(__dirname, '..', '.env');
    const env = {};
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const [key, ...vals] = trimmed.split('=');
                env[key.trim()] = vals.join('=').trim();
            }
        });
    }
    return env;
}

const env = loadEnv();

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Error: Firebase configuration not found in .env file.');
    console.error('Please run "npm run setup:congregation" or configure .env first.');
    process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addAdminUser() {
    const rl = readline.createInterface({ input, output });

    console.log('\n========================================================');
    console.log('       Appoint Initial Congregation Admin User          ');
    console.log('========================================================\n');

    try {
        const email = (await rl.question('Admin Google Account Email (e.g. brother@gmail.com): ')).trim();
        if (!email) {
            console.error('Email is required.');
            process.exit(1);
        }

        const displayName = (await rl.question('Admin Full Name: ')).trim() || 'Admin User';
        
        console.log('\nSpiritual Role:');
        console.log('1. Elder (Default)');
        console.log('2. Ministerial Servant');
        console.log('3. Publisher');
        const roleChoice = (await rl.question('Select Spiritual Role [1]: ')).trim();
        const spiritualRole = roleChoice === '2' ? 'Ministerial Servant' : roleChoice === '3' ? 'Publisher' : 'Elder';

        rl.close();

        const adminUser = {
            email: email.toLowerCase().trim(),
            displayName: displayName,
            role: 'admin',
            spiritualRole: spiritualRole,
            createdAt: serverTimestamp()
        };

        // Create document using sanitized email as document key
        const docId = email.toLowerCase().trim();
        const userRef = doc(db, 'users', docId);
        await setDoc(userRef, adminUser);

        console.log('\n✅ Success! Admin user document created in Firestore:');
        console.log(`- Email: ${email}`);
        console.log(`- Name: ${displayName}`);
        console.log(`- Role: admin`);
        console.log(`- Spiritual Role: ${spiritualRole}`);
        console.log('\nWhen signing in via Google, Congregation Tools will automatically');
        console.log('link your account and grant full administrative access!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user in Firestore:', error.message);
        console.log('\nIf permission was denied, ensure you have enabled Firestore');
        console.log('or add the user via Firebase Console > Firestore Database > users collection.');
        process.exit(1);
    }
}

addAdminUser();
