# 🎉 Deployment & Setup Guide

Your Congregation Tools Admin Dashboard is ready to deploy and configure!

## 🌐 Application URLs

- **Live App**: `https://<YOUR-PROJECT-ID>.web.app` (or your custom domain)
- **Firebase Console**: `https://console.firebase.google.com/project/<YOUR-PROJECT-ID>/overview`

---

## ⚠️ Initial Setup: Add Admin User Before First Login

You need to add yourself as an admin user to access the application for the first time. Follow these quick steps:

### Step 1: Try to Login (You'll Get "Access Denied")

1. Go to your application URL: `https://<YOUR-PROJECT-ID>.web.app` (or `http://localhost:5173` locally)
2. Click **"Sign in with Google"**
3. Sign in with your Google account
4. You will see **"Access denied"** - this is expected security behavior! ✅

### Step 2: Get Your Firebase Auth UID

1. Go to [Firebase Console](https://console.firebase.google.com) and open your project
2. Click **Authentication** in the left sidebar
3. Click the **Users** tab
4. You will see your Google email address listed
5. **Copy your User UID** (the long alphanumeric string in the "User UID" column)
   - Example: `abc123xyz456def789...`

### Step 3: Add Yourself to Firestore

1. In Firebase Console, click **Firestore Database** in the left sidebar
2. Click **+ Start collection** (if not created yet)
3. Collection ID: `users`
4. Click **Next**
5. Document ID: **Paste your copied User UID from Step 2**
6. Click **Add field** and add these 5 fields:

| Field name | Type | Value |
|------------|------|-------|
| `email` | string | `your-email@gmail.com` (your actual email) |
| `displayName` | string | `Your Name` (your actual name) |
| `role` | string | `admin` |
| `spiritualRole` | string | `Elder` |
| `createdAt` | timestamp | Click the timestamp icon to insert current time |

7. Click **Save**

### Step 4: Login Successfully! ✅

1. Return to your application URL
2. Refresh the page
3. Click **"Sign in with Google"**
4. You now have full admin access! 🎉

---

## 📱 Core Features & Modules

Once logged in as an administrator, you have access to:

- ✅ **Dashboard** - Congregation publisher statistics and quick shortcuts
- ✅ **Congregation Database** - Publishers list, emergency contacts, field service groups, and group sort orders
- ✅ **Reports** - Monthly field service report submission, reports analysis, S-21 publisher records, meeting attendance
- ✅ **Schedule** - Public talks schedule, OCLM workbooks, Kingdom Hall cleaning, sound/mic assignments
- ✅ **Territory Management** - Territory overview, territory list, S-13 territory assignment records
- ✅ **Admin Settings** - User management, role appointments (COBE, Secretary, Service Overseer), and congregation configuration

---

## 👥 Adding More Users & Congregation Service Committee

1. Ask new users to click **Sign in with Google** once on the app (they will see Access Denied).
2. As Admin, navigate to **Settings > Manage Users** tab inside the app to assign their Role (`admin`, `editor`, `viewer`) and Spiritual Role (`Elder`, `Ministerial Servant`, `Publisher`).
3. Set the **Congregation Service Committee** in **Settings > Congregation Appointments**:
   - **Coordinator of the Body of Elders (COBE)**
   - **Secretary**
   - **Service Overseer**
   *(Note: Record deletion permissions are strictly reserved for the Service Committee).*

---

## 🔧 Local Development & Updating

Run with 1-click using the provided startup scripts:
- **Windows**: Double-click `scripts/start-windows.bat`
- **Mac**: Double-click `scripts/start-mac.command`
- **Linux**: Run `./scripts/start-unix.sh`

Or manually via terminal:
```bash
# Install dependencies
npm install

# Start local development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Deploy to Firebase Hosting
npx firebase-tools deploy --only hosting
```
