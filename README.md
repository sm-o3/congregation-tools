# Congregation Tools - Admin Dashboard

Production-ready Single Page Admin Dashboard built with Vue 3, Vuetify, and Firebase.

## ⚡ Instant 1-Line URL Installation

You can set up and run Congregation Tools instantly by running a single command:

### 🪟 Windows (Open PowerShell):
```powershell
irm https://raw.githubusercontent.com/sm-o3/congregation-tools/main/scripts/install.ps1 | iex
```
*(Automatically checks Node.js, downloads the app, creates desktop shortcut, installs dependencies, and opens the browser).*

### 🍎 macOS & 🐧 Linux (Open Terminal):
```bash
curl -fsSL https://raw.githubusercontent.com/sm-o3/congregation-tools/main/scripts/install.sh | bash
```

---

## 🖱️ Or Double-Click Local Launchers

If you have downloaded this repository folder:

- **Windows**: Double-click `scripts/start-windows.bat` (automatically runs setup on first launch).
- **macOS**: Double-click `scripts/start-mac.command` in Finder.
- **Linux**: Run `./scripts/start-unix.sh`.

👉 **For complete 5-minute setup with your own congregation's Firebase backend, see [NEW_CONGREGATION_GUIDE.md](NEW_CONGREGATION_GUIDE.md).**

## Features

- **Authentication**: Google Sign-In with Firebase Authentication
- **Authorization**: Role-Based Access Control (Admin, Editor)
- **Database Management**: Publishers, Groups with CRUD operations
- **Reports**: Field service reports with aggregated statistics
- **Schedules**: Public talks, OCLM, Cleaning, Sound schedules
- **Territory Management**: Territory tracking (placeholder)
- **Responsive Design**: Material Design with Vuetify
- **Real-time Updates**: Firestore real-time database

## Tech Stack

- Vue 3 (Composition API)
- Vuetify 3 (Material Design)
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting
- Pinia (State Management)
- Vue Router
- Vite

## Prerequisites

- Node.js 16+ and npm
- Firebase account
- Firebase CLI (`npm install -g firebase-tools`)

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name and follow the setup wizard
4. Enable Google Analytics (optional)

### 2. Enable Firebase Services

#### Enable Authentication
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Google** provider
3. Add your domain to authorized domains

#### Enable Firestore
1. Go to **Firestore Database**
2. Click **Create database**
3. Start in **production mode**
4. Choose a location

#### Enable Hosting
1. Go to **Hosting**
2. Click **Get started**
3. Follow the setup instructions

### 3. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click **Web** icon (</>) to add a web app
4. Register your app
5. Copy the Firebase configuration object

### 4. Update Firebase Configuration

Edit `src/config/firebase.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

Also update `.firebaserc`:

```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  }
}
```

## Installation

```bash
# Install dependencies
npm install

# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools
```

## Development

```bash
# Run development server
npm run dev

# Access at http://localhost:5173
```

## Adding Initial Admin Users

Before you can log in, you need to manually add admin users to Firestore:

### Option 1: Using Firebase Console

1. Go to **Firestore Database** in Firebase Console
2. Click **Start collection**
3. Collection ID: `users`
4. Add a document with:
   - Document ID: (Use your Firebase Auth UID - you can get this after first login attempt)
   - Fields:
     ```
     email: "your-email@gmail.com"
     displayName: "Your Name"
     role: "admin"
     createdAt: (timestamp)
     ```

### Option 2: Using Firebase CLI

```bash
# Login to Firebase
firebase login

# Open Firestore in browser
firebase firestore:shell
```

Then run:
```javascript
db.collection('users').add({
  uid: 'YOUR_FIREBASE_AUTH_UID',
  email: 'your-email@gmail.com',
  displayName: 'Your Name',
  role: 'admin',
  createdAt: new Date()
})
```

## User Roles

- **admin**: Full access - can create, read, update, delete all data
- **editor**: Limited access - can read all data, create reports and schedules, but cannot delete

## Deployment

### 1. Build the Application

```bash
npm run build
```

This creates a `dist` folder with production-ready files.

### 2. Deploy to Firebase Hosting

```bash
# Login to Firebase (if not already logged in)
firebase login

# Deploy
firebase deploy
```

Or deploy only hosting:
```bash
firebase deploy --only hosting
```

Or deploy only Firestore rules:
```bash
firebase deploy --only firestore:rules
```

### 3. Access Your App

After deployment, your app will be available at:
```
https://YOUR_PROJECT_ID.web.app
```

## Project Structure

```
cong-tools/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, styles
│   ├── components/      # Vue components
│   │   ├── layout/      # Layout components (AppBar, NavigationDrawer, etc.)
│   │   ├── database/    # Database-specific components
│   │   ├── reports/     # Reports-specific components
│   │   ├── schedule/    # Schedule-specific components
│   │   └── common/      # Shared components
│   ├── composables/     # Reusable composition functions
│   ├── config/          # Configuration files
│   │   └── firebase.js  # Firebase configuration
│   ├── router/          # Vue Router configuration
│   │   └── index.js     # Routes and navigation guards
│   ├── stores/          # Pinia stores
│   │   └── auth.js      # Authentication store
│   ├── views/           # Page components
│   │   ├── database/    # Database pages
│   │   ├── reports/     # Reports pages
│   │   ├── schedule/    # Schedule pages
│   │   └── territory/   # Territory pages
│   ├── App.vue          # Root component
│   └── main.js          # Application entry point
├── firestore.rules      # Firestore security rules
├── firebase.json        # Firebase configuration
├── .firebaserc          # Firebase project configuration
├── package.json         # Dependencies
└── vite.config.js       # Vite configuration
```

## Firestore Collections

### users
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: 'admin' | 'editor',
  createdAt: timestamp
}
```

### publishers
```javascript
{
  name: string,
  dob: timestamp,
  baptismDate: timestamp,
  role: string,
  pioneerType: 'regular' | 'auxiliary' | null,
  mobile: string,
  alternateMobile: string,
  address: string,
  groupId: string,
  family: string,
  gender: 'brother' | 'sister',
  ageCategory: 'aged' | 'youngster' | 'child' | 'adult',
  baptized: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### groups
```javascript
{
  name: string,
  overseer: string,
  assistant: string,
  members: array<string>,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### reports
```javascript
{
  publisherId: string,
  groupId: string,
  month: number,
  year: number,
  sharedInMinistry: boolean,
  auxiliaryPioneer: boolean,
  hours: number,
  studies: number,
  comments: string,
  createdAt: timestamp,
  createdBy: string
}
```

### publicTalks
```javascript
{
  date: timestamp,
  speaker: string,
  topic: string,
  congregation: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Security

- Only authenticated users with entries in the `users` collection can access the app
- Unauthorized users are automatically signed out after login
- Firestore security rules enforce role-based access control
- All routes are protected with authentication guards

## Troubleshooting

### "Access denied" error after login
- Make sure your user email is added to the `users` collection in Firestore
- Verify the `role` field is set to either `admin` or `editor`

### Firebase configuration errors
- Double-check your Firebase config in `src/config/firebase.js`
- Ensure all Firebase services are enabled in the console

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## License

MIT

## Support

For issues and questions, please create an issue in the repository.
