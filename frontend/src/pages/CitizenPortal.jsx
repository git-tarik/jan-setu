import React, { useState } from 'react';
import { FormWizard } from '../components/FormWizard/FormWizard';
import { StatusTracker } from '../components/StatusTracker/StatusTracker';
import './CitizenPortal.css';

export const CitizenPortal = ({ currentLanguage = 'hi', currentUser = null }) => {
  const [activeTab, setActiveTab] = useState('apply'); // 'apply' | 'track'
  const [submittedToken, setSubmittedToken] = useState('');

  const handleApplicationComplete = (result) => {
    if (result?.tracking_token) {
      setSubmittedToken(result.tracking_token);
    }
  };

  return (
    <div className="citizen-portal-container">
      <div className="portal-hero-section">
        <div className="portal-mode-toggle">
          <button
            type="button"
            className={`mode-toggle-btn ${activeTab === 'apply' ? 'active' : ''}`}
            onClick={() => setActiveTab('apply')}
          >
            🎙️ Voice Application Portal
          </button>
          <button
            type="button"
            className={`mode-toggle-btn ${activeTab === 'track' ? 'active' : ''}`}
            onClick={() => setActiveTab('track')}
          >
            🔍 Track Existing Application
          </button>
        </div>

        <h1 className="portal-hero-title">
          {activeTab === 'apply'
            ? 'Voice-Enabled Citizen Revenue Services'
            : 'Track Statutory Certificate Status'}
        </h1>
        <p className="portal-hero-tagline">
          {activeTab === 'apply'
            ? 'Apply for Income, Caste, Domicile and Birth certificates in your spoken Indic dialect with zero cloud egress.'
            : 'Check real-time application processing, officer reviews, and SLA compliance.'}
        </p>
      </div>

      {activeTab === 'apply' ? (
        <FormWizard
          currentLanguage={currentLanguage}
          currentUser={currentUser}
          onApplicationComplete={handleApplicationComplete}
        />
      ) : (
        <StatusTracker initialToken={submittedToken} />
      )}
    </div>
  );
};
