import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UploadCloud,
  Calendar,
  FileText,
  Users,
  CheckSquare,
  Target,
  Award,
  LogOut,
  ShieldCheck,
  User,
  ChevronDown,
  Menu,
  X,
  Trash2
} from 'lucide-react';

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of Admin Portal?')) {
      logout();
      navigate('/login');
    }
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/manage-questions':
      case '/questions': return 'Question Bank & Delete Manager';
      case '/upload-questions': return 'Weekly Test Question Upload';
      case '/weekly-tests': return 'Weekly Tests Schedule';
      case '/this-week-questions': return "This Week's Test Questions";
      case '/students':
      case '/student-details': return 'Student Details & Management';
      case '/results': return 'Weekly Test Results & Marking';
      case '/mock-settings': return 'Mock Test Question Upload';
      case '/mock-results': return 'Mock Test Results';
      default: return 'Admin Control Center';
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">S</div>
          <div style={{ flex: 1 }}>
            <div className="sidebar-brand-title">SLA SkillUp</div>
            <div className="sidebar-brand-sub">Admin Portal</div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end
            onClick={() => setMobileNavOpen(false)}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </NavLink>

          <div className="nav-section-label">Questions & Tests</div>
          <NavLink
            to="/upload-questions"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <UploadCloud />
            <span>Weekly Test Qs Upload</span>
          </NavLink>
          <NavLink
            to="/weekly-tests"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <Calendar />
            <span>Weekly Tests</span>
          </NavLink>
          <NavLink
            to="/this-week-questions"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <FileText />
            <span>This Week's Qs</span>
          </NavLink>

          <div className="nav-section-label">Students & Results</div>
          <NavLink
            to="/students"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <Users />
            <span>Student Details & Access</span>
          </NavLink>
          <NavLink
            to="/results"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <CheckSquare />
            <span>Weekly Results</span>
          </NavLink>

          <div className="nav-section-label">Mock Assessment</div>
          <NavLink
            to="/mock-settings"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <Target />
            <span>Mock Test Qs Upload</span>
          </NavLink>
          <NavLink
            to="/mock-results"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <Award />
            <span>Mock Results</span>
          </NavLink>

          <div className="nav-section-label">Questions Management</div>
          <NavLink
            to="/manage-questions"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <Trash2 />
            <span>Manage / Delete Qs</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="top-left-group">
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setMobileNavOpen(prev => !prev)}
              aria-label="Toggle navigation menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="top-title">{getPageTitle()}</h1>
          </div>

          <div className="top-right">
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '5px 14px 5px 6px',
                  backgroundColor: profileOpen ? '#e7eefd' : '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#14217f',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(20, 33, 127, 0.25)',
                  }}
                >
                  <User size={17} />
                </div>
                <div className="top-user-text" style={{ textAlign: 'left', lineHeight: '1.2' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    {admin?.username || 'Admin'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                    Super Admin
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    color: '#64748b',
                    transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '230px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e2e8f0',
                    padding: '12px',
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #f1f5f9',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: '#e7eefd',
                        color: '#14217f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                        {admin?.username || 'Administrator'}
                      </div>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          color: '#16a34a',
                          backgroundColor: '#dcfce7',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        Super Admin
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #fecaca',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fca5a5')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                  >
                    <LogOut size={16} />
                    <span>Logout Account</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

