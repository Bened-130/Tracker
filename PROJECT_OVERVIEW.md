# SchoolVibe AI Tracker - Complete Project Documentation

**Status**: Full stack implementation with web + mobile apps

## Project Overview

SchoolVibe AI Tracker is a comprehensive school management platform with:
- **Facial recognition** for student check-in
- **Role-based dashboards** (Admin, Student, Parent, Teacher)
- **Real-time payments** tracking (Stripe integration ready)
- **Glassmorphism UI** design system
- **Real-time communications** (Supabase subscriptions)
- **Attendance management** with AI face detection
- **Complete financial statements**

---

## Project Structure

```
Tracker/
├── frontend/                    # Web application (Netlify)
│   ├── *.html                  # Role-based dashboard pages
│   ├── css/styles.css          # Glassmorphism UI
│   └── js/
│       ├── app.js              # Main app logic
│       ├── api.js              # API client (updated)
│       ├── adminDashboard.js   # Admin dashboard
│       ├── studentDashboard.js # Student dashboard
│       ├── studentCheckin.js   # Face recognition check-in
│       └── [other screens]
│
├── backend/                     # Node.js/Express server
│   ├── package.json
│   ├── server.js
│   ├── config/database.js
│   ├── controllers/             # Role-specific controllers
│   ├── routes/                  # API endpoints
│   ├── middleware/              # Auth & error handling
│   └── services/                # Business logic
│
├── mobile/                      # Expo React Native app
│   ├── app.tsx                 # Main app + navigation
│   ├── app.json                # Expo config
│   ├── package.json
│   ├── screens/
│   │   ├── Auth/               # Login/Signup
│   │   ├── Admin/              # Financial dashboard
│   │   ├── Student/            # Face auth + grades
│   │   ├── Parent/             # Child grades + messaging
│   │   └── Teacher/            # Assignments + attendance
│   ├── components/
│   │   ├── GlassmorphicUI.tsx  # Reusable UI components
│   │   └── FaceRecognitionComponent.tsx
│   ├── services/               # Supabase + APIs
│   └── constants/              # Colors, configs
│
├── supabase/                    # Database schemas + migrations
│   ├── 01_schema.sql           # All tables + RLS
│   ├── 02_functions.sql        # SQL functions
│   └── 03_seed_data.sql        # Dummy data
│
├── netlify/functions/          # Serverless backend
│   ├── api.mjs                 # Main API handler
│   └── [function handlers]
│
└── README.md                    # This file
```

---

## Getting Started

### Prerequisites
- Node.js 16+
- npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account
- Stripe account (optional, for payments)

### 1. Backend Setup (Node.js/Express)

```bash
cd backend
npm install

# Configure environment variables
# Create .env file with:
# SUPABASE_URL=your_url
# SUPABASE_KEY=your_key
# STRIPE_KEY=your_stripe_key
# DATABASE_URL=your_db_url

npm run dev  # Starts on port 3000
```

### 2. Frontend Setup (Web)

```bash
cd frontend
# Files are ready to use!
# Deploy to Netlify:
npm install netlify-cli -g
netlify deploy --prod
```

### 3. Mobile Setup (Expo)

```bash
cd mobile
npm install

# Update supabase credentials in services/supabaseClient.ts

npm start
# Choose platform:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - 'w' for web
```

---

## Database Schema

### Core Tables
```sql
-- Students with face descriptor
CREATE TABLE students (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  face_descriptor JSONB,
  class_id UUID REFERENCES classes,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User authentication with roles
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  role ENUM('student', 'parent', 'teacher', 'admin'),
  name TEXT,
  student_id UUID REFERENCES students,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance tracking
CREATE TABLE attendance (
  session_id UUID REFERENCES sessions,
  student_id UUID REFERENCES students,
  status ENUM('present', 'absent', 'late'),
  timestamp TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (session_id, student_id)
);

-- Fee management
CREATE TABLE fees (
  student_id UUID REFERENCES students,
  amount DECIMAL(10, 2),
  paid DECIMAL(10, 2) DEFAULT 0,
  status ENUM('pending', 'paid') DEFAULT 'pending',
  payment_date TIMESTAMP,
  payment_intent_id TEXT,
  PRIMARY KEY (student_id)
);

-- Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY,
  class_id UUID REFERENCES classes,
  title TEXT NOT NULL,
  due_date DATE,
  file_url TEXT,
  created_by UUID REFERENCES users,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Results/Grades
CREATE TABLE results (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students,
  subject TEXT,
  grade TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Real-time notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  type TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Parent-Teacher communication
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES users,
  teacher_id UUID REFERENCES users,
  message TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### With RLS Policies
```sql
-- Students can only see their own data
CREATE POLICY "students_select_self" ON student
  FOR SELECT USING (auth.uid() = user_id);

-- Teachers see only their class students
CREATE POLICY "teacher_see_class" ON students
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM teacher_classes 
      WHERE teacher_id = auth.uid()
    )
  );

-- Admins see all
CREATE POLICY "admin_all_access" ON students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## 🛠️ API Endpoints

### Authentication
```
POST /auth/login
POST /auth/signup
POST /auth/logout

Body: { email, password, role, name }
```

### Student Endpoints
```
GET /student/:id/results
GET /student/:id/assignments
GET /student/:id/timetable
GET /student/:id/fees
POST /student/:id/attendance (face data)
```

### Teacher Endpoints
```
GET /teacher/:id/assignments
POST /teacher/assignments (create)
PUT /teacher/assignments/:id (update)
DELETE /teacher/assignments/:id
GET /teacher/attendance?from=DATE&to=DATE
POST /teacher/grades (add student grade)
```

### Admin Endpoints
```
GET /admin/financial-summary
GET /admin/students
GET /admin/notifications
POST /admin/students (register)
```

### Parent Endpoints
```
GET /parent/child/:id/results
GET /parent/child/:id/assignments
POST /parent/messages
```

---

## Role-Based Features

###  Admin
- **Financial Dashboard**: Real-time payment tracking
- **Payment Notifications**: Supabase subscribe to fees table
- **Student Management**: Register students with face enrollment
- **Financial Statements**: SUM(fees due/paid) SQL functions
- **No Parent Communication**: Finance-focused only

###  Student
- **Mandatory Face Verification**: Login + check-in
- **Personal Dashboard**: Results, assignments, timetable
- **Financial Summary**: Fees paid vs. due
- **Identical to Parent View**: See same data parent sees

###  Parent
- **Child's Data**: Results, assignments, timetable, fees
- **Real-Time Comments**: Supabase subscriptions with teachers
- **Communication**: Send/receive messages from teachers
- **Mirrors Student View**: Same dashboard layout

### Teacher
- **Assignment CRUD**: Create, read, update delete
- **Session Management**: Open/close check-in sessions
- **Attendance Reports**: Generate CSV by date range
- **Grade Management**: Add/view student grades
- **No Finance Access**: Can't see fees

---

## UI Component Library

### Glassmorphism Components (SharedUI)

**Web** (`frontend/css/styles.css`):
```css
.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
}
```

**Mobile** (`mobile/components/GlassmorphicUI.tsx`):
```tsx
<LinearGradient
  colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
  className="p-4 border border-white/20 rounded-3xl"
/>
```

---

## Facial Recognition Flow

### Enrollment (Registration)
1. Student signs up
2. Camera access requested
3. Face landmarks extracted using `expo-face-detector`
4. Descriptor saved to `students.face_descriptor` JSONB
5. Threshold: 0.6 confidence

### Verification (Check-in)
1. Student navigates to check-in screen
2. Front camera opens (`react-native-vision-camera`)
3. Real-time face detection with landmarks
4. Compare with stored descriptor using Euclidean distance
5. If < threshold: Mark attendance ✓
6. If > threshold: "Face doesn't match" error

### Implementation
```tsx
// Mobile component
const handleFacesDetected = async ({ faces }) => {
  if (faces.length === 0) return;
  
  const descriptor = {
    bounds: faces[0].bounds,
    landmarks: faces[0].landmarks,
    smilingProbability: faces[0].smilingProbability
  };
  
  // Compare with DB descriptor
  const match = compareFaceDescriptors(descriptor, dbDescriptor);
  if (match) {
    await attendanceService.markAttendance(...);
  }
};
```

---

## Payment Integration (Stripe)

### Flow
1. **Admin Dashboard** shows "Payment Due" for each student
2. **Student/Parent** selects fee → Redirects to Stripe Checkout
3. **Stripe Webhook** confirms payment
4. **Backend** updates `fees.paid` + `fees.status = 'paid'`
5. **Real-Time Notification** sent to all admin users
6. **Admin Dashboard** updates in real-time via Supabase subscription

### Supabase Real-Time Setup
```tsx
// Mobile: paymentService.ts
subscribeToPayments: (callback) => {
  supabase
    .channel('payments')
    .on('postgres_changes', 
      { event: '*', table: 'fees' },
      (payload) => callback(payload.new)
    )
    .subscribe();
}

// Admin component
useEffect(() => {
  const subscription = paymentService.subscribeToPayments(() => {
    loadFinancialData(); // Reload on payment
  });
  return () => subscription.unsubscribe();
}, []);
```

---

## Security

### Row-Level Security (RLS)
All tables have RLS policies enabled:
- Users can only SELECT their own records
- Teachers see only their class students
- Admins have full access
- Parents can only view their child's records

### Auth Flow
1. Supabase JWT token stored in SecureStore (mobile)
2. Automatically refreshed on app launch
3. Logout clears token

### Face Recognition Security
- Descriptors stored as JSONB (not full image)
- Face verification threshold: 0.6 (configurable)
- Timestamp logged for audit trail

---

## Real-time Features

### Implemented via Supabase subscriptions:

**Payments (Admin)**
```sql
CREATE PUBLICATION "payments" FOR TABLE fees;
```
→ Admin dashboard updates when fee status changes

**Comments (Teacher/Parent)**
```sql
CREATE PUBLICATION "comments" FOR TABLE comments;
```
→ Messages appear instantly in chat

**Assignments (Student)**
```sql
CREATE PUBLICATION "assignments" FOR TABLE assignments;
```
→ New homework shows on student dashboard real-time

**Notifications**
```sql
CREATE PUBLICATION "notifications" FOR TABLE notifications;
```
→ Payment notifications toast to admins

---

##  Testing Data

Run `/supabase/03_seed_data.sql` to populate:
- 50 sample students
- 5 classes
- 10 teachers
- 5 parents
- 50 assignments
- 100+ attendance records
- Sample fees (20 paid, 30 pending)
- 20+ payment notifications

---

## Deployment

### Frontend (Netlify)
```bash
cd frontend
netlify deploy --prod
```

### Backend (Heroku/Railway)
```bash
cd backend
git push heroku main
```

### Mobile (EAS Build)
```bash
eas build --platform all --profile production
# Submits to App Store + Play Store
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Face not recognized" | Increase `THRESHOLD` in face comparison; test with different lighting |
| Camera permissions | Update `app.json` with usage descriptions |
| Supabase auth failing | Verify JWT refresh in SecureStore |
| Real-time not updating | Check RLS policies + publication settings |
| Payment webhook timing | Implement retry logic in Stripe webhook handler |
| API CORS errors | Add origin to Supabase / backend CORS |

---

## Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [React Native Vision Camera](https://react-native-vision-camera.com/)
- [Expo Face Detector](https://docs.expo.dev/versions/latest/sdk/face-detector/)
- [Stripe React Native](https://stripe.com/docs/stripe-js/react)
- [NativeWind Tailwind](https://www.nativewind.dev/)

---

## Authors & Contributors

- **Lead Developer**: [Your Name]
- **Mobile**: React Native + Expo
- **Web**: Vanilla JS + HTML5
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase)

---

## License

MIT

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Status**: Production Ready 
