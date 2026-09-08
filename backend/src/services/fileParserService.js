const { parse } = require('csv-parse/sync');
const fs = require('fs');

const sanitizeKey = (k) => {
  if (!k) return '';
  return String(k).replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s_-]+/g, '');
};

const sanitizeAnswer = (ans, optA, optB, optC, optD) => {
  if (!ans) return 'A';
  const clean = String(ans).trim().toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(clean)) return clean;
  if (clean.startsWith('OPTION ') || clean.startsWith('OPTION_') || clean.startsWith('OPT ')) {
    const letter = clean.slice(-1);
    if (['A', 'B', 'C', 'D'].includes(letter)) return letter;
  }
  if (clean === '1') return 'A';
  if (clean === '2') return 'B';
  if (clean === '3') return 'C';
  if (clean === '4') return 'D';
  
  // If the answer is the literal option text itself (e.g. '625')
  const raw = String(ans).trim().toLowerCase();
  if (optA && String(optA).trim().toLowerCase() === raw) return 'A';
  if (optB && String(optB).trim().toLowerCase() === raw) return 'B';
  if (optC && String(optC).trim().toLowerCase() === raw) return 'C';
  if (optD && String(optD).trim().toLowerCase() === raw) return 'D';
  
  return 'A';
};

const parseCsvString = (content) => {
  if (!content || !content.trim()) return [];

  let rows = [];
  try {
    rows = parse(content, {
      bom: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true
    });
  } catch (err) {
    // Fallback: line-by-line quote-aware split if csv-parse encounters malformed syntax
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    rows = lines.map(line => {
      const parts = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
          else { inQ = !inQ; }
        } else if (ch === ',' && !inQ) {
          parts.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      parts.push(cur.trim());
      return parts;
    });
  }

  if (!rows || rows.length === 0) return [];

  // Check if first row is a header row
  const firstRow = rows[0];
  const firstRowNormalized = firstRow.map(c => sanitizeKey(String(c)));
  const hasQuestionHeader = firstRowNormalized.some(k => 
    k.includes('question') || k === 'qtext' || k === 'q' || k === 'questions'
  );

  let headerMap = null;
  let dataRows = rows;

  if (hasQuestionHeader) {
    headerMap = {};
    firstRowNormalized.forEach((k, idx) => {
      if (k.includes('question') || k === 'qtext' || k === 'q' || k === 'questions') headerMap.questionText = idx;
      else if (k === 'optiona' || k === 'option1' || k === 'a' || k === 'opta') headerMap.optionA = idx;
      else if (k === 'optionb' || k === 'option2' || k === 'b' || k === 'optb') headerMap.optionB = idx;
      else if (k === 'optionc' || k === 'option3' || k === 'c' || k === 'optc') headerMap.optionC = idx;
      else if (k === 'optiond' || k === 'option4' || k === 'd' || k === 'optd') headerMap.optionD = idx;
      else if (k.includes('correct') || k.includes('answer') || k === 'ans' || k === 'key') headerMap.correctAnswer = idx;
      else if (k.includes('category')) headerMap.category = idx;
      else if (k.includes('topic')) headerMap.topic = idx;
      else if (k.includes('explain') || k.includes('solution') || k.includes('reason')) headerMap.explanation = idx;
      else if (k.includes('model')) headerMap.modelSet = idx;
      else if (k.includes('difficulty') || k.includes('level')) headerMap.difficultyLevel = idx;
    });
    dataRows = rows.slice(1);
  }

  const results = [];

  for (const row of dataRows) {
    if (!Array.isArray(row) || row.length < 5) continue;

    let qText = '', optA = '', optB = '', optC = '', optD = '', rawAns = '', cat = 'General', top = 'General', expl = '', mod = 'Model 1', diff = 'Medium';

    if (headerMap && headerMap.questionText !== undefined) {
      qText = row[headerMap.questionText] || '';
      optA = headerMap.optionA !== undefined ? row[headerMap.optionA] || '' : '';
      optB = headerMap.optionB !== undefined ? row[headerMap.optionB] || '' : '';
      optC = headerMap.optionC !== undefined ? row[headerMap.optionC] || '' : '';
      optD = headerMap.optionD !== undefined ? row[headerMap.optionD] || '' : '';
      rawAns = headerMap.correctAnswer !== undefined ? row[headerMap.correctAnswer] || 'A' : 'A';
      cat = headerMap.category !== undefined ? row[headerMap.category] || 'General' : 'General';
      top = headerMap.topic !== undefined ? row[headerMap.topic] || 'General' : 'General';
      expl = headerMap.explanation !== undefined ? row[headerMap.explanation] || '' : '';
      mod = headerMap.modelSet !== undefined ? row[headerMap.modelSet] || 'Model 1' : 'Model 1';
      diff = headerMap.difficultyLevel !== undefined ? row[headerMap.difficultyLevel] || 'Medium' : 'Medium';
    } else {
      // Positional inference when no header
      qText = row[0] || '';

      // Check if format has category & topic in cols 1 & 2:
      // Question, Category, Topic, OptionA, OptionB, OptionC, OptionD, Answer, (Explanation)
      if (row.length >= 8 && ['A','B','C','D','a','b','c','d','1','2','3','4'].includes(String(row[7]).trim())) {
        cat = row[1] || 'General';
        top = row[2] || 'General';
        optA = row[3] || '';
        optB = row[4] || '';
        optC = row[5] || '';
        optD = row[6] || '';
        rawAns = row[7] || 'A';
        expl = row[8] || '';
      } else {
        // Standard: Question, OptionA, OptionB, OptionC, OptionD, Answer, Category, Topic, Model
        optA = row[1] || '';
        optB = row[2] || '';
        optC = row[3] || '';
        optD = row[4] || '';
        rawAns = row[5] || 'A';
        cat = row[6] || 'General';
        top = row[7] || 'General';
        mod = row[8] || 'Model 1';
      }
    }

    if (!qText || !String(qText).trim()) continue;

    const cleanAns = sanitizeAnswer(rawAns, optA, optB, optC, optD);

    results.push({
      questionText: String(qText).trim(),
      optionA: String(optA).trim(),
      optionB: String(optB).trim(),
      optionC: String(optC).trim(),
      optionD: String(optD).trim(),
      correctAnswer: cleanAns,
      category: String(cat).trim() || 'General',
      topic: String(top).trim() || 'General',
      explanation: String(expl).trim(),
      modelSet: String(mod).trim() || 'Model 1',
      difficultyLevel: String(diff).trim() || 'Medium'
    });
  }

  return results;
};

const parseCsvQuestions = (filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return parseCsvString(fileContent);
};

const parseTextQuestions = (filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return parseCsvString(fileContent);
};

module.exports = {
  parseCsvQuestions,
  parseCsvString,
  parseTextQuestions
};
