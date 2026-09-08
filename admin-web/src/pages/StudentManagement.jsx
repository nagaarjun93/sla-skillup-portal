import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Shuffle,
  Phone,
  BookOpen
} from 'lucide-react';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [bulkMockEligible, setBulkMockEligible] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students/management');
      const list = res.data || [];
      setStudents(list);

      const allAllowed = list.length > 0 && list.every(s => s.mockTestAllowed || s.mockTestAccess);
      setBulkMockEligible(allAllowed);
    } catch (e) {
      console.error('Failed to load students:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (student) => {
    const newStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.put(`/admin/students/${student._id}/status`, { status: newStatus });
      setStudents(prev => prev.map(s => s._id === student._id ? { ...s, status: newStatus } : s));
    } catch (e) {
      alert('Failed to update student account status');
    }
  };

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

  const handleAutoDistributeModels = async () => {
    if (!window.confirm('Auto-distribute 10 Mock Models evenly across all active students?')) return;
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

  const handleModelChange = async (studentId, modelSet) => {
    try {
      await api.post('/admin/mock/assign-student-model', { studentId, modelSet });
      setStudents(prev => prev.map(s => s._id === studentId ? { ...s, assignedMockModel: modelSet } : s));
    } catch (e) {
      alert('Failed to assign model');
    }
  };

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.courseName?.toLowerCase().includes(q) ||
      s.trainerName?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Top Banner: Bulk Controls */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              Student & Mock Test Access
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Manage accounts, grant/revoke Mock Test permissions, and distribute exam models
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleAutoDistributeModels}
              className="btn btn-secondary"
              disabled={processing}
            >
              <Shuffle size={16} />
              <span>Auto-Distribute 10 Models</span>
            </button>

            <button
              onClick={handleBulkMockToggle}
              className={`btn ${bulkMockEligible ? 'btn-danger' : 'btn-success'}`}
              disabled={processing}
            >
              {bulkMockEligible ? 'Revoke Bulk Mock Access' : 'Grant Bulk Mock Access'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '12px', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search students by name, email, phone number, trainer or course..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
            Total Registered Students: {filteredStudents.length}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading students list...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            No students found.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student Details</th>
                <th>Course / Trainer</th>
                <th>Phone</th>
                <th>Account Status</th>
                <th>Mock Model</th>
                <th>Mock Permission</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => {
                const isMockAllowed = student.mockTestAllowed || student.mockTestAccess;
                const isActive = student.status === 'ACTIVE';

                return (
                  <tr key={student._id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {student.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{student.courseName || 'General'}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>Trainer: {student.trainerName || 'SLA Faculty'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#334155' }}>
                        <Phone size={13} color="#64748b" />
                        <span>{student.phone || 'N/A'}</span>
                      </div>
                    </td>
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
                    <td>
                      <select
                        className="form-select"
                        style={{ width: '110px', padding: '4px 8px', fontSize: '12px' }}
                        value={student.assignedMockModel || 'Model 1'}
                        onChange={e => handleModelChange(student._id, e.target.value)}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={`Model ${n}`}>Model {n}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleSingleMock(student)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: isMockAllowed ? '#dcfce7' : '#fee2e2',
                          color: isMockAllowed ? '#166534' : '#991b1b'
                        }}
                      >
                        {isMockAllowed ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        <span>{isMockAllowed ? 'Granted' : 'Blocked'}</span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(student)}
                        className="btn btn-secondary btn-sm"
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

