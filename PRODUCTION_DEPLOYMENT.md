# 🚀 PRODUCTION DEPLOYMENT GUIDE

## Quick Start (5 Steps)

After you have the code ready:

```bash
1. Copy .env.example → .env.local
2. Add Firebase credentials from Firebase Console
3. Run: npm install && npm run build
4. Deploy to Vercel/Netlify
5. Enable Google OAuth in Firebase Console
```

That's it! ✅

---

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Name: `ai-fitness-coach`
4. Accept defaults, click "Create Project"

### 1.2 Enable Firestore Database

1. In Firebase Console → "Build" menu → "Firestore Database"
2. Click "Create database"
3. Start in **Test Mode** (for development)
4. Choose region: **us-central1** or closest to you
5. Click "Create"

### 1.3 Enable Authentication

1. Firebase Console → "Build" menu → "Authentication"
2. Click "Get Started"
3. Enable providers:
   - **Email/Password** (click enable, save)
   - **Google** (click enable, add support email/privacy URL, save)

### 1.4 Get Firebase Credentials

1. Firebase Console → Settings (gear icon) → Project Settings
2. Scroll to "Your apps" → Click "Web app" icon (</>)
3. Register app: `ai-fitness-coach-web`
4. Copy the firebaseConfig object:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456",
};
```

5. Copy each value to `.env.local`:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

### 1.5 Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable "Google+ API"
4. Create OAuth 2.0 Web Application credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000` (dev)
   - `http://localhost:5173` (Vite dev)
   - `https://your-domain.com` (production)
   - `https://your-domain.com/callback` (if using callback)
6. Copy Client ID to `.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## Step 2: Firestore Security Rules

Navigate to **Firestore Database** → **Rules** tab and replace with:

```firestore-rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data - only accessible by the user
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // Workouts subcollection
      match /workouts/{workoutId} {
        allow read, write: if request.auth.uid == userId;
      }
      
      // Audits subcollection
      match /audits/{auditId} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Deploy Rules:**
1. Click "Publish" button
2. Confirm the changes

---

## Step 3: Environment Setup

### 3.1 Create `.env.local`

```bash
# In project root
cp .env.example .env.local
```

### 3.2 Fill in your values

Edit `.env.local` and add:
- Firebase credentials (from Step 1.4)
- Google Client ID (from Step 1.5)
- Payment keys (optional, for Razorpay/Stripe)

---

## Step 4: Local Testing

```bash
# Install dependencies
npm install

# Start dev server (Vite)
npm run dev

# Opens at http://localhost:5173
```

**Test the flow:**
1. Sign up with email
2. Add a workout
3. View AI audit results
4. Try Google Sign-In

---

## Step 5: Build for Production

```bash
# Build optimized version
npm run build

# Preview production build locally
npm run preview

# Opens at http://localhost:4173
```

---

## Step 6: Deploy to Vercel (Recommended)

### 6.1 Connect GitHub Repository

1. Push your code to GitHub
2. Go to [Vercel.com](https://vercel.com)
3. Import GitHub repository
4. Select your `fitness-app` repo

### 6.2 Configure Environment Variables

1. In Vercel project settings → Environment Variables
2. Add all variables from `.env.local`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_GOOGLE_CLIENT_ID`

3. Click "Save"

### 6.3 Update Firebase OAuth URLs

In Firebase Console → Authentication → Google Provider:
- Add Authorized Redirect URI: `https://your-vercel-domain.vercel.app/`
- Update Google OAuth approved domains

### 6.4 Deploy

1. Click "Deploy" button in Vercel
2. Wait 2-3 minutes
3. Your app is LIVE! 🎉

**Custom Domain (Optional):**
1. Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS instructions from your domain registrar

---

## Step 7: Deploy to Netlify (Alternative)

### 7.1 Connect GitHub

1. Go to [Netlify.com](https://app.netlify.com)
2. Click "New site from Git"
3. Connect GitHub, select repository

### 7.2 Build Configuration

- **Build Command:** `npm run build`
- **Publish Directory:** `dist`

### 7.3 Environment Variables

Settings → Build & Deploy → Environment:
- Add all variables from `.env.local`

### 7.4 Deploy

Click "Deploy" → Wait 3-5 minutes

---

## Step 8: Production Checklist

After deployment:

- ✅ Test login/signup flow
- ✅ Test Google Sign-In
- ✅ Add a workout and verify it saves
- ✅ Check AI audit displays correctly
- ✅ Test on mobile browsers
- ✅ Check console for errors (F12)
- ✅ Verify Firebase security rules are active
- ✅ Test user isolation (login as different user)
- ✅ Check performance (Lighthouse)
- ✅ Setup password reset flow

---

## Step 9: Post-Deployment

### Database Backups

1. Firestore → Manage Collections → Settings
2. Enable automatic daily backups
3. Choose backup location

### Monitoring

1. Firebase Console → Analytics (optional)
2. Setup error monitoring for production issues

### Custom Domain

1. Purchase domain from GoDaddy/Namecheap
2. Point DNS to Vercel/Netlify
3. Add SSL certificate (automatic)

---

## Troubleshooting

### "Firebase is not defined"

Add to `src/firebase/firebaseConfig.ts`:
```typescript
import { initializeApp } from 'firebase/app';
```

### "CORS Error"

Make sure Firebase rules allow reads/writes for authenticated users:
```firestore-rules
allow read, write: if request.auth.uid == userId;
```

### "Google Sign-In fails"

1. Verify `VITE_GOOGLE_CLIENT_ID` in `.env.local`
2. Check Firebase Console → Authentication → Google → URLs match
3. Check browser console for detailed error

### "App won't load in production"

1. Check environment variables are set in Vercel/Netlify
2. Run `npm run build` locally to catch build errors
3. Check Network tab in DevTools for failed requests

### "Emails not sending"

Firebase auth emails work by default in **Test Mode**. For production:
1. Firebase Console → Authentication → Templates → Customize
2. Add your reply-to email
3. Verify your domain if using custom sender

---

## Optimization for Production

### 1. Enable Compression

Vercel/Netlify do this automatically.

### 2. Optimize Images

```bash
# In public/ folder, compress images
npx imagemin src/assets/*.png --out-dir=public/images
```

### 3. Code Splitting

Vite does this automatically. Check:
```bash
npm run build
# Look for "dist/assets" folder
```

### 4. Database Indexing

Firestore creates indexes automatically on first query.

### 5. Content Delivery Network

Use Cloudflare (free):
1. Add your domain to Cloudflare
2. Point DNS nameservers
3. Enable caching rules

---

## Performance Metrics

After deployment, check:

**Lighthouse Score** (DevTools → Lighthouse):
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**Real User Monitoring:**
```javascript
// Add to monitoring
console.log(performance.timing.loadEventEnd - performance.timing.navigationStart)
// Should be < 3000ms
```

---

## Cost Estimation

### Firebase Free Tier (No Cost)
- 1GB Firestore storage
- 50K read/write ops per day
- 10GB download per month
- Good for MVP with < 1000 active users

### After Free Tier
- Firestore: $0.06 per 100K reads
- Firestore: $0.18 per 100K writes
- Storage: $0.18/GB

### Vercel/Netlify
- Free tier included
- Pay-as-you-go for enterprise

**Typical cost for 10K users:** $10-50/month

---

## Next Steps

1. ✅ Deploy to production
2. 📱 Build mobile app (React Native)
3. 💳 Add Razorpay payment integration
4. 📧 Setup email notifications
5. 📊 Add analytics dashboard
6. 🔐 Setup 2FA security

For questions, check [Firebase Docs](https://firebase.google.com/docs) or [Vercel Docs](https://vercel.com/docs).
