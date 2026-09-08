const express = require('express');
const router = express.Router();
const mockTestController = require('../controllers/mockTestController');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Admin Mock Routes
router.post('/admin/mock/questions/save-bulk', protect, adminOnly, mockTestController.saveBulkMockQuestions);
router.post('/admin/mock/questions/upload-csv', protect, adminOnly, upload.single('file'), mockTestController.uploadMockQuestionsCsv);
router.get('/admin/mock/questions', protect, adminOnly, mockTestController.getMockQuestions);
router.put('/admin/mock/questions/:id', protect, adminOnly, mockTestController.updateMockQuestion);
router.delete('/admin/mock/questions/:id', protect, adminOnly, mockTestController.deleteMockQuestion);
router.delete('/admin/mock/models/:modelSet/questions', protect, adminOnly, mockTestController.clearModelQuestions);
router.get('/admin/mock/settings', protect, adminOnly, mockTestController.getMockSettings);
router.post('/admin/mock/settings', protect, adminOnly, mockTestController.updateMockSettings);
router.put('/admin/mock/settings', protect, adminOnly, mockTestController.updateMockSettings);
router.get('/admin/mock/models-stats', protect, adminOnly, mockTestController.getMockModelsStats);
router.post('/admin/mock/assign-student-model', protect, adminOnly, mockTestController.assignStudentMockModel);
router.post('/admin/mock/auto-distribute-models', protect, adminOnly, mockTestController.autoDistributeMockModels);
router.post('/admin/students/mock-access', protect, adminOnly, mockTestController.setBulkMockAccess);
router.put('/admin/students/mock-access', protect, adminOnly, mockTestController.setBulkMockAccess);
router.get('/admin/mock/access', protect, adminOnly, mockTestController.getMockAccessList);
router.get('/admin/mock/models', protect, adminOnly, mockTestController.getMockModels);
router.get('/admin/mock/results', protect, adminOnly, mockTestController.getMockResultsAdmin);
router.get('/admin/mock/results/:id/details', protect, adminOnly, mockTestController.getMockResultDetails);


// Student Mock Routes
router.get('/student/mock/access', protect, studentOnly, mockTestController.checkStudentMockAccess);
router.get('/student/mock/check-attempted', protect, studentOnly, mockTestController.checkStudentAttempted);
router.get('/student/mock/exam', protect, studentOnly, mockTestController.getStudentMockExam);
router.post('/student/mock/submit', protect, studentOnly, mockTestController.submitStudentMockExam);
router.get('/student/mock/results/:id/details', protect, mockTestController.getMockResultDetails);
router.get('/admin/mock/results', protect, adminOnly, mockTestController.getMockResultsAdmin);
router.get('/student/mock/result', protect, adminOnly, mockTestController.getMockResultsAdmin);

module.exports = router;
