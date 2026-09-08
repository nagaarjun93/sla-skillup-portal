# Admin Native Screens Backup (React Native)

This folder preserves the complete React Native mobile implementation of all Admin management screens.

## Why this backup exists:
- The project follows the **Enterprise Architecture Standard**:
  - **Admin Portal**: Desktop / Laptop Web Portal (pure React in `admin-web/`).
  - **Student Portal**: Mobile App (React Native in `frontend/`).
- Mobile phone access to Admin is restricted so students cannot access Admin from their phone app.

## Preserved Screens:
1. `AdminDashboardScreen.jsx` - Admin statistics & module hub.
2. `AdminLoginScreen.jsx` - Native Admin authentication.
3. `AdminProfileScreen.jsx` - Admin password reset and profile.
4. `AddQuestionScreen.jsx` - Single question manual creation.
5. `EditQuestionScreen.jsx` - Existing question modification.
6. `QuestionUploadScreen.jsx` - Bulk CSV upload for practice & mock questions.
7. `MockTestManagementScreen.jsx` - Full mock test configuration, 10 models full-screen viewer, and replace conflict handling.
8. `WeeklyTestManagementScreen.jsx` - Weekly live test scheduler.
9. `ThisWeekQuestionsScreen.jsx` - Review questions for active test.
10. `StudentManagementScreen.jsx` - Student activation & mock permissions.
11. `TopicQuestionsScreen.jsx` - Practice topic question browser.
12. `ViewQuestionsScreen.jsx` - Question bank list.

## How to restore into mobile app in the future:
If the team ever wants Admin screens inside the mobile app again:
1. Copy any screen from here into `frontend/src/screens/`.
2. Connect corresponding route in `frontend/app/`.
3. Done!

