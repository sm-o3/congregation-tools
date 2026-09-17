// Script to add initial admin user to Firestore
// Run this with: node add-admin-user.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCEXowpoZl9FCY4puAFASNPahuuf0ezP5Q",
    authDomain: "cong-tools.firebaseapp.com",
    projectId: "cong-tools",
    storageBucket: "cong-tools.firebasestorage.app",
    messagingSenderId: "950697752839",
    appId: "1:950697752839:web:d6ed7c80abe97d9d27ada2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addAdminUser() {
    try {
        // IMPORTANT: Replace these values with your actual information
        const adminUser = {
            // You'll get the UID after your first login attempt
            // For now, we'll use your email as the document ID
            email: "sundar6445@gmail.com", // REPLACE THIS
            displayName: "Sam Sundar", // REPLACE THIS
            role: "admin",
            createdAt: serverTimestamp()
        };

        console.log('⚠️  IMPORTANT: You need to update this script with your information:');
        console.log('1. Replace "your-email@gmail.com" with your actual Gmail address');
        console.log('2. Replace "Your Name" with your actual name');
        console.log('3. After first login, get your Firebase Auth UID and update the document ID');
        console.log('\nFor now, this script will create a placeholder document.');
        console.log('After your first login attempt, you can find your UID in the Firebase Console:');
        console.log('Authentication > Users tab\n');

        // Create a temporary document - you'll need to update the document ID with your UID later
        const userRef = doc(db, 'users', 'TEMP_REPLACE_WITH_YOUR_UID');
        await setDoc(userRef, adminUser);

        console.log('✅ Placeholder admin user document created!');
        console.log('\nNext steps:');
        console.log('1. Try to login to your app with your Google account');
        console.log('2. You will see "Access denied" - this is expected');
        console.log('3. Go to Firebase Console > Authentication > Users');
        console.log('4. Copy your User UID');
        console.log('5. Go to Firestore Database > users collection');
        console.log('6. Delete the TEMP document and create a new one with your UID as the document ID');
        console.log('7. Add the same fields: email, displayName, role: "admin", createdAt');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding admin user:', error);
        process.exit(1);
    }
}

addAdminUser();
