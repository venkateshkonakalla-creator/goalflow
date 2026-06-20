# 🚀 GoalFlow

> **Stop wondering where your salary went.**  
> Plan your income, track expenses, and achieve financial goals faster.

GoalFlow is a goal-first financial planner for students, fresh graduates, and first-job employees in India. Unlike traditional expense trackers, GoalFlow shows you **how every purchase affects your goals** — in real time.

---

## ✨ Core Feature: Goal Impact Engine

When you spend ₹1,200 on shopping, GoalFlow doesn't just log it.  
It tells you:

> **"Your Laptop Fund goal is now delayed by 5 days."**

This is the main differentiator. Every expense is analyzed against your active goals.

---

## 📁 Project Structure

```
goalflow/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles
│   │   ├── auth/
│   │   │   ├── login/page.tsx          # Email + Google login
│   │   │   └── signup/page.tsx         # Email + Google signup
│   │   └── dashboard/
│   │       ├── layout.tsx              # Sidebar navigation
│   │       ├── page.tsx                # Main dashboard
│   │       ├── goals/page.tsx          # Goals CRUD
│   │       ├── expenses/page.tsx       # Expense tracking + impact
│   │       ├── planning/page.tsx       # Monthly salary allocation
│   │       └── analytics/page.tsx      # Charts & trends
│   ├── context/
│   │   └── AuthContext.tsx             # Firebase Auth provider
│   ├── lib/
│   │   ├── firebase.ts                 # Firebase init
│   │   ├── db.ts                       # Firestore CRUD helpers
│   │   └── goalImpact.ts               # Goal Impact Engine + AI stub
│   └── types/
│       └── index.ts                    # TypeScript types
├── firestore.rules                     # Security rules
├── .env.local.example                  # Environment template
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 🗄️ Database Schema (Firestore)

### `users/{uid}`
```json
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "photoURL": "string | null",
  "createdAt": "Timestamp"
}
```

### `goals/{goalId}`
```json
{
  "userId": "string",
  "name": "string",
  "targetAmount": 50000,
  "savedAmount": 18500,
  "targetDate": "2025-12-31",
  "priority": "high | medium | low",
  "monthlyContribution": 10000,
  "category": "emergency_fund | laptop | bike | education | investment | travel | other",
  "color": "#6366f1",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### `expenses/{expenseId}`
```json
{
  "userId": "string",
  "amount": 500,
  "category": "food | travel | shopping | entertainment | education | health | other",
  "description": "Lunch at canteen",
  "date": "2025-06-13",
  "goalImpact": {
    "goalId": "string",
    "goalName": "Emergency Fund",
    "daysDelayed": 2,
    "amountDiverted": 500
  },
  "createdAt": "Timestamp"
}
```

### `income/{userId}_{month}`
```json
{
  "userId": "string",
  "month": "2025-06",
  "amount": 16000,
  "source": "Salary",
  "updatedAt": "Timestamp"
}
```

### `allocations/{allocId}`
```json
{
  "userId": "string",
  "month": "2025-06",
  "goalId": "string",
  "goalName": "Emergency Fund",
  "amount": 10000,
  "createdAt": "Timestamp"
}
```

---

## 🔧 Local Setup

### 1. Clone & install

```bash
git clone https://github.com/yourname/goalflow.git
cd goalflow
npm install
```

### 2. Firebase Setup

#### Create Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → name it `goalflow`
3. Disable Google Analytics (optional) → **Create project**

#### Enable Authentication
1. Left sidebar → **Build → Authentication**
2. Click **"Get started"**
3. Enable **Email/Password** provider
4. Enable **Google** provider (set support email)

#### Create Firestore Database
1. Left sidebar → **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select your region (e.g., `asia-south1` for India)

#### Deploy Firestore Security Rules
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project
firebase deploy --only firestore:rules
```

#### Get Firebase config
1. Project Settings (gear icon) → **Your apps**
2. Click **"Add app"** → Web (`</>`)
3. Register app → copy the config object

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=goalflow-xxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=goalflow-xxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=goalflow-xxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deployment (Vercel)

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow prompts. Then add environment variables:
```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# repeat for each variable
```

### Option B: Vercel Dashboard

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Go to **Settings → Environment Variables**
5. Add all `NEXT_PUBLIC_FIREBASE_*` variables
6. Click **Deploy**

### Add your Vercel domain to Firebase
1. Firebase Console → **Authentication → Settings → Authorized domains**
2. Add your Vercel domain (e.g., `goalflow.vercel.app`)

---

## 🤖 Future AI Integration (Gemini)

The architecture is ready in `src/lib/goalImpact.ts`.

When ready to integrate:

1. Add Gemini API key to `.env.local`:
```env
GEMINI_API_KEY=your_gemini_key
```

2. Create API route `src/app/api/ai/afford/route.ts`:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  // Use AIQuery type from src/types/index.ts
}
```

3. Replace the stub in `checkAffordability()` with the Gemini call.

**Supported future queries:**
- "Can I afford this purchase?"
- "If I buy this phone, how will it affect my goals?"
- "What should I cut to reach my emergency fund faster?"

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, TailwindCSS |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Charts | Recharts |
| Icons | Lucide React |
| Hosting | Vercel |
| Date utils | date-fns |

---

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth/login` | Email + Google login |
| `/auth/signup` | Email + Google signup |
| `/dashboard` | Overview + goal impact alerts |
| `/dashboard/goals` | Create & manage financial goals |
| `/dashboard/expenses` | Log expenses, see impact |
| `/dashboard/planning` | Monthly salary allocation |
| `/dashboard/analytics` | Charts and spending trends |

---

## 🎨 Design System

- **Primary**: Indigo (`#6366f1`)
- **Background**: Near-black (`#09090b`)
- **Cards**: Glass morphism (`rgba(255,255,255,0.04)`)
- **Font**: Inter
- **Radius**: 12–16px rounded corners
- **Inspiration**: Linear, Notion, Stripe, Vercel

---

Built with ❤️ for India's young achievers.
