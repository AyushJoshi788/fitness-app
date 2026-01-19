# 🚀 QUICK START GUIDE

> Start the app in 5 minutes. Production-ready. No coding required.

## Step 1: Get Firebase Credentials (2 minutes)

1. **Go to** [Firebase Console](https://console.firebase.google.com)
2. **Sign in** with your Google account
3. **Click** "Create Project" → Name: `fitness-app`
4. **Wait** 1 minute for project creation
5. **Go to** Settings (gear icon) → Project Settings
6. **Scroll down** to "Your apps" section
7. **Click** the `</>` Web icon
8. **Register app**: Name it `fitness-app-web`
9. **Copy** the firebaseConfig and your credentials

## Step 2: Add Credentials to Project (1 minute)

1. **In your project**, find the file: `.env.example`
2. **Copy it** and rename to: `.env.local`
3. **Paste your Firebase credentials** into `.env.local`

Example:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=fitness-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fitness-app
VITE_FIREBASE_STORAGE_BUCKET=fitness-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
```

## Step 3: Enable Firebase Services (1 minute)

### Enable Authentication:
1. Firebase Console → **Build** → **Authentication**
2. **Click "Get Started"**
3. **Enable Email/Password** provider
4. **Enable Google** provider (add any email as support)

### Enable Firestore:
1. Firebase Console → **Build** → **Firestore Database**
2. **Click "Create Database"**
3. **Start in Test Mode** (for development)
4. **Choose region**: us-central1
5. **Done!**

### Add Firestore Rules:
1. Go to **Firestore** → **Rules** tab
2. **Replace** the rules with:

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

3. **Click "Publish"**

## Step 4: Run the App (1 minute)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

**The app opens at:** `http://localhost:5173`

## Step 5: Test It! (30 seconds)

1. **Sign up** with your email
2. **Add a workout** (click "Add Workout")
3. **Select exercises** and click "Save"
4. **View AI analysis** (click "View AI Analysis")
5. **Done!** 🎉

---

## What You Get

✅ Full-stack fitness app
✅ Real Firebase authentication (email + Google Sign-In)
✅ Cloud database with real persistence
✅ AI workout analysis engine
✅ Beautiful animations (Framer Motion)
✅ Mobile-responsive design
✅ Production-ready code

---

## Next: Deploy to Production (When Ready)

When you want to make it public:

```bash
# Build for production
npm run build

# Deploy to Vercel (free hosting)
# Go to vercel.com → Import GitHub repo
# Add same environment variables
# Deploy!
```

See `PRODUCTION_DEPLOYMENT.md` for full deployment guide.

---

## Troubleshooting

**"Can't sign up" error?**
→ Check `.env.local` has correct Firebase credentials

**"No workouts showing" after signup?**
→ Firestore rules might block writes
→ Check Firestore Console → Rules tab, make sure they're published

**"Google Sign-In not working"?**
→ Get Google Client ID from Google Cloud Console
→ Add to `.env.local` as `VITE_GOOGLE_CLIENT_ID`

**App won't start?**
→ Run: `npm install`
→ Delete `node_modules` folder: `rm -rf node_modules`
→ Run: `npm install` again
→ Run: `npm run dev`

---

## Support

For issues, check:
1. Console errors (F12 → Console)
2. `DEVELOPER_GUIDE.md` (full setup guide)
3. `PRODUCTION_DEPLOYMENT.md` (deployment guide)

**Questions?** 
- Read the code comments
- Check Firebase docs: https://firebase.google.com/docs

---

## What's Included

```
Your App ✨
├── Firebase Auth (Email + Google)
├── Firestore Database (Real-time)
├── AI Workout Analysis (5 rules)
├── Beautiful UI (Animations)
├── Mobile Responsive
├── TypeScript (Type-safe)
└── Production Ready
```

**Ready to ship!** 🚀

---

## Next Steps After Setup

1. **Invite friends** to sign up and test
2. **Add more exercises** (edit `src/domain/exerciseCatalog.ts`)
3. **Customize AI rules** (edit `src/domain/workoutAudit.ts`)
4. **Add payment** (see `PAYMENT_INTEGRATION_GUIDE.md`)
5. **Deploy to production** (see `PRODUCTION_DEPLOYMENT.md`)
6. **Present to investors** (see `VIVA_PITCH_GUIDE.md`)

Enjoy! 💪
