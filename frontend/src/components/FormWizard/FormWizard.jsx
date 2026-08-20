import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { VoiceRecorder } from '../VoiceRecorder/VoiceRecorder';
import { DocumentUpload } from '../DocumentUpload/DocumentUpload';
import './FormWizard.css';

export const FormWizard = ({
  currentLanguage = 'hi',
  currentUser = null,
  onApplicationComplete
}) => {
  // Wizard Step State (1: Auth, 2: Consent, 3: Service, 4: Voice Form, 5: Document, 6: Payment)
  const [currentStep, setCurrentStep] = useState(currentUser ? 2 : 1);
  const [highestStepUnlocked, setHighestStepUnlocked] = useState(currentUser ? 2 : 1);

  // 1. Auth State
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [otp, setOtp] = useState(currentUser ? '1234' : '');
  const [otpSent, setOtpSent] = useState(!!currentUser);
  const [sessionId, setSessionId] = useState(currentUser ? 'sess-auth-user' : '');
  const [jwtToken, setJwtToken] = useState(currentUser ? 'jwt_jansetu_citizen' : '');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // 2. Consent State
  const [consentAgreed, setConsentAgreed] = useState(false);

  // 3. Service Catalogue State
  const [catalogue, setCatalogue] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);

  // 4. Voice Form State
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [capturedFields, setCapturedFields] = useState({});
  const [formCompleted, setFormCompleted] = useState(false);

  // 5. Document State
  const [documentVerified, setDocumentVerified] = useState(false);
  const [uploadedDocResult, setUploadedDocResult] = useState(null);

  // 6. Payment State
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending' | 'success'
  const [submittedApplication, setSubmittedApplication] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Catalogue on Step 3
  useEffect(() => {
    fetchCatalogue();
  }, []);

  const fetchCatalogue = async () => {
    try {
      const data = await api.getCertificatesCatalogue();
      setCatalogue(data);
      if (data && data.length > 0) {
        setSelectedCert(data[0]);
      }
    } catch (err) {
      console.warn('Catalogue load error:', err);
    }
  };

  // --- Step 1: Auth Actions ---
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await api.authInit(phone, 'web');
      setOtpSent(res.otp_sent);
      setSessionId(res.session_id);
    } catch (err) {
      setAuthError(err.message || 'Failed to send OTP');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await api.authVerify(phone, otp || '1234', sessionId);
      setJwtToken(res.jwt_token);
      setHighestStepUnlocked((prev) => Math.max(prev, 2));
      setCurrentStep(2);
    } catch (err) {
      setAuthError(err.message || 'Invalid OTP');
    } finally {
      setAuthLoading(false);
    }
  };

  // --- Step 2: Consent Actions ---
  const handleConsentConfirm = () => {
    setConsentAgreed(true);
    setHighestStepUnlocked((prev) => Math.max(prev, 3));
    setCurrentStep(3);
  };

  // --- Step 3: Service Selection ---
  const handleSelectService = (cert) => {
    setSelectedCert(cert);
    setCapturedFields({});
    setCurrentFieldIndex(0);
    setFormCompleted(false);
    setHighestStepUnlocked((prev) => Math.max(prev, 4));
    setCurrentStep(4);
  };

  // --- Step 4: Voice Form Capture ---
  const fields = selectedCert?.fields || [];
  const activeField = fields[currentFieldIndex];

  const handleFieldCapture = (fieldId, val, convResult) => {
    const updated = { ...capturedFields, [fieldId]: val };
    setCapturedFields(updated);

    // If more fields exist, move to next field
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex((prev) => prev + 1);
    } else {
      setFormCompleted(true);
      setHighestStepUnlocked((prev) => Math.max(prev, 5));
    }
  };

  const handleManualFieldChange = (fieldId, value) => {
    setCapturedFields((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleNextToDocument = () => {
    setCurrentStep(5);
  };

  // --- Step 5: Document Upload ---
  const handleDocumentSuccess = (res) => {
    setUploadedDocResult(res);
    setDocumentVerified(true);
    setHighestStepUnlocked((prev) => Math.max(prev, 6));
  };

  const handleNextToPayment = async () => {
    setCurrentStep(6);
    // Initiate payment
    try {
      const fee = selectedCert?.fee || 50;
      const res = await api.initiatePayment(fee, selectedCert?.id || 'income-cert');
      setPaymentData(res);
    } catch (err) {
      console.warn('Payment init error:', err);
    }
  };

  // --- Step 6: Payment & Submit ---
  const handleSimulatePaymentSuccess = async () => {
    setPaymentStatus('success');
    setIsSubmitting(true);

    try {
      const applicationPayload = {
        certificate_id: selectedCert?.id || 'income-cert',
        certificate_name: selectedCert?.name || 'Income Certificate',
        citizen_name: capturedFields.fullName || currentUser?.name || 'Radha Devi',
        phone: currentUser?.phone || phone,
        user_id: currentUser?.id || 'user-citizen-01',
        captured_fields: capturedFields,
        language: currentLanguage,
        channel: 'web',
        payment_id: paymentData?.payment_id || 'PAY-DEMO-991',
        fee: selectedCert?.fee || 50,
      };

      const submitRes = await api.submitCertificate(applicationPayload);
      setSubmittedApplication(submitRes);

      if (onApplicationComplete) {
        onApplicationComplete(submitRes);
      }
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = [
    { num: 1, label: 'Auth & OTP' },
    { num: 2, label: 'Consent' },
    { num: 3, label: 'Service' },
    { num: 4, label: 'Voice Form' },
    { num: 5, label: 'Document' },
    { num: 6, label: 'Payment' },
  ];

  return (
    <div className="form-wizard-container">
      {/* Numbered Horizontal Step Tabs */}
      <div className="wizard-steps-header">
        {stepLabels.map((step) => {
          const isActive = currentStep === step.num;
          const isCompleted = step.num < currentStep;
          const isUnlocked = step.num <= highestStepUnlocked;

          return (
            <button
              key={step.num}
              type="button"
              className={`wizard-step-tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              disabled={!isUnlocked}
              onClick={() => setCurrentStep(step.num)}
            >
              <span className="step-num">{isCompleted ? '✓' : step.num}</span>
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- STEP 1: AUTH --- */}
      {currentStep === 1 && (
        <div className="wizard-step-card">
          <div className="step-card-header">
            <h2 className="step-card-title">Citizen Authentication</h2>
            <p className="step-card-subtitle">
              Enter your mobile number to receive a secure one-time verification code.
            </p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Mobile Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              {authError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{authError}</div>}

              <button type="submit" className="btn btn-primary" disabled={authLoading}>
                {authLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Enter 4-Digit OTP (Demo OTP: 1234)</label>
                <input
                  type="text"
                  className="form-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="1234"
                  maxLength={6}
                  required
                />
              </div>

              {authError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{authError}</div>}

              <button type="submit" className="btn btn-primary" disabled={authLoading}>
                {authLoading ? 'Verifying...' : 'Verify OTP & Continue'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setOtpSent(false)}
                style={{ alignSelf: 'center' }}
              >
                Change Phone Number
              </button>
            </form>
          )}
        </div>
      )}

      {/* --- STEP 2: CONSENT --- */}
      {currentStep === 2 && (
        <div className="wizard-step-card">
          <div className="step-card-header">
            <h2 className="step-card-title">Aadhaar & Data Privacy Consent</h2>
            <p className="step-card-subtitle">
              Statutory consent under DPDP Act 2023 for revenue certificate processing.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-main)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <p style={{ marginBottom: '0.75rem' }}>
              "मैं एतद्द्वारा राजस्व प्रमाण पत्र आवेदन के उद्देश्य से अपने आधार विवरण और संबंधित दस्तावेजों के सत्यापन की सहमति देता हूँ। मेरा व्यक्तिगत डेटा स्थानीय रूप से सुरक्षित रहेगा।"
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              "I hereby consent to verify my identity and revenue records strictly on on-premise local servers with zero cloud egress."
            </p>
          </div>

          <div className="wizard-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(1)}
            >
              ← Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConsentConfirm}
            >
              ✓ I Agree & Continue
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 3: SERVICE SELECTION --- */}
      {currentStep === 3 && (
        <div className="wizard-step-card" style={{ maxWidth: '800px' }}>
          <div className="step-card-header">
            <h2 className="step-card-title">Select Certificate Service</h2>
            <p className="step-card-subtitle">
              Choose from the official state revenue certificate catalogue.
            </p>
          </div>

          <div className="service-grid">
            {catalogue.map((cert) => (
              <div
                key={cert.id}
                className={`service-card ${selectedCert?.id === cert.id ? 'selected' : ''}`}
                onClick={() => setSelectedCert(cert)}
              >
                <div className="service-fee-pill">₹{cert.fee} Statutory Fee • SLA {cert.sla_days} Days</div>
                <div className="service-name">{cert.name}</div>
                <div style={{ fontSize: '0.825rem', color: 'var(--accent)' }}>{cert.hindi_name}</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {cert.description}
                </p>
              </div>
            ))}
          </div>

          <div className="wizard-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(2)}
            >
              ← Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSelectService(selectedCert)}
              disabled={!selectedCert}
            >
              Start Voice Application →
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 4: VOICE FORM --- */}
      {currentStep === 4 && (
        <div className="wizard-step-card" style={{ maxWidth: '750px' }}>
          <div className="step-card-header">
            <span className="badge badge-success" style={{ alignSelf: 'center' }}>
              {selectedCert?.name || 'Income Certificate'}
            </span>
            <h2 className="step-card-title">Voice-First Data Intake</h2>
            <p className="step-card-subtitle">
              Field {currentFieldIndex + 1} of {fields.length}: {activeField?.label} ({activeField?.hindi_label})
            </p>
          </div>

          {/* Voice Recorder Integration */}
          {activeField && (
            <VoiceRecorder
              currentField={activeField}
              certificateId={selectedCert?.id}
              language={currentLanguage}
              onCapture={handleFieldCapture}
              capturedFields={capturedFields}
            />
          )}

          {/* Captured Fields Live Summary & Fallback Manual Inputs */}
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Captured Form Fields (Click to Edit manually if needed):
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {fields.map((f, idx) => (
                <div key={f.id} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    {idx + 1}. {f.label}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={capturedFields[f.id] || ''}
                    onChange={(e) => handleManualFieldChange(f.id, e.target.value)}
                    placeholder={`e.g. ${f.label}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="wizard-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(3)}
            >
              ← Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextToDocument}
              disabled={!capturedFields.fullName && Object.keys(capturedFields).length === 0}
            >
              Proceed to Document Upload →
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 5: DOCUMENT UPLOAD --- */}
      {currentStep === 5 && (
        <div className="wizard-step-card" style={{ maxWidth: '750px' }}>
          <div className="step-card-header">
            <h2 className="step-card-title">Supporting Document Verification</h2>
            <p className="step-card-subtitle">
              Upload required proof of identity or income for instant on-premise OCR matching.
            </p>
          </div>

          <DocumentUpload
            certificate={selectedCert}
            applicantName={capturedFields.fullName || 'Citizen Applicant'}
            annualIncome={capturedFields.annualIncome}
            onUploadSuccess={handleDocumentSuccess}
          />

          <div className="wizard-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(4)}
            >
              ← Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextToPayment}
              disabled={!documentVerified}
            >
              Proceed to Fee Payment →
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 6: PAYMENT & SUBMISSION --- */}
      {currentStep === 6 && (
        <div className="wizard-step-card">
          <div className="step-card-header">
            <h2 className="step-card-title">Statutory Fee Payment & Submission</h2>
            <p className="step-card-subtitle">
              Amount Due: ₹{selectedCert?.fee || 50} (Zero Egress Gateway Mock)
            </p>
          </div>

          {!submittedApplication ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              {paymentData?.qr_code && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <img
                    src={paymentData.qr_code}
                    alt="UPI Payment QR Code"
                    style={{ width: '180px', height: '180px' }}
                  />
                  <span style={{ color: '#000000', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px' }}>
                    Scan with BHIM / GPay / PhonePe
                  </span>
                </div>
              )}

              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Payment Reference ID: <code>{paymentData?.payment_id || 'PAY-INITIATING'}</code>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSimulatePaymentSuccess}
                disabled={isSubmitting}
                style={{ width: '100%', maxWidth: '320px' }}
              >
                {isSubmitting ? 'Finalizing Application...' : 'Simulate Successful UPI Payment (₹50)'}
              </button>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2.5rem' }}>🎉</div>
              <h3 style={{ color: 'var(--accent)', fontSize: '1.25rem', fontWeight: 600 }}>
                Application Submitted Successfully!
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Your certificate request has been recorded into the revenue registry and queued for officer dispatch.
              </p>

              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                }}
              >
                <span>Application ID:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{submittedApplication.application_id}</strong>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                }}
              >
                <span>Tracking Token:</span>
                <strong style={{ color: 'var(--accent)' }}>{submittedApplication.tracking_token}</strong>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
              >
                🖨️ Download / Print Statutory Receipt
              </button>
            </div>
          )}

          <div className="wizard-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setCurrentStep(5)}
              disabled={!!submittedApplication}
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
