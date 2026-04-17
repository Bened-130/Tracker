# APK Build Guide for SchoolVibe AI Tracker

## Prerequisites

Before building the APK, ensure you have:

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Expo CLI** (`npm install -g @expo/cli`)
4. **EAS CLI** (`npm install -g eas-cli`)
5. **Android Studio** (for Android builds) or Xcode (for iOS builds)

## Environment Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `mobile/` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_anon_key
```

Replace with your actual Supabase project URL and anonymous key.

### 3. Login to Expo (if using EAS Build)

```bash
npx expo login
```

## Build Methods

### Method 1: EAS Build (Recommended - Cloud Build)

#### For APK (Android):
```bash
npx eas build --platform android --profile preview
```

#### For AAB (Android App Bundle):
```bash
npx eas build --platform android --profile production
```

#### For iOS:
```bash
npx eas build --platform ios --profile preview
```

### Method 2: Local Build (Advanced)

If you prefer local builds, you'll need:

1. **Android Studio** with Android SDK
2. **Java JDK** (v11 or higher)

```bash
# Install Android dependencies
npx expo install --fix

# Prebuild for Android
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleRelease
```

## EAS Configuration

The project includes `eas.json` with the following profiles:

### Preview Profile (APK)
- **Platform**: Android
- **Build Type**: APK
- **Purpose**: Development/Testing

### Production Profile
- **Platform**: Android + iOS
- **Build Type**: AAB (Android), IPA (iOS)
- **Purpose**: App Store deployment

## Troubleshooting

### Common Issues

#### 1. EAS CLI Not Found
```bash
npm install -g eas-cli
# or
npm install --save-dev eas-cli
npx eas-cli --version
```

#### 2. Missing Assets
The app requires these assets in `mobile/assets/`:
- `adaptive-icon.png` (512x512)
- `splash.png` (512x512)
- `favicon.png` (32x32)

#### 3. Environment Variables
Ensure `.env` file exists with valid Supabase credentials.

#### 4. Build Fails
```bash
# Clear cache
npx expo start --clear

# Check for issues
npx expo doctor
```

## Output Locations

### EAS Build
- APK files are available in your Expo account dashboard
- Download links are sent via email
- Files are stored in EAS cloud storage

### Local Build
- APK: `mobile/android/app/build/outputs/apk/release/app-release.apk`
- AAB: `mobile/android/app/build/outputs/bundle/release/app-release.aab`

## Testing the APK

### Install on Android Device
```bash
# Using ADB (Android Debug Bridge)
adb install path/to/app-release.apk

# Or transfer the APK file to your device and install manually
```

### Test Features
1. **Login System**: Test all 4 roles (Admin, Teacher, Student, Parent)
2. **Face Recognition**: Test camera permissions and face detection
3. **Navigation**: Test role-based navigation and access control
4. **Offline Functionality**: Test app behavior without internet

## Deployment

### Google Play Store
1. Build AAB using production profile
2. Upload to Google Play Console
3. Configure store listing, screenshots, and metadata
4. Publish to production

### App Store (iOS)
1. Build IPA using production profile
2. Upload to App Store Connect
3. Configure app metadata and screenshots
4. Submit for review

## Development Mode

To run the app during development:

```bash
# Web (for testing)
npm run web

# Android emulator
npm run android

# iOS simulator (macOS only)
npm run ios
```

## Build Optimization

### Reduce APK Size
1. **Enable ProGuard/R8**: Configured in `eas.json`
2. **Optimize Images**: Use WebP format for assets
3. **Tree Shaking**: Enabled by default in Expo
4. **Split APKs**: For different architectures

### Performance Tips
1. **Lazy Loading**: Implement for large screens
2. **Image Optimization**: Use appropriate sizes
3. **Bundle Splitting**: Use dynamic imports
4. **Caching**: Implement proper caching strategies

## Security Considerations

### Before Production Build
1. **Remove Debug Code**: Ensure no console.logs in production
2. **Environment Variables**: Use production Supabase credentials
3. **API Keys**: Ensure all keys are properly configured
4. **Permissions**: Review and minimize Android permissions
5. **Code Obfuscation**: Enable for production builds

## Support

If you encounter issues:

1. Check the [Expo Documentation](https://docs.expo.dev/)
2. Review [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
3. Check the app logs during build
4. Verify all dependencies are installed correctly

## Quick APK Build Command

For a quick APK build (assuming all prerequisites are met):

```bash
cd mobile
npm install
echo "EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" > .env
echo "EXPO_PUBLIC_SUPABASE_KEY=your_anon_key" >> .env
npx eas build --platform android --profile preview
```

The APK will be available for download once the build completes!