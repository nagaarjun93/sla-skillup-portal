const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const topicController = require('../controllers/topicController');
const { protect } = require('../middleware/auth');

const adminController = require('../controllers/adminController');

router.get('/categories', examController.getCategories);
router.get('/topics', topicController.getAllTopics);
router.post('/topics', topicController.createTopic);
router.delete('/topics/:id', topicController.deleteTopic);
router.get('/categories/details', examController.getCategoryDetails);
router.get('/exam', protect, examController.getExamQuestions);
router.post('/results', protect, examController.submitExamResult);
router.get('/results/:id/details', protect, adminController.getResultDetails);
router.get('/topic-history', protect, examController.getStudentTopicHistory);
router.get('/leaderboard', protect, examController.getLeaderboard);

module.exports = router;

