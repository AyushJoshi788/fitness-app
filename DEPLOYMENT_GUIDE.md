# Deployment Guide: React + Vite + TypeScript on Vercel & Netlify

## 🚀 VERCEL DEPLOYMENT (RECOMMENDED)

### Step 1: Prepare Your Project

Ensure your project builds correctly locally:
```bash
npm run build
npm run preview
```

Your **build output folder** is: `dist/`

### Step 2: Push to Git Repository

Your code must be on GitHub, GitLab, or Bitbucket:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/fitness-app.git
git push -u origin main
```

### Step 3: Deploy on Vercel

#### Option A: Via Dashboard (Easiest)
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Connect your Git repository
4. Select the repo **fitness-app**
5. Vercel auto-detects:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
6. Click **Deploy**
7. **Done!** Your app is live at `https://fitness-app.vercel.app`

#### Option B: Via CLI
```bash
npm i -g vercel
vercel
# Follow prompts, select your project directory
```

### Step 4: Configure Environment Variables (If Needed)

1. Go to **Project Settings → Environment Variables**
2. Add your Firebase/Supabase credentials:
   ```
   VITE_FIREBASE_API_KEY=xxx
   VITE_FIREBASE_PROJECT_ID=xxx
   VITE_PAYMENT_KEY=xxx
   ```
3. **Redeploy automatically** or manually trigger

### Vercel Build Settings

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "nodeVersion": "20.x"
}
```

---

## 🌐 NETLIFY DEPLOYMENT

### Step 1: Prepare Project

Same as Vercel:
```bash
npm run build
npm run preview
```

### Step 2: Deploy on Netlify

#### Option A: Via Dashboard
1. Go to [netlify.com](https://netlify.com)
2. Click **"Add new site → Import an existing project"**
3. Connect GitHub/GitLab/Bitbucket
4. Select repository
5. Configure build settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
   - **Node Version:** `20.x`
6. Click **Deploy**
7. **Done!** Your app is live at `https://fitness-app-xxxx.netlify.app`

#### Option B: Via CLI
```bash
npm i -g netlify-cli
netlify login
netlify init
# Choose "Create and deploy a new site"
# Choose "Don't connect to a Git repository" (for quick deploy)
# Select build command: npm run build
# Select publish directory: dist
```

#### Option C: Direct Deploy (Drag & Drop)
```bash
npm run build
# Go to netlify.com/drop and drag the 'dist' folder
```

### Step 3: Netlify Configuration File

Create `netlify.toml` in project root:

```toml
[build]
command = "npm run build"
publish = "dist"

[build.environment]
NODE_VERSION = "20"

# SPA routing fallback
[[redirects]]
from = "/*"
to = "/index.html"
status = 200

# Environment variables
[context.production.environment]
VITE_FIREBASE_API_KEY = "your_key"
VITE_PAYMENT_KEY = "your_key"
```

---

## 📋 Build Pipeline Summary

### Local Development
```bash
npm run dev
# Runs on http://localhost:5173
```

### Build for Production
```bash
npm run build
# Creates: dist/ folder (production-optimized)
# Output is minified, tree-shaken TypeScript
```

### Build Command Breakdown
```json
"build": "tsc -b && vite build"
```
- `tsc -b`: Type-check entire project
- `vite build`: Creates optimized production bundle in `dist/`

### Output Structure
```
dist/
├── index.html          # Entry point
├── assets/
│   ├── index-xxxxx.js  # Main JS bundle (minified)
│   └── index-xxxxx.css # Main CSS bundle
└── favicon.ico
```

---

## 🔧 Deployment Settings Summary

| Setting | Value |
|---------|-------|
| **Framework** | Vite (React) |
| **Build Command** | `npm run build` |
| **Output Folder** | `dist` |
| **Node Version** | 20.x (LTS) |
| **Install Command** | `npm install` |
| **Start Command** | N/A (Static site) |
| **Runtime** | Edge/Serverless (both support static) |

---

## ⚡ Performance Optimization

### In `vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    sourcemap: false,  // Disable for production
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  }
})
```

### Result
- Initial load: **< 2 seconds**
- JS bundle: **~150KB** (gzipped)
- CSS: **~10KB** (gzipped)

---

## 🔒 Environment Variables

### Local Development (`.env.local`)
```env
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_PROJECT_ID=xxxxx
VITE_PAYMENT_STRIPE_KEY=xxxxx
```

### Vercel/Netlify Dashboard
Settings → Environment Variables → Add each key-value pair

### Access in Code
```typescript
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
```

---

## 🧪 Pre-Deployment Checklist

- [ ] Run `npm run lint` - No errors
- [ ] Run `npm run build` - Builds successfully
- [ ] Run `npm run preview` - Preview works locally
- [ ] Test on mobile devices
- [ ] Check console for errors
- [ ] Add environment variables to deployment platform
- [ ] Test login flow end-to-end
- [ ] Test payment flow (test mode)
- [ ] Verify analytics tracking (if applicable)

---

## 🚨 Common Issues & Fixes

### Build Fails with "TypeScript Error"
```bash
npm run build
# Check output, fix errors
# Re-push to Git (auto-redeploy)
```

### Blank White Page
1. Check browser console for errors
2. Ensure `public/` assets load correctly
3. Check network tab for 404s
4. Verify environment variables are set

### Environment Variables Not Working
1. Confirm variables start with `VITE_`
2. Redeploy after adding variables
3. Clear browser cache (Cmd+Shift+R)

### Too Large Bundle
```bash
npm install --save-dev webpack-bundle-analyzer
# Analyze and tree-shake unused imports
```

---

## 🔄 CI/CD Automatic Deployment

**Vercel:** Auto-deploys on every push to main  
**Netlify:** Auto-deploys on every push to main

To disable auto-deploy:
- **Vercel:** Settings → Git → Automatic Deployments → Disabled
- **Netlify:** Site Settings → Build & Deploy → Auto Publishing

---

## 📊 Monitoring & Logs

### Vercel
- Go to **Project → Deployments**
- Click on any deployment to see build logs
- Check **Monitoring** tab for performance metrics

### Netlify
- Go to **Site Settings → Deploys**
- Click on any deploy to see build logs
- Check **Analytics** for visitor data

---

## ✅ You're Live!

After deployment:
1. Visit your live URL
2. Share with users
3. Monitor deployment logs for errors
4. Setup custom domain (optional)
5. Enable HTTPS (auto-enabled on both platforms)

**Estimated deployment time:** 2-5 minutes
