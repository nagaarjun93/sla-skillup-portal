# SLA SkillUp Aptitude Test Portal Migration Project

This repository contains the complete end-to-end technological stack migration of the **SLA SkillUp Aptitude Test Portal** (NMA).

---

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas (via Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens) with `jsonwebtoken`
- **Password Security**: `bcryptjs` password hashing & verification
- **File Uploads**: `multer` for CSV parsing
- **Validation**: Custom express validation middleware (`express-validator` style)

### Frontend
- **Framework**: React Native with Expo & Expo Router
- **State & Context**: React Context API (`AuthContext`)
- **HTTP Client**: Axios with request/response interceptors for JWT token attachment & centralized 401 redirection
- **Storage**: `@react-native-async-storage/async-storage`
- **Styling**: Vanilla React Native `StyleSheet` enforcing strict design tokens

---

## 📁 Repository Structure

```
NMA1/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection setup
│   │   ├── controllers/
│   │   │   ├── adminController.js    # Questions & Student Management
│   │   │   ├── authController.js     # Student & Admin Authentication / Registration / OTP
│   │   │   ├── examController.js     # Questions listing, exam submission & leaderboard
│   │   │   ├── mockTestController.js # Official mock test access & settings
│   │   │   └── weeklyTestController.js # Weekly test CRUD & student history
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT Auth & Admin Role Guards
│   │   │   ├── errorHandler.js       # Centralized HTTP error handler
│   │   │   └── upload.js             # Multer CSV file upload middleware
│   │   ├── models/
│   │   │   ├── Admin.js              # Admin schema
│   │   │   ├── CategoryDuration.js   # Category time limit schema
│   │   │   ├── MockQuestion.js       # Mock test question schema
│   │   │   ├── MockResult.js         # Mock test result schema
│   │   │   ├── MockSettings.js       # Mock test passing mark & duration schema
│   │   │   ├── OtpVerification.js    # OTP storage schema
│   │   │   ├── Question.js           # Aptitude question schema
│   │   │   ├── Result.js             # Test submission result schema
│   │   │   ├── Student.js            # Student profile schema
│   │   │   ├── StudentMockAccess.js  # Student mock test permission schema
│   │   │   └── WeeklyTest.js         # Scheduled weekly test schema
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── examRoutes.js
│   │   │   ├── mockTestRoutes.js
│   │   │   └── weeklyTestRoutes.js
│   │   ├── services/
│   │   │   └── fileParserService.js  # CSV line parsing utility
│   │   ├── utils/
│   │   │   └── jwt.js                # Token generation & verification helpers
│   │   ├── app.js                    # Express app configuration & middlewares
│   │   └── server.js                 # HTTP server listener
│   ├── .env.example
│   ├── package.json
│   └── seedAdmin.js                  # Default admin user seeder
├── frontend/
│   ├── app/                          # Expo Router routes
│   │   ├── _layout.tsx
│   │   ├── index.tsx                 # Role selection entry
│   │   ├── student-login.tsx
│   │   ├── student-register.tsx
│   │   ├── student-forgot-password.tsx
│   │   ├── admin-login.tsx
│   │   ├── home.tsx
│   │   ├── category-select.tsx
│   │   ├── exam.tsx
│   │   ├── student-mock-exam.tsx
│   │   ├── student-results.tsx
│   │   ├── view-mistakes.tsx
│   │   ├── previous-tests.tsx
│   │   ├── leaderboard.tsx
│   │   ├── admin-dashboard.tsx
│   │   ├── add-question.tsx
│   │   ├── edit-question.tsx
│   │   ├── question-upload.tsx
│   │   ├── view-questions.tsx
│   │   ├── topic-questions.tsx
│   │   ├── student-management.tsx
│   │   ├── mock-test-management.tsx
│   │   └── weekly-test-management.tsx
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── QuestionCard.jsx
│       │   ├── ScoreSummary.jsx
│       │   └── WeeklyTestCard.jsx
│       ├── context/
│       │   └── AuthContext.js        # Global Authentication State
│       ├── hooks/
│       │   ├── useAuth.js
│       │   └── useTimer.js
│       ├── screens/                  # Reusable Screen Components
│       │   ├── AddQuestionScreen.jsx
│       │   ├── AdminDashboardScreen.jsx
│       │   ├── AdminLoginScreen.jsx
│       │   ├── CategorySelectScreen.jsx
│       │   ├── EditQuestionScreen.jsx
│       │   ├── ExamScreen.jsx
│       │   ├── HomeScreen.jsx
│       │   ├── LeaderboardScreen.jsx
│       │   ├── MockTestManagementScreen.jsx
│       │   ├── PreviousTestsScreen.jsx
│       │   ├── QuestionUploadScreen.jsx
│       │   ├── RoleSelectionScreen.jsx
│       │   ├── StudentForgotPasswordScreen.jsx
│       │   ├── StudentLoginScreen.jsx
│       │   ├── StudentManagementScreen.jsx
│       │   ├── StudentMockExamScreen.jsx
│       │   ├── StudentRegisterScreen.jsx
│       │   ├── StudentResultsScreen.jsx
│       │   ├── TopicQuestionsScreen.jsx
│       │   ├── ViewMistakesScreen.jsx
│       │   ├── ViewQuestionsScreen.jsx
│       │   └── WeeklyTestManagementScreen.jsx
│       ├── services/
│       │   ├── adminService.js
│       │   ├── api.js                # Centralized Axios Instance
│       │   ├── authService.js
│       │   ├── examService.js
│       │   ├── mockService.js
│       │   └── weeklyService.js
│       ├── styles/
│       │   └── theme.js              # Enforced Design Tokens
│       └── utils/
│           ├── storage.js
│           └── timer.js
└── README.md
```

---

## 🚀 Setup & Execution Guide

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables (create .env file)
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/sla_aptitude_db
# JWT_SECRET=supersecretkey_12345

# Seed initial admin account (admin / admin123)
node seedAdmin.js

# Start backend server
npm run dev
```

The Express API server will listen on `http://localhost:5000`.

### 2. Frontend Setup (Expo Mobile App for Students)

```bash
cd frontend

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### 3. Admin Web Portal (React Web for Desktop / Website)

```bash
cd admin-web

# Install dependencies
npm install

# Start Vite React development server
npm run dev
# Vite will open http://localhost:3000

# Or build production static assets
npm run build
# Built files will automatically be served at http://localhost:5002/admin by the backend!
```

---

## 🔒 Key Security & Privacy Implementation Rules

1. **Student Exam Result Privacy**: Upon test submission by a student, the backend evaluates the score and stores the record in MongoDB. The API returns `{ message: 'Exam submitted successfully', status: 'SUCCESS' }` without returning raw score numbers in the HTTP response.
2. **Account Status Control**: Logging in with an inactive student account (`status === 'INACTIVE'`) returns an HTTP 403 Forbidden response denying login access.
3. **Mock Exam Guarding**: Official mock test access is strictly guarded by `StudentMockAccess` schema (`accessEnabled === true`).
4. **Auto-seeding Admin**: Logging into the admin interface automatically seeds default credentials if none exist.
