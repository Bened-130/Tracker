# SchoolVibe AI Tracker - Setup & Installation Guide

## 🎯 Quick Start (5 minutes)

### Option A: Web Only
```bash
# Just deploy frontend to Netlify
cd frontend
netlify deploy
```

### Option B: Full Stack (Web + Mobile)
Follow separate guides below.

---

## 🌐 Web Application Setup

### Step 1: Prepare Supabase

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Run SQL from `/supabase/01_schema.sql` (in SQL Editor)
3. Run `/supabase/02_functions.sql` (for SQL functions)
4. Run `/supabase/03_seed_data.sql` (test data)
5. Enable RLS on all tables (Settings → Security)

### Step 2: Frontend Config

```bash
cd frontend
# No build needed - pure HTML/JS/CSS
# Update api.js endpoint if using custom backend:
# const API = 'http://your-backend-url/api';
```

### Step 3: Deploy to Netlify

**Option A: Using Netlify CLI**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Option B: GitHub Integration**
1. Push to GitHub
2. Connect repo to Netlify
3. Deploy automatically on push

### Step 4: Test Web App

1. Visit deployed URL
2. Go to `/admin-dashboard.html` (as admin)
3. Go to `/student-dashboard.html` (as student)
4. Test `/student-checkin.html` (camera required)

---

## 📱 Mobile App Setup

### Prerequisites
```bash
# Install Expo CLI
npm install -g expo-cli@latest

# Verify Node version
node --version  # Should be 16+
```

### Step 1: Supabase Config

Create `.env` in `mobile/` folder (`.env.local` is ignored):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_anon_key
```

Update `mobile/services/supabaseClient.ts`:
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;
```

### Step 2: Install Dependencies

```bash
cd mobile
npm install

# If you get module errors:
npx expo@latest --version
```

### Step 3: Run Dev Server

**Start Expo**
```bash
npm start
```

Choose platform:
- **iOS**: Press `i` → Opens iOS Simulator
- **Android**: Press `a` → Opens Android Emulator
- **Web**: Press `w` → Opens browser

### Step 4: Test Features

1. **Login Screen**: Test with seed data email
2. **Face Auth**: Grant camera permission
3. **Dashboard**: View grades, assignments
4. **Admin Panel**: See financial data
5. **Real-time**: Check notifications

---

## 🔌 Backend Setup (Optional)

If not using Netlify Functions:

### Step 1: Configure

```bash
cd backend
npm install

# Create .env
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
PORT=3000
```

### Step 2: Run Dev Server

```bash
npm run dev
# Runs on http://localhost:3000
```

### Step 3: Connect Frontend/Mobile

**Frontend** (`frontend/js/api.js`):
```javascript
const API = 'http://localhost:3000/api';
```

**Mobile** (`mobile/services/supabaseClient.ts`):
```typescript
// Already configured - uses Supabase directly
```

---

## 🚀 Production Deployment

### Web (Netlify)

```bash
cd frontend
netlify deploy --prod

# Add environment variables in Netlify dashboard:
# - SUPABASE_URL
# - SUPABASE_KEY
```

### Mobile (App Store & Play Store)

#### Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

#### Build for iOS
```bash
cd mobile
eas build --platform ios --profile production

# Follow prompts to:
# 1. Create signing certificate
# 2. Configure bundle ID
# 3. Upload to Apple
```

#### Build for Android
```bash
eas build --platform android --profile production

# Generates .apk/.aab files
# Ready for Google Play Store
```

#### Submit to Stores
```bash
# After builds complete:
eas submit --platform ios
eas submit --platform android
```

---

## 🧪 Test Data

### Web Login Credentials (from seed_data)

**Admin**
- Email: `admin@schoolvibe.com`
- Password: `admin123`
- Role: admin

**Teacher**
- Email: `teacher@schoolvibe.com`
- Password: `teacher123`
- Role: teacher

**Student**
- Email: `student@schoolvibe.com`
- Password: `student123`
- Role: student

**Parent**
- Email: `parent@schoolvibe.com`
- Password: `parent123`
- Role: parent

### Seed Data Includes
- 50 students
- 5 faculty members
- 10 classes
- 100+ attendance records
- 50 assignments
- Test payment data

---

## 🛠️ Development Workflow

### Adding a New Feature

1. **Update Schema** (if needed)
   ```sql
   -- supabase/04_new_feature.sql
   ALTER TABLE table_name ADD COLUMN new_column TYPE;
   ```

2. **Web Frontend**
   ```
   Add HTML page to frontend/
   Add JS handler to frontend/js/
   Update frontend/js/api.js with endpoint
   ```

3. **Mobile Screen**
   ```
   Create screen in mobile/screens/Role/FeatureScreen.tsx
   Add service functions in mobile/services/
   Update navigation in mobile/app.tsx
   ```

4. **Backend** (if not using Supabase RLS)
   ```
   Add route in backend/routes/
   Add controller in backend/controllers/
   Add service logic in backend/services/
   ```

### Local Testing Checklist

- [ ] Run `npm start` on web
- [ ] Run `npm start` on mobile
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test on physical device (via Expo)
- [ ] Verify real-time updates (Supabase)
- [ ] Check RLS policies working
- [ ] Confirm auth token refresh

---

## 📋 Environment Variables

### Frontend (netlify.toml)
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"

[env.production]
  SUPABASE_URL = "https://your-project.supabase.co"
  SUPABASE_KEY = "your_anon_key"
```

### Mobile (.env)
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_anon_key
EXPO_PUBLIC_STRIPE_KEY=pk_live_...
```

### Backend (.env)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret
STRIPE_SECRET_KEY=sk_live_...
```

---

## 🔍 Debugging

### Mobile Issues

**Camera permission denied**
```javascript
// Check app.json camera permission text
"infoPlist": {
  "NSCameraUsageDescription": "We need camera for face recognition"
}
```

**Face detection not working**
```typescript
// Verify FaceDetectorSettings in FaceRecognitionComponent
faceDetectorSettings={{
  mode: FaceDetector.FaceDetectorMode.fast,
  detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
}}
```

**Supabase auth failing**
- Check `.env` variables are loaded
- Verify anon key in Supabase dashboard
- Check JWT refresh in SecureStore

### Web Issues

**API calls returning 404**
- Verify backend is running
- Check API endpoint in `api.js`
- Examine Network tab in DevTools

**Real-time not updating**
- Enable Realtime in Supabase (table settings)
- Check RLS policies
- Subscribe correctly: `supabase.channel('table').on(...)`

---

## 📞 Support

### Documentation
- Full docs: See `PROJECT_OVERVIEW.md`
- Supabase guide: https://supabase.com/docs
- React Native: https://reactnative.dev

### Common Commands

```bash
# Clear cache
npm cache clean --force

# Install dependencies fresh
rm -rf node_modules package-lock.json
npm install

# Check Expo version
expo --version

# Reset simulator
xcrun simctl erase all

# View mobile logs
expo logs
```

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Run seed data in Supabase
- [ ] Enable RLS on all tables
- [ ] Update environment variables
- [ ] Test all user roles
- [ ] Verify facial recognition workflow
- [ ] Confirm real-time updates working
- [ ] Test payment webhook (Stripe)
- [ ] Check mobile app on both iOS/Android
- [ ] Verify web is responsive
- [ ] Set up SSL/HTTPS
- [ ] Configure backups
- [ ] Document any custom configurations

---

**Happy coding! 🚀**
