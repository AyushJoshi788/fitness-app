# 🚀 AI Fitness Coach - Developer Guide

## Quick Setup (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Add your Firebase credentials to .env.local
# (See PRODUCTION_DEPLOYMENT.md for setup)

# 4. Start dev server
npm run dev

# Opens at http://localhost:5173
```

---

## Project Structure

```
src/
├── components/              # React UI components
│   ├── AuthPanel.tsx        # Login/Signup form
│   ├── Dashboard.tsx        # Main dashboard
│   ├── AddWorkoutModal.tsx  # Workout creation
│   ├── AuditDisplay.tsx     # AI analysis display
│   ├── AnimatedCard.tsx     # Reusable card component
│   └── ModernButton.tsx     # Reusable button component
│
├── contexts/                # React Context for global state
│   └── AuthContext.tsx      # Authentication state management
│
├── firebase/                # Firebase integration
│   ├── firebaseConfig.ts    # Firebase initialization
│   ├── firebaseAuth.ts      # Auth functions (login, signup, Google)
│   └── firebaseWorkouts.ts  # Firestore CRUD operations
│
├── domain/                  # Business logic
│   ├── types.ts             # TypeScript interfaces
│   ├── exerciseCatalog.ts   # Exercise database (100+ exercises)
│   ├── workoutAudit.ts      # AI audit engine (5 rules)
│   └── storage.ts           # localStorage utilities (demo)
│
├── premium/                 # Premium features
│   ├── PaymentPanel.tsx     # Payment UI
│   ├── ActivationPanel.tsx  # Premium activation
│   ├── subscription.ts      # Subscription logic
│   └── tokens.ts            # Token management
│
├── styles/                  # Global styles
│   └── components.css       # Component styles
│
├── App.tsx                  # Demo version (localStorage)
├── App_Production.tsx       # Production version (Firebase)
└── main.tsx                 # Entry point
```

---

## Key Technologies

| Technology | Purpose | Why |
|------------|---------|-----|
| React 19 | UI Framework | Latest, fastest, best DX |
| TypeScript | Type Safety | Catch bugs early |
| Firebase Auth | Authentication | Email + Google Sign-In |
| Firestore | Database | Real-time, serverless, scalable |
| Framer Motion | Animations | Smooth, professional feel |
| Vite | Build Tool | 10x faster than Create React App |
| Vercel | Deployment | One-click deploy from Git |

---

## Development Workflow

### 1. Running Locally

```bash
npm run dev

# Hot Module Replacement (HMR) enabled
# Changes auto-reload in browser
```

### 2. Building for Production

```bash
npm run build
# Creates optimized dist/ folder

npm run preview
# Test production build locally
```

### 3. Type Checking

```bash
# Check for TypeScript errors
npx tsc --noEmit
```

### 4. Linting

```bash
# Check code style
npx eslint src/

# Fix auto-fixable issues
npx eslint src/ --fix
```

---

## Firebase Setup for Development

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project" → Name: `fitness-app-dev`
3. Accept defaults

### 2. Add Web App

1. Settings (gear icon) → Project Settings
2. Scroll to "Your apps" → Click </> (Web)
3. Copy firebaseConfig values to `.env.local`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Enable Authentication

1. Firebase Console → Build → Authentication
2. Enable providers:
   - Email/Password
   - Google (add support email)

### 4. Create Firestore Database

1. Firebase Console → Build → Firestore Database
2. Start in Test Mode
3. Choose region: us-central1

### 5. Set Firestore Rules

Go to Firestore → Rules tab, paste:

```firestore-rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      match /workouts/{workoutId} {
        allow read, write: if request.auth.uid == userId;
      }
      match /audits/{auditId} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

Click Publish.

---

## File Organization Guide

### Adding a New Feature

#### Step 1: Create Component
```typescript
// src/components/NewFeature.tsx
import { motion } from 'framer-motion'
import { AnimatedCard } from './AnimatedCard'

export const NewFeature = () => {
  return (
    <AnimatedCard>
      <h2>New Feature</h2>
    </AnimatedCard>
  )
}
```

#### Step 2: Add to App
```typescript
// src/App_Production.tsx
import { NewFeature } from './components/NewFeature'

// Inside AppContent component:
<NewFeature />
```

#### Step 3: Add Styles
```css
/* src/styles/components.css */
.new-feature {
  /* Your styles */
}
```

#### Step 4: Add Types (if needed)
```typescript
// src/domain/types.ts
export interface NewFeatureData {
  id: string
  name: string
}
```

---

## Common Tasks

### Changing the Database Schema

1. Edit `src/domain/types.ts` (add fields to interfaces)
2. Update Firestore write operations in `src/firebase/firebaseWorkouts.ts`
3. Update read operations to map new fields
4. Update Firestore rules if needed

Example:
```typescript
// types.ts
export interface WorkoutLog {
  id: string
  userId: string
  date: Date
  type: string
  exercises: Exercise[]
  duration: number        // NEW
  notes: string          // NEW
}

// firebaseWorkouts.ts
export const saveWorkout = async (userId: string, workout: WorkoutLog) => {
  const workoutRef = doc(db, 'users', userId, 'workouts', workout.id)
  await setDoc(workoutRef, {
    ...workout,
    duration: workout.duration,  // Save new field
    notes: workout.notes,
  })
}
```

### Adding a New Exercise

Edit `src/domain/exerciseCatalog.ts`:

```typescript
export const EXERCISE_CATALOG: Exercise[] = [
  // ... existing exercises
  {
    name: 'Barbell Squat',
    category: 'Legs',
    muscleGroups: ['Quadriceps', 'Glutes'],
    sets: 4,
    reps: 8,
    difficulty: 'intermediate',
  },
]
```

### Modifying the AI Audit Rules

Edit `src/domain/workoutAudit.ts`:

```typescript
// The 5 rules:
// 1. Check compound exercise presence
// 2. Check total volume
// 3. Check muscle balance
// 4. Check injury risk
// 5. Check overload progression

// Add your custom rule:
if (exerciseCount > 12) {
  findings.push('⚠️ Too many exercises in one session')
}
```

### Changing UI Colors

Edit `src/styles/components.css` CSS variables:

```css
:root {
  --primary: #2563eb;           /* Change this */
  --primary-dark: #1e40af;
  --secondary: #10b981;
  /* ... more colors ... */
}
```

---

## Debugging Guide

### Browser Console Errors

**"Firebase is not defined"**
- Import Firebase: `import { initializeApp } from 'firebase/app'`

**"No auth user found"**
- Check `.env.local` has correct Firebase credentials
- Clear localStorage: `localStorage.clear()` in console
- Restart dev server

**"CORS error"**
- Firestore rules don't allow read/write
- Check rules in Firebase Console → Firestore → Rules
- Test mode should allow reads/writes for now

**"Rate limited"**
- Firebase auth has rate limits (10 failed login attempts)
- Wait 5 minutes or use different email

### Network Issues

Open DevTools (F12) → Network tab:
1. Look for failed requests (red)
2. Click request → Response tab to see error
3. Check Console tab for JavaScript errors

### Performance Issues

```bash
# Build analysis
npm run build -- --debug
# Shows file sizes and potential optimizations
```

---

## Environment Variables Reference

```env
# Firebase (Required)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Google OAuth (Required for Google Sign-In)
VITE_GOOGLE_CLIENT_ID=...

# Razorpay (Optional, for payments)
VITE_RAZORPAY_KEY_ID=...

# Stripe (Optional, alternative to Razorpay)
VITE_STRIPE_PUBLIC_KEY=...

# App Config
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
```

---

## Testing

### Manual Testing Checklist

- [ ] Sign up with email
- [ ] Sign in with email
- [ ] Sign in with Google
- [ ] Add a workout
- [ ] View AI audit
- [ ] Delete a workout
- [ ] Sign out
- [ ] Sign back in (verify data persists)
- [ ] Test on mobile (DevTools → Toggle device toolbar)

### Automated Testing (Optional)

```bash
# Add Vitest
npm install --save-dev vitest @testing-library/react @testing-library/user-event

# Create tests/
mkdir tests

# Example test:
# tests/Dashboard.test.tsx
import { render, screen } from '@testing-library/react'
import { Dashboard } from '../src/components/Dashboard'

describe('Dashboard', () => {
  it('renders welcome message', () => {
    render(<Dashboard onAddWorkout={() => {}} onViewAudit={() => {}} />)
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
  })
})
```

---

## Performance Optimization

### Code Splitting

Vite auto-splits large components. For manual control:

```typescript
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./Dashboard'))

<Suspense fallback={<LoadingScreen />}>
  <Dashboard />
</Suspense>
```

### Lazy Loading Images

```typescript
<img src="image.png" loading="lazy" />
```

### Optimize Animations

```typescript
// Good (will use GPU)
<motion.div animate={{ opacity: 1 }} />

// Avoid (CPU-intensive)
<motion.div animate={{ width: 100 }} />
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Remove console.log statements
- [ ] Set `VITE_APP_ENV=production` in Vercel
- [ ] Enable Firebase production mode
- [ ] Update security rules (no test mode)
- [ ] Setup monitoring/error tracking
- [ ] Test on real device
- [ ] Check Lighthouse score (> 80)
- [ ] Setup SSL certificate
- [ ] Configure email sender (Firebase Auth)

---

## API Reference

### Authentication (firebaseAuth.ts)

```typescript
// Signup
const user = await registerUser(email, password, displayName)

// Login
const user = await loginUser(email, password)

// Google Sign-In
const user = await loginWithGoogle()

// Logout
await logoutUser()

// Password Reset
await resetPassword(email)

// Watch auth state
const unsubscribe = onAuthChange((user) => {
  console.log('Auth user:', user)
})
```

### Workouts (firebaseWorkouts.ts)

```typescript
// Save workout
await saveWorkout(userId, workout)

// Get all workouts
const workouts = await getUserWorkouts(userId)

// Get workouts in date range
const workouts = await getWorkoutsInRange(userId, '2024-01-01', '2024-01-31')

// Get recent workouts
const workouts = await getRecentWorkouts(userId, 7) // last 7 days

// Delete workout
await deleteWorkout(userId, workoutId)

// Get AI analysis
const analysis = await getWorkoutAnalysis(workout)
```

### User Profile (firebaseWorkouts.ts)

```typescript
// Get profile
const profile = await getUserProfile(userId)

// Create profile
await createUserProfile(userId, profileData)

// Update profile
await updateUserProfile(userId, { height: 180 })
```

---

## Troubleshooting

### "Module not found"

```bash
# Restart dev server
Ctrl+C
npm run dev
```

### "Types not found"

```bash
# Regenerate types
npx tsc --init
npx tsc --noEmit
```

### "Build fails"

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Check for circular imports
npm install --save-dev madge
npx madge --circular src/
```

### "Slow build"

```bash
# Analyze what's slow
npm run build -- --profile

# Check bundle size
npx vite-plugin-visualizer
```

---

## Resources

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Vite Docs](https://vitejs.dev)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Vercel Docs](https://vercel.com/docs)

---

## Support

For issues:
1. Check this guide
2. Search GitHub Issues
3. Ask in discussions
4. Contact maintainers

Happy coding! 🚀
