const WeeklyTest = require('../models/WeeklyTest');
const Question = require('../models/Question');
const Result = require('../models/Result');

// POST /api/admin/weekly
exports.createWeeklyTest = async (req, res, next) => {
  try {
    const { weekNumber, title, weekName, topic, description, totalQuestions, duration, startTime, endTime, active, passMarks, passPercentage } = req.body;

    if (!weekName || !topic || !duration) {
      return res.status(400).json({ message: 'weekName, topic, and duration are required' });
    }

    const test = await WeeklyTest.create({
      weekNumber,
      title,
      weekName,
      topic,
      description,
      totalQuestions: totalQuestions || 0,
      duration,
      startTime,
      endTime,
      active: active !== undefined ? active : true,
      passMarks: passMarks !== undefined ? Number(passMarks) : 0,
      passPercentage: passPercentage !== undefined ? Number(passPercentage) : 50
    });

    res.status(201).json(test);
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/weekly/:id
exports.updateWeeklyTest = async (req, res, next) => {
  try {
    const test = await WeeklyTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!test) {
      return res.status(404).json({ message: 'Weekly test not found' });
    }
    res.json(test);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/weekly/:id
exports.deleteWeeklyTest = async (req, res, next) => {
  try {
    const test = await WeeklyTest.findByIdAndDelete(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Weekly test not found' });
    }
    await Question.updateMany({ weeklyTestId: req.params.id }, { weeklyTestId: null });
    res.json({ message: 'Weekly test deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/weekly/:id/questions
exports.addQuestionsToWeeklyTest = async (req, res, next) => {
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds)) {
      return res.status(400).json({ message: 'questionIds array is required' });
    }

    const test = await WeeklyTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Weekly test not found' });
    }

    await Question.updateMany(
      { _id: { $in: questionIds } },
      { weeklyTestId: test._id }
    );

    const questionCount = await Question.countDocuments({ weeklyTestId: test._id });
    test.totalQuestions = questionCount;
    await test.save();

    res.json({ message: `${questionIds.length} questions attached to weekly test`, test });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/weekly
exports.getAllWeeklyTestsAdmin = async (req, res, next) => {
  try {
    const tests = await WeeklyTest.find().sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    next(error);
  }
};

// GET /api/student/weekly/active and GET /api/student/weekly/current
exports.getActiveWeeklyTest = async (req, res, next) => {
  try {
    const now = new Date();
    const activeTest = await WeeklyTest.findOne({
      active: true,
      $or: [
        { startTime: { $exists: false } },
        { startTime: null },
        { startTime: { $lte: now } }
      ]
    }).sort({ createdAt: -1 });

    if (!activeTest) {
      return res.status(404).json({ message: 'No active weekly test found currently' });
    }

    const questions = await Question.find({ weeklyTestId: activeTest._id }).select('-correctAnswer -explanation');

    let alreadyAttempted = false;
    let attemptedAt = null;

    if (req.user && req.user.id) {
      const existingResult = await Result.findOne({ student: req.user.id, weeklyTestId: activeTest._id });
      if (existingResult) {
        alreadyAttempted = true;
        attemptedAt = existingResult.submittedAt;
      }
    }

    res.json({
      test: {
        ...activeTest.toObject(),
        alreadyAttempted,
        attemptedAt
      },
      alreadyAttempted,
      totalQuestions: questions.length,
      questions
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/student/weekly/history
exports.getStudentWeeklyHistory = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const results = await Result.find({
      student: studentId
    }).populate('weeklyTestId', 'title weekName weekNumber topic').sort({ submittedAt: -1 });

    res.json(results);
  } catch (error) {
    next(error);
  }
};
