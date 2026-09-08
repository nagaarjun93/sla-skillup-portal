const Question = require('../models/Question');
const Result = require('../models/Result');
const CategoryDuration = require('../models/CategoryDuration');
const WeeklyTest = require('../models/WeeklyTest');
const Topic = require('../models/Topic');

// GET /api/categories
exports.getCategories = async (req, res, next) => {
  try {
    const qCategories = await Question.distinct('category');
    let topicCategories = [];
    try {
      topicCategories = await Topic.distinct('category');
    } catch (e) {}
    const all = [...new Set([...qCategories, ...topicCategories])].filter(Boolean).sort();
    res.json(all);
  } catch (error) {
    next(error);
  }
};

// GET /api/topics
exports.getTopics = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const topics = await Question.distinct('topic', filter);
    res.json(topics);
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/details
exports.getCategoryDetails = async (req, res, next) => {
  try {
    const categories = await Question.distinct('category');
    const durations = await CategoryDuration.find();
    const durationMap = {};
    durations.forEach(d => {
      durationMap[d.category] = d.durationMinutes;
    });

    const categoryDetails = await Promise.all(
      categories.map(async (cat) => {
        const questionCount = await Question.countDocuments({ category: cat });
        return {
          category: cat,
          totalQuestions: questionCount,
          durationMinutes: durationMap[cat] || 30
        };
      })
    );

    res.json(categoryDetails);
  } catch (error) {
    next(error);
  }
};

// GET /api/exam
exports.getExamQuestions = async (req, res, next) => {
  try {
    const { category, topic, weeklyTestId, limit = 50 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (topic) filter.topic = topic;
    if (weeklyTestId) filter.weeklyTestId = weeklyTestId;

    let durationMinutes = 30;
    if (category) {
      const catConfig = await CategoryDuration.findOne({ category });
      if (catConfig) durationMinutes = catConfig.durationMinutes;
    }

    const questions = await Question.find(filter)
      .select('-correctAnswer -explanation')
      .limit(Number(limit));

    res.json({
      category: category || 'General',
      topic: topic || 'All Topics',
      durationMinutes,
      totalQuestions: questions.length,
      questions
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/results
exports.submitExamResult = async (req, res, next) => {
  try {
    const { answers, category, weeklyTestId, timeTaken = 0 } = req.body;

    const studentId = req.user ? req.user.id : req.body.studentId;
    if (!studentId) {
      return res.status(400).json({ message: 'Student identity is required' });
    }

    if (weeklyTestId) {
      const existing = await Result.findOne({ student: studentId, weeklyTestId });
      if (existing) {
        return res.status(400).json({ message: 'You have already submitted this Weekly Test. Re-attempts are not allowed.' });
      }
    }

    let answerMap = {};
    if (typeof answers === 'string') {
      try { answerMap = JSON.parse(answers); } catch (e) { answerMap = {}; }
    } else if (typeof answers === 'object') {
      answerMap = answers;
    }

    // Determine filter to fetch all questions for this exam
    const filter = {};
    if (weeklyTestId) {
      filter.weeklyTestId = weeklyTestId;
    } else if (category) {
      filter.category = category;
    }

    const allExamQuestions = await Question.find(filter);
    const totalCount = allExamQuestions.length > 0 ? allExamQuestions.length : Object.keys(answerMap).length;

    let correctCount = 0;

    allExamQuestions.forEach(q => {
      const submitted = answerMap[q._id.toString()];
      if (submitted && submitted.toString().trim().toUpperCase() === q.correctAnswer.trim().toUpperCase()) {
        correctCount++;
      }
    });

    const total = totalCount;
    const score = correctCount;
    const wrongCount = total - correctCount;

    let isPassed = false;
    if (weeklyTestId) {
      const weeklyTest = await WeeklyTest.findById(weeklyTestId);
      if (weeklyTest) {
        const passMark = weeklyTest.passMarks > 0
          ? weeklyTest.passMarks
          : Math.ceil(total * ((weeklyTest.passPercentage || 50) / 100));
        isPassed = score >= passMark;
      } else {
        isPassed = score >= Math.ceil(total * 0.5);
      }
    } else {
      isPassed = score >= Math.ceil(total * 0.5);
    }

    await Result.create({
      student: studentId,
      category: category || 'General',
      score,
      total,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      timeTaken,
      answersJson: JSON.stringify(answerMap),
      weeklyTestId: weeklyTestId || null,
      isPassed
    });

    // Business Rule 2: Student NEVER sees marks upon submission, only success status
    res.json({
      message: 'Test submitted successfully',
      status: 'SUCCESS'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/leaderboard
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { category, weeklyTestId } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (weeklyTestId) filter.weeklyTestId = weeklyTestId;

    const results = await Result.find(filter)
      .populate('student', 'name courseName')
      .sort({ score: -1, timeTaken: 1 })
      .limit(20);

    const leaderboard = results.map((r, index) => ({
      rank: index + 1,
      studentName: r.student ? r.student.name : 'Anonymous',
      courseName: r.student ? r.student.courseName : 'N/A',
      score: r.score,
      total: r.total,
      category: r.category,
      timeTaken: r.timeTaken,
      submittedAt: r.submittedAt
    }));

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};
