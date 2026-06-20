# GoalFlow — Complete Launch Guide
## From zero to live in production

---

## PREREQUISITES

Install these before starting:

1. **Node.js** (v18 or higher)
   - Download from https://nodejs.org
   - Choose "LTS" version
   - Verify: open Terminal and run `node -v` → should show v18+

2. **Git**
   - Download from https://git-scm.com
   - Verify: `git --version`

3. **VS Code** (recommended editor)
   - Download from https://code.visualstudio.com

4. **A Google account** (for Firebase + Google login)

5. **A GitHub account**
   - Create free at https://github.com

---

## STEP 1 — Set up your project folder

Open Terminal (Mac/Linux) or Command Prompt (Windows).

```bash
# Unzip the project
# On Mac:
unzip goalflow-nextjs.zip -d goalflow

# Go into the folder
cd goalflow

# Install all dependencies (this takes 1-2 minutes)
npm install
```

You should see a `node_modules` folder created inside `goalflow/`.

---

## STEP 2 — Create your Firebase project

### 2a. Go to Firebase Console
- Open https://console.firebase.google.com
- Sign in with your Google account
- Click **"Add project"**

### 2b. Project setup
1. **Name your project**: `goalflow` (or `goalflow-prod`)
2. **Google Analytics**: Enable it → select "Create a new account" → name it `GoalFlow`
3. Click **"Create project"** — wait ~30 seconds
4. Click **"Continue"**

---

## STEP 3 — Enable Authentication

1. In the left sidebar → click **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Under **"Sign-in method"** tab:

### Enable Email/Password:
- Click **"Email/Password"**
- Toggle the first switch **ON**
- Click **"Save"**

### Enable Google:
- Click **"Google"**
- Toggle **ON**
- Set **"Project support email"** to your email address
- Click **"Save"**

---

## STEP 4 — Create Firestore Database

1. In left sidebar → **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"** → click **"Next"**
4. **Select location**: choose `asia-south1` (Mumbai) for India users
   - Or `us-central1` if your users are global
5. Click **"Enable"** — wait ~30 seconds

---

## STEP 5 — Deploy Firestore Security Rules

### 5a. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 5b. Login to Firebase
```bash
firebase login
```
- This opens a browser window
- Sign in with your Google account
- Click **"Allow"**
- Return to Terminal — you should see "Success!"

### 5c. Initialize Firebase in your project
```bash
# Make sure you're inside the goalflow folder
firebase init firestore
```

When prompted:
- **"Which Firebase project?"** → select your `goalflow` project
- **"What file should be used for Firestore Rules?"** → press Enter (keeps `firestore.rules`)
- **"What file should be used for Firestore indexes?"** → press Enter

### 5d. Deploy the rules
```bash
firebase deploy --only firestore:rules
```
You should see: `Deploy complete!`

---

## STEP 6 — Enable Firebase Analytics

1. In Firebase Console → left sidebar → **"Analytics"** → **"Dashboard"**
2. If not enabled, click **"Enable Google Analytics"**
3. Go to **Project Settings** (gear icon top-left) → **"General"** tab
4. Scroll down to **"Your apps"** section

---

## STEP 7 — Get your Firebase config keys

1. In Firebase Console → click the **gear icon** (top-left) → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. If no app exists → click the **web icon** (`</>`)
   - App nickname: `GoalFlow Web`
   - **Do NOT** check "Firebase Hosting" (we're using Vercel)
   - Click **"Register app"**
4. You'll see a config block like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "goalflow-xxxx.firebaseapp.com",
  projectId: "goalflow-xxxx",
  storageBucket: "goalflow-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456",
  measurementId: "G-XXXXXXXXXX"
};
```

5. **Copy these values** — you need them in the next step.
6. Click **"Continue to console"**

---

## STEP 8 — Set up your environment variables

In your `goalflow` folder, create a file called `.env.local`:

```bash
# On Mac/Linux:
cp .env.local.example .env.local

# On Windows:
copy .env.local.example .env.local
```

Now open `.env.local` in VS Code and fill in your Firebase values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=goalflow-xxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=goalflow-xxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=goalflow-xxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

⚠️ **Never commit `.env.local` to Git.** It's already in `.gitignore`.

---

## STEP 9 — Run locally and test

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Test checklist:
- [ ] Landing page loads
- [ ] Click "Get started" → Signup page opens
- [ ] Create an account with email + password
- [ ] Onboarding flow appears (3 steps)
- [ ] Dashboard loads after onboarding
- [ ] Create a goal
- [ ] Log an expense
- [ ] Goal impact message appears
- [ ] Sign out → Sign in again → still logged in (session persists)
- [ ] Try Google login

If everything works → move to Step 10.

---

## STEP 10 — Push to GitHub

### 10a. Create a new GitHub repository
1. Go to https://github.com/new
2. Repository name: `goalflow`
3. Set to **Private** (you can make public later)
4. **Do NOT** initialize with README (your project already has one)
5. Click **"Create repository"**

### 10b. Push your code
```bash
# Inside your goalflow folder:
git init
git add .
git commit -m "Initial GoalFlow MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/goalflow.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## STEP 11 — Deploy to Vercel

### 11a. Create a Vercel account
- Go to https://vercel.com
- Click **"Sign up"** → choose **"Continue with GitHub"**
- Authorize Vercel to access your GitHub

### 11b. Import your project
1. In Vercel dashboard → click **"Add New..."** → **"Project"**
2. Find `goalflow` in your repositories → click **"Import"**
3. Framework: Vercel auto-detects **Next.js** ✓
4. **Do NOT** click Deploy yet — add env vars first

### 11c. Add environment variables
In the "Environment Variables" section, add each one:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | your value |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | your value |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | your value |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | your value |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | your value |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | your value |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | your value |

### 11d. Deploy
Click **"Deploy"** — wait 2-3 minutes.

You'll get a URL like: `https://goalflow-xyz.vercel.app`

---

## STEP 12 — Add your domain to Firebase Auth

This is required for Google login to work on your live site.

1. Firebase Console → **"Authentication"** → **"Settings"** tab
2. Scroll to **"Authorized domains"**
3. Click **"Add domain"**
4. Enter your Vercel URL: `goalflow-xyz.vercel.app`
5. Click **"Add"**

If you have a custom domain (e.g. `goalflow.app`), add that too.

---

## STEP 13 — Update your sitemap URL

Open `src/app/sitemap.ts` and `public/sitemap.xml`:

Change:
```
https://goalflow.app
```
To your actual domain:
```
https://goalflow-xyz.vercel.app
```

Then push the change:
```bash
git add .
git commit -m "Update sitemap with production URL"
git push
```

Vercel auto-deploys whenever you push to `main`. ✓

---

## STEP 14 — Verify production

Open your Vercel URL and test:
- [ ] Signup works
- [ ] Google login works
- [ ] Data saves to Firestore (check Firebase Console → Firestore → Data)
- [ ] Analytics fires (Firebase Console → Analytics → DebugView)
- [ ] Sitemap accessible at `yoururl.com/sitemap.xml`

---

## COMMON ERRORS & FIXES

**"auth/unauthorized-domain"**
→ You forgot Step 12. Add your Vercel domain to Firebase Auth authorized domains.

**"FirebaseError: Missing or insufficient permissions"**
→ Re-run `firebase deploy --only firestore:rules`

**"Module not found" errors**
→ Run `npm install` again

**Google login popup closes immediately**
→ Check that your domain is in Firebase Auth authorized domains

**Blank page on Vercel**
→ Check Vercel dashboard → your project → "Deployments" → click the deployment → "Functions" tab for error logs

**Environment variables not working**
→ In Vercel: Settings → Environment Variables → make sure all 7 are added → redeploy

---

## AFTER LAUNCH — ongoing workflow

Every time you make code changes:
```bash
# Make your changes in VS Code
git add .
git commit -m "describe what you changed"
git push
```
Vercel auto-deploys in ~2 minutes. Done.

---

## USEFUL COMMANDS REFERENCE

```bash
npm run dev        # Run locally at localhost:3000
npm run build      # Test production build locally
npm run lint       # Check for code issues

firebase login                          # Login to Firebase CLI
firebase deploy --only firestore:rules  # Deploy security rules

git add .                    # Stage all changes
git commit -m "message"      # Commit changes
git push                     # Push to GitHub (triggers Vercel deploy)
```

---

## SUPPORT LINKS

- Firebase Console: https://console.firebase.google.com
- Vercel Dashboard: https://vercel.com/dashboard
- Firebase Auth docs: https://firebase.google.com/docs/auth
- Firestore docs: https://firebase.google.com/docs/firestore
- Next.js docs: https://nextjs.org/docs
- Vercel docs: https://vercel.com/docs
