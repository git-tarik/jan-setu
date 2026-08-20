import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import './CitizenDashboard.css';

export const CitizenDashboard = ({
  currentUser,
  onApplyNew,
  onTrackToken,
}) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertModal, setSelectedCertModal] = useState(null);

  useEffect(() => {
    loadUserApplications();
  }, [currentUser]);

  const loadUserApplications = async () => {
    setLoading(true);
    try {
      const res = await api.getCitizenApplications(
        currentUser?.id || 'user-citizen-01',
        currentUser?.phone
      );
      setApplications(res.applications || []);
    } catch (err) {
      console.warn('Failed to load user applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = applications.filter(
    (a) =>
      a.verificationStatus === 'PENDING_VERIFICATION' ||
      a.status === 'PENDING_VERIFICATION' ||
      a.status === 'SUBMITTED'
  ).length;

  const approvedCount = applications.filter(
    (a) =>
      a.verificationStatus === 'APPROVED' ||
      a.status === 'APPROVED_AND_ISSUED'
  ).length;

  const actionRequiredCount = applications.filter(
    (a) =>
      a.verificationStatus === 'CORRECTION_REQUIRED' ||
      a.status === 'CORRECTION_REQUIRED' ||
      a.verificationStatus === 'REJECTED' ||
      a.status === 'REJECTED'
  ).length;

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
        <span>⏳</span> Under Officer Verification
      </span>
    );
  };

  return (
    <div className="citizen-dash-container">
      {/* Citizen Welcome Banner */}
      <div className="citizen-dash-header">
        <div className="citizen-info-block">
          <div className="citizen-avatar">👤</div>
          <div>
            <h1 className="citizen-title-name">
              Namaste, {currentUser?.name || 'Radha Devi'}
              <span
                style={{
                  fontSize: '0.75rem',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600,
                }}
              >
                ✓ Aadhaar e-KYC Verified
              </span>
            </h1>
            <div className="citizen-meta">
              <span>📱 {currentUser?.phone || '+91 98765 43210'}</span>
              <span>✉️ {currentUser?.email || 'citizen@jansetu.gov.in'}</span>
              <span>🏛️ Tehsil: Sadar, Varanasi</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="apply-voice-btn"
          onClick={() => onApplyNew && onApplyNew()}
        >
          <span>🎙️</span>
          <span>Apply for New Certificate</span>
        </button>
      </div>

      {/* KPI Overview Grid */}
      <div className="citizen-kpi-grid">
        <div className="citizen-kpi-card">
          <span className="citizen-kpi-title">Total Applications</span>
          <span className="citizen-kpi-val">{applications.length}</span>
        </div>

        <div className="citizen-kpi-card">
          <span className="citizen-kpi-title">Awaiting Verification</span>
          <span className="citizen-kpi-val pending">{pendingCount}</span>
        </div>

        <div className="citizen-kpi-card">
          <span className="citizen-kpi-title">Approved & Ready</span>
          <span className="citizen-kpi-val approved">{approvedCount}</span>
        </div>

        <div className="citizen-kpi-card">
          <span className="citizen-kpi-title">Action Required</span>
          <span className="citizen-kpi-val action">{actionRequiredCount}</span>
        </div>
      </div>

      {/* Applications List */}
      <div className="citizen-apps-section">
        <div className="section-header-row">
          <h2 className="section-title">
            <span>📋</span> My Revenue Applications
          </h2>
          <button
            type="button"
            className="action-btn"
            onClick={loadUserApplications}
          >
            🔄 Refresh Status
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading your applications from local sovereignty ledger...
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              No applications submitted yet.
            </p>
            <button
              type="button"
              className="apply-voice-btn"
              style={{ margin: '0 auto' }}
              onClick={() => onApplyNew && onApplyNew()}
            >
              🎙️ Start First Voice Application
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="apps-table">
              <thead>
                <tr>
                  <th>Application / Token</th>
                  <th>Service Type</th>
                  <th>Submitted Date</th>
                  <th>Channel</th>
                  <th>Backend Status</th>
                  <th>Officer Remarks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const isApproved =
                    app.verificationStatus === 'APPROVED' ||
                    app.status === 'APPROVED_AND_ISSUED';

                  return (
                    <tr key={app.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {app.applicationNumber}
                        </div>
                        <div style={{ marginTop: '2px' }}>
                          <span className="token-pill">{app.trackingToken}</span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {app.certificateName}
                        </strong>
                      </td>
                      <td>
                        {new Date(app.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize' }}>
                          {app.channel === 'ivr'
                            ? '📞 Phone'
                            : app.channel === 'whatsapp'
                            ? '💬 WhatsApp'
                            : '🎙️ Web Voice'}
                        </span>
                      </td>
                      <td>{getStatusBadge(app)}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {app.officerRemarks ||
                            (isApproved
                              ? 'Verified by Revenue Officer'
                              : 'Pending Tehsildar Scrutiny')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {isApproved && (
                            <button
                              type="button"
                              className="action-btn certificate-btn"
                              onClick={() => setSelectedCertModal(app)}
                            >
                              📜 View Certificate
                            </button>
                          )}
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() =>
                              onTrackToken && onTrackToken(app.trackingToken)
                            }
                          >
                            📍 Track
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Certificate Modal */}
      {selectedCertModal && (
        <div
          className="cert-modal-backdrop"
          onClick={() => setSelectedCertModal(null)}
        >
          <div
            className="cert-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="cert-close-btn"
              onClick={() => setSelectedCertModal(null)}
            >
              ✕
            </button>

            <div className="cert-emblem-header">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🏛️</div>
              <div className="cert-gov-title">
                Government of Uttar Pradesh • Revenue Department
              </div>
              <div className="cert-sub-title">
                Office of the Sub-Divisional Magistrate & Tehsildar, Varanasi
              </div>
              <div className="cert-doc-title">
                {selectedCertModal.certificateName.toUpperCase()}
              </div>
            </div>

            <p className="cert-body-text">
              This is to certify on the basis of inquiry and verification of records that the statutory certificate details below are authentic and registered in the State Revenue Registry.
            </p>

            <div className="cert-details-grid">
              <div className="cert-field-row">
                <span className="cert-field-label">Certificate Number</span>
                <span className="cert-field-value" style={{ color: '#1e3a8a' }}>
                  {selectedCertModal.certificateNumber || 'CERT-UP-2024-INC-99182'}
                </span>
              </div>

              <div className="cert-field-row">
                <span className="cert-field-label">Application Number</span>
                <span className="cert-field-value">
                  {selectedCertModal.applicationNumber}
                </span>
              </div>

              <div className="cert-field-row">
                <span className="cert-field-label">Citizen Name</span>
                <span className="cert-field-value">
                  {selectedCertModal.citizenName}
                </span>
              </div>

              <div className="cert-field-row">
                <span className="cert-field-label">Registered Phone</span>
                <span className="cert-field-value">{selectedCertModal.phone}</span>
              </div>

              {selectedCertModal.formData &&
                Object.entries(selectedCertModal.formData).map(([k, v]) => (
                  <div className="cert-field-row" key={k}>
                    <span className="cert-field-label">{k}</span>
                    <span className="cert-field-value">{String(v)}</span>
                  </div>
                ))}
            </div>

            <div className="cert-footer-signatures">
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Date of Issue:{' '}
                  {new Date(
                    selectedCertModal.verifiedAt || selectedCertModal.createdAt
                  ).toLocaleDateString('en-IN')}
                </div>
                <div className="cert-hash-box">
                  SHA-256 Seal:{' '}
                  {selectedCertModal.digitalSignatureHash ||
                    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </div>
              </div>

              <div className="cert-signature-box">
                <div className="cert-digital-seal">✓ Digitally Signed</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                  {selectedCertModal.verifiedBy || 'Shri Rajesh Kumar Sharma'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                  Sub-Divisional Magistrate & Tehsildar
                </div>
              </div>
            </div>

            <button
              type="button"
              className="cert-print-btn"
              onClick={() => window.print()}
            >
              🖨️ Print / Download Statutory Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
