# Adding Initial Admin User to Firestore

Follow these simple steps to add the first admin user to your congregation database:

## Recommended Method: Firebase Console Setup

### Step 1: Attempt Login First
1. Start the app (e.g., `npm run dev` or open your deployed URL).
2. Click **"Sign in with Google"** with your administrator Google account.
3. You will receive **"Access denied"** — this is expected security behavior!

### Step 2: Copy Your User UID
1. Open [Firebase Console](https://console.firebase.google.com).
2. Open your congregation's Firebase project.
3. In the left menu, select **Authentication** > **Users** tab.
4. Locate your email address and **copy the User UID** (e.g. `2skH5r1HO6SdqTgkkau...`).

### Step 3: Create User Document in Firestore
1. In Firebase Console, click **Firestore Database**.
2. If the `users` collection doesn't exist yet, click **Start collection** and name it `users`.
3. If `users` already exists, click **Add document**.
4. **Document ID**: Paste your **User UID** copied in Step 2.
5. Add the following fields:

| Field Name | Type | Value |
|------------|------|-------|
| `email` | string | `your-email@gmail.com` |
| `displayName` | string | `Your Name` |
| `role` | string | `admin` |
| `spiritualRole` | string | `Elder` |
| `createdAt` | timestamp | *(click the timestamp clock icon)* |

6. Click **Save**.

### Step 4: Login Successfully
1. Return to your application.
2. Refresh the page and click **"Sign in with Google"**.
3. You now have full Admin access to the system!
