import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
  Award,
  Download,
  Search,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  UserX
} from 'lucide-react';

export default function TestResults() {
  const [results, setResults] = useState([]);
  const [notAttempted, setNotAttempted] = useState([]);
  const [weeklyTests, setWeeklyTests] = useState([]);
  const [dbTopics, setDbTopics] = useState([]);
  const [selectedWeeklyTest, setSelectedWeeklyTest] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'passed' | 'failed' | 'not-attempted'
  const [loading, setLoading] = useState(true);

  // Breakdown Modal
  const [showModal, setShowModal] = useState(false);
  const [breakdownData, setBreakdownData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchWeeklyTests();
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await api.get('/topics');
      setDbTopics(res.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchResults();
  }, [selectedWeeklyTest, selectedTopic]);

  const fetchWeeklyTests = async () => {
    try {
      const res = await api.get('/admin/weekly');
      setWeeklyTests(res.data || []);
    } catch (e) {}
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedWeeklyTest) params.append('weeklyTestId', selectedWeeklyTest);
      if (selectedTopic && selectedTopic !== 'all') params.append('topic', selectedTopic);

      const notAttParams = new URLSearchParams();
      if (selectedWeeklyTest) notAttParams.append('weeklyTestId', selectedWeeklyTest);

      const [resData, notAttData] = await Promise.all([
        api.get(`/admin/results?${params.toString()}`),
        api.get(`/admin/results/not-attempted?${notAttParams.toString()}`)
      ]);
      setResults(resData.data || []);
      setNotAttempted(notAttData.data || []);
    } catch (e) {
      console.error('Failed to load results:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBreakdown = async (id) => {
    setShowModal(true);
    setLoadingDetails(true);
    setBreakdownData(null);
    try {
      const res = await api.get(`/admin/results/${id}/details`);
      setBreakdownData(res.data);
    } catch (e) {
      alert('Failed to load result breakdown');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Helper to determine pass mark and pass/fail status
  const getPassDetails = (r) => {
    const testPassMarks = r.weeklyTestId?.passMarks;
    const testPassPct = r.weeklyTestId?.passPercentage || 50;
    const total = r.total || 0;
    const passMark = (testPassMarks !== undefined && testPassMarks > 0)
      ? testPassMarks
      : Math.ceil(total * (testPassPct / 100));
    const passed = (r.isPassed !== undefined && r.isPassed !== null)
      ? r.isPassed
      : (r.score >= passMark);
    return { passMark, passed };
  };

  // Dynamic unique topics list from DB + tests + results
  const availableTopics = useMemo(() => {
    const topicsSet = new Set();
    dbTopics.forEach(t => { if (t.name) topicsSet.add(t.name); });
    weeklyTests.forEach(t => { if (t.topic) topicsSet.add(t.topic); });
    results.forEach(r => {
      if (r.weeklyTestId?.topic) topicsSet.add(r.weeklyTestId.topic);
      if (r.category) topicsSet.add(r.category);
    });
    return Array.from(topicsSet).sort();
  }, [dbTopics, weeklyTests, results]);

  // Search filtered results
  const searchFilteredResults = useMemo(() => {
    if (!searchQuery.trim()) return results;
    const q = searchQuery.toLowerCase().trim();
    return results.filter(r => {
      const sName = (r.student?.name || '').toLowerCase();
      const sEmail = (r.student?.email || '').toLowerCase();
      const sPhone = (r.student?.phone || '').toLowerCase();
      const sCourse = (r.student?.courseName || '').toLowerCase();
      const sTrainer = (r.student?.trainerName || '').toLowerCase();
      const testTitle = (r.weeklyTestId?.title || r.weeklyTestId?.weekName || '').toLowerCase();
      const testTopic = (r.weeklyTestId?.topic || r.category || '').toLowerCase();
      return (
        sName.includes(q) ||
        sEmail.includes(q) ||
        sPhone.includes(q) ||
        sCourse.includes(q) ||
        sTrainer.includes(q) ||
        testTitle.includes(q) ||
        testTopic.includes(q)
      );
    });
  }, [results, searchQuery]);

  // Search filtered unattempted students
  const searchFilteredNotAttempted = useMemo(() => {
    if (!searchQuery.trim()) return notAttempted;
    const q = searchQuery.toLowerCase().trim();
    return notAttempted.filter(st => {
      const name = (st.name || '').toLowerCase();
      const email = (st.email || '').toLowerCase();
      const phone = (st.phone || '').toLowerCase();
      const course = (st.courseName || '').toLowerCase();
      const trainer = (st.trainerName || '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        course.includes(q) ||
        trainer.includes(q)
      );
    });
  }, [notAttempted, searchQuery]);

  const passedResults = useMemo(() => {
    return searchFilteredResults.filter(r => getPassDetails(r).passed);
  }, [searchFilteredResults]);

  const failedResults = useMemo(() => {
    return searchFilteredResults.filter(r => !getPassDetails(r).passed);
  }, [searchFilteredResults]);

  const displayedSubmissions = useMemo(() => {
    if (activeTab === 'passed') return passedResults;
    if (activeTab === 'failed') return failedResults;
    return searchFilteredResults;
  }, [activeTab, searchFilteredResults, passedResults, failedResults]);

  const allSubmissionsCount = searchFilteredResults.length;
  const passedCount = passedResults.length;
  const failedCount = failedResults.length;
  const passRate = allSubmissionsCount > 0 ? Math.round((passedCount / allSubmissionsCount) * 100) : 0;
  const currentSelectedTestObj = weeklyTests.find(t => t._id === selectedWeeklyTest);

  const handleExportCSV = () => {
    if (results.length === 0) return alert('No results to export');

    const headers = [
      'Student Name',
      'Email',
      'Phone',
      'Course',
      'Trainer',
      'Weekly Test',
      'Topic',
      'Score',
      'Total',
      'Pass Mark Required',
      'Evaluation Status',
      'Percentage',
      'Time Taken (s)',
      'Submitted Date'
    ];

    const rows = displayedSubmissions.map(r => {
      const { passMark, passed } = getPassDetails(r);
      const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
      return [
        `"${r.student?.name || 'Anonymous'}"`,
        `"${r.student?.email || ''}"`,
        `"${r.student?.phone || ''}"`,
        `"${r.student?.courseName || ''}"`,
        `"${r.student?.trainerName || ''}"`,
        `"${r.weeklyTestId?.title || r.weeklyTestId?.weekName || 'General'}"`,
        `"${r.weeklyTestId?.topic || r.category || 'General'}"`,
        r.score,
        r.total,
        passMark,
        passed ? 'PASS' : 'FAIL',
        `${pct}%`,
        r.timeTaken,
        `"${new Date(r.submittedAt).toLocaleString()}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `weekly_test_results_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Top Header Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="#14217f" />
              <span>Weekly Test Results & Evaluation</span>
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Track student test scores, evaluate Pass / Fail status, and filter across weekly tests and topics
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleExportCSV} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Bar: Weekly Test, Topic, Search */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: '1px solid #e2e8f0'
        }}>
          {/* Weekly Test Selector */}
          <div>
            <label className="form-label" style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
              Select Weekly Test:
            </label>
            <select
              className="form-select"
              value={selectedWeeklyTest}
              onChange={e => setSelectedWeeklyTest(e.target.value)}
              style={{ fontSize: '13px', padding: '8px 12px' }}
            >
              <option value="">All Weekly Tests</option>
              {weeklyTests.map(t => (
                <option key={t._id} value={t._id}>
                  {t.weekName || t.title} ({t.topic}) {t.passMarks > 0 ? `• Pass: ${t.passMarks}` : `• Pass: ${t.passPercentage || 50}%`}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Selector */}
          <div>
            <label className="form-label" style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
              Filter by Topic / Subject:
            </label>
            <select
              className="form-select"
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              style={{ fontSize: '13px', padding: '8px 12px' }}
            >
              <option value="all">All Topics</option>
              {availableTopics.map(top => (
                <option key={top} value={top}>{top}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="form-label" style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
              Search Students / Course:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search name, email, phone, trainer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ fontSize: '13px', padding: '8px 12px 8px 34px' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KPI Mini-Stats Bar */}
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#64748b' }}>Total Submissions:</span>
            <strong style={{ color: '#0f172a' }}>{allSubmissionsCount}</strong>
          </div>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#166534' }}>Passed:</span>
            <strong style={{ color: '#166534' }}>{passedCount} ({passRate}%)</strong>
          </div>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#991b1b' }}>Failed:</span>
            <strong style={{ color: '#991b1b' }}>{failedCount}</strong>
          </div>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#475569' }}>Unattempted:</span>
            <strong style={{ color: '#d97706' }}>{searchFilteredNotAttempted.length}</strong>
          </div>
          {currentSelectedTestObj && (
            <>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#14217f' }}>🎯 Required Pass Mark:</span>
                <strong style={{ color: '#14217f' }}>
                  {currentSelectedTestObj.passMarks > 0 ? `${currentSelectedTestObj.passMarks} Marks` : `${currentSelectedTestObj.passPercentage || 50}%`}
                </strong>
              </div>
            </>
          )}
        </div>

        {/* 4 Segmented Tabs: All, Passed, Failed, Unattempted */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '18px',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '16px',
          flexWrap: 'wrap'
        }}>
          {/* Tab 1: All Submissions */}
          <button
            onClick={() => setActiveTab('all')}
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
          >
            <span>All Submissions ({allSubmissionsCount})</span>
          </button>

          {/* Tab 2: Passed Students */}
          <button
            onClick={() => setActiveTab('passed')}
            className="btn btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '700',
              backgroundColor: activeTab === 'passed' ? '#16a34a' : '#dcfce7',
              color: activeTab === 'passed' ? '#ffffff' : '#166534',
              borderColor: activeTab === 'passed' ? '#16a34a' : '#86efac',
            }}
          >
            <CheckCircle2 size={14} />
            <span>Passed Students ({passedCount})</span>
          </button>

          {/* Tab 3: Failed Students */}
          <button
            onClick={() => setActiveTab('failed')}
            className="btn btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '700',
              backgroundColor: activeTab === 'failed' ? '#dc2626' : '#fee2e2',
              color: activeTab === 'failed' ? '#ffffff' : '#991b1b',
              borderColor: activeTab === 'failed' ? '#dc2626' : '#fca5a5',
            }}
          >
            <XCircle size={14} />
            <span>Failed Students ({failedCount})</span>
          </button>

          {/* Tab 4: Unattempted Students */}
          <button
            onClick={() => setActiveTab('not-attempted')}
            className={`btn ${activeTab === 'not-attempted' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
          >
            <Clock size={14} />
            <span>Unattempted Students ({searchFilteredNotAttempted.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab !== 'not-attempted' ? (
        /* Submissions Table (All, Passed, Failed) */
        <div className="table-container">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              Loading test results...
            </div>
          ) : displayedSubmissions.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              {activeTab === 'passed' && 'No passed students found for this filter.'}
              {activeTab === 'failed' && 'No failed students found for this filter.'}
              {activeTab === 'all' && 'No submissions found.'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course / Trainer</th>
                  <th>Test & Topic</th>
                  <th>Score & Requirement</th>
                  <th>Evaluation Status</th>
                  <th>Time Taken</th>
                  <th>Submitted At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedSubmissions.map(r => {
                  const { passMark, passed } = getPassDetails(r);
                  const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                  return (
                    <tr key={r._id}>
                      <td>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>
                          {r.student?.name || 'Anonymous'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          {r.student?.email}
                        </div>
                        {r.student?.phone && (
                          <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                            📱 {r.student.phone}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                          {r.student?.courseName || 'General'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Trainer: {r.student?.trainerName || 'SLA'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>
                          {r.weeklyTestId?.title || r.weeklyTestId?.weekName || 'Weekly Test'}
                        </div>
                        <div style={{ marginTop: '3px' }}>
                          <span className="badge badge-blue" style={{ fontSize: '11px' }}>
                            {r.weeklyTestId?.topic || r.category || 'General'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '800', color: '#14217f', fontSize: '15px' }}>
                          {r.score} / {r.total}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Pass Mark: <strong>{passMark}</strong>
                        </div>
                      </td>
                      <td>
                        {passed ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              border: '1.5px solid #86efac',
                              fontWeight: '800',
                              fontSize: '12px'
                            }}
                          >
                            <CheckCircle2 size={13} />
                            <span>PASS ({pct}%)</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1.5px solid #fca5a5',
                              fontWeight: '800',
                              fontSize: '12px'
                            }}
                          >
                            <XCircle size={13} />
                            <span>FAIL ({pct}%)</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                          <Clock size={13} />
                          <span>{Math.round((r.timeTaken || 0) / 60)}m</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: '#334155' }}>
                          {new Date(r.submittedAt).toLocaleDateString()}
                        </span>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                          {new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenBreakdown(r._id)}
                          className="btn btn-secondary btn-sm"
                          title="View Question Mistakes Breakdown"
                        >
                          <Eye size={13} />
                          <span>View Mistakes</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Not Attempted Students Table */
        <div className="table-container">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
              {selectedWeeklyTest && currentSelectedTestObj
                ? `Students who have not attempted "${currentSelectedTestObj.title || currentSelectedTestObj.weekName}" (${searchFilteredNotAttempted.length})`
                : `Students who have not attempted the active weekly test (${searchFilteredNotAttempted.length})`}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Only active enrolled students are listed
            </span>
          </div>

          {searchFilteredNotAttempted.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              All registered students have attempted this test! 🎉
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Course</th>
                  <th>Trainer</th>
                  <th>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {searchFilteredNotAttempted.map(st => (
                  <tr key={st._id}>
                    <td style={{ fontWeight: '700', color: '#0f172a' }}>{st.name}</td>
                    <td>{st.email}</td>
                    <td>{st.phone || 'N/A'}</td>
                    <td>{st.courseName || 'General'}</td>
                    <td>{st.trainerName || 'SLA'}</td>
                    <td>{new Date(st.registerDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* View Mistakes / Breakdown Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Detailed Test Evaluation & Answer Breakdown
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
                  Loading student answers and questions...
                </div>
              ) : !breakdownData ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No breakdown details found.
                </div>
              ) : (
                <div>
                  {/* Summary Bar */}
                  {(() => {
                    const { passMark, passed } = getPassDetails(breakdownData.result || {});
                    return (
                      <div style={{
                        backgroundColor: '#f8fafc',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                            {breakdownData.result?.student?.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {breakdownData.result?.student?.courseName} | Trainer: {breakdownData.result?.student?.trainerName}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                backgroundColor: passed ? '#dcfce7' : '#fee2e2',
                                color: passed ? '#15803d' : '#b91c1c',
                                border: `1.5px solid ${passed ? '#86efac' : '#fca5a5'}`,
                                fontWeight: '800',
                                fontSize: '13px'
                              }}
                            >
                              {passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                              <span>{passed ? 'PASSED' : 'FAILED'}</span>
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#14217f' }}>
                              Score: {breakdownData.result?.score} / {breakdownData.result?.total}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              Pass Mark: <strong>{passMark}</strong> • Time: {Math.round((breakdownData.result?.timeTaken || 0) / 60)}m
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Questions Breakdown List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {(breakdownData.questions || []).map((q, idx) => {
                      const studentAns = (breakdownData.submittedAnswers || {})[q._id];
                      const isCorrect = studentAns && studentAns.toString().trim().toUpperCase() === q.correctAnswer?.trim().toUpperCase();

                      return (
                        <div
                          key={q._id}
                          style={{
                            padding: '16px',
                            borderRadius: '10px',
                            backgroundColor: '#fff',
                            border: `1.5px solid ${isCorrect ? '#86efac' : '#fca5a5'}`
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
                              #{idx + 1}. {q.questionText}
                            </span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '800',
                              color: isCorrect ? '#166534' : '#b91c1c'
                            }}>
                              {isCorrect ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                              <span>{isCorrect ? 'Correct' : 'Mistake / Wrong'}</span>
                            </span>
                          </div>

                          <div className="grid-cols-2" style={{ gap: '8px', marginTop: '10px' }}>
                            {['A', 'B', 'C', 'D'].map(optKey => {
                              const isStudentSelected = studentAns?.toUpperCase() === optKey;
                              const isCorrectOpt = q.correctAnswer?.toUpperCase() === optKey;

                              let bg = '#f8fafc';
                              let border = '#e2e8f0';
                              let textCol = '#334155';

                              if (isCorrectOpt) {
                                bg = '#dcfce7';
                                border = '#16a34a';
                                textCol = '#166534';
                              } else if (isStudentSelected && !isCorrectOpt) {
                                bg = '#fee2e2';
                                border = '#dc2626';
                                textCol = '#991b1b';
                              }

                              return (
                                <div
                                  key={optKey}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: bg,
                                    border: `1px solid ${border}`,
                                    fontSize: '12.5px',
                                    fontWeight: (isStudentSelected || isCorrectOpt) ? '700' : '400',
                                    color: textCol,
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <span>{optKey}: {q[`option${optKey}`]}</span>
                                  {isStudentSelected && <span style={{ fontSize: '10.5px' }}>[Student Pick]</span>}
                                  {isCorrectOpt && <span style={{ fontSize: '10.5px' }}>[Correct]</span>}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px' }}>
                              💡 <strong>Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
