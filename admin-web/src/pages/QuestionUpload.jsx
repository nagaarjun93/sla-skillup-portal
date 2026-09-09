import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UploadCloud, CheckCircle2, AlertCircle, Calendar, Clock, Layers, Download, Edit3, Plus, X } from 'lucide-react';

export default function QuestionUpload() {
  const [inputMode, setInputMode] = useState('file'); // 'file' | 'text'
  const [file, setFile] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [weeklyTests, setWeeklyTests] = useState([]);
  const [selectedWeeklyTestId, setSelectedWeeklyTestId] = useState('');
  
  // Database-driven topics
  const [topics, setTopics] = useState([]);
  const [selectedTopicLabel, setSelectedTopicLabel] = useState('');
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);

  useEffect(() => {
    fetchWeeklyTests();
    fetchTopics();
  }, []);

  const fetchWeeklyTests = async () => {
    try {
      const res = await api.get('/admin/weekly');
      setWeeklyTests(res.data || []);
    } catch (e) {
      console.error('Failed to load weekly tests:', e);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await api.get('/topics');
      const data = res.data || [];
      setTopics(data);
      if (data.length > 0) {
        setSelectedTopicLabel(prev => prev || data[0].name);
      }
    } catch (e) {
      console.error('Failed to load topics from DB:', e);
    }
  };

  const handleCreateNewTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return alert('Please enter topic name');
    setCreatingTopic(true);
    try {
      const res = await api.post('/topics', {
        name: newTopicName.trim(),
        category: newTopicCategory.trim() || newTopicName.trim()
      });
      const created = res.data;
      setTopics(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedTopicLabel(created.name);
      setShowAddTopicModal(false);
      setNewTopicName('');
      setNewTopicCategory('');
      alert(`Topic "${created.name}" created and saved to Database! 🎉`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create topic');
    } finally {
      setCreatingTopic(false);
    }
  };

  const formatTestDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      const datePart = d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timePart = d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${datePart}, ${timePart}`;
    } catch (e) {
      return String(dateStr);
    }
  };

  const fileInputRef = React.useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filePreviewInfo, setFilePreviewInfo] = useState(null);

  const getFileTypeLabel = (filename) => {
    if (!filename) return 'Document';
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return 'PDF Document';
      case 'docx':
      case 'doc': return 'Word Document';
      case 'xlsx':
      case 'xls': return 'Excel Spreadsheet';
      case 'csv': return 'CSV File';
      case 'txt': return 'Text File';
      default: return 'Document';
    }
  };

  const processSelectedFile = async (selected) => {
    if (!selected) return;
    const lowerName = selected.name.toLowerCase();
    const validExts = ['.csv', '.txt', '.pdf', '.docx', '.doc', '.xlsx', '.xls'];
    const isValid = validExts.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      setError('Please select a supported question file: .csv, .xlsx, .xls, .pdf, .docx, .doc, .txt');
      setFile(null);
      setFilePreviewInfo(null);
      return;
    }

    setFile(selected);
    setError('');
    setResult(null);

    const sizeFormatted = selected.size > 1024 * 1024
      ? `${(selected.size / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.round(selected.size / 1024)} KB`;

    const fileType = getFileTypeLabel(selected.name);

    if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
      try {
        const text = await selected.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        const rowCount = Math.max(0, lines.length - 1);
        setFilePreviewInfo({
          fileName: selected.name,
          size: sizeFormatted,
          type: fileType,
          detectedRows: rowCount > 0 ? rowCount : lines.length
        });
      } catch (err) {
        setFilePreviewInfo({ fileName: selected.name, size: sizeFormatted, type: fileType, detectedRows: 'Ready' });
      }
    } else {
      setFilePreviewInfo({
        fileName: selected.name,
        size: sizeFormatted,
        type: fileType,
        detectedRows: 'Ready for auto-extraction'
      });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const parseCsvLinesToQuestions = (text, fallbackCategory, fallbackTopic, targetWeeklyId) => {
    const rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (rawLines.length === 0) return [];

    const firstRowParts = splitCsvRow(rawLines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const hasHeader = firstRowParts.some((h) => h.includes('question') || h.includes('option') || h.includes('ans') || h.includes('problem'));

    let headerIndices = null;
    if (hasHeader) {
      headerIndices = {
        questionText: firstRowParts.findIndex((h) => h.includes('question') || h.includes('problem') || h === 'qtext' || h === 'q'),
        category: firstRowParts.findIndex((h) => h.includes('cat') || h.includes('subject') || h.includes('domain')),
        topic: firstRowParts.findIndex((h) => h.includes('top') || h.includes('chapter') || h.includes('unit')),
        optionA: firstRowParts.findIndex((h) => ['optiona', 'option1', 'opta', 'opt1', 'a', 'choicea', 'choice1', 'ans1'].includes(h)),
        optionB: firstRowParts.findIndex((h) => ['optionb', 'option2', 'optb', 'opt2', 'b', 'choiceb', 'choice2', 'ans2'].includes(h)),
        optionC: firstRowParts.findIndex((h) => ['optionc', 'option3', 'optc', 'opt3', 'c', 'choicec', 'choice3', 'ans3'].includes(h)),
        optionD: firstRowParts.findIndex((h) => ['optiond', 'option4', 'optd', 'opt4', 'd', 'choiced', 'choice4', 'ans4'].includes(h)),
        correctAnswer: firstRowParts.findIndex((h) => h.includes('correct') || h.includes('answer') || h === 'ans' || h === 'key' || h === 'right'),
        explanation: firstRowParts.findIndex((h) => h.includes('expla') || h.includes('solu') || h.includes('reason')),
      };
    }

    const dataLines = hasHeader ? rawLines.slice(1) : rawLines;
    const questions = [];

    dataLines.forEach((line) => {
      const parts = splitCsvRow(line);
      if (parts.length < 5) return;

      let qText = '', optA = '', optB = '', optC = '', optD = '', cAns = '', cat = '', top = '', expl = '';

      if (headerIndices && headerIndices.questionText !== -1) {
        qText = parts[headerIndices.questionText] || '';
        optA = headerIndices.optionA !== -1 ? parts[headerIndices.optionA] : '';
        optB = headerIndices.optionB !== -1 ? parts[headerIndices.optionB] : '';
        optC = headerIndices.optionC !== -1 ? parts[headerIndices.optionC] : '';
        optD = headerIndices.optionD !== -1 ? parts[headerIndices.optionD] : '';
        cAns = headerIndices.correctAnswer !== -1 ? parts[headerIndices.correctAnswer] : '';
        cat = headerIndices.category !== -1 ? parts[headerIndices.category] : '';
        top = headerIndices.topic !== -1 ? parts[headerIndices.topic] : '';
        expl = headerIndices.explanation !== -1 ? parts[headerIndices.explanation] : '';
      } else {
        // Positional check
        let offset = 0;
        if (/^\d+$/.test(String(parts[0]).trim()) && String(parts[1]).trim().length > 5) {
          offset = 1;
        }

        if (parts.length >= offset + 8 && ['A','B','C','D','1','2','3','4'].includes(String(parts[offset + 7]).trim().toUpperCase())) {
          qText = parts[offset];
          cat = parts[offset + 1];
          top = parts[offset + 2];
          optA = parts[offset + 3];
          optB = parts[offset + 4];
          optC = parts[offset + 5];
          optD = parts[offset + 6];
          cAns = parts[offset + 7];
          expl = parts[offset + 8] || '';
        } else {
          qText = parts[offset];
          optA = parts[offset + 1];
          optB = parts[offset + 2];
          optC = parts[offset + 3];
          optD = parts[offset + 4];
          cAns = parts[offset + 5];
          cat = parts[offset + 6] || '';
          top = parts[offset + 7] || '';
          expl = parts[offset + 8] || '';
        }
      }

      if (qText && optA && optB && optC && optD) {
        const finalAnswer = sanitizeAnswer(cAns, optA, optB, optC, optD);
        questions.push({
          questionText: qText,
          optionA: optA,
          optionB: optB,
          optionC: optC,
          optionD: optD,
          correctAnswer: finalAnswer,
          explanation: expl || '',
          category: cat || fallbackCategory || 'General',
          topic: top || fallbackTopic || 'General',
          weeklyTestId: targetWeeklyId || null,
        });
      }
    });

    return questions;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const activeTopicObj = topics.find((t) => t.name === selectedTopicLabel) || {
      name: selectedTopicLabel,
      category: selectedTopicLabel || 'General',
    };

    const targetCategory = activeTopicObj.category || 'General';
    const targetTopic = activeTopicObj.name || selectedTopicLabel || 'General';

    if (inputMode === 'file') {
      if (!file) {
        setError('Please select a question file first (.csv, .xlsx, .pdf, .docx, .txt)');
        return;
      }

      setUploading(true);
      const isTextOrCsv = file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt');

      try {
        if (isTextOrCsv) {
          // Read file text directly in browser for fast client-side parsing
          const fileContent = await file.text();
          const parsedQuestions = parseCsvLinesToQuestions(
            fileContent,
            targetCategory,
            targetTopic,
            selectedWeeklyTestId || null
          );

          if (parsedQuestions.length > 0) {
            // Save directly via save-bulk
            const res = await api.post('/admin/questions/save-bulk', {
              questions: parsedQuestions,
              weeklyTestId: selectedWeeklyTestId || null,
              category: targetCategory,
              topic: targetTopic
            });

            setResult({
              message: `Successfully uploaded and saved ${parsedQuestions.length} questions from ${file.name} into Database! 🎉`,
              inserted: parsedQuestions
            });
            setFile(null);
            setFilePreviewInfo(null);
            fetchWeeklyTests();
            return;
          }
        }

        // For .pdf, .docx, .xlsx, .xls or if client parse needed server extraction:
        const formData = new FormData();
        formData.append('file', file);
        if (selectedWeeklyTestId) {
          formData.append('weeklyTestId', selectedWeeklyTestId);
        }
        formData.append('category', targetCategory);
        formData.append('topic', targetTopic);

        const res = await api.post('/admin/questions/upload-csv', formData);
        setResult({
          message: res.data.message || `Successfully extracted and uploaded questions from ${file.name}! 🎉`,
          inserted: res.data.inserted || res.data.count
        });
        setFile(null);
        setFilePreviewInfo(null);
        fetchWeeklyTests();
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to upload and extract questions from file');
      } finally {
        setUploading(false);
      }
    } else {
      // Direct Text Paste mode
      if (!csvText.trim()) {
        setError('Please paste or type CSV questions content into the text area');
        return;
      }

      setUploading(true);
      try {
        const questions = parseCsvLinesToQuestions(
          csvText,
          targetCategory,
          targetTopic,
          selectedWeeklyTestId || null
        );

        if (questions.length === 0) {
          setError('No valid questions parsed. Please ensure each line has Question Text, 4 Options, and Correct Answer.');
          setUploading(false);
          return;
        }

        const res = await api.post('/admin/questions/save-bulk', {
          questions,
          weeklyTestId: selectedWeeklyTestId || null,
          category: targetCategory,
          topic: targetTopic
        });

        setResult({
          message: `${questions.length} questions saved successfully!`,
          inserted: questions,
        });
        setCsvText('');
        fetchWeeklyTests();
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to save questions');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDownloadSample = () => {
    const csvContent = 
`question_text,category,topic,option_a,option_b,option_c,option_d,correct_option_key,explanation
"What is 20% of 150?","Vedic Math","Percentage","20","25","30","35","C","20% of 150 = (20/100) * 150 = 30"
"Find 35 x 35 using Ekadhikena Purvena","Vedic Math","Multiplication","1125","1225","1250","1325","B","For numbers ending in 5: 3 x 4 = 12, append 25 -> 1225"
"Solve: 98 x 97 using Nikhilam Sutra","Vedic Math","Nikhilam Sutra","9506","9516","9406","9606","A","Deficiencies: -2 and -3. Cross: 98-3=95. Right: (-2)x(-3)=06 -> 9506"
`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_practice_questions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedTestObj = weeklyTests.find((t) => t._id === selectedWeeklyTestId);
  const detectedLinesCount = csvText.split('\n').filter((l) => l.trim()).length;

  return (
    <div style={{ maxWidth: '940px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', color: '#0f172a' }}>
              Weekly Test & Practice Question Upload
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Upload questions in bulk via CSV spreadsheet file or paste text directly. Select an optional target weekly test or topic.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDownloadSample}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 15px', fontSize: '13px' }}
          >
            <Download size={16} />
            <span>Download Sample CSV</span>
          </button>
        </div>

        {/* Target Weekly Test Selector with Day, Date and Time */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} color="#14217f" />
            <span>Target Weekly Test (Optional):</span>
          </label>
          <select
            className="form-select"
            value={selectedWeeklyTestId}
            onChange={(e) => setSelectedWeeklyTestId(e.target.value)}
            style={{ fontSize: '13.5px', padding: '10px 14px' }}
          >
            <option value="">-- General Topic Practice Bank (No specific weekly test) --</option>
            {weeklyTests.map((t) => (
              <option key={t._id} value={t._id}>
                {t.weekName || t.title} ({t.topic}) • Created: {formatTestDateTime(t.createdAt)} • Duration: {t.duration}m • {t.totalQuestions || 0} Qs
              </option>
            ))}
          </select>

          {selectedTestObj ? (
            <div
              style={{
                marginTop: '10px',
                padding: '12px 16px',
                backgroundColor: '#eff6ff',
                borderRadius: '10px',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontWeight: '800', color: '#1e40af', fontSize: '13.5px' }}>
                  🎯 Selected Test: {selectedTestObj.weekName || selectedTestObj.title} ({selectedTestObj.topic})
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  🗓️ <strong>Created:</strong> {formatTestDateTime(selectedTestObj.createdAt)} • ⏳ <strong>Duration:</strong> {selectedTestObj.duration} mins • 📊 <strong>Questions:</strong> {selectedTestObj.totalQuestions || 0} • 🎯 <strong>Pass Mark:</strong> {selectedTestObj.passMarks > 0 ? `${selectedTestObj.passMarks} Marks` : `${selectedTestObj.passPercentage || 50}%`}
                </div>
              </div>
              <span className="badge badge-active">
                {selectedTestObj.active ? '🟢 Active' : '⚪ Inactive'}
              </span>
            </div>
          ) : (
            <div style={{ marginTop: '14px', padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <label className="form-label" style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', margin: 0 }}>
                  🎯 Target Practice Topic (Database-Loaded):
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddTopicModal(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '4px 10px' }}
                >
                  <Plus size={14} />
                  <span>+ Add New Topic to DB</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  className="form-select"
                  value={selectedTopicLabel}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowAddTopicModal(true);
                    } else {
                      setSelectedTopicLabel(e.target.value);
                    }
                  }}
                  style={{ fontSize: '13px', flex: 1 }}
                >
                  {topics.map((t) => (
                    <option key={t._id || t.name} value={t.name}>
                      {t.name} {t.category && t.category !== t.name ? `(${t.category})` : ''}
                    </option>
                  ))}
                  <option value="__add_new__">➕ + Add New Custom Topic...</option>
                </select>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
                ⚡ Loaded dynamically from MongoDB Database ({topics.length} topics available)
              </div>
            </div>
          )}
        </div>

        {/* Input Mode Selector: File Upload vs Direct Text Paste */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
          <button
            type="button"
            className={`btn ${inputMode === 'file' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setInputMode('file');
              setTimeout(() => fileInputRef.current?.click(), 50);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px' }}
          >
            <UploadCloud size={16} />
            <span>Pick / Drop Question File</span>
          </button>
          <button
            type="button"
            className={`btn ${inputMode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setInputMode('text')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px' }}
          >
            <Edit3 size={16} />
            <span>Paste CSV Text Directly</span>
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div
            style={{
              backgroundColor: '#dcfce7',
              color: '#166534',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '13.5px',
              marginBottom: '20px',
              border: '1px solid #86efac',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', marginBottom: '4px' }}>
              <CheckCircle2 size={18} />
              <span>{result.message || 'Questions uploaded successfully!'}</span>
            </div>
            {result.inserted && (
              <div style={{ fontSize: '12.5px', marginTop: '6px', color: '#14532d' }}>
                🎉 Successfully added <strong>{result.inserted.length || result.inserted}</strong> questions to the test bank.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleUpload}>
          {inputMode === 'file' ? (
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  border: isDragging ? '2px dashed #2563eb' : '2px dashed #94a3b8',
                  borderRadius: '12px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  backgroundColor: isDragging ? '#eff6ff' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isDragging ? '0 0 0 4px rgba(37, 99, 235, 0.15)' : 'none',
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processSelectedFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.pdf,.docx,.doc,.xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {file ? (
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #bfdbfe',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                    }}>
                      <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        <UploadCloud size={24} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>{file.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          <span style={{ fontWeight: '700', color: '#2563eb' }}>{filePreviewInfo?.type || 'Document'}</span> • {filePreviewInfo?.size || ''} {filePreviewInfo?.detectedRows ? `• ~${filePreviewInfo.detectedRows} items` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setFilePreviewInfo(null);
                        }}
                        style={{
                          marginLeft: '12px',
                          border: 'none',
                          background: '#f1f5f9',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#64748b'
                        }}
                        title="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#16a34a', fontWeight: '700' }}>
                      ✅ Ready! Click "Upload & Save Questions" below or click box to replace file.
                    </div>
                  </div>
                ) : (
                  <div>
                    <UploadCloud size={44} color={isDragging ? '#2563eb' : '#94a3b8'} style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b', marginBottom: '6px' }}>
                      Click to open file picker or Drag & Drop question file here
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '12px' }}>
                      Supports all formats: <strong>CSV, Excel (.xlsx, .xls), PDF (.pdf), Word (.docx, .doc), Text (.txt)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>📄 PDF</span>
                      <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>📝 Word (.docx)</span>
                      <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>📊 Excel (.xlsx)</span>
                      <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>📋 CSV Spreadsheet</span>
                      <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>📃 Text</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#64748b' }}>
                <span>Paste raw CSV formatted rows below:</span>
                <span>Detected Lines: <strong>{detectedLinesCount}</strong></span>
              </div>
              <textarea
                className="form-input"
                rows={10}
                placeholder={`question_text,category,topic,option_a,option_b,option_c,option_d,correct_option_key,explanation\n"What is 20% of 150?","Vedic Math","Percentage","20","25","30","35","C","20% of 150 = 30"`}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '12.5px', lineHeight: '1.5' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '14px' }}
            >
              {uploading ? (
                <>
                  <Clock size={16} />
                  <span>Processing & Saving...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Upload & Save Questions</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Add New Custom Topic Modal */}
      {showAddTopicModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Topic to Database</h3>
              <button onClick={() => setShowAddTopicModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateNewTopic}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  This will save a new topic directly into the MongoDB Database, making it immediately selectable in all upload and filter dropdowns.
                </p>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Topic Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Python Testing, Clocks & Calendars"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category / Subject Group (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Programming, Reasoning (defaults to Topic Name)"
                    value={newTopicCategory}
                    onChange={(e) => setNewTopicCategory(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddTopicModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creatingTopic}>
                  {creatingTopic ? 'Saving to DB...' : 'Save Topic to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Instructions Card */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '10px', color: '#0f172a' }}>
          📋 Supported CSV Headers & Formats
        </h3>
        <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px' }}>
          Both Standard Format and CamelCase Format are supported. If no Topic is provided per line, the target topic selected above will be used automatically.
        </p>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', marginBottom: '6px' }}>
            Format 1 (Standard with Headers):
          </div>
          <div
            style={{
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
              overflowX: 'auto',
              lineHeight: '1.6',
            }}
          >
            question_text,category,topic,option_a,option_b,option_c,option_d,correct_option_key,explanation<br />
            <span style={{ color: '#e2e8f0' }}>"What is 20% of 150?","Vedic Math","Percentage","20","25","30","35","C","20% of 150 = 30"</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', marginBottom: '6px' }}>
            Format 2 (CamelCase):
          </div>
          <div
            style={{
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
              overflowX: 'auto',
              lineHeight: '1.6',
            }}
          >
            questionText,optionA,optionB,optionC,optionD,correctAnswer,category,topic<br />
            <span style={{ color: '#e2e8f0' }}>"Solve 12 x 15 using Vedic Math","160","180","190","175","B","Vedic Math","Multiplication"</span>
          </div>
        </div>
      </div>
    </div>
  );
}
