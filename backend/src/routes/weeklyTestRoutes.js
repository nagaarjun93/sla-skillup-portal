const express = require('express');
const router = express.Router();
const weeklyTestController = require('../controllers/weeklyTestController');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');

// Admin Weekly Test Routes
router.post('/admin/weekly', protect, adminOnly, weeklyTestController.createWeeklyTest);
router.put('/admin/weekly/:id', protect, adminOnly, weeklyTestController.updateWeeklyTest);
router.put('/admin/weekly/:id/activate', protect, adminOnly, weeklyTestController.activateWeeklyTest);
router.delete('/admin/weekly/:id', protect, adminOnly, weeklyTestController.deleteWeeklyTest);
router.post('/admin/weekly/:id/questions', protect, adminOnly, weeklyTestController.addQuestionsToWeeklyTest);
router.get('/admin/weekly', protect, adminOnly, weeklyTestController.getAllWeeklyTestsAdmin);

// Student Weekly Test Routes
router.get('/student/weekly/active', protect, studentOnly, weeklyTestController.getActiveWeeklyTest);
router.get('/student/weekly/current', protect, studentOnly, weeklyTestController.getActiveWeeklyTest);
router.get('/student/weekly/history', protect, studentOnly, weeklyTestController.getStudentWeeklyHistory);

module.exports = router;
