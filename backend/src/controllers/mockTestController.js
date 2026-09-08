const MockQuestion = require('../models/MockQuestion');
const MockResult = require('../models/MockResult');
const MockSettings = require('../models/MockSettings');
const StudentMockAccess = require('../models/StudentMockAccess');
const Student = require('../models/Student');
const { parseCsvQuestions } = require('../services/fileParserService');
const fs = require('fs');

// --- Admin Mock Operations ---

// GET /api/admin/mock/models
exports.getMockModels = async (req, res, next) => {
  try {
    const existingModels = await MockQuestion.distinct('modelSet');
    const studentAssigned = await Student.distinct('assignedMockModel');
    const defaultModels = [
      'Model 1', 'Model 2', 'Model 3', 'Model 4', 'Model 5',
      'Model 6', 'Model 7', 'Model 8', 'Model 9', 'Model 10'
    ];
    const allModels = [...new Set([...defaultModels, ...existingModels, ...studentAssigned])].filter(Boolean);
    res.json(allModels);
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/mock/questions/save-bulk
exports.saveBulkMockQuestions = async (req, res, next) => {
  try {
    const { questions, targetModelSet, replaceExisting } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Questions array is required' });
    }

    const modelName = targetModelSet || 'Model 1';

    // If replaceExisting is requested, remove old questions for this model
    if (replaceExisting === true || replaceExisting === 'true') {
      await MockQuestion.deleteMany({ modelSet: modelName });
    }

    const formatted = questions.map(q => ({
      ...q,
      modelSet: q.modelSet || modelName
    }));

    const inserted = await MockQuestion.insertMany(formatted);
    res.status(201).json({
      message: `${inserted.length} mock questions saved into ${modelName}`,
      questions: inserted,
      replaced: Boolean(replaceExisting)
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/mock/questions/upload-csv
exports.uploadMockQuestionsCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'CSV file is required' });
    }
    const targetModelSet = req.body.targetModelSet || 'Model 1';
    const replaceExisting = req.body.replaceExisting === true || req.body.replaceExisting === 'true';

    const records = parseCsvQuestions(req.file.path);
    if (!records || records.length === 0) {
      return res.status(400).json({ message: 'No valid questions could be parsed from the CSV file. Please check column headers.' });
    }

    const validQuestions = records.filter(r => r.questionText && r.optionA && r.optionB && r.optionC && r.optionD);
    if (validQuestions.length === 0) {
      return res.status(400).json({ message: 'No complete questions found. Each row must have question text and 4 options.' });
    }

    if (replaceExisting) {
      await MockQuestion.deleteMany({ modelSet: targetModelSet });
    }

    const questionsToInsert = validQuestions.map(r => ({
      questionText: r.questionText,
      optionA: r.optionA,
      optionB: r.optionB,
      optionC: r.optionC,
      optionD: r.optionD,
      correctAnswer: r.correctAnswer || 'A',
      category: r.category || 'Mock Test',
      topic: r.topic || 'General Aptitude',
      modelSet: r.modelSet && r.modelSet !== 'Model 1' ? r.modelSet : targetModelSet
    }));

    const inserted = await MockQuestion.insertMany(questionsToInsert);
    res.status(201).json({
      message: `${inserted.length} mock questions uploaded successfully into ${targetModelSet}`,
      count: inserted.length,
      inserted,
      replaced: replaceExisting
    });
  } catch (error) {
    next(error);
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
};

// POST /api/admin/mock/assign-student-model
exports.assignStudentMockModel = async (req, res, next) => {
  try {
    const { studentId, modelSet } = req.body;
    if (!studentId || !modelSet) {
      return res.status(400).json({ message: 'Student ID and modelSet are required' });
    }
    const student = await Student.findByIdAndUpdate(studentId, { assignedMockModel: modelSet }, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: `Assigned ${modelSet} to ${student.name} successfully`, student });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/mock/auto-distribute-models
exports.autoDistributeMockModels = async (req, res, next) => {
  try {
    const students = await Student.find({ status: 'ACTIVE' }).sort({ name: 1 });
    if (!students || students.length === 0) {
      return res.status(400).json({ message: 'No active students found' });
    }
    const models = ['Model 1', 'Model 2', 'Model 3', 'Model 4', 'Model 5', 'Model 6', 'Model 7', 'Model 8', 'Model 9', 'Model 10'];
    const bulkOps = students.map((st, idx) => ({
      updateOne: {
        filter: { _id: st._id },
        update: { assignedMockModel: models[idx % models.length] }
      }
    }));
    await Student.bulkWrite(bulkOps);
    res.json({ message: `Auto-distributed 10 Mock Models across ${students.length} students successfully!` });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/mock/models-stats
exports.getMockModelsStats = async (req, res, next) => {
  try {
    const models = ['Model 1', 'Model 2', 'Model 3', 'Model 4', 'Model 5', 'Model 6', 'Model 7', 'Model 8', 'Model 9', 'Model 10'];
    const stats = await Promise.all(models.map(async (m) => {
      const qCount = await MockQuestion.countDocuments({ modelSet: m });
      const sCount = await Student.countDocuments({ assignedMockModel: m });
      return { modelSet: m, questionCount: qCount, studentCount: sCount };
    }));
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/mock/questions
exports.getMockQuestions = async (req, res, next) => {
  try {
    const { modelSet } = req.query;
    const filter = {};
    if (modelSet) filter.modelSet = modelSet;

    const questions = await MockQuestion.find(filter).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/mock/questions/:id
exports.updateMockQuestion = async (req, res, next) => {
  try {
    const question = await MockQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) {
      return res.status(404).json({ message: 'Mock question not found' });
    }
    res.json(question);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/mock/questions/:id
exports.deleteMockQuestion = async (req, res, next) => {
  try {
    const question = await MockQuestion.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Mock question not found' });
    }
    res.json({ message: 'Mock question deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/mock/models/:modelSet/questions
exports.clearModelQuestions = async (req, res, next) => {
  try {
    const { modelSet } = req.params;
    const result = await MockQuestion.deleteMany({ modelSet });
    res.json({ message: `Deleted ${result.deletedCount} questions from ${modelSet}`, deletedCount: result.deletedCount });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/mock/settings
exports.getMockSettings = async (req, res, next) => {
  try {
    let settings = await MockSettings.findOne();
    if (!settings) {
      settings = await MockSettings.create({ passingMarks: 35, durationMinutes: 45 });
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// POST / PUT /api/admin/mock/settings
exports.updateMockSettings = async (req, res, next) => {
  try {
    const { passingMarks, durationMinutes } = req.body;
    let settings = await MockSettings.findOne();
    if (!settings) {
      settings = new MockSettings({ passingMarks, durationMinutes });
    } else {
      if (passingMarks !== undefined) settings.passingMarks = passingMarks;
      if (durationMinutes !== undefined) settings.durationMinutes = durationMinutes;
      settings.updatedAt = new Date();
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// POST / PUT /api/admin/students/mock-access
exports.setBulkMockAccess = async (req, res, next) => {
  try {
    const { accessList, studentIds, accessEnabled } = req.body;

    let updates = [];
    if (Array.isArray(accessList)) {
      updates = accessList;
    } else if (Array.isArray(studentIds) && accessEnabled !== undefined) {
      updates = studentIds.map(id => ({ studentId: id, accessEnabled }));
    } else {
      return res.status(400).json({ message: 'Provide accessList array or studentIds with accessEnabled' });
    }

    const operations = updates.map(item => ({
      updateOne: {
        filter: { studentId: item.studentId },
        update: { accessEnabled: item.accessEnabled, updatedAt: new Date() },
        upsert: true
      }
    }));

    await StudentMockAccess.bulkWrite(operations);

    const enabledIds = updates.filter(u => u.accessEnabled).map(u => u.studentId);
    const disabledIds = updates.filter(u => !u.accessEnabled).map(u => u.studentId);

    if (enabledIds.length > 0) {
      await Student.updateMany({ _id: { $in: enabledIds } }, { mockTestAllowed: true });
    }
    if (disabledIds.length > 0) {
      await Student.updateMany({ _id: { $in: disabledIds } }, { mockTestAllowed: false });
    }

    res.json({ message: 'Mock test access updated for students successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/mock/access
exports.getMockAccessList = async (req, res, next) => {
  try {
    const accessRecords = await StudentMockAccess.find().populate('studentId', 'name email courseName status');
    res.json(accessRecords);
  } catch (error) {
    next(error);
  }
};

// --- Student Mock Operations ---

// GET /api/student/mock/access
exports.checkStudentMockAccess = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const accessRecord = await StudentMockAccess.findOne({ studentId });
    const isAllowed = accessRecord ? accessRecord.accessEnabled : false;

    res.json({
      studentId,
      accessEnabled: isAllowed
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/student/mock/exam
exports.getStudentMockExam = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // ── Block Re-Attempt ──────────────────────────────────────
    const alreadySubmitted = await MockResult.findOne({ student: studentId });
    if (alreadySubmitted) {
      return res.status(403).json({
        message: 'You have already completed the mock test. Only one attempt is allowed.',
        alreadyAttempted: true,
        result: {
          score: alreadySubmitted.score,
          total: alreadySubmitted.total,
          passStatus: alreadySubmitted.passStatus,
          submittedAt: alreadySubmitted.submittedAt,
        }
      });
    }

    const accessRecord = await StudentMockAccess.findOne({ studentId });
    if (!accessRecord || !accessRecord.accessEnabled) {
      return res.status(403).json({ message: 'Mock test access is not enabled for your account. Please contact administrator.' });
    }

    let settings = await MockSettings.findOne();
    if (!settings) {
      settings = { passingMarks: 35, durationMinutes: 45 };
    }

    const student = await Student.findById(studentId);
    const assignedModel = student?.assignedMockModel || 'Model 1';

    let questions = await MockQuestion.find({ modelSet: assignedModel }).select('-correctAnswer');
    if (!questions || questions.length === 0) {
      questions = await MockQuestion.find().select('-correctAnswer');
    }

    res.json({
      title: `Official Aptitude Mock Test (${assignedModel})`,
      assignedModel,
      durationMinutes: settings.durationMinutes,
      totalQuestions: questions.length,
      autoStart: false,
      questions
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/student/mock/submit
exports.submitStudentMockExam = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const accessRecord = await StudentMockAccess.findOne({ studentId });
    if (!accessRecord || !accessRecord.accessEnabled) {
      return res.status(403).json({ message: 'Mock test access denied' });
    }

    const { answers, timeTaken = 0 } = req.body;
    let answerMap = {};
    if (typeof answers === 'string') {
      try { answerMap = JSON.parse(answers); } catch (e) { answerMap = {}; }
    } else if (typeof answers === 'object') {
      answerMap = answers;
    }

    const student = await Student.findById(studentId);
    const assignedModel = student?.assignedMockModel || 'Model 1';
    const allMockQuestions = await MockQuestion.find({ modelSet: assignedModel });
    const allQuestions = allMockQuestions.length > 0 ? allMockQuestions : await MockQuestion.find();

    let correctCount = 0;
    allQuestions.forEach(q => {
      const submitted = answerMap[q._id.toString()];
      if (submitted && submitted.toString().trim().toUpperCase() === (q.correctAnswer || '').trim().toUpperCase()) {
        correctCount++;
      }
    });

    const total = allQuestions.length > 0 ? allQuestions.length : Object.keys(answerMap).length;
    const score = correctCount;
    const wrongCount = total - correctCount;
    const percentage = total > 0 ? (score / total) * 100 : 0;

    let settings = await MockSettings.findOne();
    const passingMarks = settings ? settings.passingMarks : 35;
    const passStatus = (score >= passingMarks || percentage >= 35) ? 'PASS' : 'FAIL';

    await MockResult.create({
      student: studentId,
      score,
      total,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      passStatus,
      passed: passStatus === 'PASS',
      percentage: Math.round(percentage * 100) / 100,
      timeTaken,
      answersJson: JSON.stringify(answerMap)
    });

    // Business Rule 2: Student is redirected to Home, NO score shown to student
    res.json({
      message: 'Mock test submitted successfully',
      status: 'SUCCESS'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/student/mock/result  (Admin only)
exports.getMockResultsAdmin = async (req, res, next) => {
  try {
    const results = await MockResult.find()
      .populate('student', 'name email courseName trainerName phone assignedMockModel')
      .sort({ submittedAt: -1 });

    res.json(results);
  } catch (error) {
    next(error);
  }
};

// GET /api/student/mock/check-attempted  (Student: check if already attempted)
exports.checkStudentAttempted = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const result = await MockResult.findOne({ student: studentId });
    res.json({
      alreadyAttempted: !!result,
      result: result || null
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/mock/results/:id/details
exports.getMockResultDetails = async (req, res, next) => {
  try {
    const result = await MockResult.findById(req.params.id)
      .populate('student', 'name email courseName trainerName assignedMockModel');

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
          category: 'Official Mock Test',
          submittedAt: result.submittedAt,
          correctAnswers: result.correctAnswers,
          wrongAnswers: result.wrongAnswers,
          passStatus: result.passStatus,
          isPassed: result.isPassed
        },
        canViewMistakes: false,
        msUntilReviewUnlock,
        unlockAt: new Date(submissionTime + TWENTY_FOUR_HOURS_MS).toISOString(),
        message: 'Detailed answer explanations and mistakes will unlock 24 hours after test submission to maintain exam integrity.'
      });
    }

    let parsedAnswers = {};
    if (result.answersJson) {
      try {
        parsedAnswers = JSON.parse(result.answersJson);
      } catch (e) {
        parsedAnswers = {};
      }
    }

    const assignedModel = result.student?.assignedMockModel || 'Model 1';
    let questions = await MockQuestion.find({ modelSet: assignedModel });

    if (!questions || questions.length === 0) {
      const questionIds = Object.keys(parsedAnswers);
      if (questionIds.length > 0) {
        questions = await MockQuestion.find({ _id: { $in: questionIds } });
      } else {
        questions = await MockQuestion.find();
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
