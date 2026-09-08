const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateStudentRegister, validateStudentLogin, validateAdminLogin } = require('../validators/authValidator');
const { protect } = require('../middleware/auth');

router.post('/students/register', validateStudentRegister, authController.registerStudent);
router.post('/students/login', validateStudentLogin, authController.loginStudent);
router.post('/admin/login', validateAdminLogin, authController.loginAdmin);
router.post('/students/forgot-password/request', authController.requestForgotPassword);
router.post('/students/forgot-password/verify-otp', authController.verifyOtpOnly);
router.post('/students/forgot-password/reset-password', authController.resetPassword);
router.post('/students/forgot-password/verify', authController.verifyForgotPassword);
router.get('/students/profile', protect, authController.getStudentProfile);

module.exports = router;
