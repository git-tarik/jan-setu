/**
 * Centralized API Client for JanSetu Voice.
 * All API calls route to /api/v1 (configurable via import.meta.env.VITE_API_BASE_URL).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }
    const err = new Error(errorData.error || errorData.message || 'API request failed');
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  return response.json();
}

export const api = {
  // 1. User & Admin Authentication
  authSignup: (userData) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  authLogin: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getAuthMe: (userId) => request(`/auth/me?userId=${encodeURIComponent(userId || '')}`),

  // Legacy OTP flow
  authInit: (phone, channel = 'web') =>
    request('/auth/init', {
      method: 'POST',
      body: JSON.stringify({ phone, channel }),
    }),

  authVerify: (phone, otp, session_id) =>
    request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, session_id }),
    }),

  // 2. Citizen Dashboard Applications
  getCitizenApplications: (userId, phone) => {
    let q = `/citizen/applications?userId=${encodeURIComponent(userId || '')}`;
    if (phone) q += `&phone=${encodeURIComponent(phone)}`;
    return request(q);
  },

  // 3. Admin Applications & Verification Desk
  getAdminApplications: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.certificate_id) query.set('certificate_id', params.certificate_id);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return request(`/admin/applications${qs ? `?${qs}` : ''}`);
  },

  getAdminApplicationById: (id) => request(`/admin/applications/${id}`),

  verifyAdminApplication: (id, payload) =>
    request(`/admin/applications/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // 4. Certificate Catalogue
  getCertificatesCatalogue: () => request('/certificates/catalogue'),

  // 5. Voice & Conversation
  voiceSTT: (audioData, language = 'hi') =>
    request('/voice/stt', {
      method: 'POST',
      body: JSON.stringify({ ...audioData, language }),
    }),

  voiceTTS: (text, language = 'hi') =>
    request('/voice/tts', {
      method: 'POST',
      body: JSON.stringify({ text, language }),
    }),

  conversationMessage: (payload) =>
    request('/conversation/message', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // 6. Documents & OCR
  uploadDocument: (doc_type, applicant_name, annual_income, fileData) =>
    request('/documents/upload', {
      method: 'POST',
      body: JSON.stringify({ doc_type, applicant_name, annual_income, ...fileData }),
    }),

  // 7. Payment
  initiatePayment: (amount, certificate_id) =>
    request('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ amount, certificate_id }),
    }),

  getPaymentStatus: (payment_id) => request(`/payments/${payment_id}/status`),

  // 8. Submit & Status Tracking
  submitCertificate: (applicationData) =>
    request('/certificates/submit', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    }),

  getCertificateStatus: (id) => request(`/certificates/${id}/status`),
  getApplicationStatus: (application_id) => request(`/status/${application_id}`),

  // 9. Omnichannel Adapters
  whatsappInbound: (From, Body, Language = 'hi') =>
    request('/adapters/whatsapp/inbound', {
      method: 'POST',
      body: JSON.stringify({ From, Body, Language }),
    }),

  ivrDtmf: (Caller, Digits, Language = 'hi') =>
    request('/adapters/ivr/dtmf', {
      method: 'POST',
      body: JSON.stringify({ Caller, Digits, Language }),
    }),

  ivrSpeech: (Caller, SpeechResult, Language = 'hi') =>
    request('/adapters/ivr/speech', {
      method: 'POST',
      body: JSON.stringify({ Caller, SpeechResult, Language }),
    }),

  // 10. Admin Telemetry, Escalations & Audit Logs
  getAdminQueue: () => request('/admin/queue'),
  assignAdminQueue: (ticket_id, officer_name, resolutionNotes) =>
    request(`/admin/queue/${ticket_id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ officer_name, resolutionNotes }),
    }),

  getAdminMetrics: () => request('/admin/metrics'),
  getAdminAuditLogs: () => request('/admin/audit-logs'),
};
