import React from 'react';
import {
  ShieldCheck,
  Mic,
  MessageSquare,
  PhoneCall,
  LayoutDashboard,
  FileCode2,
  Globe2,
  LogOut,
  UserCircle2,
} from 'lucide-react';
import { LANGUAGES } from '../data/certificates';
import { LanguageCode } from '../types';
import { useAuth, AuthUser } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'citizen' | 'whatsapp' | 'ivr' | 'admin' | 'architecture';
  setActiveTab: (tab: 'citizen' | 'whatsapp' | 'ivr' | 'admin' | 'architecture') => void;
  currentLanguage: LanguageCode;
  setCurrentLanguage: (lang: LanguageCode) => void;
  user: AuthUser;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentLanguage,
  setCurrentLanguage,
  user,
}) => {
  const { logout } = useAuth();
  const isAdmin = user.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0B]/95 backdrop-blur border-b border-[#27272A] text-[#E4E4E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border border-[#3F3F46] flex items-center justify-center bg-[#18181B] text-[#10B981]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
                  {isAdmin ? 'Admin / Officer Portal' : 'Citizen Portal'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-light tracking-tight text-[#E4E4E7]">
                  JanSetu <span className="text-[#71717A]">Voice Revenue</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                  <ShieldCheck className="w-3 h-3 mr-1 text-[#10B981]" />
                  $0.00 Free Tier
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-[#18181B] p-1 rounded-lg border border-[#27272A]">
            {/* Citizen-only tabs */}
            {!isAdmin && (
              <>
                <button
                  id="nav-tab-citizen"
                  onClick={() => setActiveTab('citizen')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'citizen'
                      ? 'bg-[#27272A] text-white shadow-sm border border-[#3F3F46]'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Citizen Voice</span>
                </button>

                <button
                  id="nav-tab-whatsapp"
                  onClick={() => setActiveTab('whatsapp')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'whatsapp'
                      ? 'bg-[#27272A] text-white shadow-sm border border-[#3F3F46]'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>WhatsApp Sim</span>
                </button>

                <button
                  id="nav-tab-ivr"
                  onClick={() => setActiveTab('ivr')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'ivr'
                      ? 'bg-[#27272A] text-white shadow-sm border border-[#3F3F46]'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>IVR Phone</span>
                </button>
              </>
            )}

            {/* Admin tab (visible to all, but gated by role in Dashboard) */}
            <button
              id="nav-tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#27272A] text-white shadow-sm border border-[#3F3F46]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Telemetry &amp; Triage</span>
            </button>

            <button
              id="nav-tab-architecture"
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'architecture'
                  ? 'bg-[#27272A] text-white shadow-sm border border-[#3F3F46]'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Architecture Plan</span>
            </button>
          </nav>

          {/* Right side: Language selector + User badge + Logout */}
          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="hidden sm:flex items-center bg-[#18181B] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-[#E4E4E7]">
              <Globe2 className="w-3.5 h-3.5 mr-1.5 text-[#10B981]" />
              <select
                id="language-selector"
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-[#E4E4E7] font-medium focus:outline-none cursor-pointer text-xs"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#18181B] text-[#E4E4E7]">
                    {lang.flag} {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* User badge */}
            <div className="hidden sm:flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-lg px-2.5 py-1.5">
              <UserCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              <div className="text-xs leading-tight">
                <p className="text-[#E4E4E7] font-medium max-w-[90px] truncate">{user.name.split(' ')[0]}</p>
                <p className="text-[#71717A] capitalize text-[10px]">{user.role}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              id="btn-logout"
              onClick={logout}
              title="Sign out"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] hover:border-red-900/50 hover:text-red-400 text-[#71717A] text-xs transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex overflow-x-auto space-x-1 py-2 border-t border-[#27272A] scrollbar-none">
          {!isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('citizen')}
                className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${
                  activeTab === 'citizen' ? 'bg-[#27272A] text-white border border-[#3F3F46]' : 'text-[#A1A1AA] bg-[#18181B]'
                }`}
              >
                Citizen Voice
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${
                  activeTab === 'whatsapp' ? 'bg-[#27272A] text-white border border-[#3F3F46]' : 'text-[#A1A1AA] bg-[#18181B]'
                }`}
              >
                WhatsApp
              </button>
              <button
                onClick={() => setActiveTab('ivr')}
                className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${
                  activeTab === 'ivr' ? 'bg-[#27272A] text-white border border-[#3F3F46]' : 'text-[#A1A1AA] bg-[#18181B]'
                }`}
              >
                IVR Phone
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${
              activeTab === 'admin' ? 'bg-[#27272A] text-white border border-[#3F3F46]' : 'text-[#A1A1AA] bg-[#18181B]'
            }`}
          >
            Telemetry
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${
              activeTab === 'architecture' ? 'bg-[#27272A] text-white border border-[#3F3F46]' : 'text-[#A1A1AA] bg-[#18181B]'
            }`}
          >
            Architecture
          </button>
          <button
            onClick={logout}
            className="px-3 py-1 text-xs rounded-md whitespace-nowrap text-red-400 bg-[#18181B]"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
