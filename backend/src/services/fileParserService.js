const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

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

/**
 * ENGINE 1: Tabular / 2D Rows Parser
 * Parses 2D array of cells (from CSV or Excel Sheet)
 */
const parseRowsToQuestions = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  // Filter out completely empty rows
  const cleanRows = rows.filter(r => Array.isArray(r) && r.some(c => c !== null && c !== undefined && String(c).trim().length > 0));
  if (cleanRows.length === 0) return [];

  const firstRow = cleanRows[0];
  const firstRowNormalized = firstRow.map(c => sanitizeKey(String(c)));
  const hasQuestionHeader = firstRowNormalized.some(k =>
    k.includes('question') || k === 'qtext' || k === 'q' || k === 'questions' || k.includes('problem')
  );

  let headerMap = null;
  let dataRows = cleanRows;

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
    dataRows = cleanRows.slice(1);
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
      let offset = 0;
      if (/^\d+$/.test(String(row[0]).trim()) && String(row[1]).trim().length > 5) {
        offset = 1;
      }

      qText = row[offset] || '';

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

/**
 * Delimited Text Parser (CSV, TSV, Semicolon)
 */
const parseCsvString = (content) => {
  if (!content || !content.trim()) return [];

  let cleanContent = content.replace(/^\uFEFF/, '');
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

  return parseRowsToQuestions(rows);
};

/**
 * ENGINE 2: Exam Paper Block Pattern Recognition Parser
 * Parses question documents commonly found in PDF, Word (docx), or freeform TXT
 * Patterns supported:
 * 1. Question text ...
 * A) opt1  B) opt2  C) opt3  D) opt4
 * Answer: B
 * Explanation: ...
 */
const parseBlockQuestions = (rawText) => {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  const questions = [];
  let currentQ = null;

  // Regex patterns
  const qStartRegex = /^(?:(?:Q(?:uestion)?\s*[\d.:\-#]+)|(?:\(?\d+\s*[\).:\-#]))\s*(.+)$/i;
  const optARegex = /^(?:(?:\(?A[\).:\-]|\[A\]|Option\s*A\s*[:.\-]?))\s*(.+)$/i;
  const optBRegex = /^(?:(?:\(?B[\).:\-]|\[B\]|Option\s*B\s*[:.\-]?))\s*(.+)$/i;
  const optCRegex = /^(?:(?:\(?C[\).:\-]|\[C\]|Option\s*C\s*[:.\-]?))\s*(.+)$/i;
  const optDRegex = /^(?:(?:\(?D[\).:\-]|\[D\]|Option\s*D\s*[:.\-]?))\s*(.+)$/i;
  const ansRegex = /^(?:(?:Ans(?:wer)?|Correct(?:\s*Option|\s*Answer)?|Key)\s*[:.\-]?)\s*(.+)$/i;
  const explRegex = /^(?:(?:Expla(?:nation)?|Solution|Reason|Hint)\s*[:.\-]?)\s*(.+)$/i;

  const flushCurrentQuestion = () => {
    if (currentQ && currentQ.questionText && (currentQ.optionA || currentQ.optionB)) {
      const cleanAns = sanitizeAnswer(
        currentQ.rawAnswer || 'A',
        currentQ.optionA,
        currentQ.optionB,
        currentQ.optionC,
        currentQ.optionD
      );

      questions.push({
        questionText: currentQ.questionText.trim(),
        optionA: (currentQ.optionA || '').trim(),
        optionB: (currentQ.optionB || '').trim(),
        optionC: (currentQ.optionC || '').trim(),
        optionD: (currentQ.optionD || '').trim(),
        correctAnswer: cleanAns,
        category: (currentQ.category || 'General').trim(),
        topic: (currentQ.topic || 'General').trim(),
        explanation: (currentQ.explanation || '').trim(),
        modelSet: 'Model 1',
        difficultyLevel: 'Medium'
      });
    }
    currentQ = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains inline options on one line: A) opt1 B) opt2 C) opt3 D) opt4
    const inlineMatch = line.match(/(?:(?:\(?A[\).:\-]|\[A\]))\s*(.+?)\s+(?:(?:\(?B[\).:\-]|\[B\]))\s*(.+?)\s+(?:(?:\(?C[\).:\-]|\[C\]))\s*(.+?)\s+(?:(?:\(?D[\).:\-]|\[D\]))\s*(.+)$/i);
    if (inlineMatch && currentQ) {
      currentQ.optionA = inlineMatch[1];
      currentQ.optionB = inlineMatch[2];
      currentQ.optionC = inlineMatch[3];
      currentQ.optionD = inlineMatch[4];
      continue;
    }

    // Check if new question begins
    const qMatch = line.match(qStartRegex);
    if (qMatch) {
      flushCurrentQuestion();
      currentQ = {
        questionText: qMatch[1],
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        rawAnswer: '',
        explanation: '',
        category: 'General',
        topic: 'General'
      };
      continue;
    }

    if (!currentQ) {
      // If line is not empty and looks like a standalone question without Q number
      if (line.endsWith('?') || line.length > 25) {
        currentQ = {
          questionText: line,
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          rawAnswer: '',
          explanation: '',
          category: 'General',
          topic: 'General'
        };
      }
      continue;
    }

    // Check for Options
    const optAMatch = line.match(optARegex);
    if (optAMatch) { currentQ.optionA = optAMatch[1]; continue; }

    const optBMatch = line.match(optBRegex);
    if (optBMatch) { currentQ.optionB = optBMatch[1]; continue; }

    const optCMatch = line.match(optCRegex);
    if (optCMatch) { currentQ.optionC = optCMatch[1]; continue; }

    const optDMatch = line.match(optDRegex);
    if (optDMatch) { currentQ.optionD = optDMatch[1]; continue; }

    // Check for Answer
    const ansMatch = line.match(ansRegex);
    if (ansMatch) { currentQ.rawAnswer = ansMatch[1]; continue; }

    // Check for Explanation
    const explMatch = line.match(explRegex);
    if (explMatch) { currentQ.explanation = explMatch[1]; continue; }

    // Multi-line continuation
    if (currentQ.explanation) {
      currentQ.explanation += ' ' + line;
    } else if (currentQ.optionD) {
      currentQ.optionD += ' ' + line;
    } else if (currentQ.optionC) {
      currentQ.optionC += ' ' + line;
    } else if (currentQ.optionB) {
      currentQ.optionB += ' ' + line;
    } else if (currentQ.optionA) {
      currentQ.optionA += ' ' + line;
    } else if (currentQ.questionText) {
      currentQ.questionText += ' ' + line;
    }
  }

  flushCurrentQuestion();
  return questions;
};

/**
 * Universal Question Extractor for Any File Format
 * Supports: .xlsx, .xls, .docx, .doc, .pdf, .csv, .txt
 */
const parseUniversalQuestions = async (filePath, originalFilename = '') => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const ext = (path.extname(originalFilename || filePath) || '').toLowerCase();

  // 1. Excel Spreadsheets (.xlsx, .xls)
  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = xlsx.readFile(filePath);
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return [];
    }
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const questions = parseRowsToQuestions(rows);
    if (questions.length > 0) return questions;
  }

  // 2. Word Documents (.docx)
  if (ext === '.docx') {
    try {
      const docResult = await mammoth.extractRawText({ path: filePath });
      const text = docResult.value || '';
      let questions = parseBlockQuestions(text);
      if (questions.length === 0) {
        questions = parseCsvString(text);
      }
      if (questions.length > 0) return questions;
    } catch (e) {
      console.warn('Mammoth docx parse warning:', e.message);
    }
  }

  // 3. PDF Documents (.pdf)
  if (ext === '.pdf') {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const text = pdfData.text || '';
      let questions = parseBlockQuestions(text);
      if (questions.length === 0) {
        questions = parseCsvString(text);
      }
      if (questions.length > 0) return questions;
    } catch (e) {
      console.warn('PDF parse warning:', e.message);
    }
  }

  // 4. CSV, Text, or Fallback
  const buffer = fs.readFileSync(filePath);
  let content;
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    content = buffer.toString('utf16le');
  } else {
    content = buffer.toString('utf8');
  }

  let questions = parseCsvString(content);
  if (questions.length === 0) {
    questions = parseBlockQuestions(content);
  }

  return questions;
};

const parseCsvQuestions = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  let fileContent;
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    fileContent = buffer.toString('utf16le');
  } else {
    fileContent = buffer.toString('utf8');
  }
  return parseCsvString(fileContent);
};

const parseTextQuestions = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const content = buffer.toString('utf8');
  let q = parseCsvString(content);
  if (q.length === 0) q = parseBlockQuestions(content);
  return q;
};

module.exports = {
  parseUniversalQuestions,
  parseRowsToQuestions,
  parseCsvQuestions,
  parseCsvString,
  parseBlockQuestions,
  parseTextQuestions,
  sanitizeAnswer
};
