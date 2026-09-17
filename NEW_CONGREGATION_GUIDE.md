# 🏛️ New Congregation Setup & Installation Guide

This guide walks you through setting up **Congregation Tools** for a new congregation in under 10 minutes.

---

## ⚡ 1-Click Quick Start (Choose Your Operating System)

Before running, ensure you have **Node.js (version 18 or newer)** installed from [https://nodejs.org/](https://nodejs.org/).

### 🪟 Windows (1-Click)
1. **Initial Setup**: Double-click `setup-windows.bat` (installs dependencies and creates `.env`).
2. **Start Local App**: Double-click `start-windows.bat` (opens your browser at `http://localhost:5173`).
3. **Deploy to Web**: Double-click `deploy-windows.bat` (builds and deploys to Firebase Hosting).

### 🍎 macOS (1-Click)
1. **Initial Setup**: Double-click `setup-mac.command` in Finder.
2. **Start Local App**: Double-click `start-mac.command` in Finder.
3. **Deploy to Web**: Double-click `deploy-mac.command` in Finder.

### 🐧 Linux (1-Click)
Open your terminal in the project folder and run:
```bash
./setup-unix.sh    # Initial setup & dependency installation
./start-unix.sh    # Starts local server and opens browser
./deploy-unix.sh   # Builds and deploys to Firebase Hosting
```

---

## ☁️ Step 1: Create a Free Firebase Project

Congregation Tools runs on Google Firebase (Authentication, Firestore Database, and Hosting) completely free for standard congregation usage.

1. Go to the [Firebase Console](https://console.firebase.google.com/) and sign in with your Google account.
2. Click **"Add project"** (or "Create a project").
3. Enter your Congregation's project name (e.g., `central-cong-tools`) and follow the on-screen steps.
4. Google Analytics can be enabled or disabled as preferred. Click **Create project**.

---

## 🔑 Step 2: Enable Firebase Services

### 1. Google Authentication
1. In the left navigation menu of Firebase Console, click **Build > Authentication**.
2. Click **Get started**, then open the **Sign-in method** tab.
3. Select **Google**, toggle **Enable**, select your support email, and click **Save**.

### 2. Cloud Firestore Database
1. In the left menu, click **Build > Firestore Database**.
2. Click **Create database**.
3. Choose **Production mode** and select your closest location region.
4. Click **Create**.
5. Once created, go to the **Rules** tab and paste the contents of the `firestore.rules` file from this project repository, then click **Publish**.

### 3. Firebase Hosting
1. In the left menu, click **Build > Hosting**.
2. Click **Get started** and proceed through the initial prompt.

---

## ⚙️ Step 3: Connect Your Project Configuration

1. In Firebase Console, click the **Settings gear icon (⚙️)** in the top left next to *Project Overview* &rarr; select **Project settings**.
2. Scroll down to the **"Your apps"** section and click the **Web icon (`</>`)**.
3. Register your app with a nickname (e.g., `Congregation Web App`).
4. Firebase will present your `firebaseConfig` object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-cong-project.firebaseapp.com",
     projectId: "your-cong-project",
     storageBucket: "your-cong-project.firebasestorage.app",
     messagingSenderId: "123456789...",
     appId: "1:123456789:web:..."
   };
   ```
5. In your project folder, copy `.env.example` to `.env` and fill in your values:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-cong-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-cong-project
   VITE_FIREBASE_STORAGE_BUCKET=your-cong-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789...
   VITE_FIREBASE_APP_ID=1:123456789:web:...
   ```
6. In `.firebaserc`, replace the project ID:
   ```json
   {
     "projects": {
       "default": "your-cong-project"
     }
   }
   ```

---

## 👤 Step 4: Create the Initial Admin User

1. Start your app (`start-windows.bat`, `start-mac.command`, or `./start-unix.sh`).
2. Click **"Sign in with Google"** with the administrator's Google account.
3. You will see **"Access denied"** &mdash; *this is expected!*
4. Go to **Firebase Console > Authentication > Users** tab. Copy your **User UID** column value (e.g., `abc123xyz456...`).
5. Go to **Firebase Console > Firestore Database**:
   - Click **+ Start collection**, name it `users`.
   - **Document ID**: Paste your copied **User UID**.
   - Add these fields:
     - `email` (string): your Google email
     - `displayName` (string): your Name
     - `role` (string): `admin`
     - `spiritualRole` (string): `Elder`
     - `createdAt` (timestamp): current timestamp
   - Click **Save**.
6. Return to your app, refresh the page, and sign in again. You now have full Admin access!

---

## 🚀 Step 5: Deploy to the Web

When you are ready to publish the app online for your elders and servants:
- **Windows**: Double-click `deploy-windows.bat`.
- **macOS**: Double-click `deploy-mac.command`.
- **Linux**: Run `./deploy-unix.sh`.

Your application will be live at:
`https://your-cong-project.web.app`

---

## 🛡️ Role-Based Permissions Summary

- **Admin / Full Access**: Can manage users, adjust congregation settings, edit/delete data across modules.
- **Congregation Service Committee (COBE, Secretary, Service Overseer)**: Only users appointed to these roles can delete records (publishers, groups, reports, meeting attendance).
- **Editor**: Can enter reports, edit schedules, and view publisher cards.
- **Viewer / Publisher**: Limited to their respective authorized modules.
