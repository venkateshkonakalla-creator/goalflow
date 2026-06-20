# GoalFlow Goals Not Loading — Debug & Fix

## The Problem
✅ Goals are created and saved to Firestore  
❌ After page refresh, Goals page shows "No goals yet"  
❌ Dashboard shows no goals data

---

## Root Cause: Missing Firestore Composite Indexes

### Why Goals Disappear
When you refresh the page:

1. **Dashboard loads and calls:** 
   ```
   Promise.all([getGoals(), getExpenses(), getIncome(), getAllocations()])
   ```

2. **getExpenses query fails** because it needs a composite index:
   ```typescript
   query(
     collection(db, 'expenses'),
     where('userId', '==', userId),  // First condition
     orderBy('date', 'desc')         // Second condition on DIFFERENT field
   )
   ```

3. **Promise.all rejects** → entire data load fails → Dashboard shows empty

4. **Error was hidden** in the try/catch that returned empty arrays

### Why Other Queries Fail Too

| Query | Issue | Fix |
|-------|-------|-----|
| `getExpenses` | `where(userId) + orderBy(date)` | **Composite Index 1** |
| `getAllocations` | `where(userId) + where(month)` | **Composite Index 2** |
| `getGoals` | `where(userId)` only | ✅ Works (no index needed) |
| `getIncome` | Document lookup by ID | ✅ Works (no index needed) |

---

## Solution: Deploy Composite Indexes

### Step 1: Verify firebase-tools is installed
```bash
npm install -g firebase-tools
```

### Step 2: Deploy indexes using CLI
```bash
cd goalflow
firebase deploy --only firestore:indexes
```

This reads `firestore.indexes.json` and creates the indexes in your Firebase project.

**Expected output:**
```
✔  firestore:indexes: creating indexes
✔  Deploy complete!
```

⏳ **Wait:** Firestore will take 5-10 minutes to build the indexes. You'll get an email when complete.

### Step 3: Verify in Firebase Console
1. Go to https://console.firebase.google.com
2. Select your project
3. Left sidebar → **"Firestore Database"** → **"Indexes"**
4. Verify you see:
   - ✅ `expenses` index: userId ↑ + date ↓
   - ✅ `allocations` index: userId ↑ + month ↑

---

## Changes Made to Your Code

### 1. Added Comprehensive Logging
**File:** [src/lib/db.ts](src/lib/db.ts)

All query functions now log:
- 🔍 When query starts
- ✅ When data is fetched  
- ❌ Detailed error messages with error codes

Example output to browser console:
```
🔍 [getGoals] Starting fetch for userId: 21iqEC6bQOTIEGOSPVVULG5ylMv1
✅ [getGoals] Successfully fetched 3 goals
📄 [getGoals] Document: goal-id-1 {userId: "...", name: "IITG Fee fund", ...}
```

### 2. Fixed Error Handling
**Files:** 
- [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)
- [src/app/dashboard/goals/page.tsx](src/app/dashboard/goals/page.tsx)

Changed from silently returning empty arrays to properly reporting errors:
```typescript
// BEFORE: Silent failure
.catch(err => showToast(friendlyError(err, '...')))

// AFTER: Logs full error details
.catch(err => {
  console.error('❌ [Dashboard] Error loading data:', err)
  showToast(friendlyError(err, '...'), 'error')
})
```

### 3. Created Firestore Indexes Config
**File:** [firestore.indexes.json](firestore.indexes.json)

Defines the two composite indexes needed.

---

## How to Debug Further

### Step 1: Open Browser Console
1. Load http://localhost:3000
2. Open DevTools: `F12` or `Cmd+Option+I`
3. Click **"Console"** tab

### Step 2: Trigger Data Load
- Refresh the page
- OR log out → log in again

### Step 3: Read the Logs
You'll see one of these:

✅ **Success Pattern:**
```
🔍 [getGoals] Starting fetch for userId: 21iqEC6bQOTIEGOSPVVULG5ylMv1
✅ [getGoals] Successfully fetched 3 goals
📄 [getGoals] Document: ...
📊 [Dashboard] Data loaded successfully: {goals: 3, expenses: 5}
```

❌ **Index Error Pattern:**
```
❌ [getExpenses] Error fetching expenses: Error
⚠️ [getExpenses] Error details: {
  code: "failed-precondition",
  message: "..requires a composite index..."
}
```

❌ **Security Rule Denial Pattern:**
```
❌ [getGoals] Error fetching goals: Error
⚠️ [getGoals] Error details: {
  code: "permission-denied",
  message: "Missing or insufficient permissions"
}
```

---

## Quick Checklist

- [ ] Run `firebase deploy --only firestore:indexes`
- [ ] Wait for email saying indexes are built
- [ ] Refresh the app
- [ ] Open browser console
- [ ] Check for ✅ success logs or ❌ error codes
- [ ] If error code `failed-precondition` → wait longer for index to build
- [ ] If error code `permission-denied` → security rules issue (see below)

---

## If You Still See Errors

### Error: "Failed Precondition"
**Means:** Indexes are being built  
**Solution:** Wait another 5 minutes. Firestore sends progress emails.

### Error: "Permission Denied"
**Means:** Security rule blocked the read  
**Check:** [firestore.rules](firestore.rules) has:
```
allow read, write: if isAuth() && isOwner(resource.data.userId);
```

### Error: "Not Found" on Goals Page
**Means:** `getGoals` works but other queries fail  
**Solution:** Check if you've created any expenses or allocations yet. The queries might be failing because the data doesn't exist.

---

## Verification Steps

After indexes are built (you get the email):

1. **Create a goal:**
   - Go to http://localhost:3000/dashboard/goals
   - Click "New Goal"
   - Fill in and create

2. **Refresh the page:**
   - Press F5
   - Should see your goal listed

3. **Check console:**
   - Open DevTools
   - You should see success logs

4. **If it works:**
   - 🎉 Issue is fixed!
   - You can remove the console.log statements if you want (optional)

---

## Security Rules Check

Your [firestore.rules](firestore.rules) are correct for this issue:

```
match /goals/{goalId} {
  allow read, write: if isAuth() && isOwner(resource.data.userId);
  allow create: if isAuth() && isOwner(request.resource.data.userId);
}
```

✅ Allows authenticated users to read/write only their own documents  
✅ `serverTimestamp()` is allowed by these rules

---

## What NOT to Do

❌ Don't manually create indexes in Firebase Console (use CLI)  
❌ Don't modify security rules without testing  
❌ Don't remove the `orderBy` from queries (data will be unordered)  
❌ Don't remove the logging yet (keep it for now to monitor)

---

## Next Steps

1. ✅ Code changes are already applied
2. 📦 Run: `firebase deploy --only firestore:indexes`
3. ⏳ Wait for index to build (email confirmation)
4. 🧪 Test by creating/refreshing goals
5. 📋 Check console logs for success/errors

Questions? The console logs will tell you exactly what's wrong.
