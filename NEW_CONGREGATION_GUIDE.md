# 🏛️ New Congregation Setup & Installation Guide

This guide walks you through setting up **Congregation Tools** for a new congregation in under 5 minutes.

---

## ⚡ Step 0: Get Congregation Tools (Choose 1 Option)

### 🪟 Windows (Open PowerShell):
```powershell
irm https://raw.githubusercontent.com/sm-o3/congregation-tools/main/install.ps1 | iex
```
*(Automatically checks Node.js, downloads the app, creates desktop shortcut, installs dependencies, and launches the setup wizard).*

### 🍎 macOS & 🐧 Linux (Open Terminal):
```bash
curl -fsSL https://raw.githubusercontent.com/sm-o3/congregation-tools/main/install.sh | bash
```

### 🖱️ Or Double-Click Local Launchers:
If you downloaded the ZIP or cloned the repo:
- **Windows**: Double-click `setup-windows.bat`
- **macOS**: Double-click `setup-mac.command`
- **Linux**: Run `./setup-unix.sh`

---

## 🤖 Automated Terminal Setup Wizard (Steps 1 – 5 in Terminal)

You can automate Steps 1 through 5 completely in the terminal with our interactive setup wizard:

```bash
npm run setup
```

### What the wizard automates with simple terminal prompts:
1. **Step 1: Firebase Project & Login**  
   - Runs `npx firebase-tools login` to authenticate with your Google account.
   - Lets you choose your Firebase project or provide its ID.

2. **Step 2: Automated Configuration (`.env` & `.firebaserc`)**  
   - Automatically retrieves your Web App configuration keys via Firebase CLI.
   - Automatically generates `.env` and `.firebaserc` without manual file editing!

3. **Step 3: Enable Services & Deploy Firestore Rules**  
   - Automatically publishes `firestore.rules` directly to your Firebase database.
   - Provides direct links to toggle Google Sign-In and Firestore Database.

4. **Step 4: Appoint Initial Admin User**  
   - Prompts for the Congregation Admin / Elder's Google email and display name.
   - Automatically provisions the Admin role in Firestore.
   - When the elder clicks **"Sign in with Google"**, full administrator access is granted immediately.

5. **Step 5: Deploy to Web & Launch**  
   - Prompts to build and deploy to Firebase Hosting (`https://<project-id>.web.app`).
   - Automatically launches the local development server at `http://localhost:5173`.

---

## 📖 Manual Reference (Optional)

If you prefer configuring Firebase manually through the web browser console instead of the automated wizard:

### Step 1: Create a Free Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/) and sign in with your Google account.
2. Click **"Add project"**, enter your congregation project name (e.g., `central-cong-tools`), and click **Create project**.

### Step 2: Enable Firebase Services
1. **Google Authentication**:
   - Go to **Build > Authentication > Sign-in method**.
   - Select **Google**, toggle **Enable**, pick your support email, and click **Save**.
2. **Cloud Firestore Database**:
   - Go to **Build > Firestore Database > Create database**.
   - Choose **Production mode** and click **Create**.
   - Under **Rules**, paste the contents of `firestore.rules` and click **Publish**.
3. **Firebase Hosting**:
   - Go to **Build > Hosting** and click **Get started**.

### Step 3: Connect Project Configuration
1. In Firebase Console, click the **Settings gear (⚙️) > Project settings**.
2. Under "Your apps", click the **Web icon (`</>`)** and register your app.
3. Copy `.env.example` to `.env` and fill in your values:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-cong-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-cong-project
   VITE_FIREBASE_STORAGE_BUCKET=your-cong-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789...
   VITE_FIREBASE_APP_ID=1:123456789:web:...
   ```
4. In `.firebaserc`, replace the project ID with your project ID.

### Step 4: Create Initial Admin User
Run the automated script:
```bash
npm run add-admin
```
Enter the Elder's Google account email and name. The user will be created in Firestore.

### Step 5: Deploy to the Web
- **Windows**: Double-click `deploy-windows.bat`
- **macOS**: Double-click `deploy-mac.command`
- **Linux**: Run `./deploy-unix.sh`

Your app is live at `https://<your-project-id>.web.app`!

---

## 🛡️ Role-Based Permissions Summary

- **Admin / Full Access**: Can manage users, adjust congregation settings, edit/delete data across modules.
- **Congregation Service Committee (COBE, Secretary, Service Overseer)**: Only users appointed to these roles can delete records (publishers, groups, reports, meeting attendance).
- **Editor**: Can enter reports, edit schedules, and view publisher cards.
- **Viewer / Publisher**: Limited to their respective authorized modules.
