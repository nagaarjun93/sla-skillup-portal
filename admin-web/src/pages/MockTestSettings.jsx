import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Target, Save, UploadCloud, CheckCircle2, AlertCircle, Clock, BookOpen, Eye, Trash2, X, Search, Download, Edit3 } from 'lucide-react';

export default function MockTestSettings() {
  const [settings, setSettings] = useState({ passingMarks: 35, durationMinutes: 45 });
  const [modelStats, setModelStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Bulk Upload to Specific Model Set
  const [selectedTargetModel, setSelectedTargetModel] = useState('Model 1');
  const [mockInputMode, setMockInputMode] = useState('file'); // 'file' | 'text'
  const [mockFile, setMockFile] = useState(null);
  const [mockCsvText, setMockCsvText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Question Viewer Modal State (Full Screen / Large)
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingModel, setViewingModel] = useState('Model 1');
  const [viewingQuestions, setViewingQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [settingsRes, statsRes] = await Promise.all([
        api.get('/admin/mock/settings'),
        api.get('/admin/mock/models-stats')
      ]);
      if (settingsRes.data) {
        setSettings({
          passingMarks: settingsRes.data.passingMarks ?? 35,
          durationMinutes: settingsRes.data.durationMinutes ?? 45,
        });
      }
      setModelStats(statsRes.data || []);
    } catch (e) {
      console.error('Failed to load mock settings/stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      await api.put('/admin/mock/settings', {
        passingMarks: Number(settings.passingMarks),
        durationMinutes: Number(settings.durationMinutes),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e) {
      alert('Failed to update mock test settings');
    } finally {
      setSavingSettings(false);
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
    const rawLower = String(val).trim().toLowerCase();
    if (optA && rawLower === String(optA).trim().toLowerCase()) return 'A';
    if (optB && rawLower === String(optB).trim().toLowerCase()) return 'B';
    if (optC && rawLower === String(optC).trim().toLowerCase()) return 'C';
    if (optD && rawLower === String(optD).trim().toLowerCase()) return 'D';
    return 'A';
  };

  const handleUploadMockCsv = async (e) => {
    e.preventDefault();

    if (mockInputMode === 'file' && !mockFile) {
      setUploadError('Please select a CSV file first');
      return;
    }
    if (mockInputMode === 'text' && !mockCsvText.trim()) {
      setUploadError('Please enter or paste CSV content first');
      return;
    }

    // Check if target model already contains questions!
    const targetStat = modelStats.find(m => m.modelSet === selectedTargetModel);
    const existingCount = targetStat ? targetStat.questionCount : 0;
    let replaceExisting = false;

    if (existingCount > 0) {
      const confirmMsg = `⚠️ Questions Already Exist!\n\n${selectedTargetModel} already has ${existingCount} questions.\n\nDo you want to remove the existing ${existingCount} questions and replace them with these new ones?`;
      const confirmed = window.confirm(confirmMsg);
      if (!confirmed) return;
      replaceExisting = true;
    }

    setUploading(true);
    setUploadMsg('');
    setUploadError('');

    try {
      if (mockInputMode === 'file') {
        const formData = new FormData();
        formData.append('file', mockFile);
        formData.append('targetModelSet', selectedTargetModel);
        if (replaceExisting) {
          formData.append('replaceExisting', 'true');
        }

        const res = await api.post('/admin/mock/questions/upload-csv', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const replacedText = replaceExisting ? ' (pazhaiya questions remove panniyachu)' : '';
        setUploadMsg(res.data.message || `Mock questions uploaded to ${selectedTargetModel}${replacedText}!`);
        setMockFile(null);
      } else {
        // Direct Text Paste Mode
        const rawLines = mockCsvText.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (rawLines.length === 0) throw new Error('No content found in text area');

        const firstRowParts = splitCsvRow(rawLines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const hasHeader = firstRowParts.some(h => h.includes('question') || h.includes('option') || h.includes('ans'));

        let headerIndices = null;
        if (hasHeader) {
          headerIndices = {
            questionText: firstRowParts.findIndex(h => h.includes('question')),
            category: firstRowParts.findIndex(h => h.includes('cat')),
            topic: firstRowParts.findIndex(h => h.includes('top')),
            optionA: firstRowParts.findIndex(h => h === 'optiona' || h === 'a' || h === 'opta'),
            optionB: firstRowParts.findIndex(h => h === 'optionb' || h === 'b' || h === 'optb'),
            optionC: firstRowParts.findIndex(h => h === 'optionc' || h === 'c' || h === 'optc'),
            optionD: firstRowParts.findIndex(h => h === 'optiond' || h === 'd' || h === 'optd'),
            correctAnswer: firstRowParts.findIndex(h => h.includes('correct') || h.includes('answer') || h === 'ans'),
            explanation: firstRowParts.findIndex(h => h.includes('expla')),
          };
        }

        const dataLines = hasHeader ? rawLines.slice(1) : rawLines;
        const questions = [];

        dataLines.forEach(line => {
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
          } else if (parts.length >= 8 && (parts[1] === 'Mock Test' || parts[1] === 'General' || parts[1].length > 15)) {
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
              category: cat || 'Mock Test',
              topic: top || 'Official Mock',
              modelSet: selectedTargetModel
            });
          }
        });

        if (questions.length === 0) {
          throw new Error('No valid questions parsed. Please check the format.');
        }

        if (replaceExisting) {
          await api.delete(`/admin/mock/models/${encodeURIComponent(selectedTargetModel)}/questions`);
        }

        await api.post('/admin/mock/questions/bulk', {
          questions,
          targetModelSet: selectedTargetModel
        });

        setUploadMsg(`✅ ${questions.length} questions successfully uploaded to ${selectedTargetModel}!`);
        setMockCsvText('');
      }

      // Refresh model stats
      const statsRes = await api.get('/admin/mock/models-stats');
      setModelStats(statsRes.data);
      if (viewerOpen && viewingModel === selectedTargetModel) {
        handleOpenViewer(selectedTargetModel);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Failed to upload mock questions');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenViewer = async (modelName) => {
    setViewingModel(modelName);
    setSearchQuery('');
    setViewerOpen(true);
    setLoadingQuestions(true);
    try {
      const res = await api.get('/admin/mock/questions', { params: { modelSet: modelName } });
      setViewingQuestions(res.data || []);
    } catch (e) {
      alert('Failed to load questions for ' + modelName);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/admin/mock/questions/${qId}`);
      setViewingQuestions(prev => prev.filter(q => q._id !== qId));
      const statsRes = await api.get('/admin/mock/models-stats');
      setModelStats(statsRes.data);
    } catch (e) {
      alert('Failed to delete question');
    }
  };

  const handleClearModel = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ALL questions in ${viewingModel}?`)) return;
    try {
      await api.delete(`/admin/mock/models/${encodeURIComponent(viewingModel)}/questions`);
      setViewingQuestions([]);
      const statsRes = await api.get('/admin/mock/models-stats');
      setModelStats(statsRes.data);
      alert(`Cleared all questions from ${viewingModel}`);
    } catch (e) {
      alert('Failed to clear model questions');
    }
  };

  const filteredQuestions = viewingQuestions.filter(q => {
    if (!searchQuery.trim()) return true;
    return (q.questionText || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleDownloadMockSample = () => {
    const csvContent = 
`question_text,category,topic,option_a,option_b,option_c,option_d,correct_option_key,explanation
"What is the base of decimal number system?","Mock Test","General Math","2","8","10","16","C","Decimal system uses base 10 (digits 0 to 9)"
"Evaluate: 99 x 99 using Vedic Math sutra","Mock Test","Multiplication","9801","9811","9701","9901","A","99 x 99 = (99 - 1) | (1 x 1) = 9801"
"What is 15% of 600?","Mock Test","Percentage","75","80","90","100","C","15% of 600 = 0.15 * 600 = 90"
`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_mock_questions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="grid-cols-2" style={{ marginBottom: '28px' }}>
        {/* Pass Marks & Duration Config */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#e7eefd', color: '#14217f' }}>
              <Target size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              Evaluation Rules & Duration
            </h3>
          </div>

          {saveSuccess && (
            <div style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>Settings updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label className="form-label">Passing Marks Required</label>
              <input
                type="number"
                className="form-input"
                value={settings.passingMarks}
                onChange={e => setSettings({ ...settings, passingMarks: e.target.value })}
                required
              />
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>Students must score this or above to qualify</span>
            </div>

            <div className="form-group">
              <label className="form-label">Exam Duration (in Minutes)</label>
              <input
                type="number"
                className="form-input"
                value={settings.durationMinutes}
                onChange={e => setSettings({ ...settings, durationMinutes: e.target.value })}
                required
              />
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>Default time is 45 minutes</span>
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
              <Save size={15} />
              <span>{savingSettings ? 'Updating...' : 'Save Configuration'}</span>
            </button>
          </form>
        </div>

        {/* Upload Questions to Specific Model Set */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#b45309' }}>
                <UploadCloud size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Upload Questions by Model Set (1-10)
              </h3>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownloadMockSample}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
            >
              <Download size={14} />
              <span>Sample CSV</span>
            </button>
          </div>

          {uploadMsg && (
            <div style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>{uploadMsg}</span>
            </div>
          )}

          {uploadError && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Input Mode Selector: File Upload vs Direct Text Paste */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
            <button
              type="button"
              className={`btn ${mockInputMode === 'file' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMockInputMode('file')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '6px 14px' }}
            >
              <UploadCloud size={15} />
              <span>CSV File</span>
            </button>
            <button
              type="button"
              className={`btn ${mockInputMode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMockInputMode('text')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '6px 14px' }}
            >
              <Edit3 size={15} />
              <span>Paste Text</span>
            </button>
          </div>

          <form onSubmit={handleUploadMockCsv}>
            <div className="form-group">
              <label className="form-label">Target Model Set (Model 1 to 10)</label>
              <select
                className="form-select"
                value={selectedTargetModel}
                onChange={e => setSelectedTargetModel(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={`Model ${n}`}>Model {n}</option>
                ))}
              </select>
            </div>

            {mockInputMode === 'file' ? (
              <div className="form-group">
                <label className="form-label">Select CSV Spreadsheet File</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="form-input"
                  onChange={e => setMockFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Paste CSV Questions:
                  </label>
                  {mockCsvText.split('\n').filter(l => l.trim()).length > 0 && (
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#2563eb', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '6px' }}>
                      📊 ~{mockCsvText.split('\n').filter(l => l.trim()).length} rows detected
                    </span>
                  )}
                </div>
                <textarea
                  className="form-input"
                  style={{
                    minHeight: '140px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    padding: '10px',
                    whiteSpace: 'pre',
                  }}
                  placeholder={`question_text,category,topic,option_a,option_b,option_c,option_d,correct_option_key,explanation\n"What is 15% of 600?","Mock Test","Percentage","75","80","90","100","C","15% of 600 = 90"`}
                  value={mockCsvText}
                  onChange={e => setMockCsvText(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-secondary"
              disabled={uploading || (mockInputMode === 'file' ? !mockFile : !mockCsvText.trim())}
              style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
            >
              <UploadCloud size={15} />
              <span>{uploading ? 'Uploading...' : `Upload to ${selectedTargetModel}`}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Model Sets 1-10 Statistics Table */}
      <div className="table-container card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              📚 10 Mock Question Paper Models Overview
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Click any model row or "View Questions" button to inspect active questions.
            </p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Model Set Name</th>
              <th>Question Bank Count</th>
              <th>Assigned Students</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modelStats.map(m => (
              <tr
                key={m.modelSet}
                style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                onClick={() => handleOpenViewer(m.modelSet)}
              >
                <td style={{ fontWeight: '700', color: '#14217f' }}>
                  {m.modelSet}
                </td>
                <td style={{ fontWeight: '700' }}>
                  {m.questionCount} Questions
                </td>
                <td>
                  <span className="badge badge-blue">
                    {m.studentCount} Students Assigned
                  </span>
                </td>
                <td>
                  <span className={`badge ${m.questionCount > 0 ? 'badge-active' : 'badge-inactive'}`}>
                    {m.questionCount > 0 ? 'Ready' : 'Empty'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenViewer(m.modelSet);
                    }}
                  >
                    <Eye size={14} />
                    <span>View Questions</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Full-Screen Model Question Viewer Modal */}
      {viewerOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '1000px',
            height: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    📚 {viewingModel} Question Bank
                  </h2>
                  <span className="badge badge-blue">
                    {viewingQuestions.length} Questions
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Reviewing all active questions uploaded for {viewingModel}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {viewingQuestions.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                    onClick={handleClearModel}
                  >
                    <Trash2 size={14} />
                    <span>Clear All Questions</span>
                  </button>
                )}
                <button
                  type="button"
                  style={{
                    border: 'none',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => setViewerOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Search Toolbar */}
            <div style={{
              padding: '12px 24px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                padding: '8px 12px',
                flex: 1,
                gap: '8px'
              }}>
                <Search size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder={`Search ${viewingModel} questions...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: '13px'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Modal Questions List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              backgroundColor: '#f8fafc'
            }}>
              {loadingQuestions ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                  Loading {viewingModel} questions...
                </div>
              ) : viewingQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                    No Questions Uploaded Yet in {viewingModel}
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '400px', margin: '8px auto 0 auto' }}>
                    Use the CSV upload section above to upload questions into this model set.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredQuestions.map((q, idx) => (
                    <div
                      key={q._id || idx}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            backgroundColor: '#14217f',
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '800'
                          }}>
                            Q{idx + 1}
                          </span>
                          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                            {q.topic || 'General Aptitude'} • {q.category || 'Mock Test'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q._id)}
                          style={{
                            border: 'none',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>

                      <p style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                        {q.questionText}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {['A', 'B', 'C', 'D'].map(opt => {
                          const optKey = `option${opt}`;
                          const optVal = q[optKey];
                          const isCorrect = (q.correctAnswer || '').toUpperCase() === opt;
                          return (
                            <div
                              key={opt}
                              style={{
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: isCorrect ? '2px solid #22c55e' : '1px solid #e2e8f0',
                                backgroundColor: isCorrect ? '#f0fdf4' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}
                            >
                              <span style={{
                                fontWeight: '800',
                                color: isCorrect ? '#15803d' : '#64748b',
                                minWidth: '20px'
                              }}>
                                {opt}.
                              </span>
                              <span style={{
                                flex: 1,
                                fontSize: '13.5px',
                                color: isCorrect ? '#15803d' : '#1e293b',
                                fontWeight: isCorrect ? '700' : '500'
                              }}>
                                {optVal || '-'}
                              </span>
                              {isCorrect && (
                                <span style={{
                                  backgroundColor: '#22c55e',
                                  color: '#ffffff',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '800'
                                }}>
                                  ✓ Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setViewerOpen(false)}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
