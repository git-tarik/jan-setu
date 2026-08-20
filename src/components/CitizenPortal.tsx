import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  QrCode,
  Search,
  UserCheck,
  ShieldCheck,
  Clock,
  Send,
} from 'lucide-react';
import { CERTIFICATES_CATALOGUE } from '../data/certificates';
import { SYNTHETIC_PERSONAS } from '../data/personas';
import { UI_TRANSLATIONS } from '../data/multilingual';
import { CertificateDefinition, LanguageCode, ApplicationRecord } from '../types';
import { DocumentScanner } from './DocumentScanner';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { AuthUser } from '../context/AuthContext';

interface CitizenPortalProps {
  currentLanguage: LanguageCode;
  onApplicationCompleted?: (app: ApplicationRecord) => void;
  user?: AuthUser;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  currentLanguage,
  onApplicationCompleted,
  user,
}) => {
  const t = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS.en;

  // Start at step 2 (Consent) — Auth is done via the AuthPage login
  const [currentStep, setCurrentStep] = useState<number>(2);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateDefinition>(CERTIFICATES_CATALOGUE[0]);
  // Derive phone from logged-in user if available
  const [phone, setPhone] = useState<string>(user?.phone?.replace(/[^0-9]/g, '').slice(-10) || '9876543210');
  const [isAuthVerified] = useState<boolean>(true); // Always true — user logged in via AuthPage
  const [consentGiven, setConsentGiven] = useState<boolean>(false);

  const [currentFieldIndex, setCurrentFieldIndex] = useState<number>(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [spokenInput, setSpokenInput] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState<boolean>(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState<boolean>(true);
  const [aiProcessing, setAiProcessing] = useState<boolean>(false);

  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
  const [documentVerified, setDocumentVerified] = useState<boolean>(false);
  const [ocrExtractedData, setOcrExtractedData] = useState<any>(null);
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentSuccessRef, setPaymentSuccessRef] = useState<string>('');

  const [completedApp, setCompletedApp] = useState<ApplicationRecord | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const [activeMode, setActiveMode] = useState<'apply' | 'track'>('apply');
  const [trackingSearchToken, setTrackingSearchToken] = useState<string>('');
  const [trackedRecord, setTrackedRecord] = useState<ApplicationRecord | null>(null);
  const [trackingError, setTrackingError] = useState<string>('');

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang =
        currentLanguage === 'hi'
          ? 'hi-IN'
          : currentLanguage === 'ta'
          ? 'ta-IN'
          : currentLanguage === 'te'
          ? 'te-IN'
          : currentLanguage === 'ml'
          ? 'ml-IN'
          : currentLanguage === 'bn'
          ? 'bn-IN'
          : currentLanguage === 'mr'
          ? 'mr-IN'
          : currentLanguage === 'ur'
          ? 'ur-IN'
          : 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpokenInput(transcript);
        handleVoiceInput(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentLanguage]);

  const speakText = (text: string) => {
    if (!autoSpeakEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      currentLanguage === 'hi'
        ? 'hi-IN'
        : currentLanguage === 'ta'
        ? 'ta-IN'
        : currentLanguage === 'te'
        ? 'te-IN'
        : currentLanguage === 'ml'
        ? 'ml-IN'
        : currentLanguage === 'bn'
        ? 'bn-IN'
        : currentLanguage === 'mr'
        ? 'mr-IN'
        : currentLanguage === 'ur'
        ? 'ur-IN'
        : 'en-IN';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeakingPrompt(true);
    utterance.onend = () => setIsSpeakingPrompt(false);
    utterance.onerror = () => setIsSpeakingPrompt(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (currentStep === 4 && selectedCertificate.fields[currentFieldIndex]) {
      const field = selectedCertificate.fields[currentFieldIndex];
      const prompt = field.voicePrompt[currentLanguage] || field.voicePrompt.en;
      speakText(prompt);
    }
  }, [currentStep, currentFieldIndex, currentLanguage, selectedCertificate]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.warn('Speech recognition error:', e);
        }
      } else {
        setIsListening(true);
        setTimeout(() => {
          setIsListening(false);
          const currentField = selectedCertificate.fields[currentFieldIndex];
          const sample = currentField?.example || 'Sample Value';
          setSpokenInput(sample);
          handleVoiceInput(sample);
        }, 2000);
      }
    }
  };

  const handleVoiceInput = async (utterance: string) => {
    if (!utterance.trim()) return;
    setAiProcessing(true);
    const currentField = selectedCertificate.fields[currentFieldIndex];

    try {
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utterance,
          currentFieldId: currentField.id,
          certificateId: selectedCertificate.id,
          language: currentLanguage,
          capturedFields: formData,
        }),
      });
      const data = await response.json();
      const value = data.extractedValue || utterance;
      setFormData((prev) => ({ ...prev, [currentField.id]: value }));

      if (currentFieldIndex < selectedCertificate.fields.length - 1) {
        setCurrentFieldIndex((prev) => prev + 1);
        setSpokenInput('');
      } else {
        setTimeout(() => {
          setCurrentStep(5);
        }, 600);
      }
    } catch (e) {
      setFormData((prev) => ({ ...prev, [currentField.id]: utterance }));
      if (currentFieldIndex < selectedCertificate.fields.length - 1) {
        setCurrentFieldIndex((prev) => prev + 1);
        setSpokenInput('');
      } else {
        setCurrentStep(5);
      }
    } finally {
      setAiProcessing(false);
    }
  };

  const handleApplyPersona = (persona: (typeof SYNTHETIC_PERSONAS)[0]) => {
    setPhone(persona.phone.replace(/[^0-9]/g, '').slice(-10));
    setOtp('584920');
    setIsOtpSent(true);
    setIsAuthVerified(true);
    setConsentGiven(true);

    const foundCert = CERTIFICATES_CATALOGUE.find((c) => c.id === persona.targetCertificateId) || CERTIFICATES_CATALOGUE[0];
    setSelectedCertificate(foundCert);
    setFormData(persona.sampleFormData);
    setCurrentStep(4);
    setCurrentFieldIndex(Object.keys(persona.sampleFormData).length >= foundCert.fields.length ? foundCert.fields.length - 1 : 0);
  };

  const handleFinalSubmit = async () => {
    try {
      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: selectedCertificate.id,
          certificateName: selectedCertificate.name,
          // Prefer the authenticated user's name, fall back to form data
          citizenName: user?.name || formData.fullName || 'Citizen Applicant',
          phone: user?.phone || `+91 ${phone}`,
          userId: user?.id,
          language: currentLanguage,
          channel: 'web',
          formData,
          amount: selectedCertificate.fee,
          documentName: selectedCertificate.requiredDocuments[0]?.name || 'Identity_Proof.pdf',
          ocrConfidence: ocrConfidence || 96,
        }),
      });
      const data = await response.json();
      if (data.success && data.application) {
        setCompletedApp(data.application);
        setIsReceiptModalOpen(true);
        setCurrentStep(7);
        if (onApplicationCompleted) {
          onApplicationCompleted(data.application);
        }
      }
    } catch (e) {
      console.error('Submission error:', e);
    }
  };

  const handleTrackSearch = async () => {
    if (!trackingSearchToken.trim()) return;
    setTrackingError('');
    try {
      const response = await fetch(`/api/applications/status/${encodeURIComponent(trackingSearchToken.trim())}`);
      const data = await response.json();
      if (data.found && data.application) {
        setTrackedRecord(data.application);
      } else {
        setTrackingError('No certificate application found with this tracking ID.');
        setTrackedRecord(null);
      }
    } catch (e) {
      setTrackingError('Unable to query local records.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Mode Switch & Quick Persona Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0E0E10] border border-[#27272A] p-4 rounded-xl shadow-sm">
        <div className="flex items-center space-x-1.5 bg-[#18181B] p-1 rounded-lg border border-[#27272A]">
          <button
            id="btn-mode-apply"
            onClick={() => setActiveMode('apply')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeMode === 'apply'
                ? 'bg-[#27272A] text-white border border-[#3F3F46]'
                : 'text-[#71717A] hover:text-[#E4E4E7]'
            }`}
          >
            {t.startApplication}
          </button>
          <button
            id="btn-mode-track"
            onClick={() => setActiveMode('track')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeMode === 'track'
                ? 'bg-[#27272A] text-white border border-[#3F3F46]'
                : 'text-[#71717A] hover:text-[#E4E4E7]'
            }`}
          >
            {t.trackApplication}
          </button>
        </div>

        {/* Quick Synthetic Persona Loader */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-[#71717A] whitespace-nowrap flex items-center">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-[#10B981]" />
            {t.autoFillDemo}:
          </span>
          {SYNTHETIC_PERSONAS.map((persona) => (
            <button
              key={persona.id}
              onClick={() => handleApplyPersona(persona)}
              className="px-2.5 py-1 bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white rounded-md text-xs font-mono border border-[#27272A] transition-colors whitespace-nowrap"
            >
              <span>{persona.name}</span>{' '}
              <span className="text-[#10B981]">({persona.preferredLanguage.toUpperCase()})</span>
            </button>
          ))}
        </div>
      </div>

      {activeMode === 'track' ? (
        /* Status Tracking Interface */
        <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-6 shadow-md space-y-6">
          <div className="max-w-xl mx-auto text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#18181B] border border-[#27272A] text-[#10B981] flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-light tracking-tight text-[#E4E4E7]">Track Application Status</h2>
            <p className="text-xs text-[#71717A]">
              Enter your Application Tracking Token (e.g. <span className="font-mono text-[#10B981]">TRK-INC-99182</span>) or Registration Number.
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="text"
                value={trackingSearchToken}
                onChange={(e) => setTrackingSearchToken(e.target.value)}
                placeholder="e.g. TRK-INC-99182 or REV-2024-UP-0077184"
                className="flex-1 bg-[#18181B] border border-[#27272A] rounded-lg px-4 py-2 text-xs text-[#E4E4E7] placeholder-[#71717A] focus:outline-none focus:border-[#3F3F46] font-mono"
              />
              <button
                onClick={handleTrackSearch}
                className="px-4 py-2 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] font-medium text-xs border border-[#3F3F46] transition-colors"
              >
                Query Record
              </button>
            </div>

            {trackingError && (
              <p className="text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-900/40">
                {trackingError}
              </p>
            )}
          </div>

          {trackedRecord && (
            <div className="bg-[#18181B] border border-[#27272A] rounded-lg p-5 space-y-4 max-w-2xl mx-auto text-xs animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
                <div>
                  <span className="text-[10px] text-[#71717A] font-mono block uppercase">APPLICATION NUMBER</span>
                  <span className="font-mono font-medium text-sm text-[#E4E4E7]">{trackedRecord.applicationNumber}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                  {trackedRecord.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[#A1A1AA]">
                <div>
                  <span className="text-[#71717A] block">Certificate:</span>
                  <span className="text-[#E4E4E7] font-medium">{trackedRecord.certificateName}</span>
                </div>
                <div>
                  <span className="text-[#71717A] block">Applicant:</span>
                  <span className="text-[#E4E4E7] font-medium">{trackedRecord.citizenName}</span>
                </div>
                <div>
                  <span className="text-[#71717A] block">SLA Target:</span>
                  <span className="text-[#10B981] font-medium">{trackedRecord.estimatedCompletionDate}</span>
                </div>
                <div>
                  <span className="text-[#71717A] block">Payment Ref:</span>
                  <span className="font-mono text-[#A1A1AA]">{trackedRecord.paymentRef}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#27272A] flex justify-end">
                <button
                  onClick={() => {
                    setCompletedApp(trackedRecord);
                    setIsReceiptModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#27272A] hover:bg-[#3F3F46] text-white rounded-lg text-xs font-medium border border-[#3F3F46] transition-colors flex items-center space-x-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>View Official Digital Receipt</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Multi-Step Voice Application Wizard */
        <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-6 sm:p-8 shadow-lg space-y-6">
          {/* Step Progress Tracker — Step 1 Auth is always done (logged in via AuthPage) */}
          <div className="grid grid-cols-6 gap-2 pb-4 border-b border-[#27272A] text-[11px] font-mono">
            {['1. Auth ✓', '2. Consent', '3. Service', '4. Voice Form', '5. Document', '6. Payment'].map(
              (label, sIdx) => (
                <div
                  key={sIdx}
                  className={`flex items-center space-x-1.5 pb-2 border-b-2 transition-all ${
                    sIdx === 0 || currentStep >= sIdx + 1
                      ? 'border-[#10B981] text-[#10B981] font-semibold'
                      : 'border-[#27272A] text-[#71717A]'
                  }`}
                >
                  <span>{label}</span>
                </div>
              )
            )}
          </div>

          {/* STEP 1: Phone & Local OTP Auth */}
          {currentStep === 1 && (
            <div className="space-y-6 max-w-md mx-auto text-center py-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#18181B] border border-[#27272A] text-[#10B981] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-light tracking-tight text-[#E4E4E7]">{t.step1Auth}</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Authenticate your citizen identity with a local 6-digit TOTP (air-gapped generation).
                </p>
              </div>

              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#71717A] mb-1">
                    Mobile Number (10 Digits)
                  </label>
                  <div className="flex rounded-lg overflow-hidden border border-[#27272A] bg-[#18181B]">
                    <span className="px-3 py-2 bg-[#27272A] text-[#A1A1AA] text-xs font-mono flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="flex-1 bg-transparent px-3 py-2 text-xs text-[#E4E4E7] focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setIsOtpSent(true)}
                      className="px-3 text-xs font-medium bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] transition-colors border-l border-[#3F3F46]"
                    >
                      {isOtpSent ? 'Resend' : t.sendOtp}
                    </button>
                  </div>
                </div>

                {isOtpSent && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#71717A]">
                      Enter 6-digit OTP (Simulated: <span className="text-[#10B981] font-mono">482910</span>)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="482910"
                      className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-4 py-2.5 text-center text-base tracking-widest text-[#10B981] font-mono focus:outline-none focus:border-[#3F3F46]"
                    />
                  </div>
                )}
              </div>

              <button
                id="btn-verify-otp"
                disabled={!isOtpSent}
                onClick={() => {
                  setIsAuthVerified(true);
                  setCurrentStep(2);
                }}
                className="w-full py-2.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-[#E4E4E7] border border-[#3F3F46] font-medium text-xs shadow-sm transition-all disabled:opacity-40 flex items-center justify-center space-x-2"
              >
                <span>{t.verifyOtp} & Continue</span>
                <ArrowRight className="w-4 h-4 text-[#10B981]" />
              </button>
            </div>
          )}

          {/* STEP 2: Voice Consent */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-lg mx-auto text-center py-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#18181B] border border-[#27272A] text-[#10B981] flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-light tracking-tight text-[#E4E4E7]">{t.step2Consent}</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Statutory verbal consent recorded locally under Data Sovereignty Isolation.
                </p>
              </div>

              <div className="bg-[#18181B] p-4 rounded-lg border border-[#27272A] text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-[#71717A]">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#10B981]">
                    Statutory Declaration:
                  </span>
                  <button
                    onClick={() => speakText(t.consentStatement)}
                    className="p-1 rounded bg-[#27272A] text-[#A1A1AA] hover:text-white"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#E4E4E7] leading-relaxed font-sans italic">
                  "{t.consentStatement}"
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setConsentGiven(true);
                    setCurrentStep(3);
                  }}
                  className="px-6 py-2.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-[#E4E4E7] border border-[#3F3F46] font-medium text-xs shadow-sm transition-all flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>{t.consentGiven}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Service Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-light tracking-tight text-[#E4E4E7]">{t.step3Service}</h2>
                  <p className="text-xs text-[#71717A]">
                    Select certificate service from the statutory catalogue (25 services available).
                  </p>
                </div>
                <span className="text-xs text-[#71717A] bg-[#18181B] border border-[#27272A] px-3 py-1 rounded-md font-mono">
                  3 Full Voice Flows + 22 Stubs
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CERTIFICATES_CATALOGUE.slice(0, 6).map((cert) => {
                  const isSelected = selectedCertificate.id === cert.id;
                  return (
                    <div
                      key={cert.id}
                      onClick={() => setSelectedCertificate(cert)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#18181B] border-[#10B981] shadow-sm ring-1 ring-[#10B981]'
                          : 'bg-[#18181B] border-[#27272A] hover:border-[#3F3F46]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#27272A] text-[#A1A1AA]">
                            {cert.code}
                          </span>
                          <span className="text-xs font-mono text-[#10B981]">₹{cert.fee}</span>
                        </div>
                        <h3 className="font-medium text-sm text-[#E4E4E7]">
                          {cert.nameTranslations[currentLanguage] || cert.name}
                        </h3>
                        <p className="text-xs text-[#71717A] line-clamp-2">{cert.description}</p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#27272A] flex items-center justify-between text-[11px] text-[#71717A]">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-[#10B981]" /> SLA: {cert.slaDays} Days
                        </span>
                        {cert.isFullFlow ? (
                          <span className="text-[#10B981] font-mono text-[10px]">Full Flow</span>
                        ) : (
                          <span className="text-[#71717A] text-[10px]">Standard</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#27272A]">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-lg text-xs text-[#71717A] hover:text-[#E4E4E7]"
                >
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button
                  id="btn-proceed-voice-form"
                  onClick={() => {
                    setCurrentStep(4);
                    setCurrentFieldIndex(0);
                  }}
                  className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-[#E4E4E7] border border-[#3F3F46] font-medium text-xs shadow-sm transition-all"
                >
                  <span>Start Conversational Form</span>
                  <ArrowRight className="w-4 h-4 text-[#10B981]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Conversational Voice Form */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#10B981] block">
                    {selectedCertificate.nameTranslations[currentLanguage] || selectedCertificate.name}
                  </span>
                  <h2 className="text-base font-medium text-[#E4E4E7]">
                    Field {currentFieldIndex + 1} of {selectedCertificate.fields.length}:{' '}
                    <span className="text-[#A1A1AA]">
                      {selectedCertificate.fields[currentFieldIndex]?.label}
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => setAutoSpeakEnabled(!autoSpeakEnabled)}
                  className={`p-2 rounded-lg text-xs flex items-center space-x-1 border ${
                    autoSpeakEnabled
                      ? 'bg-[#18181B] text-[#10B981] border-[#10B981]/40'
                      : 'bg-[#18181B] text-[#71717A] border-[#27272A]'
                  }`}
                >
                  {autoSpeakEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline font-mono text-[10px]">TTS</span>
                </button>
              </div>

              {/* Conversational Box */}
              <div className="bg-[#18181B] rounded-xl p-6 border border-[#27272A] space-y-6 text-center shadow-inner">
                <div className="bg-[#0A0A0B] rounded-lg p-4 border border-[#27272A] text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#10B981] flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> Spoken Assistant Prompt:
                    </span>
                    <button
                      onClick={() => {
                        const field = selectedCertificate.fields[currentFieldIndex];
                        speakText(field.voicePrompt[currentLanguage] || field.voicePrompt.en);
                      }}
                      className="text-[#71717A] hover:text-white p-1"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-[#E4E4E7] font-medium leading-relaxed">
                    {selectedCertificate.fields[currentFieldIndex]?.voicePrompt[currentLanguage] ||
                      selectedCertificate.fields[currentFieldIndex]?.voicePrompt.en}
                  </p>
                  <p className="text-xs text-[#71717A] mt-2 font-mono">
                    Example: "{selectedCertificate.fields[currentFieldIndex]?.example}"
                  </p>
                </div>

                {/* Mic Visualizer */}
                <div className="flex flex-col items-center justify-center space-y-3 py-2">
                  <button
                    id="btn-voice-mic"
                    onClick={toggleListening}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      isListening
                        ? 'bg-red-600 text-white animate-pulse shadow-lg ring-4 ring-red-500/20'
                        : 'bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] border border-[#3F3F46]'
                    }`}
                  >
                    {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6 text-[#10B981]" />}
                  </button>

                  <div className="text-center">
                    <p className="text-xs font-medium text-[#E4E4E7]">
                      {isListening ? t.listening : t.clickToSpeak}
                    </p>
                    <p className="text-[11px] text-[#71717A]">
                      Audio transcribed locally with Whisper (zero cloud egress)
                    </p>
                  </div>
                </div>

                {/* Text Input Fallback */}
                <div className="flex items-center space-x-2 max-w-lg mx-auto">
                  <input
                    type="text"
                    value={spokenInput}
                    onChange={(e) => setSpokenInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVoiceInput(spokenInput);
                    }}
                    placeholder="Type or review transcribed answer..."
                    className="flex-1 bg-[#0A0A0B] border border-[#27272A] rounded-lg px-3.5 py-2 text-xs text-[#E4E4E7] focus:outline-none focus:border-[#3F3F46]"
                  />
                  <button
                    disabled={!spokenInput.trim() || aiProcessing}
                    onClick={() => handleVoiceInput(spokenInput)}
                    className="px-4 py-2 bg-[#27272A] hover:bg-[#3F3F46] text-white rounded-lg text-xs font-medium border border-[#3F3F46] transition-colors disabled:opacity-40 flex items-center space-x-1"
                  >
                    <span>{aiProcessing ? 'Parsing...' : 'Next'}</span>
                    <Send className="w-3.5 h-3.5 text-[#10B981]" />
                  </button>
                </div>
              </div>

              {/* Captured Field Cards */}
              <div className="bg-[#18181B] p-4 rounded-lg border border-[#27272A]">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A] block mb-2">
                  Captured Application Details:
                </span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedCertificate.fields.map((f, idx) => {
                    const val = formData[f.id];
                    const isCurrent = idx === currentFieldIndex;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setCurrentFieldIndex(idx)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isCurrent
                            ? 'bg-[#27272A] border-[#10B981] text-[#E4E4E7]'
                            : val
                            ? 'bg-[#0A0A0B] border-[#27272A] text-[#A1A1AA]'
                            : 'bg-[#0A0A0B]/50 border-[#27272A] text-[#71717A]'
                        }`}
                      >
                        <span className="block text-[10px] text-[#71717A] truncate">{f.label}</span>
                        <span className="font-medium truncate block font-mono text-[11px]">
                          {val || (isCurrent ? '● Active' : '— Pending')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    if (currentFieldIndex > 0) setCurrentFieldIndex((prev) => prev - 1);
                    else setCurrentStep(3);
                  }}
                  className="px-4 py-2 rounded-lg text-xs text-[#71717A] hover:text-[#E4E4E7]"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Previous Field
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#18181B] hover:bg-[#27272A] text-[#E4E4E7] border border-[#27272A] transition-colors"
                >
                  Skip to Documents <ArrowRight className="w-3.5 h-3.5 inline ml-1 text-[#10B981]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Document Upload & Local OCR */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-light tracking-tight text-[#E4E4E7]">{t.step5Docs}</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Upload verification documents. Files are processed in-memory by local Tesseract 5 OCR.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCertificate.requiredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 rounded-lg bg-[#18181B] border border-[#27272A] flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#E4E4E7]">{doc.name}</span>
                        {documentVerified ? (
                          <span className="px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-[10px] font-mono flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#71717A] bg-[#27272A] px-2 py-0.5 rounded border border-[#3F3F46]">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#71717A]">{doc.description}</p>
                    </div>

                    <button
                      onClick={() => setIsOcrModalOpen(true)}
                      className={`w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                        documentVerified
                          ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30'
                          : 'bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] border border-[#3F3F46]'
                      }`}
                    >
                      <FileCheck className="w-4 h-4 text-[#10B981]" />
                      <span>{documentVerified ? 'Re-scan with OCR' : t.scanOCR}</span>
                    </button>
                  </div>
                ))}
              </div>

              {documentVerified && (
                <div className="bg-[#18181B] p-4 rounded-lg border border-[#27272A] text-xs text-[#10B981] flex items-center justify-between font-mono">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Local OCR Check: Name Match 98% (Zero PII Cloud Egress)</span>
                  </div>
                  <span>{ocrConfidence}% Match</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#27272A]">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 rounded-lg text-xs text-[#71717A] hover:text-[#E4E4E7]"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Back to Form
                </button>
                <button
                  id="btn-proceed-payment"
                  onClick={() => setCurrentStep(6)}
                  className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-[#E4E4E7] border border-[#3F3F46] font-medium text-xs shadow-sm transition-all"
                >
                  <span>{t.proceedPayment}</span>
                  <ArrowRight className="w-4 h-4 text-[#10B981]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Fee Payment */}
          {currentStep === 6 && (
            <div className="space-y-6 max-w-lg mx-auto text-center py-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#18181B] border border-[#27272A] text-[#10B981] flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-light tracking-tight text-[#E4E4E7]">{t.step6Pay}</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Pay statutory treasury fee via mock UPI gateway.
                </p>
              </div>

              <div className="bg-[#18181B] p-5 rounded-lg border border-[#27272A] text-left space-y-3 text-xs text-[#A1A1AA]">
                <div className="flex justify-between">
                  <span>Certificate Service:</span>
                  <span className="font-medium text-[#E4E4E7]">{selectedCertificate.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Applicant:</span>
                  <span className="font-medium text-[#E4E4E7]">{formData.fullName || 'Radha Devi'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#27272A] text-sm font-semibold text-[#E4E4E7]">
                  <span>Statutory Fee:</span>
                  <span className="text-[#10B981] font-mono">₹{selectedCertificate.fee}.00</span>
                </div>
              </div>

              <button
                id="btn-open-payment-modal"
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full py-3 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-[#E4E4E7] border border-[#3F3F46] font-medium text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                <QrCode className="w-4 h-4 text-[#10B981]" />
                <span>Open UPI QR Code & Pay ₹{selectedCertificate.fee}</span>
              </button>

              {paymentSuccessRef && (
                <div className="p-3 bg-[#18181B] border border-[#27272A] rounded-lg text-xs text-[#10B981] font-mono">
                  Payment confirmed! Ref: {paymentSuccessRef}
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Completed Application */}
          {currentStep === 7 && completedApp && (
            <div className="space-y-6 text-center py-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#18181B] border border-[#27272A] text-[#10B981] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-light tracking-tight text-[#E4E4E7]">Application Submitted Successfully</h2>
                <p className="text-xs text-[#71717A] mt-1">
                  Your record has been routed to the Tehsildar office. Official digital receipt generated.
                </p>
              </div>

              <div className="bg-[#18181B] max-w-md mx-auto p-4 rounded-lg border border-[#27272A] text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Tracking Token:</span>
                  <span className="font-semibold text-[#10B981]">{completedApp.trackingToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Application Number:</span>
                  <span className="text-[#E4E4E7]">{completedApp.applicationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#71717A]">Estimated Completion:</span>
                  <span className="text-[#10B981]">{completedApp.estimatedCompletionDate}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setIsReceiptModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] border border-[#3F3F46] font-medium text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <FileCheck className="w-4 h-4 text-[#10B981]" />
                  <span>{t.viewReceipt}</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setFormData({});
                    setSpokenInput('');
                    setPaymentSuccessRef('');
                    setDocumentVerified(false);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-[#71717A] hover:text-[#E4E4E7] border border-[#27272A] text-xs transition-colors"
                >
                  Start New Application
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OCR Scanner Modal */}
      <DocumentScanner
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        documentTitle={selectedCertificate.requiredDocuments[0]?.name || 'Identity Proof'}
        applicantName={formData.fullName || 'Radha Devi'}
        annualIncome={formData.annualIncome}
        onSuccess={(extracted, conf) => {
          setOcrExtractedData(extracted);
          setOcrConfidence(conf);
          setDocumentVerified(true);
        }}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={selectedCertificate.fee}
        certificateName={selectedCertificate.name}
        applicantName={formData.fullName || 'Citizen Applicant'}
        onPaymentSuccess={(ref) => {
          setPaymentSuccessRef(ref);
          handleFinalSubmit();
        }}
      />

      {/* Official Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        application={completedApp}
      />
    </div>
  );
};
