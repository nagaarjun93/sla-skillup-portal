import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Award, Download, Eye, Clock, CheckCircle2, XCircle, X } from 'lucide-react';

export default function MockTestResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Details
  const [showModal, setShowModal] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchMockResults();
  }, []);

  const fetchMockResults = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/mock/results');
      setResults(res.data || []);
    } catch (e) {
      console.error('Failed to load mock results:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (id) => {
    setShowModal(true);
    setLoadingDetails(true);
    setBreakdown(null);
    try {
      const res = await api.get(`/admin/mock/results/${id}/details`);
      setBreakdown(res.data);
    } catch (e) {
      alert('Failed to load mock result details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExportCsv = () => {
    if (results.length === 0) return alert('No mock results to export');

    const headers = ['Student Name', 'Email', 'Phone', 'Course', 'Assigned Model', 'Score', 'Total', 'Percentage', 'Status', 'Time Taken (s)', 'Date'];
    const rows = results.map(r => [
      `"${r.student?.name || 'Anonymous'}"`,
      `"${r.student?.email || ''}"`,
      `"${r.student?.phone || ''}"`,
      `"${r.student?.courseName || ''}"`,
      `"${r.student?.assignedMockModel || 'Model 1'}"`,
      r.score,
      r.total,
      `${r.percentage}%`,
      r.passStatus,
      r.timeTaken || 0,
      `"${new Date(r.submittedAt).toLocaleString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `official_mock_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              Official Mock Test Evaluation & Results
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Review student assessment performance, PASS/FAIL rankings, and detailed answers
            </p>
          </div>

          <button onClick={handleExportCsv} className="btn btn-secondary">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading mock results...
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            No mock test submissions recorded yet.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Model Set</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Time Taken</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>
                      {r.student?.name || 'Anonymous'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {r.student?.email}
                    </div>
                  </td>
                  <td>
                    <div>{r.student?.courseName || 'General'}</div>
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      {r.student?.assignedMockModel || 'Model 1'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '800', color: '#14217f', fontSize: '15px' }}>
                    {r.score} / {r.total}
                  </td>
                  <td style={{ fontWeight: '700' }}>
                    {r.percentage}%
                  </td>
                  <td>
                    <span className={`badge ${r.passStatus === 'PASS' ? 'badge-pass' : 'badge-fail'}`}>
                      {r.passStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                      <Clock size={13} />
                      <span>{Math.round((r.timeTaken || 0) / 60)}m</span>
                    </div>
                  </td>
                  <td>{new Date(r.submittedAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenDetails(r._id)}
                      className="btn btn-secondary btn-sm"
                      title="View Question Mistakes"
                    >
                      <Eye size={13} />
                      <span>View Breakdown</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Breakdown Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Official Mock Test Breakdown</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {loadingDetails ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading mock breakdown...</div>
              ) : !breakdown ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No details found.</div>
              ) : (
                <div>
                  {/* Summary */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '800' }}>{breakdown.result?.student?.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {breakdown.result?.student?.courseName} | Assigned Model: {breakdown.result?.student?.assignedMockModel || 'Model 1'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#14217f' }}>
                        Score: {breakdown.result?.score} / {breakdown.result?.total} ({breakdown.result?.percentage}%)
                      </div>
                      <span className={`badge ${breakdown.result?.passStatus === 'PASS' ? 'badge-pass' : 'badge-fail'}`}>
                        {breakdown.result?.passStatus}
                      </span>
                    </div>
                  </div>

                  {/* Questions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {(breakdown.questions || []).map((q, idx) => {
                      const studentAns = (breakdown.submittedAnswers || {})[q._id];
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
                              const isStudentPick = studentAns?.toUpperCase() === optKey;
                              const isCorrectOpt = q.correctAnswer?.toUpperCase() === optKey;

                              let bg = '#f8fafc';
                              let border = '#e2e8f0';
                              let textCol = '#334155';

                              if (isCorrectOpt) {
                                bg = '#dcfce7';
                                border = '#16a34a';
                                textCol = '#166534';
                              } else if (isStudentPick && !isCorrectOpt) {
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
                                    fontWeight: (isStudentPick || isCorrectOpt) ? '700' : '400',
                                    color: textCol,
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <span>{optKey}: {q[`option${optKey}`]}</span>
                                  {isStudentPick && <span style={{ fontSize: '10.5px' }}>[Student Pick]</span>}
                                  {isCorrectOpt && <span style={{ fontSize: '10.5px' }}>[Correct]</span>}
                                </div>
                              );
                            })}
                          </div>
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

