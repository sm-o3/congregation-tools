import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'

// Firebase configuration supports environment variables (.env) or direct config
// Get this from Firebase Console > Project Settings > General > Your apps > SDK setup
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCEXowpoZl9FCY4puAFASNPahuuf0ezP5Q",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cong-tools.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cong-tools",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cong-tools.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "950697752839",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:950697752839:web:d6ed7c80abe97d9d27ada2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
})
export const googleProvider = new GoogleAuthProvider()

// Set auth persistence to LOCAL (persists even when browser is closed)
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log('Auth persistence enabled')
    })
    .catch((error) => {
        console.error('Error setting persistence:', error)
    })

export default app
