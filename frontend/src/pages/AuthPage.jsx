import React, { useState } from 'react';
import { api } from '../api/client';
import './AuthPage.css';

export const AuthPage = ({ onAuthSuccess, initialRole = 'citizen' }) => {
  const [role, setRole] = useState(initialRole); // 'citizen' | 'admin'
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // Citizen Form State
  const [citizenEmail, setCitizenEmail] = useState('citizen@jansetu.gov.in');
  const [citizenPassword, setCitizenPassword] = useState('Password@123');
  const [citizenName, setCitizenName] = useState('Radha Devi');
  const [citizenPhone, setCitizenPhone] = useState('+91 98765 43210');

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('admin@jansetu.gov.in');
  const [adminPassword, setAdminPassword] = useState('Admin@123');
  const [adminName, setAdminName] = useState('Shri Rajesh Kumar Sharma');
  const [adminPhone, setAdminPhone] = useState('+91 91234 56789');
  const [adminDept, setAdminDept] = useState('Department of Revenue & Land Records');
  const [adminDesignation, setAdminDesignation] = useState('Sub-Divisional Magistrate & Verification Officer');
  const [adminOfficerId, setAdminOfficerId] = useState('OFF-UP-2024-SDM-8891');

  // Feedback State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1-Click Demo Fillers
  const fillDemoCitizen = () => {
    setRole('citizen');
    setMode('login');
    setCitizenEmail('citizen@jansetu.gov.in');
    setCitizenPassword('Password@123');
    setError('');
  };

  const fillDemoAdmin = () => {
    setRole('admin');
    setMode('login');
    setAdminEmail('admin@jansetu.gov.in');
    setAdminPassword('Admin@123');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        const payload = {
          role,
          email: role === 'citizen' ? citizenEmail : adminEmail,
          password: role === 'citizen' ? citizenPassword : adminPassword,
        };
        const res = await api.authLogin(payload);
        if (res.success) {
          setSuccessMsg(res.message || 'Login successful!');
          if (onAuthSuccess) {
            onAuthSuccess(res.user, res.token);
          }
        }
      } else {
        // Sign Up
        const payload =
          role === 'citizen'
            ? {
                role: 'citizen',
                name: citizenName,
                email: citizenEmail,
                phone: citizenPhone,
                password: citizenPassword,
              }
            : {
                role: 'admin',
                name: adminName,
                email: adminEmail,
                phone: adminPhone,
                password: adminPassword,
                department: adminDept,
                designation: adminDesignation,
                officer_id: adminOfficerId,
              };

        const res = await api.authSignup(payload);
        if (res.success) {
          setSuccessMsg('Account created successfully! Logging you in...');
          if (onAuthSuccess) {
            onAuthSuccess(res.user, res.token);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-header">
          <div className="auth-logo-badge">🏛️</div>
          <h1 className="auth-title">JanSetu Sovereign Gate</h1>
          <p className="auth-subtitle">
            {role === 'citizen'
              ? 'Voice-First Citizen Certificate Portal & Application Tracker'
              : 'Government Revenue Administration & Statutory Verification Desk'}
          </p>
        </div>

        {/* Role Switcher */}
        <div className="auth-role-selector" role="tablist">
          <button
            type="button"
            className={`auth-role-tab ${role === 'citizen' ? 'active' : ''}`}
            onClick={() => {
              setRole('citizen');
              setError('');
            }}
          >
            <span>👤</span>
            <span>Citizen User</span>
          </button>

          <button
            type="button"
            className={`auth-role-tab admin ${role === 'admin' ? 'active admin' : ''}`}
            onClick={() => {
              setRole('admin');
              setError('');
            }}
          >
            <span>🛡️</span>
            <span>Government Officer</span>
          </button>
        </div>

        {/* Mode Tabs (Login vs Sign Up) */}
        <div className="auth-mode-tabs">
          <button
            type="button"
            className={`auth-mode-btn ${mode === 'login' ? `active ${role === 'admin' ? 'admin' : ''}` : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-mode-btn ${mode === 'signup' ? `active ${role === 'admin' ? 'admin' : ''}` : ''}`}
            onClick={() => {
              setMode('signup');
              setError('');
            }}
          >
            Create {role === 'citizen' ? 'Citizen' : 'Officer'} Account
          </button>
        </div>

        {/* Alert Boxes */}
        {error && <div className="auth-error-box">⚠️ {error}</div>}
        {successMsg && <div className="auth-success-box">✓ {successMsg}</div>}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {role === 'citizen' ? (
            /* CITIZEN FORM */
            <>
              {mode === 'signup' && (
                <>
                  <div className="auth-form-group">
                    <label className="auth-label">Full Legal Name</label>
                    <input
                      type="text"
                      className="auth-input"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="e.g. Radha Devi"
                      required
                    />
                  </div>
                  <div className="auth-form-group">
                    <label className="auth-label">Mobile Number</label>
                    <input
                      type="tel"
                      className="auth-input"
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </>
              )}

              <div className="auth-form-group">
                <label className="auth-label">Citizen Email or Phone</label>
                <input
                  type="text"
                  className="auth-input"
                  value={citizenEmail}
                  onChange={(e) => setCitizenEmail(e.target.value)}
                  placeholder="citizen@jansetu.gov.in"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <input
                  type="password"
                  className="auth-input"
                  value={citizenPassword}
                  onChange={(e) => setCitizenPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </>
          ) : (
            /* ADMIN / OFFICER FORM */
            <>
              {mode === 'signup' && (
                <>
                  <div className="auth-form-group">
                    <label className="auth-label">Officer Name & Salutation</label>
                    <input
                      type="text"
                      className="auth-input admin"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Shri Rajesh Kumar Sharma"
                      required
                    />
                  </div>
                  <div className="auth-form-row">
                    <div className="auth-form-group">
                      <label className="auth-label">Department</label>
                      <input
                        type="text"
                        className="auth-input admin"
                        value={adminDept}
                        onChange={(e) => setAdminDept(e.target.value)}
                        placeholder="Revenue & Land Records"
                        required
                      />
                    </div>
                    <div className="auth-form-group">
                      <label className="auth-label">Designation</label>
                      <input
                        type="text"
                        className="auth-input admin"
                        value={adminDesignation}
                        onChange={(e) => setAdminDesignation(e.target.value)}
                        placeholder="Tehsildar / SDM"
                        required
                      />
                    </div>
                  </div>
                  <div className="auth-form-group">
                    <label className="auth-label">Official Badge / Officer ID</label>
                    <input
                      type="text"
                      className="auth-input admin"
                      value={adminOfficerId}
                      onChange={(e) => setAdminOfficerId(e.target.value)}
                      placeholder="OFF-UP-2024-SDM-8891"
                      required
                    />
                  </div>
                </>
              )}

              <div className="auth-form-group">
                <label className="auth-label">Official Gov Email</label>
                <input
                  type="email"
                  className="auth-input admin"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@jansetu.gov.in"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Security PIN / Password</label>
                <input
                  type="password"
                  className="auth-input admin"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className={`auth-submit-btn ${role === 'admin' ? 'admin' : ''}`}
            disabled={loading}
          >
            {loading
              ? 'Authenticating...'
              : mode === 'login'
              ? `Sign In to ${role === 'citizen' ? 'Citizen Portal' : 'Officer Desk'}`
              : `Create ${role === 'citizen' ? 'Citizen Account' : 'Officer Profile'}`}
          </button>
        </form>

        {/* 1-Click Fast Testing Demo Buttons */}
        <div className="auth-demo-section">
          <span className="auth-demo-label">⚡ 1-Click Quick Demo Sign In</span>
          <div className="auth-demo-buttons">
            <button type="button" className="auth-demo-btn" onClick={fillDemoCitizen}>
              👤 Demo Citizen (Radha Devi)
            </button>
            <button type="button" className="auth-demo-btn admin" onClick={fillDemoAdmin}>
              🛡️ Demo Admin (SDM Sharma)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
