# SchoolVibe AI Tracker - Mobile App

A comprehensive React Native + Expo mobile application for school attendance management with facial recognition, role-based dashboards, and real-time notifications.

## Features

- **Role-Based Authentication**: Student, Parent, Teacher, Admin
- **Facial Recognition**: Student check-in using face detection
- **Real-Time Notifications**: Supabase subscriptions for payments and updates
- **Glassmorphism UI**: Modern, frosted glass design with NativeWind
- **Financial Dashboard**: Admin payment tracking and statements
- **Communication**: Parent-Teacher messaging
- **Assignment Management**: Teacher CRUD operations
- **Attendance Tracking**: Complete attendance reports

## Project Structure

```
mobile/
├── app.tsx                 # Main app navigation
├── app.json               # Expo config
├── package.json
├── screens/
│   ├── Auth/             # Login/Signup screens
│   ├── Admin/            # Admin-specific screens
│   ├── Student/          # Student screens (face auth, grades)
│   ├── Parent/           # Parent screens (child grades, messaging)
│   └── Teacher/          # Teacher screens (assignments, reports)
├── components/           # Reusable UI components
├── services/            # Supabase & API services
├── context/             # Global state (auth, theme)
├── constants/           # Colors, configs
└── utils/              # Helper functions
```

## Getting Started

### Prerequisites
- Node.js & npm
- Expo CLI: `npm install -g expo-cli`
- Supabase project with RLS policies enabled

### Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Configure Supabase:
   - Update `services/supabaseClient.ts` with your project URL and anon key

3. Start development:
```bash
npm start
```

4. Run on device/simulator:
   - Android: `npm run android`
   - iOS: `npm run ios`
   - Web: `npm run web`

## Build for Production

### EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android
npm run eas-build-production

# Build for iOS
npm run eas-build-production
```

### Local Build

```bash
# Eject from Expo (if needed)
npm run eject
```

## Environment Variables

Create a `.env.local` file:
```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Database Schema

See `/supabase/01_schema.sql` for the complete schema including:
- students
- classes
- sessions
- attendance
- users (with roles)
- fees
- assignments
- results
- timetables
- comments
- notifications

## API Integration

All services in `services/` handle Supabase real-time subscriptions:
- Payment notifications (admin)
- Comments (parent-teacher)
- Assignments (teacher)
- Attendance (student)

## Facial Recognition

Uses `react-native-vision-camera` + `expo-face-detector` for:
- Face enrollment (students on sign-up)
- Face verification (check-in process)
- Confidence threshold: 0.6

## Deployment

1. Generate EAS build configuration
2. Build for App Store (iOS) and Play Store (Android)
3. Submit for review
4. Deploy with automatic updates via Expo's update service

## Contributing

Pull requests welcome. For major changes, please open an issue first.

## License

MIT
