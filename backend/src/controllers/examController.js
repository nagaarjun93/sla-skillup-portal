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
    const qCategories = await Question.distinct('category');
    const qTopics = await Question.distinct('topic');
    let topicNames = [];
    try {
      topicNames = (await Topic.find().select('name category')).flatMap(t => [t.name, t.category]);
    } catch (e) {}

    const allDistinct = [...new Set([...qCategories, ...qTopics, ...topicNames])]
      .filter(Boolean)
      .filter(name => !/[\!\@\#\$\%\^\&\*\(\)\_\+\<\>\?\:\;\'\`\~\\\/]{4,}/.test(name) && name.length >= 2 && name !== '&f');

    const durations = await CategoryDuration.find();
    const durationMap = {};
    durations.forEach(d => {
      durationMap[d.category] = d.durationMinutes;
    });

    const categoryDetails = await Promise.all(
      allDistinct.map(async (name) => {
        const clean = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
        const regex = new RegExp(`^${clean}$`, 'i');
        const questionCount = await Question.countDocuments({
          $or: [{ category: regex }, { topic: regex }]
        });
        return {
          category: name,
          name,
          totalQuestions: questionCount,
          durationMinutes: durationMap[name] || 30
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
    const { category, topic, title, weeklyTestId, limit = 100, practice } = req.query;
    const filter = {};
    if (weeklyTestId) filter.weeklyTestId = weeklyTestId;

    // Resolve target search subject/topic
    const searchTarget = topic || title || (category && !['General', 'All Topics'].includes(category) ? category : null);

    if (searchTarget && searchTarget !== 'General' && searchTarget !== 'All Topics') {
      const clean = searchTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
      const regex = new RegExp(`^${clean}$`, 'i');
      filter.$or = [
        { topic: regex },
        { category: regex }
      ];
    } else if (category && category !== 'General' && category !== 'All Topics') {
      const cleanCat = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
      filter.$or = [
        { category: new RegExp(`^${cleanCat}$`, 'i') },
        { topic: new RegExp(`^${cleanCat}$`, 'i') }
      ];
    }

    let durationMinutes = 30;
    if (searchTarget) {
      const clean = searchTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
      const catConfig = await CategoryDuration.findOne({
        category: new RegExp(`^${clean}$`, 'i')
      });
      if (catConfig) durationMinutes = catConfig.durationMinutes;
    }

    let query = Question.find(filter).limit(Number(limit));
    if (practice === 'true' || practice === true) {
      // In practice mode (Paper & Pen practice), allow viewing answers and explanations
    } else {
      query = query.select('-correctAnswer -explanation');
    }

    const questions = await query;

    res.json({
      category: category || searchTarget || 'General',
      topic: topic || searchTarget || 'All Topics',
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
    const { weeklyTestId } = req.query;
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;
    const isAdmin = userRole === 'admin';

    // 1. Resolve which Weekly Test this leaderboard is for
    let targetWeeklyTest = null;
    if (weeklyTestId) {
      targetWeeklyTest = await WeeklyTest.findById(weeklyTestId);
    } else {
      // Find active weekly test, or if none active, the most recently created weekly test
      const now = new Date();
      targetWeeklyTest = await WeeklyTest.findOne({
        active: true,
        $or: [
          { startTime: { $exists: false } },
          { startTime: null },
          { startTime: { $lte: now } }
        ]
      }).sort({ createdAt: -1 });

      if (!targetWeeklyTest) {
        targetWeeklyTest = await WeeklyTest.findOne().sort({ createdAt: -1 });
      }
    }

    if (!targetWeeklyTest) {
      return res.json({
        status: 'EMPTY',
        canViewRanking: false,
        message: 'No weekly tests found.',
        leaderboard: []
      });
    }

    const testTitle = targetWeeklyTest.title || targetWeeklyTest.weekName || `Week ${targetWeeklyTest.weekNumber || 1} Test`;

    // 2. Strict Filter: ONLY official weekly test results (EXCLUDE topic practice!)
    const filter = { weeklyTestId: targetWeeklyTest._id };

    // 3. For students: Check submission & 24-hour lock rule
    if (!isAdmin && userId) {
      const studentResult = await Result.findOne({
        student: userId,
        weeklyTestId: targetWeeklyTest._id
      });

      if (!studentResult) {
        return res.json({
          status: 'NOT_ATTEMPTED',
          canViewRanking: false,
          testTitle,
          testId: targetWeeklyTest._id,
          topic: targetWeeklyTest.topic,
          message: 'You must complete this Weekly Test first to view rankings.'
        });
      }

      // Check 24 hours lock from student's submission time
      const submissionTime = new Date(studentResult.submittedAt).getTime();
      const now = Date.now();
      const msPassed = now - submissionTime;
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

      if (msPassed < TWENTY_FOUR_HOURS_MS) {
        const msUntilUnlock = TWENTY_FOUR_HOURS_MS - msPassed;
        return res.json({
          status: 'LOCKED',
          canViewRanking: false,
          testTitle,
          testId: targetWeeklyTest._id,
          topic: targetWeeklyTest.topic,
          msUntilUnlock,
          unlockAt: new Date(submissionTime + TWENTY_FOUR_HOURS_MS).toISOString(),
          message: 'Weekly Test rankings unlock 24 hours after your test submission.'
        });
      }
    }

    // 4. Fetch all participants for this weekly test sorted by score DESC and timeTaken ASC
    const allResults = await Result.find(filter)
      .populate('student', 'name courseName')
      .sort({ score: -1, timeTaken: 1 });

    const totalParticipants = allResults.length;
    let userRank = null;

    const leaderboard = allResults.slice(0, 50).map((r, index) => {
      const rank = index + 1;
      const isCurrentUser = userId && r.student && r.student._id.toString() === userId.toString();
      if (isCurrentUser) {
        userRank = rank;
      }
      return {
        rank,
        studentId: r.student ? r.student._id : null,
        studentName: r.student ? r.student.name : 'Anonymous',
        courseName: r.student ? r.student.courseName : 'N/A',
        score: r.score,
        total: r.total,
        category: r.category,
        timeTaken: r.timeTaken,
        submittedAt: r.submittedAt,
        isCurrentUser
      };
    });

    // If student rank was beyond top 50, calculate exact rank
    if (userId && !userRank) {
      const idx = allResults.findIndex(r => r.student && r.student._id.toString() === userId.toString());
      if (idx !== -1) {
        userRank = idx + 1;
      }
    }

    res.json({
      status: 'UNLOCKED',
      canViewRanking: true,
      testTitle,
      testId: targetWeeklyTest._id,
      topic: targetWeeklyTest.topic,
      userRank,
      totalParticipants,
      leaderboard
    });
  } catch (error) {
    next(error);
  }
};

