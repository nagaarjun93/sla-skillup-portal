const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const topicController = require('../controllers/topicController');
const { protect } = require('../middleware/auth');

router.get('/categories', examController.getCategories);
router.get('/topics', topicController.getAllTopics);
router.post('/topics', topicController.createTopic);
router.delete('/topics/:id', topicController.deleteTopic);
router.get('/categories/details', examController.getCategoryDetails);
router.get('/exam', protect, examController.getExamQuestions);
router.post('/results', protect, examController.submitExamResult);
router.get('/leaderboard', examController.getLeaderboard);

module.exports = router;
