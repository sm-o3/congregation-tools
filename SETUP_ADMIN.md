# Adding Initial Admin User to Firestore

Since you need your Firebase Auth UID to create the user document, here's the recommended approach:

## Method 1: Manual Setup via Firebase Console (Recommended)

### Step 1: Try to Login First
1. Build and run your app locally: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Click "Sign in with Google"
4. Sign in with your Google account
5. You'll see "Access denied" - **this is expected!**

### Step 2: Get Your UID
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **cong-tools**
3. Go to **Authentication** > **Users** tab
4. You should see your email listed
5. **Copy your User UID** (long string like: `abc123xyz456...`)

### Step 3: Add User to Firestore
1. In Firebase Console, go to **Firestore Database**
2. Click **Start collection**
3. Collection ID: `users`
4. Click **Next**
5. Document ID: **Paste your UID from Step 2**
6. Add these fields:

| Field Name | Type | Value |
|------------|------|-------|
| `email` | string | your-email@gmail.com |
| `displayName` | string | Your Name |
| `role` | string | `admin` |
| `createdAt` | timestamp | (click "Insert timestamp") |

7. Click **Save**

### Step 4: Test Login
1. Go back to your app
2. Refresh the page
3. Sign in again
4. You should now have full access! ✅

---

## Method 2: Using Firebase CLI (Alternative)

If you prefer using the command line:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Open Firestore shell
firebase firestore:shell --project cong-tools
```

Then in the Firestore shell, run:
```javascript
// Replace YOUR_UID with your actual Firebase Auth UID
db.collection('users').doc('YOUR_UID').set({
  email: 'your-email@gmail.com',
  displayName: 'Your Name',
  role: 'admin',
  createdAt: new Date()
})
```

---

## Adding Additional Users Later

Once you're logged in as admin, you can add more users through the Firebase Console:

1. Have the user sign in once (they'll get "Access denied")
2. Get their UID from Authentication > Users
3. Add them to Firestore `users` collection with role `admin` or `editor`

---

## Quick Reference

**Admin Role**: Full CRUD access to all data
**Editor Role**: Can read all, create reports/schedules, but cannot delete

Choose **Method 1** for the easiest setup!
