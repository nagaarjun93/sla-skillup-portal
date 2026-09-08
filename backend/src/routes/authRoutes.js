const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateStudentRegister, validateStudentLogin, validateAdminLogin } = require('../validators/authValidator');
const { protect } = require('../middleware/auth');

const gameController = require('../controllers/gameController');

router.post('/students/register', validateStudentRegister, authController.registerStudent);
router.post('/students/login', validateStudentLogin, authController.loginStudent);
router.post('/admin/login', validateAdminLogin, authController.loginAdmin);
router.post('/students/forgot-password/request', authController.requestForgotPassword);
router.post('/students/forgot-password/verify-otp', authController.verifyOtpOnly);
router.post('/students/forgot-password/reset-password', authController.resetPassword);
router.post('/students/forgot-password/verify', authController.verifyForgotPassword);
router.get('/students/profile', protect, authController.getStudentProfile);

// Gamification: Lucky Spin & Daily Streak Rewards (MongoDB Cloud Synced)
router.get('/student/game/status', protect, gameController.getGameStatus);
router.post('/student/game/spin', protect, gameController.recordSpin);
router.post('/student/game/claim-streak', protect, gameController.claimStreakBonus);

module.exports = router;
