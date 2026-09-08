import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    category: 'Vedic Math',
    topic: '',
    difficultyLevel: 'Medium',
    explanation: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuestions();
    fetchCategories();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/questions');
      setQuestions(res.data || []);
    } catch (e) {
      console.error('Failed to load questions:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (e) {
      // ignore
    }
  };

  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setFormData({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      category: categories[0] || 'Vedic Math',
      topic: '',
      difficultyLevel: 'Medium',
      explanation: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (q) => {
    setEditingQuestion(q);
    setFormData({
      questionText: q.questionText || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctAnswer: q.correctAnswer || 'A',
      category: q.category || 'Vedic Math',
      topic: q.topic || '',
      difficultyLevel: q.difficultyLevel || 'Medium',
      explanation: q.explanation || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      setQuestions(prev => prev.filter(q => q._id !== id));
    } catch (e) {
      alert('Failed to delete question');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingQuestion) {
        const res = await api.put(`/admin/questions/${editingQuestion._id}`, formData);
        setQuestions(prev => prev.map(q => q._id === editingQuestion._id ? res.data : q));
      } else {
        const res = await api.post('/admin/questions/manual', formData);
        setQuestions(prev => [res.data, ...prev]);
      }
      setShowModal(false);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesCat = !selectedCategory || q.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      q.questionText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div>
      {/* Controls Bar */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '320px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="Search questions by text or topic..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '220px' }}
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Single Question</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
            Showing {filteredQuestions.length} Questions
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading questions bank...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            No questions found matching your filter criteria.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Question</th>
                <th>Category</th>
                <th>Topic</th>
                <th>Correct Ans</th>
                <th>Difficulty</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map(q => (
                <tr key={q._id}>
                  <td>
                    <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                      {q.questionText}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      A: {q.optionA} | B: {q.optionB} | C: {q.optionC} | D: {q.optionD}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue">{q.category}</span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: '#475569' }}>
                    {q.topic || 'General'}
                  </td>
                  <td>
                    <span style={{
                      fontWeight: '800',
                      color: '#166534',
                      backgroundColor: '#dcfce7',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      Option {q.correctAnswer}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                      {q.difficultyLevel || 'Medium'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEditModal(q)}
                        className="btn btn-secondary btn-sm"
                        title="Edit question"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(q._id)}
                        className="btn btn-danger btn-sm"
                        title="Delete question"
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

      {/* Add / Edit Question Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Question Text *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Enter the full question statement..."
                    value={formData.questionText}
                    onChange={e => setFormData({ ...formData, questionText: e.target.value })}
                    required
                  />
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Option A *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.optionA}
                      onChange={e => setFormData({ ...formData, optionA: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Option B *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.optionB}
                      onChange={e => setFormData({ ...formData, optionB: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Option C *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.optionC}
                      onChange={e => setFormData({ ...formData, optionC: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Option D *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.optionD}
                      onChange={e => setFormData({ ...formData, optionD: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid-cols-3">
                  <div className="form-group">
                    <label className="form-label">Correct Answer *</label>
                    <select
                      className="form-select"
                      value={formData.correctAnswer}
                      onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })}
                      required
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category * (From Database)</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          const custom = prompt('Enter custom category:');
                          if (custom && custom.trim()) {
                            setFormData({ ...formData, category: custom.trim() });
                          }
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      required
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__custom__">➕ + Enter Custom Category...</option>
                    </select>
                    {formData.category && (
                      <input
                        type="text"
                        className="form-input"
                        style={{ marginTop: '4px', fontSize: '12px' }}
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Category name"
                        required
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <select
                      className="form-select"
                      value={formData.difficultyLevel}
                      onChange={e => setFormData({ ...formData, difficultyLevel: e.target.value })}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Topic / Sub-topic</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Profit and Loss Basics"
                    value={formData.topic}
                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Explanation (Optional)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Provide step-by-step solution..."
                    value={formData.explanation}
                    onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

