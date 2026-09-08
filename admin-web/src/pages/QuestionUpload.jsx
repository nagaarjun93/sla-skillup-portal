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

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.endsWith('.csv') && !selected.name.endsWith('.txt')) {
        setError('Please select a valid CSV or TXT spreadsheet file');
        setFile(null);
        return;
      }
      setFile(selected);
      setError('');
      setResult(null);
    }
  };

  const splitCsvRow = (text) => {
    const res = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        res.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    res.push(current.trim());
    return res;
  };

  const sanitizeAnswer = (val, optA, optB, optC, optD) => {
    if (!val) return 'A';
    const raw = String(val).trim().toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(raw)) return raw;
    if (raw.startsWith('OPTION')) {
      const last = raw.replace('OPTION', '').trim();
      if (['A', 'B', 'C', 'D'].includes(last)) return last;
    }
    if (raw === '1') return 'A';
    if (raw === '2') return 'B';
    if (raw === '3') return 'C';
    if (raw === '4') return 'D';
    if (optA && raw === String(optA).trim().toUpperCase()) return 'A';
    if (optB && raw === String(optB).trim().toUpperCase()) return 'B';
    if (optC && raw === String(optC).trim().toUpperCase()) return 'C';
    if (optD && raw === String(optD).trim().toUpperCase()) return 'D';
    return 'A';
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const activeTopicObj = topics.find((t) => t.name === selectedTopicLabel) || {
      name: selectedTopicLabel,
      category: selectedTopicLabel || 'Vedic Math',
    };

    if (inputMode === 'file') {
      if (!file) {
        setError('Please select a CSV file first');
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (selectedWeeklyTestId) {
        formData.append('weeklyTestId', selectedWeeklyTestId);
      }

      try {
        const res = await api.post('/admin/questions/upload-csv', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setResult(res.data);
        setFile(null);
        fetchWeeklyTests();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to upload and parse CSV questions');
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
        const rawLines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (rawLines.length === 0) throw new Error('No content found in text area');

        const firstRowParts = splitCsvRow(rawLines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const hasHeader = firstRowParts.some((h) => h.includes('question') || h.includes('option') || h.includes('ans'));

        let headerIndices = null;
        if (hasHeader) {
          headerIndices = {
            questionText: firstRowParts.findIndex((h) => h.includes('question')),
            category: firstRowParts.findIndex((h) => h.includes('cat')),
            topic: firstRowParts.findIndex((h) => h.includes('top')),
            optionA: firstRowParts.findIndex((h) => h === 'optiona' || h === 'a' || h === 'opta'),
            optionB: firstRowParts.findIndex((h) => h === 'optionb' || h === 'b' || h === 'optb'),
            optionC: firstRowParts.findIndex((h) => h === 'optionc' || h === 'c' || h === 'optc'),
            optionD: firstRowParts.findIndex((h) => h === 'optiond' || h === 'd' || h === 'optd'),
            correctAnswer: firstRowParts.findIndex((h) => h.includes('correct') || h.includes('answer') || h === 'ans'),
            explanation: firstRowParts.findIndex((h) => h.includes('expla')),
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
          } else if (parts.length >= 8 && (parts[1] === 'Vedic Math' || parts[1] === 'Mock Test' || parts[1] === 'General' || parts[1].length > 15)) {
            qText = parts[0];
            cat = parts[1];
            top = parts[2];
            optA = parts[3];
            optB = parts[4];
            optC = parts[5];
            optD = parts[6];
            cAns = parts[7];
            expl = parts[8] || '';
          } else {
            qText = parts[0];
            optA = parts[1];
            optB = parts[2];
            optC = parts[3];
            optD = parts[4];
            cAns = parts[5];
            cat = parts[6];
            top = parts[7];
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
              category: cat || activeTopicObj.category || 'Vedic Math',
              topic: top || activeTopicObj.name || selectedTopicLabel || 'Vedic Math',
              weeklyTestId: selectedWeeklyTestId || null,
            });
          }
        });

        if (questions.length === 0) {
          setError('No valid questions parsed. Please ensure each line has Question Text, 4 Options, and Correct Answer.');
          setUploading(false);
          return;
        }

        const res = await api.post('/admin/questions/save-bulk', {
          questions,
          weeklyTestId: selectedWeeklyTestId || null,
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
            onClick={() => setInputMode('file')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px' }}
          >
            <UploadCloud size={16} />
            <span>Pick / Drop CSV File</span>
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
            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                marginBottom: '20px',
              }}
              onClick={() => document.getElementById('csvFileInput').click()}
            >
              <UploadCloud size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b', marginBottom: '4px' }}>
                {file ? file.name : 'Click to select or drag CSV spreadsheet here'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Supported formats: .csv, .txt (comma separated)
              </div>
              <input
                id="csvFileInput"
                type="file"
                accept=".csv,.txt"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
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
