// AUTHENTICATION_GUIDE.md

# Complete Authentication System for FitAI

## 📋 Architecture Overview

```
src/auth/
├── authTypes.ts           # TypeScript interfaces
├── firebase-config.ts     # Firebase initialization
├── AuthProvider.tsx       # Context provider (handles auth logic)
├── useAuth.ts            # Custom hook
├── LoginPage.tsx         # Login UI
├── SignupPage.tsx        # Signup UI
└── AuthStyles.css        # Styling
```

---

## 🚀 Step-by-Step Integration

### Step 1: Install Dependencies

```bash
npm install firebase
```

### Step 2: Setup Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Create Project"** → Name it "FitAI"
3. Enable Google Analytics (optional)
4. Wait for project creation
5. Click **"Web"** to add a web app
6. Copy the config object

### Step 3: Create `.env.local` File

Create `.env.local` in project root:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 4: Enable Authentication Methods

In Firebase Console:
1. Go to **Authentication → Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (add your email as test user)

### Step 5: Setup Firestore Database

In Firebase Console:
1. Go to **Firestore Database**
2. Click **"Create Database"**
3. Choose **"Start in test mode"**
4. Select region (us-central1)
5. Click **"Enable"**

### Step 6: Add Auth Rules

In Firestore **Rules** tab, set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Workouts belong to users
    match /users/{userId}/workouts/{workoutId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Subscriptions
    match /subscriptions/{subscriptionId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 💻 How to Use in App

### Wrap App with AuthProvider

```typescript
// src/main.tsx
import { AuthProvider } from './auth/AuthProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
```

### Access Auth in Components

```typescript
// src/pages/Dashboard.tsx
import { useAuth } from '../auth/useAuth';

export const Dashboard = () => {
  const { user, signOut, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {user?.displayName || user?.email}</h1>
      <button onClick={signOut}>Logout</button>
    </div>
  );
};
```

---

## 🔐 Session Persistence (Automatic)

Firebase automatically handles session persistence:

- User logs in → token stored in browser
- Page refreshes → `onAuthStateChanged` fires
- User status restored automatically
- No manual session management needed

**How it works:**
```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    // This runs on:
    // 1. App load (if user was logged in before)
    // 2. Manual login
    // 3. Manual logout
    // 4. Auth token refresh
  });
}, []);
```

---

## 🔗 Protected Routes Example

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

interface ProtectedRouteProps {
  element: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return element;
};

// Usage in App.tsx:
// <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
```

---

## 📊 Database Schema - Users Collection

**Collection:** `users`  
**Document ID:** Firebase UID (auto-generated)

```typescript
{
  id: "userId123",
  email: "user@gmail.com",
  displayName: "John Doe",
  photoURL: "https://...",
  createdAt: Timestamp,
  
  // Profile data
  ageGroup: "young-adult",
  fitnessLevel: "beginner",
  goal: "weight-loss",
  
  // Subscription
  subscriptionStatus: "free" | "premium",
  premiumExpiresAt: Timestamp,
}
```

---

## 🎯 Authentication Flow

### Email/Password Signup
```
1. User fills signup form
2. signUp(email, password) called
3. Firebase creates user account
4. Firestore doc created at users/{uid}
5. User redirected to goal setup
6. Session auto-persists
```

### Email/Password Login
```
1. User fills login form
2. signIn(email, password) called
3. Firebase validates credentials
4. User profile loaded from Firestore
5. User redirected to dashboard
6. Session auto-persists
```

### Google Login
```
1. User clicks "Google Sign In"
2. Google popup appears
3. User authenticates with Google
4. signInWithGoogle() completes
5. Check if user exists in Firestore
6. If new user, create profile doc
7. User redirected to dashboard
```

### Logout
```
1. User clicks logout
2. signOut() called
3. Firebase clears session token
4. User state cleared
5. Redirected to login
```

---

## 🛠️ Common Patterns

### Check if User is Logged In
```typescript
const { user } = useAuth();

if (user) {
  // User is logged in
} else {
  // Not logged in
}
```

### Get Current User ID
```typescript
const { user } = useAuth();
const userId = user?.id; // Use in Firestore queries
```

### Update User Profile
```typescript
const { updateProfile } = useAuth();

await updateProfile({
  displayName: "New Name",
  fitnessLevel: "intermediate",
  goal: "muscle-gain"
});
```

### Handle Loading State
```typescript
const { loading } = useAuth();

if (loading) {
  return <Spinner />;
}
```

---

## 🚨 Error Handling

```typescript
const { signIn } = useAuth();
const [error, setError] = useState('');

const handleLogin = async (email: string, password: string) => {
  try {
    await signIn(email, password);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      setError('No account with this email');
    } else if (error.code === 'auth/wrong-password') {
      setError('Incorrect password');
    } else {
      setError(error.message);
    }
  }
};
```

---

## 🔄 Integration with Other Systems

### With Payment System
```typescript
// After successful payment, update subscription
await updateProfile({
  subscriptionStatus: 'premium',
  premiumExpiresAt: futureDate
});
```

### With Workout Logging
```typescript
const { user } = useAuth();

// Save workout with user ID
await saveWorkout({
  userId: user.id,  // Reference to user
  exercise: "Bench Press",
  // ...
});
```

---

## ✅ Checklist

- [ ] Firebase project created
- [ ] `.env.local` configured with keys
- [ ] Email/Password auth enabled
- [ ] Google auth enabled
- [ ] Firestore database created
- [ ] Security rules set
- [ ] AuthProvider wraps app
- [ ] Login/Signup pages imported
- [ ] ProtectedRoutes implemented
- [ ] Error handling added

---

## 📱 Next Steps

1. Add **password reset** functionality
2. Implement **email verification**
3. Add **profile picture upload**
4. Build **two-factor authentication (2FA)**
5. Integrate with **payment system**

All these are extensions to the base system shown here.
