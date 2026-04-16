# AUTHENTICATION & ROLE-BASED ACCESS CONTROL GUIDE

## Overview

The application now implements a comprehensive role-based access control (RBAC) system where all users must log in with a specific role to access the platform. Unregistered users are redirected to the login page.

## Login System

### Entry Point: `login.html` 
- **Location**: `/frontend/login.html`
- **Purpose**: First page users see. Requires role selection and credentials.
- **Features**:
  - 4-role selection: Admin, Teacher, Student, Parent
  - Email and password validation
  - Demo account credentials for testing
  - Professional glassmorphism design with gradient background

### Authentication Logic: `login.js`
- **Location**: `/frontend/js/login.js`
- **Features**:
  - Role selection mechanism
  - Form validation (email, password, role)
  - Local storage-based session management
  - Auto-redirect to appropriate dashboard after login
  - Automatic redirect to login if session expires

## Demo Accounts

Use these credentials to test the system:

| Role    | Email                | Password    |
|---------|----------------------|-------------|
| Admin   | admin@school.com     | admin123    |
| Teacher | teacher@school.com   | teacher123  |
| Student | student@school.com   | student123  |
| Parent  | parent@school.com    | parent123   |

## Role-Specific Dashboards

After successful login, users are directed to their role-specific dashboard:

| Role    | Dashboard Page        | File                      |
|---------|----------------------|---------------------------|
| Admin   | Admin Dashboard      | `/admin-dashboard.html`   |
| Teacher | Teacher Dashboard    | `/teacher-dashboard.html` |
| Student | Student Dashboard    | `/student-dashboard.html` |
| Parent  | Parent Portal        | `/parent-portal.html`     |

## How It Works

### 1. Initial Login
```
User visits website
  ↓
Redirected to login.html (if not authenticated)
  ↓
Select role (Admin/Teacher/Student/Parent)
  ↓
Enter email and password
  ↓
Credentials validated against demo users
  ↓
Session created in localStorage
  ↓
Redirected to role-specific dashboard
```

### 2. Authentication Functions

#### `AuthManager.setUser(user)`
Stores user data in localStorage with auth token.
```javascript
AuthManager.setUser({
    id: 'student_001',
    name: 'Jane Student',
    email: 'student@school.com',
    role: 'student',
    loginTime: '2024-04-16T10:30:00Z'
});
```

#### `AuthManager.getUser()`
Retrieves current authenticated user from localStorage.

#### `AuthManager.getUserRole()`
Returns the role of authenticated user (admin/teacher/student/parent).

#### `AuthManager.isAuthenticated()`
Returns true if user is logged in (authToken exists).

#### `AuthManager.logout()`
Clears session and redirects to login page.

### 3. Access Control Functions

#### `requireAuth()`
Checks if user is authenticated. If not, redirects to login.html.
```javascript
// Add to any page that requires authentication
requireAuth();
```

#### `requireRole(...allowedRoles)`
Checks if user has one of the specified roles. Redirects unauthorized users.
```javascript
// Only admins can access this page
requireRole('admin');

// Teachers or admins can access this page
requireRole('teacher', 'admin');

// Students can check in
requireRole('student');

// Parents can view portal
requireRole('parent');
```

## Page Protection

All pages (except login.html) are protected with one of the following:

### Public Access (Any Authenticated User)
- `/index.html` - Home page (requires `requireAuth()`)
- `/dashboard.html` - General dashboard (requires `requireAuth()`)
- `/register.html` - Registration (requires `requireAuth()`)
- `/checkin.html` - General check-in (requires `requireAuth()`)

### Admin Only
- `/admin-dashboard.html` - (requires `requireRole('admin')`)

### Teacher Only
- `/teacher-dashboard.html` - (requires `requireRole('teacher')`)
- `/reports.html` - Reports page (allows `admin` or `teacher`)

### Student Only
- `/student-dashboard.html` - (requires `requireRole('student')`)
- `/student-checkin.html` - Face recognition check-in (requires `requireRole('student')`)

### Parent Only
- `/parent-portal.html` - (requires `requireRole('parent')`)

## User Session Management

### Session Storage
User sessions are stored in localStorage with:
- `user` - Complete user object (JSON)
- `userRole` - User's role (string)
- `authToken` - Encoded token (base64)

### Session Persistence
- Sessions persist across browser sessions
- Users remain logged in until they manually logout or clear browser data
- Logout button appears in navigation with current role

### Logout
Click "Logout [ROLE]" in the navigation bar to:
1. Clear all localStorage data
2. Redirect to login page
3. Require re-authentication to access protected pages

## Implementation Details

### Adding Role-Based Access to New Pages

1. **Create new HTML file** (e.g., new-page.html)

2. **Add login.js script**:
```html
<script src="js/login.js"></script>
```

3. **Add role requirement** before closing `</body>`:
```html
<script>
    // For specific roles
    requireRole('admin', 'teacher');
    
    // For any authenticated user
    requireAuth();
</script>
</body>
```

### Role-Based Navigation

The `setupRoleBasedNavigation()` function automatically:
- Hides menu items for pages the user cannot access
- Shows logout button with user's role
- Prevents unauthorized page access

## Security Notes

### Current Implementation
This demo uses localStorage for session management - suitable for development/learning environments.

### For Production
Consider implementing:
- Server-side session management
- HTTP-only cookies
- JWT tokens with expiration
- Refresh tokens
- CSRF protection
- HTTPS enforcement
- Secure password hashing (bcrypt)
- Rate limiting on login attempts
- Role-based middleware in backend

## Troubleshooting

### User redirected to login on every page load
- Check browser console for errors
- Verify localStorage is enabled
- Check that `login.js` is loaded before page content

### "Access denied" message
- User is authenticated but lacks required role
- Verify correct role was selected during login
- Use demo credentials for testing

### Logout not working
- Check browser console for errors
- Verify localStorage is writable
- Try clearing browser cache

### Demo accounts not working
- Credentials must match exactly (case-sensitive)
- Use exact email: `admin@school.com` (not variations)
- Password is `admin123` (not `Admin123`)

## Testing the System

### Test Administrator Access
1. Go to `/login.html`
2. Select "ADMIN" role
3. Enter: admin@school.com / admin123
4. Should see Admin Dashboard

### Test Student Access
1. Go to `/login.html`
2. Select "STUDENT" role
3. Enter: student@school.com / student123
4. Should see Student Dashboard

### Test Role Isolation
1. Login as Student
2. Try to access `/admin-dashboard.html` directly
   - Should be redirected with "Access denied" message
3. Attempting to access Teacher pages should also be denied

### Test Session Persistence
1. Login as any role
2. Refresh the page
3. Should remain logged in
4. Close browser and reopen
5. Should still be logged in (session persists)

### Test Logout
1. Login as any role
2. Click "Logout [ROLE]" in navigation
3. Should be redirected to login.html
4. Session should be cleared
5. Attempting to access any page should redirect to login

## File Structure

```
frontend/
├── login.html                    # Login page (entry point)
├── index.html                    # Home (requires auth)
├── admin-dashboard.html          # Admin only
├── teacher-dashboard.html        # Teacher only
├── student-dashboard.html        # Student only
├── parent-portal.html            # Parent only
├── register.html                 # General (requires auth)
├── checkin.html                  # General (requires auth)
├── student-checkin.html          # Student only
├── reports.html                  # Admin/Teacher only
├── dashboard.html                # General (requires auth)
├── css/
│   └── styles.css
└── js/
    ├── login.js                  # AUTH SYSTEM (NEW)
    ├── api.js
    ├── app.js
    ├── adminDashboard.js
    ├── teacherAssignments.js
    ├── studentDashboard.js
    ├── studentCheckin.js
    └── [other scripts]
```

## Next Steps

1. **Integrate with Backend**: Connect login.js to actual authentication API
2. **Database Integration**: Store user credentials securely in database
3. **Password Recovery**: Implement password reset functionality
4. **Two-Factor Authentication**: Add 2FA for enhanced security
5. **Session Timeout**: Add automatic logout after inactivity
6. **Activity Logging**: Track user actions for audit purposes
7. **Role Permissions Matrix**: Define granular permissions per role
