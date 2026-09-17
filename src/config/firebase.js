import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'

// TODO: Replace with your Firebase project configuration
// Get this from Firebase Console > Project Settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
    apiKey: "AIzaSyCEXowpoZl9FCY4puAFASNPahuuf0ezP5Q",
    authDomain: "cong-tools.firebaseapp.com",
    projectId: "cong-tools",
    storageBucket: "cong-tools.firebasestorage.app",
    messagingSenderId: "950697752839",
    appId: "1:950697752839:web:d6ed7c80abe97d9d27ada2"
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
