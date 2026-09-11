import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Shuffle,
  Phone,
  Mail,
  Edit3,
  Trash2,
  Eye,
  Key,
  FileText,
  X,
  Save
} from 'lucide-react';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mockFilter, setMockFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [bulkMockEligible, setBulkMockEligible] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    courseName: '',
    trainerName: '',
    status: 'ACTIVE',
    mockTestAllowed: false,
    assignedMockModel: 'Model 1',
    newPassword: ''
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // View Student Details Modal state
  const [viewingData, setViewingData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [res, modelsRes] = await Promise.all([
        api.get('/admin/students/management'),
        api.get('/admin/mock/models').catch(() => ({ data: [] }))
      ]);
      const list = res.data || [];
      setStudents(list);

      if (Array.isArray(modelsRes?.data) && modelsRes.data.length > 0) {
        setAvailableModels(modelsRes.data);
      }

      const allAllowed = list.length > 0 && list.every(s => s.mockTestAllowed || s.mockTestAccess);
      setBulkMockEligible(allAllowed);
    } catch (e) {
      console.error('Failed to load students:', e);
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setEditError('');
    setEditForm({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      courseName: student.courseName || '',
      trainerName: student.trainerName || '',
      status: student.status || 'ACTIVE',
      mockTestAllowed: Boolean(student.mockTestAllowed || student.mockTestAccess),
      assignedMockModel: student.assignedMockModel || 'Model 1',
      newPassword: ''
    });
  };

  // Save Edit Student
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setEditError('Student name is required');
      return;
    }
    if (!editForm.email.trim()) {
      setEditError('Student email is required');
      return;
    }
    if (editForm.newPassword && editForm.newPassword.trim().length < 4) {
      setEditError('New password must be at least 4 characters');
      return;
    }

    setEditSaving(true);
    setEditError('');
    try {
      const res = await api.put(`/admin/students/${editingStudent._id}`, editForm);
      const updated = res.data?.student;

      setStudents(prev => prev.map(s => {
        if (s._id === editingStudent._id) {
          return {
            ...s,
            ...updated,
            mockTestAllowed: editForm.mockTestAllowed,
            mockTestAccess: editForm.mockTestAllowed
          };
        }
        return s;
      }));

      setEditingStudent(null);
      alert('Student details updated successfully!');
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update student details');
    } finally {
      setEditSaving(false);
    }
  };

  // Open View Details Modal
  const handleOpenView = async (student) => {
    setViewingData({ student, results: [], stats: null });
    setViewLoading(true);
    try {
      const res = await api.get(`/admin/students/${student._id}/details`);
      setViewingData(res.data);
    } catch (e) {
      console.error('Failed to fetch student details:', e);
    } finally {
      setViewLoading(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (student) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete student "${student.name}" (${student.email})?\n\nThis will remove the student account. This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/students/${student._id}`);
      setStudents(prev => prev.filter(s => s._id !== student._id));
      alert('Student deleted successfully.');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete student');
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (student) => {
    const newStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/admin/students/${student._id}/status`, { status: newStatus });
      setStudents(prev => prev.map(s => s._id === student._id ? { ...s, status: newStatus } : s));
    } catch (e) {
      alert('Failed to update student status');
    }
  };

  // Quick Toggle Mock Permission
  const handleToggleSingleMock = async (student) => {
    const newAccess = !(student.mockTestAllowed || student.mockTestAccess);
    try {
      await api.post('/admin/students/mock-access', {
        studentIds: [student._id],
        accessEnabled: newAccess
      });
      setStudents(prev => prev.map(s => s._id === student._id ? { ...s, mockTestAllowed: newAccess, mockTestAccess: newAccess } : s));
    } catch (e) {
      alert('Failed to update mock test access');
    }
  };

  // Bulk Mock Toggle
  const handleBulkMockToggle = async () => {
    const nextState = !bulkMockEligible;
    if (!window.confirm(`Are you sure you want to ${nextState ? 'GRANT' : 'REVOKE'} Mock Test access for ALL students?`)) return;

    setProcessing(true);
    try {
      const studentIds = students.map(s => s._id);
      await api.post('/admin/students/mock-access', {
        studentIds,
        accessEnabled: nextState
      });
      setBulkMockEligible(nextState);
      setStudents(prev => prev.map(s => ({ ...s, mockTestAllowed: nextState, mockTestAccess: nextState })));
      alert(`Mock test access successfully ${nextState ? 'granted to' : 'revoked from'} all students!`);
    } catch (e) {
      alert('Failed to update bulk mock access');
    } finally {
      setProcessing(false);
    }
  };

  // Auto Distribute Models
  const handleAutoDistributeModels = async () => {
    if (!window.confirm('Auto-distribute available Mock Models evenly across all active students?')) return;
    setProcessing(true);
    try {
      const res = await api.post('/admin/mock/auto-distribute-models');
      alert(res.data.message || 'Models distributed successfully!');
      fetchStudents();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to distribute models');
    } finally {
      setProcessing(false);
    }
  };

  // Quick Mock Model Change
  const handleModelChange = async (studentId, modelSet) => {
    try {
      await api.post('/admin/mock/assign-student-model', { studentId, modelSet });
      setStudents(prev => prev.map(s => s._id === studentId ? { ...s, assignedMockModel: modelSet } : s));
    } catch (e) {
      alert('Failed to assign model');
    }
  };

  // Filtered Students List
  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = (
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.courseName?.toLowerCase().includes(q) ||
      s.trainerName?.toLowerCase().includes(q)
    );

    const matchesStatus = (
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.status === 'ACTIVE') ||
      (statusFilter === 'INACTIVE' && s.status === 'INACTIVE')
    );

    const isMockGranted = s.mockTestAllowed || s.mockTestAccess;
    const matchesMock = (
      mockFilter === 'ALL' ||
      (mockFilter === 'GRANTED' && isMockGranted) ||
      (mockFilter === 'BLOCKED' && !isMockGranted)
    );

    return matchesQuery && matchesStatus && matchesMock;
  });

  // Calculate quick stats
  const totalCount = students.length;
  const activeCount = students.filter(s => s.status === 'ACTIVE').length;
  const inactiveCount = students.filter(s => s.status === 'INACTIVE').length;
  const mockGrantedCount = students.filter(s => s.mockTestAllowed || s.mockTestAccess).length;

  return (
    <div>
      {/* Top Banner: Header and Main Actions */}
      <div className="card" style={{ marginBottom: '20px', padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#e7eefd',
                color: '#14217f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Student Details & Management
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  View complete student records, edit details, reset passwords, and manage mock test access
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleAutoDistributeModels}
              className="btn btn-secondary"
              disabled={processing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Shuffle size={16} />
              <span>Auto-Distribute Models</span>
            </button>

            <button
              onClick={handleBulkMockToggle}
              className={`btn ${bulkMockEligible ? 'btn-danger' : 'btn-success'}`}
              disabled={processing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {bulkMockEligible ? <XCircle size={16} /> : <CheckCircle size={16} />}
              <span>{bulkMockEligible ? 'Revoke All Mock Access' : 'Grant All Mock Access'}</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Chips */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '14px',
          marginTop: '20px',
          paddingTop: '18px',
          borderTop: '1px solid #f1f5f9'
        }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Total Students</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{totalCount}</div>
          </div>
          <div style={{ backgroundColor: '#f0fdf4', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>Active Accounts</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#15803d', marginTop: '4px' }}>{activeCount}</div>
          </div>
          <div style={{ backgroundColor: '#fef2f2', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: '600' }}>Inactive Accounts</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#b91c1c', marginTop: '4px' }}>{inactiveCount}</div>
          </div>
          <div style={{ backgroundColor: '#eff6ff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>Mock Test Permitted</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>{mockGrantedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', width: '100%' }}
              placeholder="Search by student name, email, phone number, course, trainer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ minWidth: '150px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Inactive Accounts</option>
            </select>

            <select
              className="form-select"
              style={{ minWidth: '170px' }}
              value={mockFilter}
              onChange={e => setMockFilter(e.target.value)}
            >
              <option value="ALL">All Mock Permissions</option>
              <option value="GRANTED">Mock Granted</option>
              <option value="BLOCKED">Mock Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
            Showing {filteredStudents.length} of {students.length} Students
          </span>
          <button
            onClick={fetchStudents}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '12px' }}
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading student records...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            No students found matching current filters.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student Profile</th>
                <th>Contact</th>
                <th>Course / Trainer</th>
                <th>Status</th>
                <th>Mock Model</th>
                <th>Mock Access</th>
                <th style={{ textAlign: 'center', width: '220px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => {
                const isMockAllowed = Boolean(student.mockTestAllowed || student.mockTestAccess);
                const isActive = student.status === 'ACTIVE';
                const initial = student.name ? student.name.charAt(0).toUpperCase() : 'S';

                return (
                  <tr key={student._id}>
                    {/* Profile */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: isActive ? '#e0e7ff' : '#f1f5f9',
                          color: isActive ? '#3730a3' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                          {initial}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                            {student.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} color="#94a3b8" />
                            <span>{student.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155' }}>
                        <Phone size={13} color="#64748b" />
                        <span>{student.phone || '—'}</span>
                      </div>
                    </td>

                    {/* Course / Trainer */}
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                        {student.courseName || 'General Aptitude'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        Trainer: {student.trainerName || 'SLA Faculty'}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <button
                        onClick={() => handleToggleStatus(student)}
                        className={`badge ${isActive ? 'badge-active' : 'badge-inactive'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle status"
                      >
                        {isActive ? '● Active' : '● Inactive'}
                      </button>
                    </td>

                    {/* Mock Model */}
                    <td>
                      <select
                        className="form-select"
                        style={{ width: '110px', padding: '4px 8px', fontSize: '12px' }}
                        value={student.assignedMockModel || 'Model 1'}
                        onChange={e => handleModelChange(student._id, e.target.value)}
                      >
                        {Array.from(new Set([
                          ...(availableModels.length > 0 ? availableModels : ['Model 1', 'Model 2', 'Model 3', 'Model 4', 'Model 5']),
                          student.assignedMockModel
                        ].filter(Boolean))).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </td>

                    {/* Mock Access */}
                    <td>
                      <button
                        onClick={() => handleToggleSingleMock(student)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '11.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          backgroundColor: isMockAllowed ? '#dcfce7' : '#fee2e2',
                          color: isMockAllowed ? '#166534' : '#991b1b'
                        }}
                      >
                        {isMockAllowed ? <CheckCircle size={13} /> : <XCircle size={13} />}
                        <span>{isMockAllowed ? 'Granted' : 'Blocked'}</span>
                      </button>
                    </td>

                    {/* Actions Hub */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        {/* View Details Button */}
                        <button
                          onClick={() => handleOpenView(student)}
                          className="btn btn-secondary btn-sm"
                          title="View Full Student Details & History"
                          style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="btn btn-primary btn-sm"
                          title="Edit Student Details & Password"
                          style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit3 size={14} />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          style={{
                            padding: '6px 8px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                          title="Delete Student Account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: EDIT STUDENT DETAILS MODAL                          */}
      {/* ============================================================ */}
      {editingStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #cbd5e1'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#e7eefd',
                  color: '#14217f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                    Edit Student Details
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Updating profile for: {editingStudent.name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Form */}
            <form onSubmit={handleSaveEdit} style={{ padding: '24px' }}>
              {editError && (
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  fontWeight: '600'
                }}>
                  {editError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={editForm.email}
                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                {/* Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9876543210"
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                {/* Course Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Course Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Java Full Stack / Aptitude"
                    value={editForm.courseName}
                    onChange={e => setEditForm(prev => ({ ...prev, courseName: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                {/* Trainer Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Trainer / Faculty
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Trainer name"
                    value={editForm.trainerName}
                    onChange={e => setEditForm(prev => ({ ...prev, trainerName: e.target.value }))}
                  />
                </div>

                {/* Account Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Account Status
                  </label>
                  <select
                    className="form-select"
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="ACTIVE">ACTIVE (Can login)</option>
                    <option value="INACTIVE">INACTIVE (Blocked)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                {/* Mock Test Permission */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Mock Test Permission
                  </label>
                  <select
                    className="form-select"
                    value={editForm.mockTestAllowed ? 'YES' : 'NO'}
                    onChange={e => setEditForm(prev => ({ ...prev, mockTestAllowed: e.target.value === 'YES' }))}
                  >
                    <option value="YES">Granted (Allowed)</option>
                    <option value="NO">Blocked (Not Allowed)</option>
                  </select>
                </div>

                {/* Mock Model */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Assigned Mock Model
                  </label>
                  <select
                    className="form-select"
                    value={editForm.assignedMockModel}
                    onChange={e => setEditForm(prev => ({ ...prev, assignedMockModel: e.target.value }))}
                  >
                    {Array.from(new Set([
                      ...(availableModels.length > 0 ? availableModels : ['Model 1', 'Model 2', 'Model 3', 'Model 4', 'Model 5']),
                      editForm.assignedMockModel
                    ].filter(Boolean))).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password Reset Section */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Key size={15} color="#14217f" />
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Reset Student Password (Optional)
                  </label>
                </div>
                <p style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '8px' }}>
                  Leave this field completely blank if you do not want to change student's password.
                </p>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter new password (min 4 characters)"
                  value={editForm.newPassword}
                  onChange={e => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingStudent(null)}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSaving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Save size={16} />
                  <span>{editSaving ? 'Saving Changes...' : 'Save Student Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: VIEW STUDENT FULL DETAILS & EXAM HISTORY            */}
      {/* ============================================================ */}
      {viewingData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #cbd5e1'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '18px'
                }}>
                  {viewingData.student?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                    {viewingData.student?.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {viewingData.student?.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingData(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Profile Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                backgroundColor: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Phone Number</span>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                    {viewingData.student?.phone || 'Not Provided'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Course & Batch</span>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                    {viewingData.student?.courseName || 'General Aptitude'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Faculty Trainer</span>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                    {viewingData.student?.trainerName || 'SLA Faculty'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Account Status</span>
                  <div style={{ marginTop: '3px' }}>
                    <span className={`badge ${viewingData.student?.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                      {viewingData.student?.status === 'ACTIVE' ? '● Active' : '● Inactive'}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Mock Test Model</span>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#14217f', marginTop: '2px' }}>
                    {viewingData.student?.assignedMockModel || 'Model 1'} ({viewingData.mockAccess ? 'Access Granted' : 'Access Blocked'})
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Joined Date</span>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginTop: '2px' }}>
                    {viewingData.student?.registerDate ? new Date(viewingData.student.registerDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Test Performance KPI Chips */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11.5px', color: '#1e40af', fontWeight: '700' }}>Tests Attempted</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e3a8a', marginTop: '3px' }}>
                    {viewingData.stats?.totalTests || viewingData.results?.length || 0}
                  </div>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11.5px', color: '#166534', fontWeight: '700' }}>Tests Passed</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#15803d', marginTop: '3px' }}>
                    {viewingData.stats?.passedTests || 0}
                  </div>
                </div>
                <div style={{ backgroundColor: '#fdf4ff', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11.5px', color: '#86198f', fontWeight: '700' }}>Overall Accuracy</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#701a75', marginTop: '3px' }}>
                    {viewingData.stats?.averageAccuracy || 0}%
                  </div>
                </div>
              </div>

              {/* Exam Results Table */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} color="#14217f" />
                  <span>Exam Attempt History</span>
                </h4>

                {viewLoading ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    Loading test history...
                  </div>
                ) : !viewingData.results || viewingData.results.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    No tests attempted yet by this student.
                  </div>
                ) : (
                  <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Test Title / Category</th>
                          <th>Score</th>
                          <th>Result</th>
                          <th>Submitted Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingData.results.map((res, i) => (
                          <tr key={res._id || i}>
                            <td style={{ fontWeight: '600', color: '#0f172a' }}>
                              {res.weeklyTestId?.title || res.weeklyTestId?.weekName || res.category || 'Aptitude Test'}
                            </td>
                            <td style={{ fontWeight: '700' }}>
                              {res.score} / {res.total}
                            </td>
                            <td>
                              <span className={`badge ${res.isPassed ? 'badge-active' : 'badge-inactive'}`}>
                                {res.isPassed ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                            <td style={{ fontSize: '12px', color: '#64748b' }}>
                              {res.submittedAt ? new Date(res.submittedAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewingData(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

