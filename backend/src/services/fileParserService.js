const { parse } = require('csv-parse/sync');
const fs = require('fs');

const sanitizeKey = (k) => {
  if (!k) return '';
  return String(k).replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s_\-.]+/g, '');
};

const sanitizeAnswer = (ans, optA, optB, optC, optD) => {
  if (!ans) return 'A';
  const clean = String(ans).trim().toUpperCase().replace(/["']/g, '');
  if (['A', 'B', 'C', 'D'].includes(clean)) return clean;
  if (clean.startsWith('OPTION') || clean.startsWith('OPT') || clean.startsWith('CHOICE')) {
    const letter = clean.replace(/[^ABCD1234]/g, '').slice(-1);
    if (['A', 'B', 'C', 'D'].includes(letter)) return letter;
    if (letter === '1') return 'A';
    if (letter === '2') return 'B';
    if (letter === '3') return 'C';
    if (letter === '4') return 'D';
  }
  if (clean === '1') return 'A';
  if (clean === '2') return 'B';
  if (clean === '3') return 'C';
  if (clean === '4') return 'D';

  // If the answer is the literal option text itself (e.g. '30' or 'extends')
  const raw = String(ans).trim().toLowerCase().replace(/["']/g, '');
  if (optA && String(optA).trim().toLowerCase().replace(/["']/g, '') === raw) return 'A';
  if (optB && String(optB).trim().toLowerCase().replace(/["']/g, '') === raw) return 'B';
  if (optC && String(optC).trim().toLowerCase().replace(/["']/g, '') === raw) return 'C';
  if (optD && String(optD).trim().toLowerCase().replace(/["']/g, '') === raw) return 'D';

  return 'A';
};

const parseCsvString = (content) => {
  if (!content || !content.trim()) return [];

  // Remove potential BOM
  let cleanContent = content.replace(/^\uFEFF/, '');

  // Auto-detect delimiter from the first few lines
  const firstLines = cleanContent.split(/\r?\n/).slice(0, 5).join('\n');
  const commaCount = (firstLines.match(/,/g) || []).length;
  const semiCount = (firstLines.match(/;/g) || []).length;
  const tabCount = (firstLines.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  }

  let rows = [];
  try {
    rows = parse(cleanContent, {
      delimiter,
      bom: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true
    });
  } catch (err) {
    // Fallback parser: line-by-line quote-aware split
    const lines = cleanContent.split(/\r?\n/).filter(l => l.trim().length > 0);
    rows = lines.map(line => {
      const parts = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
          else { inQ = !inQ; }
        } else if (ch === delimiter && !inQ) {
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
    k.includes('question') || k === 'qtext' || k === 'q' || k === 'questions' || k.includes('problem')
  );

  let headerMap = null;
  let dataRows = rows;

  if (hasQuestionHeader) {
    headerMap = {};
    firstRowNormalized.forEach((k, idx) => {
      if (k.includes('question') || k === 'qtext' || k === 'q' || k === 'questions' || k.includes('problem')) {
        headerMap.questionText = idx;
      } else if (['optiona', 'option1', 'opta', 'opt1', 'a', 'choicea', 'choice1', 'ans1'].includes(k)) {
        headerMap.optionA = idx;
      } else if (['optionb', 'option2', 'optb', 'opt2', 'b', 'choiceb', 'choice2', 'ans2'].includes(k)) {
        headerMap.optionB = idx;
      } else if (['optionc', 'option3', 'optc', 'opt3', 'c', 'choicec', 'choice3', 'ans3'].includes(k)) {
        headerMap.optionC = idx;
      } else if (['optiond', 'option4', 'optd', 'opt4', 'd', 'choiced', 'choice4', 'ans4'].includes(k)) {
        headerMap.optionD = idx;
      } else if (k.includes('correct') || k.includes('answer') || k === 'ans' || k === 'key' || k === 'right' || k.includes('solutionkey')) {
        headerMap.correctAnswer = idx;
      } else if (k.includes('category') || k.includes('subject') || k.includes('domain')) {
        headerMap.category = idx;
      } else if (k.includes('topic') || k.includes('chapter') || k.includes('unit')) {
        headerMap.topic = idx;
      } else if (k.includes('explain') || k.includes('solution') || k.includes('reason') || k.includes('hint')) {
        headerMap.explanation = idx;
      } else if (k.includes('model')) {
        headerMap.modelSet = idx;
      } else if (k.includes('difficulty') || k.includes('level')) {
        headerMap.difficultyLevel = idx;
      }
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
      // Positional inference when no header row
      // Check if Col 0 is a Serial Number (e.g. 1, 2, 3...) and Col 1 is the question text
      let offset = 0;
      if (/^\d+$/.test(String(row[0]).trim()) && String(row[1]).trim().length > 5) {
        offset = 1;
      }

      qText = row[offset] || '';

      // Check if format has Category & Topic in next 2 columns:
      // [S.No], Question, Category, Topic, OptionA, OptionB, OptionC, OptionD, Answer, [Explanation]
      if (row.length >= offset + 8 && ['A','B','C','D','1','2','3','4'].includes(String(row[offset + 7]).trim().toUpperCase())) {
        cat = row[offset + 1] || 'General';
        top = row[offset + 2] || 'General';
        optA = row[offset + 3] || '';
        optB = row[offset + 4] || '';
        optC = row[offset + 5] || '';
        optD = row[offset + 6] || '';
        rawAns = row[offset + 7] || 'A';
        expl = row[offset + 8] || '';
      } else {
        // Standard format: [S.No], Question, OptionA, OptionB, OptionC, OptionD, Answer, [Category], [Topic], [Explanation]
        optA = row[offset + 1] || '';
        optB = row[offset + 2] || '';
        optC = row[offset + 3] || '';
        optD = row[offset + 4] || '';
        rawAns = row[offset + 5] || 'A';
        cat = row[offset + 6] || 'General';
        top = row[offset + 7] || 'General';
        expl = row[offset + 8] || '';
      }
    }

    if (!qText || !String(qText).trim()) continue;
    if (!optA && !optB && !optC && !optD) continue;

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
  const buffer = fs.readFileSync(filePath);
  let fileContent;
  // Detect UTF-16LE BOM
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    fileContent = buffer.toString('utf16le');
  } else {
    fileContent = buffer.toString('utf8');
  }
  return parseCsvString(fileContent);
};

const parseTextQuestions = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  return parseCsvString(buffer.toString('utf8'));
};

module.exports = {
  parseCsvQuestions,
  parseCsvString,
  parseTextQuestions
};
