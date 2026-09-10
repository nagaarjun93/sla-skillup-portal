const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateQuestionManual, validateBulkQuestions } = require('../validators/questionValidator');

// Protect all admin routes
router.use(protect, adminOnly);

// Question Management
router.get('/questions', adminController.getAllQuestions);
router.get('/questions-manage', adminController.getManageQuestions);
router.get('/questions/:id', adminController.getQuestionById);
router.post('/questions/manual', validateQuestionManual, adminController.addQuestionManual);
router.post('/questions/upload-file', upload.single('file'), adminController.uploadQuestionFile);
router.post('/questions/upload-csv', upload.single('file'), adminController.uploadQuestionsCsv);
router.post('/questions/parse-file', upload.single('file'), adminController.parseQuestionsFile);
router.post('/questions/save-bulk', validateBulkQuestions, adminController.saveBulkQuestions);
router.post('/questions/bulk-delete', adminController.bulkDeleteQuestions);
router.post('/questions/delete-by-scope', adminController.deleteQuestionsByScope);
router.delete('/mock-questions/:id', adminController.deleteMockQuestion);
router.put('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);

// Results Management
router.get('/results', adminController.getResults);
router.get('/results/not-attempted', adminController.getNotAttemptedStudents);
router.put('/results/:id/mark', adminController.markResult);
router.get('/results/:id/details', adminController.getResultDetails);

// Student Management
router.get('/students', adminController.getAllStudents);
router.get('/students/management', adminController.getStudentManagement);
router.get('/students/:id/details', adminController.getStudentDetails);
router.put('/students/:id/status', adminController.updateStudentStatus);

module.exports = router;
