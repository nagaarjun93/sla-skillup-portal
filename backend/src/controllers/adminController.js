const Question = require('../models/Question');
const Result = require('../models/Result');
const Student = require('../models/Student');
const WeeklyTest = require('../models/WeeklyTest');
const StudentMockAccess = require('../models/StudentMockAccess');
const { parseCsvQuestions, parseTextQuestions } = require('../services/fileParserService');
const fs = require('fs');

// --- Question Management ---

// GET /api/admin/questions
exports.getAllQuestions = async (req, res, next) => {
  try {
    const { category, topic, weeklyTestId } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (topic) filter.topic = topic;
    if (weeklyTestId) filter.weeklyTestId = weeklyTestId;

    const questions = await Question.find(filter).populate('weeklyTestId', 'title weekName').sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/questions/:id
exports.getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/questions/manual
exports.addQuestionManual = async (req, res, next) => {
  try {
    const { questionText, optionA, optionB, optionC, optionD, correctAnswer, category, topic, difficultyLevel, explanation, weeklyTestId } = req.body;

    if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !category) {
      return res.status(400).json({ message: 'Question text, 4 options, correct answer, and category are required' });
    }

    const question = await Question.create({
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      category,
      topic,
      difficultyLevel,
      explanation,
      weeklyTestId: weeklyTestId || null
    });

    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/questions/upload-file
exports.uploadQuestionFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { questionText, optionA, optionB, optionC, optionD, correctAnswer, category, topic, difficultyLevel, explanation, weeklyTestId } = req.body;

    const question = await Question.create({
      questionText: questionText || req.file.originalname,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      category: category || 'General',
      topic,
      filePath: req.file.path,
      difficultyLevel,
      explanation,
      weeklyTestId: weeklyTestId || null
    });

    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/questions/upload-csv
exports.uploadQuestionsCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'CSV file is required' });
    }

    const { weeklyTestId, category, topic } = req.body;
    const rawQuestions = parseCsvQuestions(req.file.path);

    if (!rawQuestions || rawQuestions.length === 0) {
      return res.status(400).json({ message: 'No valid questions could be parsed from the CSV file. Please check column headers and content.' });
    }

    let fallbackCategory = category || 'General';
    let fallbackTopic = topic || 'General';
    if (weeklyTestId) {
      const targetWeekly = await WeeklyTest.findById(weeklyTestId);
      if (targetWeekly) {
        fallbackTopic = targetWeekly.topic || fallbackTopic;
      }
    }

    const questionsToInsert = rawQuestions.map(q => ({
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer || 'A',
      category: q.category && q.category !== 'General' ? q.category : fallbackCategory,
      topic: q.topic && q.topic !== 'General' ? q.topic : fallbackTopic,
      difficultyLevel: q.difficultyLevel || 'Medium',
      explanation: q.explanation || '',
      weeklyTestId: weeklyTestId || null
    }));

    const inserted = await Question.insertMany(questionsToInsert);

    if (weeklyTestId) {
      const count = await Question.countDocuments({ weeklyTestId });
      // Deactivate older tests and activate target test so student app immediately receives it
      await WeeklyTest.updateMany({ _id: { $ne: weeklyTestId } }, { active: false });
      await WeeklyTest.findByIdAndUpdate(weeklyTestId, {
        totalQuestions: count,
        active: true,
        startTime: null
      });
    }

    res.status(201).json({
      message: `${inserted.length} questions uploaded successfully`,
      count: inserted.length,
      inserted
    });
  } catch (error) {
    next(error);
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
};

// POST /api/admin/questions/parse-file
exports.parseQuestionsFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required for parsing' });
    }

    let parsedQuestions = [];
    if (req.file.originalname.endsWith('.csv')) {
      parsedQuestions = parseCsvQuestions(req.file.path);
    } else {
      parsedQuestions = parseTextQuestions(req.file.path);
    }

    res.json({ message: 'File parsed successfully', preview: parsedQuestions });
  } catch (error) {
    next(error);
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
};

// POST /api/admin/questions/save-bulk
exports.saveBulkQuestions = async (req, res, next) => {
  try {
    const { questions, weeklyTestId, category, topic } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Questions array is required' });
    }

    const validQuestions = questions.filter(q => q.questionText && q.optionA && q.optionB && q.optionC && q.optionD);
    if (validQuestions.length === 0) {
      return res.status(400).json({ message: 'No valid questions found. Each question must have question text and 4 options.' });
    }

    let fallbackTopic = topic || 'General';
    let fallbackCategory = category || 'General';
    const targetWeeklyId = weeklyTestId || (questions[0] && questions[0].weeklyTestId);
    if (targetWeeklyId) {
      const targetWeekly = await WeeklyTest.findById(targetWeeklyId);
      if (targetWeekly) {
        fallbackTopic = targetWeekly.topic || fallbackTopic;
      }
    }

    const questionsToInsert = validQuestions.map(q => ({
      ...q,
      correctAnswer: (q.correctAnswer || 'A').toUpperCase(),
      category: q.category && q.category !== 'General' ? q.category : fallbackCategory,
      topic: q.topic && q.topic !== 'General' ? q.topic : fallbackTopic,
      weeklyTestId: q.weeklyTestId || targetWeeklyId || null
    }));

    const inserted = await Question.insertMany(questionsToInsert);

    if (targetWeeklyId) {
      const count = await Question.countDocuments({ weeklyTestId: targetWeeklyId });
      await WeeklyTest.updateMany({ _id: { $ne: targetWeeklyId } }, { active: false });
      await WeeklyTest.findByIdAndUpdate(targetWeeklyId, {
        totalQuestions: count,
        active: true,
        startTime: null
      });
    }

    res.status(201).json({ message: `${inserted.length} questions saved`, count: inserted.length, questions: inserted });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/questions/:id
exports.updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/questions/:id
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- Results Management ---

// GET /api/admin/results
exports.getResults = async (req, res, next) => {
  try {
    const { weeklyTestId, topic } = req.query;
    let filter = {};

    if (weeklyTestId) {
      filter.weeklyTestId = weeklyTestId;
    }

    if (topic && topic !== 'all') {
      const matchingTests = await WeeklyTest.find({ topic: { $regex: new RegExp(topic, 'i') } }).select('_id');
      const testIds = matchingTests.map(t => t._id);
      filter.$or = [
        { category: { $regex: new RegExp(topic, 'i') } },
        { weeklyTestId: { $in: testIds } }
      ];
    }

    const results = await Result.find(filter)
      .populate('student', 'name email phone courseName trainerName')
      .populate('weeklyTestId', 'title weekName weekNumber topic passMarks passPercentage totalQuestions')
      .sort({ submittedAt: -1 });

    res.json(results);
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/results/not-attempted
exports.getNotAttemptedStudents = async (req, res, next) => {
  try {
    const { weeklyTestId } = req.query;
    let targetTestId = weeklyTestId;

    if (!targetTestId) {
      const activeTest = await WeeklyTest.findOne({ active: true }).sort({ createdAt: -1 });
      if (activeTest) {
        targetTestId = activeTest._id;
      } else {
        const latestTest = await WeeklyTest.findOne().sort({ createdAt: -1 });
        if (latestTest) targetTestId = latestTest._id;
      }
    }

    if (!targetTestId) {
      return res.json([]);
    }

    const attemptedStudentIds = await Result.distinct('student', { weeklyTestId: targetTestId });
    const notAttempted = await Student.find({
      _id: { $nin: attemptedStudentIds },
      status: 'ACTIVE'
    }).select('name email phone courseName trainerName registerDate');

    res.json(notAttempted);
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/results/:id/mark
exports.markResult = async (req, res, next) => {
  try {
    const { score, total, correctAnswers, wrongAnswers } = req.body;
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    if (score !== undefined) result.score = score;
    if (total !== undefined) result.total = total;
    if (correctAnswers !== undefined) result.correctAnswers = correctAnswers;
    if (wrongAnswers !== undefined) result.wrongAnswers = wrongAnswers;
    result.marked = true;

    await result.save();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/results/:id/details
exports.getResultDetails = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('student', 'name email courseName trainerName')
      .populate('weeklyTestId');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // ── 24-Hour Review Lock Rule ──────────────────────────────────
    const now = Date.now();
    const submissionTime = new Date(result.submittedAt).getTime();
    const msSinceSubmission = now - submissionTime;
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const isStudent = req.user && req.user.role === 'student';
    const canViewMistakes = !isStudent || (msSinceSubmission >= TWENTY_FOUR_HOURS_MS);
    const msUntilReviewUnlock = Math.max(0, TWENTY_FOUR_HOURS_MS - msSinceSubmission);

    if (!canViewMistakes) {
      return res.json({
        result: {
          _id: result._id,
          score: result.score,
          total: result.total,
          category: result.category,
          submittedAt: result.submittedAt,
          correctAnswers: result.correctAnswers,
          wrongAnswers: result.wrongAnswers,
          weeklyTestId: result.weeklyTestId,
          isPassed: result.isPassed
        },
        canViewMistakes: false,
        msUntilReviewUnlock,
        unlockAt: new Date(submissionTime + TWENTY_FOUR_HOURS_MS).toISOString(),
        message: 'Detailed answer explanations and mistakes will unlock 24 hours after submission to maintain exam integrity.'
      });
    }
    if (result.answersJson) {
      try {
        parsedAnswers = JSON.parse(result.answersJson);
      } catch (e) {
        parsedAnswers = {};
      }
    }

    let questions = [];
    if (result.weeklyTestId) {
      const wId = result.weeklyTestId._id || result.weeklyTestId;
      questions = await Question.find({ weeklyTestId: wId });
    }

    if (!questions || questions.length === 0) {
      if (result.category) {
        const catQuestions = await Question.find({ category: result.category });
        const questionIds = Object.keys(parsedAnswers);
        if (result.total && catQuestions.length > result.total) {
          if (questionIds.length > 0) {
            const answeredQs = await Question.find({ _id: { $in: questionIds } });
            const answeredIds = new Set(answeredQs.map(q => q._id.toString()));
            const remaining = catQuestions.filter(q => !answeredIds.has(q._id.toString())).slice(0, Math.max(0, result.total - answeredQs.length));
            questions = [...answeredQs, ...remaining];
          } else {
            questions = catQuestions.slice(0, result.total);
          }
        } else {
          questions = catQuestions;
        }
      }
    }

    if (!questions || questions.length === 0) {
      const questionIds = Object.keys(parsedAnswers);
      if (questionIds.length > 0) {
        questions = await Question.find({ _id: { $in: questionIds } });
      }
    }

    res.json({
      result,
      submittedAnswers: parsedAnswers,
      questions,
      canViewMistakes: true
    });
  } catch (error) {
    next(error);
  }
};

// --- Student Management ---

// GET /api/admin/students
exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find().select('-password').sort({ registerDate: -1 });
    res.json(students);
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/students/management
exports.getStudentManagement = async (req, res, next) => {
  try {
    const students = await Student.find().select('-password').sort({ registerDate: -1 });
    const accessRecords = await StudentMockAccess.find();
    const accessMap = {};
    accessRecords.forEach(a => {
      accessMap[a.studentId.toString()] = a.accessEnabled;
    });

    const studentList = students.map(s => ({
      ...s.toObject(),
      mockTestAccess: accessMap[s._id.toString()] || false
    }));

    res.json(studentList);
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/students/:id/details
exports.getStudentDetails = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const results = await Result.find({ student: student._id }).populate('weeklyTestId');
    const mockAccess = await StudentMockAccess.findOne({ studentId: student._id });

    res.json({
      student,
      results,
      mockAccess: mockAccess ? mockAccess.accessEnabled : false
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/students/:id/status
exports.updateStudentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE' });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
};
