import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  BadgeCheck,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  LayoutDashboard,
  Mic,
} from 'lucide-react';
import { useAuth, SignupData } from '../context/AuthContext';

type AuthMode = 'login' | 'signup';
type PortalRole = 'citizen' | 'admin';

export const AuthPage: React.FC = () => {
  const { login, signup } = useAuth();

  const [portalRole, setPortalRole] = useState<PortalRole>('citizen');
  const [mode, setMode] = useState<AuthMode>('login');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('Revenue Department');
  const [signupDesignation, setSignupDesignation] = useState('Verification Officer');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginEmail || !loginPassword) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    const result = await login(loginEmail.trim(), loginPassword, portalRole);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!signupName || !signupEmail || !signupPassword) {
      setError('Name, email and password are required.');
      return;
    }
    if (signupPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    setIsLoading(true);
    const payload: SignupData = {
      name: signupName.trim(),
      email: signupEmail.trim(),
      phone: signupPhone.trim(),
      password: signupPassword,
      role: portalRole,
      ...(portalRole === 'admin' && {
        department: signupDepartment,
        designation: signupDesignation,
      }),
    };
    const result = await signup(payload);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || 'Registration failed.');
    } else {
      setSuccessMsg('Account created! Redirecting...');
    }
  };

  const switchRole = (role: PortalRole) => {
    setPortalRole(role);
    setMode('login');
    setError('');
    setSuccessMsg('');
    setLoginEmail('');
    setLoginPassword('');
  };

  const isCitizen = portalRole === 'citizen';

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background grid / glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#10B981 1px, transparent 1px), linear-gradient(90deg, #10B981 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#10B981]/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#18181B] border border-[#27272A] mb-2 shadow-lg">
            <div className="w-3.5 h-3.5 rounded-full bg-[#10B981] animate-pulse" />
          </div>
          <h1 className="text-2xl font-light tracking-tight text-[#E4E4E7]">
            Jan<span className="text-[#10B981] font-medium">Setu</span>
          </h1>
          <p className="text-xs text-[#71717A] font-mono">
            Voice-First Revenue &amp; Certificate Services Platform
          </p>
          <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 font-mono">
            <ShieldCheck className="w-3 h-3" /> Air-Gapped · Zero Cloud Egress · 100% Local
          </span>
        </div>

        {/* Portal Role Toggle */}
        <div className="flex rounded-xl overflow-hidden border border-[#27272A] bg-[#0E0E10] p-1 gap-1">
          <button
            id="auth-tab-citizen"
            onClick={() => switchRole('citizen')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              isCitizen
                ? 'bg-[#18181B] text-white border border-[#3F3F46] shadow-sm'
                : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-[#10B981]" />
            Citizen Portal
          </button>
          <button
            id="auth-tab-admin"
            onClick={() => switchRole('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              !isCitizen
                ? 'bg-[#18181B] text-white border border-[#3F3F46] shadow-sm'
                : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#10B981]" />
            Admin / Officer Portal
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0E0E10] border border-[#27272A] rounded-2xl p-6 shadow-2xl space-y-5">
          {/* Login / Signup toggle (Citizen only gets signup) */}
          <div className="flex border-b border-[#27272A] -mx-6 px-6 mb-0 pb-0">
            <button
              id="auth-mode-login"
              onClick={() => { setMode('login'); setError(''); }}
              className={`pb-3 mr-5 text-sm font-medium transition-all border-b-2 ${
                mode === 'login'
                  ? 'border-[#10B981] text-[#E4E4E7]'
                  : 'border-transparent text-[#71717A] hover:text-[#A1A1AA]'
              }`}
            >
              Sign In
            </button>
            {isCitizen && (
              <button
                id="auth-mode-signup"
                onClick={() => { setMode('signup'); setError(''); }}
                className={`pb-3 text-sm font-medium transition-all border-b-2 ${
                  mode === 'signup'
                    ? 'border-[#10B981] text-[#E4E4E7]'
                    : 'border-transparent text-[#71717A] hover:text-[#A1A1AA]'
                }`}
              >
                Create Account
              </button>
            )}
          </div>

          {/* Error / Success banners */}
          {error && (
            <div className="flex items-start gap-2.5 text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2.5 text-xs text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#71717A]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3F3F46]" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={isCitizen ? 'citizen@example.com' : 'officer@revenue.gov.in'}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#E4E4E7] placeholder-[#3F3F46] focus:outline-none focus:border-[#4F4F52] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#71717A]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3F3F46]" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-10 pr-10 py-2.5 text-sm text-[#E4E4E7] placeholder-[#3F3F46] focus:outline-none focus:border-[#4F4F52] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3F3F46] hover:text-[#71717A] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Demo credentials hint */}
              <div className="bg-[#18181B] rounded-lg p-3 border border-[#27272A] text-[11px] text-[#71717A] space-y-1">
                <p className="font-semibold text-[#A1A1AA]">Quick demo accounts:</p>
                {isCitizen ? (
                  <>
                    <p>Email: <span className="font-mono text-[#10B981]">radha@citizen.in</span> · Pass: <span className="font-mono text-[#10B981]">demo1234</span></p>
                    <p className="text-[10px]">Or register a new account above →</p>
                  </>
                ) : (
                  <>
                    <p>Email: <span className="font-mono text-[#10B981]">officer@revenue.gov.in</span> · Pass: <span className="font-mono text-[#10B981]">admin1234</span></p>
                    <p className="text-[10px]">Admin accounts are pre-seeded on first run.</p>
                  </>
                )}
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#10B981] hover:bg-[#0D9F6F] disabled:opacity-50 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to {isCitizen ? 'Citizen Portal' : 'Admin Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── SIGNUP FORM (Citizen only) ── */}
          {mode === 'signup' && isCitizen && (
            <form onSubmit={handleSignup} className="space-y-4" noValidate>
              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#71717A]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3F3F46]" />
                  <input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Radha Devi"
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#E4E4E7] placeholder-[#3F3F46] focus:outline-none focus:border-[#4F4F52] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#71717A]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3F3F46]" />
                  <input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#E4E4E7] placeholder-[#3F3F46] focus:outline-none focus:border-[#4F4F52] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#71717A]">
                  Mobile Number (optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3F3F46]" />
                  <input
                    id="signup-phone"
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#E4E4E7] placeholder-[#3F3F46] focus:outline-none focus:border-[#4F4F52] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#71717A]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3F3F46]" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min. 4 characters"
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg pl-10 pr-10 py-2.5 text-sm text-[#E4E4E7] placeholder-[#3F3F46] focus:outline-none focus:border-[#4F4F52] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3F3F46] hover:text-[#71717A]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-signup-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#10B981] hover:bg-[#0D9F6F] disabled:opacity-50 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Citizen Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-[#71717A]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-[#10B981] hover:underline font-medium"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* Admin note — no self-signup */}
          {mode === 'login' && !isCitizen && (
            <p className="text-center text-[11px] text-[#71717A]">
              Admin accounts are provisioned by the system administrator. Contact your IT department for credentials.
            </p>
          )}
        </div>

        {/* Footer data sovereignty badge */}
        <p className="text-center text-[10px] text-[#3F3F46] font-mono">
          All data stored locally on-device · No data leaves your machine · SHA-256 citizen identity masking
        </p>
      </div>
    </div>
  );
};
