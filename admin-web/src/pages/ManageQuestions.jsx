import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Search,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  RefreshCw,
  Layers,
  Calendar,
  Target,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Undo2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function ManageQuestions() {
  // Tab: 'topic' | 'weekly' | 'mock'
  const [activeTab, setActiveTab] = useState('topic');

  // Data & Pagination
  const [questions, setQuestions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedWeeklyTest, setSelectedWeeklyTest] = useState('');
  const [selectedModelSet, setSelectedModelSet] = useState('');

  // Dropdown lists from backend
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    topics: [],
    weeklyTests: [],
    mockModels: [],
    topicSummaries: []
  });

  // Collapsible batch delete hub
  const [showBatchHub, setShowBatchHub] = useState(true);

  // Selected checkboxes (Set of IDs)
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Fetch questions from backend
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        type: activeTab,
        page,
        limit: 50,
        search: searchQuery.trim() || undefined
      };

      if (activeTab === 'topic') {
        if (selectedCategory) params.category = selectedCategory;
        if (selectedTopic) params.topic = selectedTopic;
      } else if (activeTab === 'weekly') {
        if (selectedWeeklyTest) params.weeklyTestId = selectedWeeklyTest;
      } else if (activeTab === 'mock') {
        if (selectedModelSet) params.modelSet = selectedModelSet;
      }

      const res = await api.get('/admin/questions-manage', { params });
      setQuestions(res.data.questions || []);
      setTotalCount(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      if (res.data.filters) {
        setFilterOptions(res.data.filters);
      }
    } catch (err) {
      console.error('Failed to fetch questions for management:', err);
      showStatus('error', err.response?.data?.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, searchQuery, selectedCategory, selectedTopic, selectedWeeklyTest, selectedModelSet]);

  useEffect(() => {
    fetchQuestions();
    setSelectedIds(new Set());
  }, [fetchQuestions]);

  // Tab switch handler
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setPage(1);
    setSelectedIds(new Set());
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTopic('');
    setSelectedWeeklyTest('');
    setSelectedModelSet('');
  };

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllOnPage = () => {
    if (selectedIds.size === questions.length && questions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map(q => q._id)));
    }
  };

  // Delete Single Question
  const handleDeleteSingle = async (question) => {
    const qSnippet = (question.questionText || '').slice(0, 60);
    if (!window.confirm(`Are you sure you want to permanently delete this question?\n\n"${qSnippet}..."`)) {
      return;
    }

    setIsDeleting(true);
    try {
      if (activeTab === 'mock') {
        await api.delete(`/admin/mock-questions/${question._id}`);
      } else {
        await api.delete(`/admin/questions/${question._id}`);
      }
      showStatus('success', 'Question deleted successfully');
      fetchQuestions();
    } catch (err) {
      console.error('Single delete error:', err);
      showStatus('error', err.response?.data?.message || 'Failed to delete question');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Selected Questions (Bulk)
  const handleDeleteSelected = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    if (!window.confirm(`Are you sure you want to permanently delete the ${count} selected question(s)?\n\nThis action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await api.post('/admin/questions/bulk-delete', {
        ids: Array.from(selectedIds),
        type: activeTab
      });
      showStatus('success', res.data.message || `Deleted ${count} question(s)`);
      setSelectedIds(new Set());
      fetchQuestions();
    } catch (err) {
      console.error('Bulk delete error:', err);
      showStatus('error', err.response?.data?.message || 'Failed to delete selected questions');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Entire Topic / Test Scope
  const handleDeleteCurrentScope = async () => {
    let scopeLabel = '';
    const payload = { scope: activeTab };

    if (activeTab === 'topic') {
      if (!selectedTopic && !selectedCategory) {
        alert('Please select a specific Topic or Category from the filter dropdown first to delete all its questions.');
        return;
      }
      payload.topic = selectedTopic || undefined;
      payload.category = selectedCategory || undefined;
      scopeLabel = selectedTopic ? `Topic: "${selectedTopic}"` : `Category: "${selectedCategory}"`;
    } else if (activeTab === 'weekly') {
      if (!selectedWeeklyTest) {
        alert('Please select a specific Weekly Test from the dropdown first.');
        return;
      }
      payload.weeklyTestId = selectedWeeklyTest;
      const testObj = filterOptions.weeklyTests.find(w => w._id === selectedWeeklyTest);
      scopeLabel = `Weekly Test: "${testObj?.title || testObj?.weekName || selectedWeeklyTest}"`;
    } else if (activeTab === 'mock') {
      if (!selectedModelSet) {
        alert('Please select a specific Mock Model Set from the dropdown first.');
        return;
      }
      payload.modelSet = selectedModelSet;
      scopeLabel = `Mock Model: "${selectedModelSet}"`;
    }

    if (!window.confirm(`⚠️ WARNING: DELETE ENTIRE SCOPE\n\nAre you sure you want to permanently DELETE ALL questions for ${scopeLabel}?\n\nAll questions will be erased from MongoDB immediately.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await api.post('/admin/questions/delete-by-scope', payload);
      showStatus('success', res.data.message || `Deleted scope successfully`);
      setSelectedIds(new Set());
      setSelectedTopic('');
      setSelectedCategory('');
      setSelectedWeeklyTest('');
      setSelectedModelSet('');
      fetchQuestions();
    } catch (err) {
      console.error('Scope delete error:', err);
      showStatus('error', err.response?.data?.message || 'Failed to delete questions for this scope');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Entire Weekly Test (All Questions or Entire Test Record)
  const handleDeleteWeeklyTest = async (testId, testName, deleteDoc = false) => {
    const confirmPrompt = deleteDoc
      ? `⚠️ DELETE ENTIRE WEEKLY TEST RECORD & QUESTIONS\n\nAre you sure you want to permanently delete "${testName}" along with all of its questions from MongoDB?\n\nThis cannot be undone.`
      : `⚠️ DELETE ALL QUESTIONS FOR ${testName.toUpperCase()}\n\nAre you sure you want to delete all uploaded questions for this week?\n\nThe Weekly Test itself will remain with 0 questions.`;

    if (!window.confirm(confirmPrompt)) return;

    setIsDeleting(true);
    try {
      const res = await api.post('/admin/questions/delete-by-scope', {
        scope: 'weekly',
        weeklyTestId: testId,
        deleteTestDoc: deleteDoc
      });
      showStatus('success', res.data.message || `Deleted weekly test questions successfully`);
      setSelectedIds(new Set());
      if (selectedWeeklyTest === testId && deleteDoc) {
        setSelectedWeeklyTest('');
      }
      fetchQuestions();
    } catch (err) {
      console.error('Delete weekly test error:', err);
      showStatus('error', err.response?.data?.message || 'Failed to delete weekly test questions');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Topic Questions (All or Just Latest Upload Batch)
  const handleDeleteTopicScope = async (topicName, categoryName, isLatestBatchOnly = false) => {
    const targetLabel = topicName || categoryName || 'selected topic';
    const confirmPrompt = isLatestBatchOnly
      ? `⚡ UNDO / DELETE LATEST UPLOAD FOR "${targetLabel.toUpperCase()}"\n\nAre you sure you want to delete ONLY the most recently uploaded batch of questions for this topic?\n\nEarlier questions will NOT be deleted.`
      : `⚠️ DELETE ALL QUESTIONS FOR "${targetLabel.toUpperCase()}"\n\nAre you sure you want to permanently delete ALL questions for this topic?\n\nAll questions under this topic will be erased immediately.`;

    if (!window.confirm(confirmPrompt)) return;

    setIsDeleting(true);
    try {
      const res = await api.post('/admin/questions/delete-by-scope', {
        scope: 'topic',
        topic: topicName || undefined,
        category: categoryName || undefined,
        deleteLatestBatch: isLatestBatchOnly
      });
      showStatus('success', res.data.message || `Deleted topic questions successfully`);
      setSelectedIds(new Set());
      fetchQuestions();
    } catch (err) {
      console.error('Delete topic scope error:', err);
      showStatus('error', err.response?.data?.message || 'Failed to delete topic questions');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAllSelected = questions.length > 0 && selectedIds.size === questions.length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
          Question Bank & Delete Manager
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Manage, search, and delete accidental or mistake questions across Topic Practice, Weekly Tests, and Mock Tests.
        </p>
      </div>

      {/* Status Toast */}
      {statusMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${statusMessage.type === 'success' ? '#86efac' : '#fca5a5'}`,
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Section Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('topic')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'topic' ? '3px solid #14217f' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'topic' ? '#14217f' : '#64748b',
            fontWeight: activeTab === 'topic' ? '800' : '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Layers size={17} />
          <span>📚 Topic / Practice Questions</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('weekly')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'weekly' ? '3px solid #14217f' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'weekly' ? '#14217f' : '#64748b',
            fontWeight: activeTab === 'weekly' ? '800' : '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Calendar size={17} />
          <span>📅 Weekly Test Questions</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('mock')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'mock' ? '3px solid #14217f' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'mock' ? '#14217f' : '#64748b',
            fontWeight: activeTab === 'mock' ? '800' : '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Target size={17} />
          <span>🎯 Mock Test Questions</span>
        </button>
      </div>

      {/* ── BATCH & TOTAL DELETION HUB (Week-by-Week & Topic Uploads) ── */}
      {activeTab === 'weekly' && (filterOptions.weeklyTests || []).length > 0 && (
        <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showBatchHub ? '14px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#14217f" />
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                📅 Weekly Tests Total Deletion Hub ({(filterOptions.weeklyTests || []).length} Tests Configured)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowBatchHub(!showBatchHub)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}
            >
              <span>{showBatchHub ? 'Hide Weekly Hub' : 'Show Weekly Hub'}</span>
              {showBatchHub ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {showBatchHub && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {(filterOptions.weeklyTests || []).map((wt) => (
                <div
                  key={wt._id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                        {wt.title || wt.weekName || `Week ${wt.weekNumber}`}
                      </strong>
                      <span style={{ fontSize: '11px', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                        {wt.totalQuestions || 0} Qs
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
                      Topic: {wt.topic || 'Weekly Exam'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteWeeklyTest(wt._id, wt.title || wt.weekName || `Week ${wt.weekNumber}`, false)}
                      disabled={isDeleting || !wt.totalQuestions}
                      title="Delete all uploaded questions in this week (resets question count to 0)"
                      style={{
                        flex: 1,
                        backgroundColor: wt.totalQuestions ? '#fee2e2' : '#f1f5f9',
                        color: wt.totalQuestions ? '#991b1b' : '#94a3b8',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: wt.totalQuestions ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete All Qs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteWeeklyTest(wt._id, wt.title || wt.weekName || `Week ${wt.weekNumber}`, true)}
                      disabled={isDeleting}
                      title="Delete entire weekly test document from database"
                      style={{
                        backgroundColor: '#fff1f2',
                        color: '#be123c',
                        border: '1px solid #fecdd3',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Delete Test</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'topic' && (filterOptions.topicSummaries || []).length > 0 && (
        <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showBatchHub ? '14px' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#14217f" />
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                📚 Topic Uploads & Total Deletion Hub ({(filterOptions.topicSummaries || []).length} Topics with Questions)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowBatchHub(!showBatchHub)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}
            >
              <span>{showBatchHub ? 'Hide Topics Hub' : 'Show Topics Hub'}</span>
              {showBatchHub ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {showBatchHub && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {(filterOptions.topicSummaries || []).map((t) => (
                <div
                  key={t.topic}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{t.topic}</strong>
                      <span style={{ fontSize: '11px', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                        {t.count} Qs
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
                      Category: {t.category || 'General'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteTopicScope(t.topic, t.category, true)}
                      disabled={isDeleting || !t.count}
                      title="Undo / delete only the latest uploaded batch for this topic (preserves older questions)"
                      style={{
                        flex: 1,
                        backgroundColor: '#fffbeb',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: t.count ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Undo2 size={13} />
                      <span>Undo Latest</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTopicScope(t.topic, t.category, false)}
                      disabled={isDeleting || !t.count}
                      title="Delete ALL questions in this topic"
                      style={{
                        flex: 1,
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: t.count ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete All Qs</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter & Action Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search question text or keyword..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Dynamic Dropdown Filters based on Tab */}
          {activeTab === 'topic' && (
            <>
              <select
                className="form-select"
                style={{ width: '200px' }}
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                className="form-select"
                style={{ width: '220px' }}
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Topics</option>
                {filterOptions.topics.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </>
          )}

          {activeTab === 'weekly' && (
            <select
              className="form-select"
              style={{ width: '280px' }}
              value={selectedWeeklyTest}
              onChange={(e) => {
                setSelectedWeeklyTest(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Weekly Tests</option>
              {filterOptions.weeklyTests.map(w => (
                <option key={w._id} value={w._id}>
                  {w.title || w.weekName || 'Week Test'} ({w.totalQuestions || 0} Qs)
                </option>
              ))}
            </select>
          )}

          {activeTab === 'mock' && (
            <select
              className="form-select"
              style={{ width: '220px' }}
              value={selectedModelSet}
              onChange={(e) => {
                setSelectedModelSet(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Model Sets</option>
              {filterOptions.mockModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            className="btn btn-outline"
            onClick={fetchQuestions}
            disabled={loading}
            title="Reload questions"
            style={{ padding: '8px 14px' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Bulk Action Strip */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={handleSelectAllOnPage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              {isAllSelected ? (
                <CheckSquare size={17} color="#14217f" />
              ) : (
                <Square size={17} color="#94a3b8" />
              )}
              <span>Select All on Page ({questions.length})</span>
            </button>

            {selectedIds.size > 0 && (
              <span
                style={{
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                {selectedIds.size} Selected
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Delete Selected Button */}
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.25)'
                }}
              >
                <Trash2 size={15} />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            )}

            {/* Scope Delete Buttons for Topic */}
            {activeTab === 'topic' && (selectedTopic || selectedCategory) && (
              <>
                <button
                  type="button"
                  onClick={() => handleDeleteTopicScope(selectedTopic, selectedCategory, true)}
                  disabled={isDeleting}
                  title="Undo / delete only the latest uploaded batch of questions for this topic"
                  style={{
                    backgroundColor: '#fffbeb',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Undo2 size={15} />
                  <span>Undo Latest Upload</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteTopicScope(selectedTopic, selectedCategory, false)}
                  disabled={isDeleting}
                  style={{
                    backgroundColor: '#fff1f2',
                    color: '#be123c',
                    border: '1px solid #fecdd3',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <AlertTriangle size={15} />
                  <span>Delete All Qs in {selectedTopic || selectedCategory}</span>
                </button>
              </>
            )}

            {/* Scope Delete Buttons for Weekly Test */}
            {activeTab === 'weekly' && selectedWeeklyTest && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const wt = filterOptions.weeklyTests.find(w => w._id === selectedWeeklyTest);
                    handleDeleteWeeklyTest(selectedWeeklyTest, wt?.title || wt?.weekName || 'This Weekly Test', false);
                  }}
                  disabled={isDeleting}
                  title="Delete all questions in this week (resets question count to 0)"
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={15} />
                  <span>Delete All Qs in This Week</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const wt = filterOptions.weeklyTests.find(w => w._id === selectedWeeklyTest);
                    handleDeleteWeeklyTest(selectedWeeklyTest, wt?.title || wt?.weekName || 'This Weekly Test', true);
                  }}
                  disabled={isDeleting}
                  title="Permanently remove entire weekly test document"
                  style={{
                    backgroundColor: '#fff1f2',
                    color: '#be123c',
                    border: '1px solid #fecdd3',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <span>Delete Test Record</span>
                </button>
              </>
            )}

            {/* Scope Delete Button for Mock Models */}
            {activeTab === 'mock' && selectedModelSet && (
              <button
                type="button"
                onClick={handleDeleteCurrentScope}
                disabled={isDeleting}
                style={{
                  backgroundColor: '#fff1f2',
                  color: '#be123c',
                  border: '1px solid #fecdd3',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontWeight: '700',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <AlertTriangle size={15} />
                <span>Delete All in {selectedModelSet}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <div className="table-container">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
            Showing {questions.length} of {totalCount} Questions
          </span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Page {page} of {totalPages}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '10px' }}>
              <RefreshCw size={24} color="#14217f" />
            </div>
            <div>Loading questions...</div>
          </div>
        ) : questions.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <HelpCircle size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#334155' }}>No Questions Found</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              Try adjusting your search query or dropdown filters.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '12px 14px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAllOnPage}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
                  <th style={{ padding: '12px 14px', width: '50px' }}>#</th>
                  <th style={{ padding: '12px 14px', minWidth: '280px' }}>Question Text</th>
                  <th style={{ padding: '12px 14px', minWidth: '260px' }}>Options (A, B, C, D)</th>
                  <th style={{ padding: '12px 14px', width: '80px', textAlign: 'center' }}>Ans</th>
                  <th style={{ padding: '12px 14px', width: '160px' }}>
                    {activeTab === 'topic' ? 'Category / Topic' : activeTab === 'weekly' ? 'Weekly Test' : 'Model Set'}
                  </th>
                  <th style={{ padding: '12px 14px', width: '100px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => {
                  const isChecked = selectedIds.has(q._id);
                  const rowNumber = (page - 1) * 50 + (idx + 1);

                  return (
                    <tr
                      key={q._id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isChecked ? '#f0f4ff' : 'transparent',
                        transition: 'background-color 0.15s'
                      }}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(q._id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontWeight: '600' }}>
                        {rowNumber}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: '600', lineHeight: '1.4' }}>
                        <div>{q.questionText}</div>
                        {q.explanation ? (
                          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: '500' }}>
                            💡 {q.explanation}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569', fontSize: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                          <div><span style={{ fontWeight: '700', color: '#0f172a' }}>A:</span> {q.optionA}</div>
                          <div><span style={{ fontWeight: '700', color: '#0f172a' }}>B:</span> {q.optionB}</div>
                          <div><span style={{ fontWeight: '700', color: '#0f172a' }}>C:</span> {q.optionC}</div>
                          <div><span style={{ fontWeight: '700', color: '#0f172a' }}>D:</span> {q.optionD}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                        >
                          {q.correctAnswer}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {activeTab === 'topic' && (
                          <div>
                            <span style={{ display: 'inline-block', backgroundColor: '#e2e8f0', color: '#1e293b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', marginBottom: '2px' }}>
                              {q.topic || 'General'}
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{q.category}</div>
                          </div>
                        )}
                        {activeTab === 'weekly' && (
                          <div>
                            <span style={{ display: 'inline-block', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                              {q.weeklyTestId?.title || q.weeklyTestId?.weekName || 'Weekly Test'}
                            </span>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{q.topic}</div>
                          </div>
                        )}
                        {activeTab === 'mock' && (
                          <span style={{ display: 'inline-block', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                            {q.modelSet || 'Model 1'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(q)}
                          disabled={isDeleting}
                          title="Delete this question"
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #fecdd3',
                            color: '#e11d48',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffe4e6')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

