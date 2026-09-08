import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Users,
  Calendar,
  Award,
  UploadCloud,
  ArrowRight,
  TrendingUp,
  Clock,
  FileText
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    studentsCount: 0,
    weeklyTestsCount: 0,
    resultsCount: 0,
    passedCount: 0,
  });
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [studentsRes, weeklyRes, resultsRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/weekly'),
        api.get('/admin/results'),
      ]);

      const results = resultsRes.data || [];
      const passed = results.filter((r) => r.score >= (r.total * 0.4)).length;

      setStats({
        studentsCount: studentsRes.data?.length || 0,
        weeklyTestsCount: weeklyRes.data?.length || 0,
        resultsCount: results.length,
        passedCount: passed,
      });

      setRecentResults((resultsRes.data || []).slice(0, 8));
    } catch (e) {
      console.error('Failed to load dashboard statistics:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>Loading Dashboard Metrics...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 4 Top KPI Cards (Clickable to view detailed data) */}
      <div className="grid-cols-4" style={{ marginBottom: '28px' }}>
        <Link to="/students" className="stat-card" title="Click to view & manage enrolled students">
          <div className="stat-info">
            <h3>{stats.studentsCount}</h3>
            <p>Enrolled Students</p>
          </div>
          <div className="stat-icon-wrapper">
            <Users size={24} />
          </div>
        </Link>

        <Link to="/weekly-tests" className="stat-card" title="Click to view & manage scheduled weekly tests">
          <div className="stat-info">
            <h3>{stats.weeklyTestsCount}</h3>
            <p>Scheduled Tests</p>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
            <Calendar size={24} />
          </div>
        </Link>

        <Link to="/results" className="stat-card" title="Click to view all student test submissions">
          <div className="stat-info">
            <h3>{stats.resultsCount}</h3>
            <p>Total Submissions</p>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <TrendingUp size={24} />
          </div>
        </Link>

        <Link to="/results" className="stat-card" title="Click to view passed student results">
          <div className="stat-info">
            <h3>{stats.passedCount}</h3>
            <p>Successful Passes</p>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <Award size={24} />
          </div>
        </Link>
      </div>

      {/* Quick Action Bar */}
      <div className="card" style={{ marginBottom: '28px', backgroundColor: '#ffffff' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: '#0f172a' }}>
          ⚡ Fast Administrative Shortcuts
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/upload-questions" className="btn btn-primary">
            <UploadCloud size={16} />
            <span>Weekly Test Qs Upload</span>
          </Link>
          <Link to="/weekly-tests" className="btn btn-secondary">
            <Calendar size={16} />
            <span>Schedule Weekly Test</span>
          </Link>
          <Link to="/this-week-questions" className="btn btn-secondary">
            <FileText size={16} />
            <span>This Week's Qs</span>
          </Link>
          <Link to="/students" className="btn btn-secondary">
            <Users size={16} />
            <span>Manage Mock Test Access</span>
          </Link>
          <Link to="/results" className="btn btn-secondary">
            <Award size={16} />
            <span>Review Test Submissions</span>
          </Link>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="table-container">
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Recent Test Submissions</h3>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Latest students who completed aptitude tests</p>
          </div>
          <Link to="/results" className="btn btn-sm btn-secondary">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentResults.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No submissions recorded yet.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Course / Trainer</th>
                <th>Category / Test</th>
                <th>Score</th>
                <th>Time Taken</th>
                <th>Submitted At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentResults.map((item) => (
                <tr key={item._id}>
                  <td style={{ fontWeight: '700' }}>
                    {item.student?.name || 'Anonymous'}
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '400' }}>
                      {item.student?.email || ''}
                    </div>
                  </td>
                  <td>
                    <div>{item.student?.courseName || 'General Aptitude'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{item.student?.trainerName || 'SLA Faculty'}</div>
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      {item.weeklyTestId?.title || item.weeklyTestId?.weekName || item.category || 'General'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '800', color: '#14217f' }}>
                    {item.score} / {item.total}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '12px' }}>
                      <Clock size={13} />
                      <span>{Math.round(item.timeTaken / 60)} mins</span>
                    </div>
                  </td>
                  <td>{new Date(item.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <span className="badge badge-active">Recorded</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

