export type ChannelType = 'web' | 'whatsapp' | 'ivr';

export type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'ml' | 'bn' | 'mr' | 'ur';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export type FSMState =
  | 'IDLE'
  | 'LANG_SELECT'
  | 'AUTH_OTP'
  | 'CONSENT'
  | 'SERVICE_SELECT'
  | 'FORM_CAPTURE'
  | 'DOC_UPLOAD'
  | 'PAYMENT_INIT'
  | 'PAYMENT_WAIT'
  | 'SUBMISSION'
  | 'RECEIPT_ISSUED'
  | 'STATUS_TRACK'
  | 'ESCALATED'
  | 'CORRECTION';

export interface FormFieldDefinition {
  id: string;
  label: string;
  labelTranslations?: Partial<Record<LanguageCode, string>>;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[];
  required: boolean;
  validationRegex?: string;
  voicePrompt: Record<LanguageCode, string>;
  helpText: string;
  example: string;
}

export interface RequiredDocument {
  id: string;
  name: string;
  nameTranslations?: Partial<Record<LanguageCode, string>>;
  acceptedFormats: string[];
  mandatory: boolean;
  description: string;
}

export interface CertificateDefinition {
  id: string;
  code: string;
  name: string;
  nameTranslations: Record<LanguageCode, string>;
  category: 'revenue' | 'social_welfare' | 'identification' | 'land_records' | 'general';
  description: string;
  fee: number;
  slaDays: number;
  isFullFlow: boolean; // true for Income, Domicile, Caste; false for stub
  fields: FormFieldDefinition[];
  requiredDocuments: RequiredDocument[];
  eligibilitySummary: string;
  issuingAuthority: string;
}

export interface Persona {
  id: string;
  name: string;
  avatar: string;
  age: number;
  phone: string;
  preferredLanguage: LanguageCode;
  channel: ChannelType;
  literacy: 'Low' | 'Medium' | 'High';
  targetCertificateId: string;
  scenarioDescription: string;
  initialQuery: string;
  sampleFormData: Record<string, string>;
  sampleDocumentType: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  sessionId: string;
  citizenHash: string;
  action: string;
  channel: ChannelType;
  dataClassification: 'RESTRICTED_LOCAL' | 'CLOUD_SAFE_ANON';
  externalCallAttempted: boolean;
  externalCallBlocked: boolean;
  piiDetected: boolean;
  stateBefore: string;
  stateAfter: string;
  details: string;
}

export interface EscalationTicket {
  id: string;
  applicationId: string;
  citizenName: string;
  phone: string;
  certificateName: string;
  channel: ChannelType;
  language: LanguageCode;
  reason: string;
  status: 'PENDING' | 'ASSIGNED' | 'RESOLVED' | 'REJECTED';
  assignedOfficer?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  notes?: string;
}

export interface ApplicationRecord {
  id: string;
  applicationNumber: string;
  certificateId: string;
  certificateName: string;
  citizenName: string;
  phone: string;
  language: LanguageCode;
  channel: ChannelType;
  formData: Record<string, string>;
  documentUploaded: boolean;
  documentName?: string;
  ocrExtractedData?: Record<string, string>;
  ocrConfidence?: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  paymentRef?: string;
  amount: number;
  status: 'SUBMITTED' | 'UNDER_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  createdAt: string;
  estimatedCompletionDate: string;
  trackingToken: string;
}

export interface SystemMetrics {
  voiceTranscriptionLatencyMs: number;
  llmInferenceLatencyMs: number;
  ttsSynthesisLatencyMs: number;
  totalApplications: number;
  activeSessions: number;
  fsmTransitionsTotal: number;
  ocrAccuracyPercent: number;
  dataSovereigntyViolations: number;
  escalationCount: number;
  channelCounts: {
    web: number;
    whatsapp: number;
    ivr: number;
  };
  languageCounts: Record<LanguageCode, number>;
}
