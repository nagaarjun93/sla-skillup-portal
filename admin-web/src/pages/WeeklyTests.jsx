import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
  X,
  Layers
} from 'lucide-react';

export default function WeeklyTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    weekName: '',
    topic: '',
    duration: 30,
    passMarks: 10,
    passPercentage: 50,
    startTime: '',
    endTime: '',
    active: true
  });
  const [saving, setSaving] = useState(false);

  // Attach Questions Modal State
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [attaching, setAttaching] = useState(false);
  const [dbTopics, setDbTopics] = useState([]);

  useEffect(() => {
    fetchWeeklyTests();
    fetchDbTopics();
  }, []);

  const fetchDbTopics = async () => {
    try {
      const res = await api.get('/topics');
      setDbTopics(res.data || []);
    } catch (e) {
      console.error('Failed to load DB topics:', e);
    }
  };

  const fetchWeeklyTests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/weekly');
      setTests(res.data || []);
    } catch (e) {
      console.error('Failed to load weekly tests:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/weekly', formData);
      setTests(prev => [res.data, ...prev]);
      setShowCreateModal(false);
      const newTest = res.data;
      setFormData({
        title: '',
        weekName: '',
        topic: '',
        duration: 30,
        passMarks: 10,
        passPercentage: 50,
        startTime: '',
        endTime: '',
        active: true
      });
      if (window.confirm('Weekly test created successfully! 📋\n\nWould you like to attach questions for this test now?')) {
        handleOpenAttachModal(newTest);
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create weekly test');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this weekly test? Attached questions will be unlinked.')) return;
    try {
      await api.delete(`/admin/weekly/${id}`);
      setTests(prev => prev.filter(t => t._id !== id));
    } catch (e) {
      alert('Failed to delete weekly test');
    }
  };

  const handleOpenAttachModal = async (test) => {
    setSelectedTest(test);
    setSelectedQuestionIds([]);
    setShowAttachModal(true);
    try {
      const res = await api.get('/admin/questions');
      setAvailableQuestions(res.data || []);
    } catch (e) {
      alert('Failed to load question bank');
    }
  };

  const handleToggleSelectQuestion = (id) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAttachSubmit = async () => {
    if (selectedQuestionIds.length === 0) {
      alert('Please select at least one question to attach');
      return;
    }
    setAttaching(true);
    try {
      await api.post(`/admin/weekly/${selectedTest._id}/questions`, {
        questionIds: selectedQuestionIds
      });
      alert(`${selectedQuestionIds.length} questions attached to weekly test successfully!`);
      setShowAttachModal(false);
      fetchWeeklyTests();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to attach questions');
    } finally {
      setAttaching(false);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Weekly Tests Schedule</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Configure, schedule and assign questions for live weekly aptitude tests</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/this-week-questions" className="btn btn-secondary">
              <FileText size={16} />
              <span>Review This Week's Questions</span>
            </Link>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Create New Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tests Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading weekly tests schedule...
          </div>
        ) : tests.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            No weekly tests scheduled yet. Click "Create New Test" to begin.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Test Title</th>
                <th>Topic</th>
                <th>Duration</th>
                <th>Assigned Questions</th>
                <th>Pass Mark</th>
                <th>Status</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(test => (
                <tr key={test._id}>
                  <td>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>
                      {test.title || test.weekName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{test.weekName}</div>
                  </td>
                  <td>
                    <span className="badge badge-blue">{test.topic}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}>
                      <Clock size={14} color="#64748b" />
                      <span>{test.duration} mins</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '800', color: '#14217f' }}>
                      {test.totalQuestions || 0} Questions
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: '700',
                      color: '#166534',
                      backgroundColor: '#dcfce7',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      border: '1px solid #86efac'
                    }}>
                      🎯 {test.passMarks > 0 ? `${test.passMarks} Marks` : `${test.passPercentage || 50}%`}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${test.active ? 'badge-active' : 'badge-inactive'}`}>
                      {test.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(test.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenAttachModal(test)}
                        className="btn btn-secondary btn-sm"
                        title="Attach questions"
                      >
                        <Layers size={13} />
                        <span>Attach Qs</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test._id)}
                        className="btn btn-danger btn-sm"
                        title="Delete test"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create Scheduled Weekly Test</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTest}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Test Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Week 4 - Quantitative Aptitude Test"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Week Name / Identifier *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Week 4"
                      value={formData.weekName}
                      onChange={e => setFormData({ ...formData, weekName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Topic / Subject * (From Database)</label>
                    <select
                      className="form-select"
                      value={dbTopics.some(t => t.name === formData.topic) ? formData.topic : (formData.topic ? '__custom__' : '')}
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          const custom = prompt('Enter custom topic/subject name:');
                          if (custom && custom.trim()) {
                            setFormData({ ...formData, topic: custom.trim() });
                          }
                        } else {
                          setFormData({ ...formData, topic: e.target.value });
                        }
                      }}
                      required
                    >
                      <option value="">-- Select Topic from Database --</option>
                      {dbTopics.map(t => (
                        <option key={t._id || t.name} value={t.name}>{t.name}</option>
                      ))}
                      <option value="__custom__">➕ + Enter Custom Topic...</option>
                    </select>
                    {formData.topic && (
                      <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#166534', fontWeight: '600' }}>
                        Selected: <strong>{formData.topic}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Duration (in Minutes) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.duration}
                      onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Active for Students?</label>
                    <select
                      className="form-select"
                      value={formData.active}
                      onChange={e => setFormData({ ...formData, active: e.target.value === 'true' })}
                    >
                      <option value="true">Active (Students can see and take test)</option>
                      <option value="false">Inactive / Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Pass Marks (Passing Score) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 10 (minimum score to pass)"
                      value={formData.passMarks}
                      onChange={e => setFormData({ ...formData, passMarks: Number(e.target.value) })}
                      min="0"
                    />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Students scoring ≥ this mark will be marked as Passed</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pass Percentage (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 50"
                      value={formData.passPercentage}
                      onChange={e => setFormData({ ...formData, passPercentage: Number(e.target.value) })}
                      min="1"
                      max="100"
                    />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Used if pass mark is not explicitly set (Default: 50%)</span>
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Start Time (Optional)</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time (Optional)</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Weekly Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach Questions Modal */}
      {showAttachModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Attach Questions to "{selectedTest?.title || selectedTest?.weekName}"
              </h3>
              <button onClick={() => setShowAttachModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Select questions from the question bank to include in this weekly test. Currently selected: <strong>{selectedQuestionIds.length}</strong>
              </p>

              {availableQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No questions found in the question bank. Please add questions first.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableQuestions.map(q => {
                    const isSelected = selectedQuestionIds.includes(q._id);
                    return (
                      <div
                        key={q._id}
                        onClick={() => handleToggleSelectQuestion(q._id)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #14217f' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#e7eefd' : '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>
                            {q.questionText}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            Category: <strong>{q.category}</strong> | Topic: {q.topic || 'General'} | Correct: Option {q.correctAnswer}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowAttachModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAttachSubmit}
                className="btn btn-primary"
                disabled={attaching || selectedQuestionIds.length === 0}
              >
                {attaching ? 'Attaching...' : `Attach ${selectedQuestionIds.length} Questions`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

