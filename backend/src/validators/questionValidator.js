const validateQuestionManual = (req, res, next) => {
  const { questionText, optionA, optionB, optionC, optionD, correctAnswer, category } = req.body;

  if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !category) {
    return res.status(400).json({
      message: 'Question text, 4 options (optionA, optionB, optionC, optionD), correct answer, and category are required'
    });
  }
  next();
};

const validateBulkQuestions = (req, res, next) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Questions array is required and cannot be empty' });
  }
  next();
};

module.exports = {
  validateQuestionManual,
  validateBulkQuestions
};
