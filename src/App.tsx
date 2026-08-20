import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { Navbar } from './components/Navbar';
import { CitizenPortal } from './components/CitizenPortal';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { IVRSimulator } from './components/IVRSimulator';
import { AdminDashboard } from './components/AdminDashboard';
import { ArchitecturePlanView } from './components/ArchitecturePlanView';
import { LanguageCode, ApplicationRecord } from './types';
import { ShieldCheck, Loader2 } from 'lucide-react';

/** Inner app — only rendered when user is authenticated */
function AppInner() {
  const { user, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'citizen' | 'whatsapp' | 'ivr' | 'admin' | 'architecture'>('citizen');
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('hi');

  const handleApplicationCompleted = (app: ApplicationRecord) => {
    console.log('Application completed:', app.applicationNumber);
  };

  // While restoring session from localStorage, show a small spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#10B981] animate-spin" />
      </div>
    );
  }

  // Not logged in → show auth page
  if (!user) {
    return <AuthPage />;
  }

  // Admin user who somehow lands on citizen tab — redirect to admin
  const resolvedTab =
    user.role === 'admin' && activeTab === 'citizen' ? 'admin' : activeTab;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] flex flex-col font-sans selection:bg-[#10B981] selection:text-black">
      {/* Top Navigation */}
      <Navbar
        activeTab={resolvedTab}
        setActiveTab={setActiveTab}
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
        user={user}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {resolvedTab === 'citizen' && user.role === 'citizen' && (
          <CitizenPortal
            currentLanguage={currentLanguage}
            onApplicationCompleted={handleApplicationCompleted}
            user={user}
          />
        )}

        {resolvedTab === 'whatsapp' && (
          <WhatsAppSimulator currentLanguage={currentLanguage} />
        )}

        {resolvedTab === 'ivr' && (
          <IVRSimulator currentLanguage={currentLanguage} />
        )}

        {resolvedTab === 'admin' && <AdminDashboard user={user} />}

        {resolvedTab === 'architecture' && <ArchitecturePlanView />}
      </main>

      {/* Footer & Compliance Seal */}
      <footer className="bg-[#0A0A0B] border-t border-[#27272A] text-[#71717A] py-6 px-4 text-xs mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-8 h-8 rounded-full border border-[#27272A] bg-[#18181B] text-[#10B981] flex items-center justify-center font-mono text-xs">
              🏛️
            </div>
            <div>
              <p className="font-medium text-[#E4E4E7]">
                JanSetu Voice Revenue &amp; Certificate Services Platform
              </p>
              <p className="text-[11px] text-[#71717A] font-mono">
                Zero Cloud Egress • 100% Free / Open-Source Stack (Whisper + Llama 3.2 + Tesseract 5)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-[#71717A] font-mono">
            <span className="flex items-center text-[#10B981]">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Air-Gapped Trust
            </span>
            <span>•</span>
            <button
              onClick={() => setActiveTab('architecture')}
              className="text-[#E4E4E7] hover:text-[#10B981] transition-colors underline decoration-[#3F3F46]"
            >
              View Free Architecture Plan &amp; ADRs
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Root — wraps everything with AuthProvider */
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
