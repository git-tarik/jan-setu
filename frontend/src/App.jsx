import React, { useState } from 'react';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { CitizenPortal } from './pages/CitizenPortal';
import { AdminVerificationDesk } from './pages/AdminVerificationDesk';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthPage } from './pages/AuthPage';
import { WhatsAppSim } from './components/WhatsAppSim/WhatsAppSim';
import { IVRPhone } from './components/IVRPhone/IVRPhone';
import { ArchitecturePlan } from './components/ArchitecturePlan/ArchitecturePlan';
import { LanguageSelector } from './components/LanguageSelector/LanguageSelector';
import { StatusTracker } from './components/StatusTracker/StatusTracker';
import './App.css';

const DEFAULT_CITIZEN = {
  id: 'user-citizen-01',
  name: 'Radha Devi',
  email: 'citizen@jansetu.gov.in',
  phone: '+91 98765 43210',
  role: 'citizen',
};

const DEFAULT_ADMIN = {
  id: 'user-admin-01',
  name: 'Shri Rajesh Kumar Sharma',
  email: 'admin@jansetu.gov.in',
  phone: '+91 91234 56789',
  role: 'admin',
  department: 'Department of Revenue & Land Records',
  designation: 'Sub-Divisional Magistrate & Verification Officer',
  officer_id: 'OFF-UP-2024-SDM-8891',
};

export function App() {
  const [currentUser, setCurrentUser] = useState(DEFAULT_CITIZEN);
  const [activeView, setActiveView] = useState('citizen_dash'); // 'citizen_dash' | 'citizen_voice' | 'citizen_track' | 'admin_verify' | 'admin_telemetry' | 'whatsapp' | 'ivr' | 'auth' | 'arch'
  const [currentLanguage, setCurrentLanguage] = useState('hi');
  const [trackingInitialToken, setTrackingInitialToken] = useState('');

  // Handle Authentication Success (Login/Signup)
  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveView('admin_verify');
    } else {
      setActiveView('citizen_dash');
    }
  };

  // Quick 1-Click Persona Switcher for Evaluation
  const toggleRolePersona = () => {
    if (currentUser?.role === 'admin') {
      setCurrentUser(DEFAULT_CITIZEN);
      setActiveView('citizen_dash');
    } else {
      setCurrentUser(DEFAULT_ADMIN);
      setActiveView('admin_verify');
    }
  };

  const isCitizen = currentUser?.role === 'citizen';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="app-shell">
      {/* Top Navigation Bar */}
      <header className="app-navbar">
        {/* Brand */}
        <div
          className="brand-section"
          onClick={() => setActiveView(isCitizen ? 'citizen_dash' : 'admin_verify')}
        >
          <div className="brand-logo-badge">🏛️</div>
          <div className="brand-titles">
            <span className="brand-name">JanSetu Voice</span>
            <span className="brand-tagline">Air-Gapped Sovereign Revenue Portal</span>
          </div>
        </div>

        {/* Dynamic Navigation Tabs based on Role */}
        <nav className="channel-nav-tabs" aria-label="Portal Navigation">
          {isCitizen ? (
            <>
              <button
                type="button"
                className={`nav-tab-btn ${activeView === 'citizen_dash' ? 'active' : ''}`}
                onClick={() => setActiveView('citizen_dash')}
              >
                👤 My Dashboard
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeView === 'citizen_voice' ? 'active' : ''}`}
                onClick={() => setActiveView('citizen_voice')}
              >
                🎙️ Voice Application
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeView === 'citizen_track' ? 'active' : ''}`}
                onClick={() => setActiveView('citizen_track')}
              >
                📍 Track Status
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeView === 'whatsapp' ? 'active' : ''}`}
                onClick={() => setActiveView('whatsapp')}
              >
                💬 WhatsApp
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeView === 'ivr' ? 'active' : ''}`}
                onClick={() => setActiveView('ivr')}
              >
                📞 IVR Phone
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`nav-tab-btn admin-tab ${activeView === 'admin_verify' ? 'active' : ''}`}
                onClick={() => setActiveView('admin_verify')}
              >
                🛡️ Verification Desk
              </button>
              <button
                type="button"
                className={`nav-tab-btn admin-tab ${activeView === 'admin_telemetry' ? 'active' : ''}`}
                onClick={() => setActiveView('admin_telemetry')}
              >
                📊 Telemetry & Triage
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeView === 'whatsapp' ? 'active' : ''}`}
                onClick={() => setActiveView('whatsapp')}
              >
                💬 WhatsApp Sim
              </button>
              <button
                type="button"
                className={`nav-tab-btn ${activeView === 'ivr' ? 'active' : ''}`}
                onClick={() => setActiveView('ivr')}
              >
                📞 IVR Phone
              </button>
            </>
          )}

          <button
            type="button"
            className={`nav-tab-btn ${activeView === 'arch' ? 'active' : ''}`}
            onClick={() => setActiveView('arch')}
          >
            🏛️ Architecture
          </button>
        </nav>

        {/* User Persona & Language Controls */}
        <div className="navbar-user-controls">
          {/* Active User Badge */}
          <div
            className={`user-persona-chip ${isAdmin ? 'admin-chip' : 'citizen-chip'}`}
            title={`Logged in as ${currentUser?.name}`}
          >
            <span>{isAdmin ? '🛡️' : '👤'}</span>
            <span style={{ fontWeight: 600 }}>{currentUser?.name}</span>
            <span className={`user-role-badge ${currentUser?.role}`}>
              {currentUser?.role === 'admin' ? 'Officer' : 'Citizen'}
            </span>
          </div>

          {/* Quick 1-Click Role Switcher */}
          <button
            type="button"
            className="quick-switch-btn"
            onClick={toggleRolePersona}
            title="Switch between Citizen and Admin persona"
          >
            🔄 Switch to {isCitizen ? 'Officer' : 'Citizen'}
          </button>

          {/* Sign In / Out button */}
          <button
            type="button"
            className="auth-nav-btn"
            onClick={() => setActiveView('auth')}
          >
            {activeView === 'auth' ? 'Back' : '🔑 Auth Portal'}
          </button>

          {/* Multilingual Selector */}
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
          />
        </div>
      </header>

      {/* Main View Body */}
      <main className="app-content-body container">
        {/* Auth Page */}
        {activeView === 'auth' && (
          <AuthPage
            initialRole={currentUser?.role || 'citizen'}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {/* Citizen Dashboard */}
        {activeView === 'citizen_dash' && (
          <CitizenDashboard
            currentUser={currentUser}
            onApplyNew={() => setActiveView('citizen_voice')}
            onTrackToken={(token) => {
              setTrackingInitialToken(token);
              setActiveView('citizen_track');
            }}
          />
        )}

        {/* Citizen Voice Application Wizard */}
        {activeView === 'citizen_voice' && (
          <CitizenPortal
            currentLanguage={currentLanguage}
            currentUser={currentUser}
          />
        )}

        {/* Track Application Standalone */}
        {activeView === 'citizen_track' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <StatusTracker initialToken={trackingInitialToken} />
          </div>
        )}

        {/* Admin Verification Desk */}
        {activeView === 'admin_verify' && (
          <AdminVerificationDesk currentOfficer={currentUser} />
        )}

        {/* Admin Telemetry & Triage */}
        {activeView === 'admin_telemetry' && <AdminDashboard />}

        {/* Omnichannel Simulators */}
        {activeView === 'whatsapp' && (
          <div style={{ padding: '1rem 0' }}>
            <WhatsAppSim currentLanguage={currentLanguage} />
          </div>
        )}

        {activeView === 'ivr' && (
          <div style={{ padding: '1rem 0' }}>
            <IVRPhone currentLanguage={currentLanguage} />
          </div>
        )}

        {/* Architecture Plan */}
        {activeView === 'arch' && <ArchitecturePlan />}
      </main>

      {/* Sovereign Trust Notice Footer */}
      <footer className="app-footer container">
        <div>
          <strong>JanSetu Voice</strong> • Air-Gapped Indic Multimodal Revenue System (Varanasi Division)
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="badge badge-success">✓ 100% Local SQLite & Tesseract</span>
          <span className="badge badge-info">🛡️ DPDP Act 2023 Compliant</span>
          <span className="badge badge-warning">⚡ LangGraph State Engine</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
