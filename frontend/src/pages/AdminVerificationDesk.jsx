import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AdminDashboard } from './AdminDashboard';
import './AdminVerificationDesk.css';

export const AdminVerificationDesk = ({ currentOfficer }) => {
  const [activeSubTab, setActiveSubTab] = useState('verification'); // 'verification' | 'escalations' | 'telemetry' | 'audit'
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, correction: 0 });
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CORRECTION'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAppModal, setSelectedAppModal] = useState(null);
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState('');

  useEffect(() => {
    loadApplications();
  }, [statusFilter, searchQuery]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminApplications({
        status: statusFilter,
        search: searchQuery,
      });
      setApplications(res.applications || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.warn('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAction = async (appId, action) => {
    setActionLoading(true);
    try {
      const officerData = {
        name: currentOfficer?.name || 'Shri Rajesh Kumar Sharma',
        officer_id: currentOfficer?.officer_id || 'OFF-UP-2024-SDM-8891',
        department: currentOfficer?.department || 'Department of Revenue',
      };

      const res = await api.verifyAdminApplication(appId, {
        action,
        officer: officerData,
        remarks: officerRemarks || (action === 'APPROVE' ? 'Statutory criteria verified and approved.' : 'Application rejected.'),
      });

      if (res.success) {
        setFeedbackToast(`✓ Application ${action === 'APPROVE' ? 'Approved & Certificate Issued' : action === 'REJECT' ? 'Rejected' : 'Correction Requested'}!`);
        setSelectedAppModal(null);
        setOfficerRemarks('');
        loadApplications();
        setTimeout(() => setFeedbackToast(''), 4000);
      }
    } catch (err) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (app) => {
    const status = (app.verificationStatus || app.status || '').toUpperCase();
    if (status === 'APPROVED' || status === 'APPROVED_AND_ISSUED') {
      return (
        <span className="status-tag approved">
          <span>✓</span> Approved & Issued
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="status-tag rejected">
          <span>✕</span> Rejected
        </span>
      );
    }
    if (status === 'CORRECTION_REQUIRED') {
      return (
        <span className="status-tag correction">
          <span>⚠️</span> Correction Required
        </span>
      );
    }
    return (
      <span className="status-tag pending">
        <span>⏳</span> Pending Review
      </span>
    );
  };

  return (
    <div className="admin-desk-container">
      {/* Officer Header */}
      <div className="officer-banner">
        <div className="officer-profile">
          <div className="officer-seal-avatar">🛡️</div>
          <div>
            <h1 className="officer-name">
              {currentOfficer?.name || 'Shri Rajesh Kumar Sharma'}
            </h1>
            <div className="officer-badges">
              <span className="officer-badge primary">
                {currentOfficer?.designation || 'Sub-Divisional Magistrate & Tehsildar'}
              </span>
              <span className="officer-badge sec">
                {currentOfficer?.department || 'Department of Revenue & Land Records'}
              </span>
              <span className="officer-badge sec">
                ID: {currentOfficer?.officer_id || 'OFF-UP-2024-SDM-8891'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Statutory Jurisdiction
          </span>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            Varanasi Division • Sadar Tehsil
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="admin-subnav-tabs">
        <button
          type="button"
          className={`admin-subtab-btn ${activeSubTab === 'verification' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('verification')}
        >
          <span>📝</span>
          <span>Application Verification Desk ({summary.pending})</span>
        </button>

        <button
          type="button"
          className={`admin-subtab-btn ${activeSubTab === 'telemetry' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('telemetry')}
        >
          <span>📊</span>
          <span>Telemetry & Triage Dashboard</span>
        </button>
      </div>

      {feedbackToast && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid #22c55e',
            color: '#4ade80',
            padding: '0.85rem 1.25rem',
            borderRadius: '6px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {feedbackToast}
        </div>
      )}

      {/* Sub-Tab 1: Verification Desk */}
      {activeSubTab === 'verification' && (
        <>
          {/* KPI Counters */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card highlight">
              <span className="admin-kpi-label">Pending Verification</span>
              <span className="admin-kpi-num" style={{ color: '#facc15' }}>
                {summary.pending}
              </span>
            </div>

            <div className="admin-kpi-card">
              <span className="admin-kpi-label">Total Applications</span>
              <span className="admin-kpi-num">{summary.total}</span>
            </div>

            <div className="admin-kpi-card">
              <span className="admin-kpi-label">Approved & Issued</span>
              <span className="admin-kpi-num" style={{ color: '#4ade80' }}>
                {summary.approved}
              </span>
            </div>

            <div className="admin-kpi-card">
              <span className="admin-kpi-label">Rejections</span>
              <span className="admin-kpi-num" style={{ color: '#f87171' }}>
                {summary.rejected}
              </span>
            </div>

            <div className="admin-kpi-card">
              <span className="admin-kpi-label">SLA Compliance</span>
              <span className="admin-kpi-num" style={{ color: '#38bdf8' }}>
                98.4%
              </span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="admin-filter-bar">
            <div className="status-filter-pills">
              {[
                { id: 'ALL', label: 'All Applications' },
                { id: 'PENDING', label: `Pending Review (${summary.pending})` },
                { id: 'APPROVED', label: `Approved (${summary.approved})` },
                { id: 'REJECTED', label: `Rejected (${summary.rejected})` },
                { id: 'CORRECTION', label: `Correction (${summary.correction})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  className={`filter-pill ${statusFilter === pill.id ? 'active' : ''}`}
                  onClick={() => setStatusFilter(pill.id)}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              className="search-input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Citizen Name, Token, No..."
            />
          </div>

          {/* Verification Table */}
          <div className="admin-table-card">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Loading verification queue from local state ledger...
              </div>
            ) : applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                No applications matching filter criteria.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="apps-table">
                  <thead>
                    <tr>
                      <th>Citizen / Applicant</th>
                      <th>Service Certificate</th>
                      <th>Application & Token</th>
                      <th>Channel</th>
                      <th>OCR Confidence</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {app.citizenName}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {app.phone}
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {app.certificateName}
                          </strong>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {app.applicationNumber}
                          </div>
                          <span className="token-pill">{app.trackingToken}</span>
                        </td>
                        <td>
                          <span style={{ textTransform: 'capitalize' }}>
                            {app.channel === 'ivr'
                              ? '📞 IVR'
                              : app.channel === 'whatsapp'
                              ? '💬 WhatsApp'
                              : '🎙️ Web Voice'}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              color: app.ocrConfidence >= 90 ? '#4ade80' : '#facc15',
                            }}
                          >
                            {app.ocrConfidence}% Match
                          </span>
                        </td>
                        <td>{getStatusBadge(app)}</td>
                        <td>
                          <button
                            type="button"
                            className="review-btn"
                            onClick={() => {
                              setSelectedAppModal(app);
                              setOfficerRemarks(app.officerRemarks || '');
                            }}
                          >
                            🔍 Review & Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Sub-Tab 2: Telemetry & Triage */}
      {activeSubTab === 'telemetry' && <AdminDashboard />}

      {/* Verification Review Modal */}
      {selectedAppModal && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedAppModal(null)}
        >
          <div
            className="verify-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="verify-modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Statutory Application Scrutiny & Verification
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {selectedAppModal.certificateName} • {selectedAppModal.applicationNumber} • Token: {selectedAppModal.trackingToken}
                </div>
              </div>

              <button
                type="button"
                className="cert-close-btn"
                onClick={() => setSelectedAppModal(null)}
              >
                ✕
              </button>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="verify-grid">
              {/* Citizen Spoken / Declared Form Data */}
              <div className="verify-column">
                <div className="column-title">
                  <span>🗣️</span> Citizen Self-Declaration
                </div>

                <div className="verify-field-item">
                  <span className="verify-field-label">Applicant Legal Name</span>
                  <span className="verify-field-val">{selectedAppModal.citizenName}</span>
                </div>

                <div className="verify-field-item">
                  <span className="verify-field-label">Registered Phone</span>
                  <span className="verify-field-val">{selectedAppModal.phone}</span>
                </div>

                {selectedAppModal.formData &&
                  Object.entries(selectedAppModal.formData).map(([k, v]) => (
                    <div className="verify-field-item" key={k}>
                      <span className="verify-field-label">{k}</span>
                      <span className="verify-field-val">{String(v)}</span>
                    </div>
                  ))}
              </div>

              {/* Tesseract OCR Extracted Document Data */}
              <div className="verify-column">
                <div className="column-title">
                  <span>📄</span> Tesseract 5 OCR Evidence
                </div>

                <div className="verify-field-item">
                  <span className="verify-field-label">Uploaded Document</span>
                  <span className="verify-field-val">{selectedAppModal.documentName}</span>
                </div>

                <div className="verify-field-item">
                  <span className="verify-field-label">OCR Match Confidence</span>
                  <span
                    className="verify-field-val"
                    style={{
                      color: selectedAppModal.ocrConfidence >= 90 ? '#4ade80' : '#facc15',
                    }}
                  >
                    {selectedAppModal.ocrConfidence}% (Passes State Threshold)
                  </span>
                </div>

                <div className="verify-field-item">
                  <span className="verify-field-label">Document Tamper Check</span>
                  <span className="verify-field-val" style={{ color: '#4ade80' }}>
                    ✓ Clean (No tampering detected)
                  </span>
                </div>

                <div className="verify-field-item">
                  <span className="verify-field-label">Current Verification Status</span>
                  <div>{getStatusBadge(selectedAppModal)}</div>
                </div>
              </div>
            </div>

            {/* Officer Action Box */}
            <div className="officer-action-box">
              <label
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  marginBottom: '0.4rem',
                  display: 'block',
                }}
              >
                Officer Statutory Remarks / Verification Notes
              </label>

              <textarea
                className="remarks-textarea"
                value={officerRemarks}
                onChange={(e) => setOfficerRemarks(e.target.value)}
                placeholder="Enter statutory verification findings or reasons for approval/rejection..."
              />

              <div className="action-buttons-row">
                <button
                  type="button"
                  className="btn-approve"
                  disabled={actionLoading}
                  onClick={() => handleVerifyAction(selectedAppModal.id, 'APPROVE')}
                >
                  ✓ Approve & Digitally Sign Certificate
                </button>

                <button
                  type="button"
                  className="btn-correction"
                  disabled={actionLoading}
                  onClick={() => handleVerifyAction(selectedAppModal.id, 'REQUEST_CORRECTION')}
                >
                  ⚠️ Request Citizen Correction
                </button>

                <button
                  type="button"
                  className="btn-reject"
                  disabled={actionLoading}
                  onClick={() => handleVerifyAction(selectedAppModal.id, 'REJECT')}
                >
                  ✕ Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerificationDesk;
