import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Edit2, Save, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ThisWeekQuestions() {
  const [activeTest, setActiveTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchActiveWeeklyTest();
  }, []);

  const fetchActiveWeeklyTest = async () => {
    setLoading(true);
    try {
      const weeklyRes = await api.get('/admin/weekly');
      const tests = weeklyRes.data || [];
      const current = tests.find(t => t.active) || tests[0];

      if (current) {
        setActiveTest(current);
        const qRes = await api.get(`/admin/questions?weeklyTestId=${current._id}`);
        setQuestions(qRes.data || []);
      }
    } catch (e) {
      console.error('Failed to load this week questions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (q) => {
    setEditingId(q._id);
    setEditForm({ ...q });
    setMsg('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await api.put(`/admin/questions/${editingId}`, editForm);
      setQuestions(prev => prev.map(q => q._id === editingId ? res.data : q));
      setEditingId(null);
      setMsg('Question updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading active weekly test questions...</div>;
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
          📝 This Week's Active Test Questions
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Active Test: <strong>{activeTest?.title || activeTest?.weekName || 'No live weekly test'}</strong> ({questions.length} questions attached)
        </p>

        {msg && (
          <div style={{
            marginTop: '12px',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{msg}</span>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
          No questions attached to the active weekly test yet. Go to "Weekly Tests" to attach questions.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {questions.map((q, index) => {
            const isEditing = editingId === q._id;

            return (
              <div key={q._id} className="card">
                {isEditing ? (
                  /* Edit Mode */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{ fontWeight: '800', color: '#14217f', fontSize: '15px' }}>
                        Editing Question #{index + 1}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleCancelEdit} className="btn btn-secondary btn-sm">
                          <X size={14} />
                          <span>Cancel</span>
                        </button>
                        <button onClick={handleSaveEdit} className="btn btn-primary btn-sm" disabled={saving}>
                          <Save size={14} />
                          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Question Text</label>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        value={editForm.questionText}
                        onChange={e => setEditForm({ ...editForm, questionText: e.target.value })}
                      />
                    </div>

                    <div className="grid-cols-2">
                      <div className="form-group">
                        <label className="form-label">Option A</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.optionA}
                          onChange={e => setEditForm({ ...editForm, optionA: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Option B</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.optionB}
                          onChange={e => setEditForm({ ...editForm, optionB: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Option C</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.optionC}
                          onChange={e => setEditForm({ ...editForm, optionC: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Option D</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.optionD}
                          onChange={e => setEditForm({ ...editForm, optionD: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid-cols-2">
                      <div className="form-group">
                        <label className="form-label">Correct Answer</label>
                        <select
                          className="form-select"
                          value={editForm.correctAnswer}
                          onChange={e => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                        >
                          <option value="A">Option A</option>
                          <option value="B">Option B</option>
                          <option value="C">Option C</option>
                          <option value="D">Option D</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Topic</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.topic || ''}
                          onChange={e => setEditForm({ ...editForm, topic: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          backgroundColor: '#14217f',
                          color: '#fff',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '800'
                        }}>
                          {index + 1}
                        </span>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                          {q.questionText}
                        </h4>
                      </div>
                      <button onClick={() => handleStartEdit(q)} className="btn btn-secondary btn-sm">
                        <Edit2 size={13} />
                        <span>Quick Edit</span>
                      </button>
                    </div>

                    {/* Options Grid */}
                    <div className="grid-cols-2" style={{ marginTop: '12px' }}>
                      {['A', 'B', 'C', 'D'].map(optKey => {
                        const isCorrect = q.correctAnswer?.toUpperCase() === optKey;
                        return (
                          <div
                            key={optKey}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              backgroundColor: isCorrect ? '#dcfce7' : '#f8fafc',
                              border: isCorrect ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <span style={{
                              fontWeight: '800',
                              color: isCorrect ? '#166534' : '#64748b',
                              fontSize: '12px'
                            }}>
                              {optKey}:
                            </span>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: isCorrect ? '700' : '500',
                              color: isCorrect ? '#166534' : '#0f172a'
                            }}>
                              {q[`option${optKey}`]}
                            </span>
                            {isCorrect && (
                              <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '800', color: '#16a34a' }}>
                                ✓ Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

