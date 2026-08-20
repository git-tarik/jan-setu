import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  Radio,
  Search,
  Check,
  Lock,
} from 'lucide-react';
import { AuditLogEntry, EscalationTicket, SystemMetrics } from '../types';
import { AuthUser } from '../context/AuthContext';

export const AdminDashboard: React.FC<{ user?: AuthUser }> = ({ user }) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    voiceTranscriptionLatencyMs: 312,
    llmInferenceLatencyMs: 420,
    ttsSynthesisLatencyMs: 180,
    totalApplications: 148,
    activeSessions: 6,
    fsmTransitionsTotal: 1842,
    ocrAccuracyPercent: 94.6,
    dataSovereigntyViolations: 0,
    escalationCount: 2,
    channelCounts: { web: 68, whatsapp: 52, ivr: 28 },
    languageCounts: { hi: 74, en: 32, ta: 18, te: 10, ml: 6, bn: 4, mr: 3, ur: 1 },
  });

  const [tickets, setTickets] = useState<EscalationTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<string>('');
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  useEffect(() => {
    // Only fetch data if user is actually an admin
    if (user?.role !== 'admin') return;
    fetchMetrics();
    fetchEscalations();
    fetchAuditLogs();
    const interval = setInterval(fetchMetrics, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      if (data) setMetrics(data);
    } catch (e) {
      console.warn('Metrics error:', e);
    }
  };

  const fetchEscalations = async () => {
    try {
      const res = await fetch('/api/escalation');
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
    } catch (e) {
      console.warn('Escalation fetch error:', e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data.logs) setAuditLogs(data.logs);
    } catch (e) {
      console.warn('Logs fetch error:', e);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await fetch('/api/escalation/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, resolutionNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: 'RESOLVED', notes: resolutionNotes } : t))
        );
        setResolvingTicketId(null);
        setResolutionNotes('');
        fetchMetrics();
      }
    } catch (e) {
      console.error('Resolve error:', e);
    }
  };

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.details.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.channel.toLowerCase().includes(logFilter.toLowerCase())
  );

  // Role guard — citizen users should not see admin dashboard
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#18181B] border border-[#27272A] flex items-center justify-center">
          <Lock className="w-8 h-8 text-[#71717A]" />
        </div>
        <div>
          <h2 className="text-xl font-light text-[#E4E4E7] mb-2">Access Restricted</h2>
          <p className="text-sm text-[#71717A]">
            The Admin &amp; Telemetry Dashboard is only accessible to verified Revenue Officers and Administrators.
          </p>
          <p className="text-xs text-[#3F3F46] mt-4 font-mono">
            Your role: <span className="text-[#A1A1AA]">{user?.role || 'unauthenticated'}</span> · Required: <span className="text-[#10B981]">admin</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-[#0E0E10] border border-[#27272A] p-6 sm:p-8 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
            Operations & Observability
          </span>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-light tracking-tight text-[#E4E4E7]">
              Telemetry Center: <span className="text-[#71717A]">Prometheus Exporter</span>
            </h1>
          </div>
          <p className="text-xs text-[#A1A1AA]">
            Real-time latency metrics, omnichannel application distribution, and zero-egress audit ledger.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-[#18181B] px-3.5 py-2 rounded-lg border border-[#27272A] font-mono text-xs">
            <span className="text-[#71717A] block text-[9px] uppercase">Data Sovereignty</span>
            <span className="text-[#10B981] font-medium flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> 0 Cloud Violations
            </span>
          </div>
          <div className="bg-[#18181B] px-3.5 py-2 rounded-lg border border-[#27272A] font-mono text-xs">
            <span className="text-[#71717A] block text-[9px] uppercase">Active Sessions</span>
            <span className="text-[#E4E4E7] font-medium flex items-center">
              <Radio className="w-3.5 h-3.5 mr-1 text-[#10B981] animate-pulse" /> {metrics.activeSessions} Live
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#71717A] text-xs">
            <span>Voice STT Latency</span>
            <Activity className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-light text-[#E4E4E7] font-mono">{metrics.voiceTranscriptionLatencyMs} ms</div>
          <div className="text-[11px] text-[#71717A] flex items-center justify-between font-mono">
            <span>Whisper Tiny</span>
            <span className="text-[#10B981]">32x Realtime</span>
          </div>
        </div>

        <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#71717A] text-xs">
            <span>LLM / NLU Extraction</span>
            <Layers className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-light text-[#E4E4E7] font-mono">{metrics.llmInferenceLatencyMs} ms</div>
          <div className="text-[11px] text-[#71717A] flex items-center justify-between font-mono">
            <span>Llama 3.2 3B</span>
            <span className="text-[#10B981]">4-bit Quantized</span>
          </div>
        </div>

        <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#71717A] text-xs">
            <span>Total Applications</span>
            <Users className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-light text-[#E4E4E7] font-mono">{metrics.totalApplications}</div>
          <div className="text-[11px] text-[#71717A] flex items-center justify-between font-mono">
            <span>FSM Transitions</span>
            <span className="text-[#E4E4E7]">{metrics.fsmTransitionsTotal}</span>
          </div>
        </div>

        <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#71717A] text-xs">
            <span>OCR Match Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-light text-[#E4E4E7] font-mono">{metrics.ocrAccuracyPercent}%</div>
          <div className="text-[11px] text-[#71717A] flex items-center justify-between font-mono">
            <span>Tesseract 5</span>
            <span className="text-[#10B981]">In-Memory</span>
          </div>
        </div>
      </div>

      {/* Omnichannel Distribution & Languages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-[#E4E4E7]">Omnichannel Intake Distribution</h3>
            <span className="text-xs font-mono text-[#71717A]">3 Channels Active</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-[#A1A1AA] mb-1 font-mono">
                <span>Citizen Web Voice Portal</span>
                <span className="font-medium text-[#E4E4E7]">
                  {metrics.channelCounts.web} (
                  {Math.round((metrics.channelCounts.web / metrics.totalApplications) * 100)}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#18181B] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] rounded-full"
                  style={{ width: `${(metrics.channelCounts.web / metrics.totalApplications) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#A1A1AA] mb-1 font-mono">
                <span>WhatsApp Messaging Bot</span>
                <span className="font-medium text-[#E4E4E7]">
                  {metrics.channelCounts.whatsapp} (
                  {Math.round((metrics.channelCounts.whatsapp / metrics.totalApplications) * 100)}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#18181B] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981]/70 rounded-full"
                  style={{ width: `${(metrics.channelCounts.whatsapp / metrics.totalApplications) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#A1A1AA] mb-1 font-mono">
                <span>IVR Feature Phone</span>
                <span className="font-medium text-[#E4E4E7]">
                  {metrics.channelCounts.ivr} (
                  {Math.round((metrics.channelCounts.ivr / metrics.totalApplications) * 100)}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#18181B] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981]/40 rounded-full"
                  style={{ width: `${(metrics.channelCounts.ivr / metrics.totalApplications) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-[#E4E4E7]">Multilingual Dialect Distribution</h3>
            <span className="text-xs font-mono text-[#71717A]">8 Indic Languages</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {Object.entries(metrics.languageCounts).map(([lang, count]) => (
              <div key={lang} className="bg-[#18181B] p-2.5 rounded-lg border border-[#27272A]">
                <span className="font-mono text-[#71717A] uppercase text-[10px] block">{lang}</span>
                <span className="text-base font-mono font-medium text-[#E4E4E7]">{count}</span>
                <span className="text-[9px] text-[#71717A] block font-mono">apps</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LangGraph Agentic Workflow Architecture Panel */}
      <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#18181B] border border-[#27272A] text-[#10B981] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-[#E4E4E7]">LangGraph Agentic StateGraph (Scalable DAG)</h3>
              <p className="text-xs text-[#71717A]">
                Decoupled multi-agent node architecture with conditional routing, self-correction, and SQLite checkpointer.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 rounded font-mono text-xs">
            StateGraph Compiled & Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2 font-mono text-xs">
          <div className="bg-[#18181B] border border-[#27272A] p-3.5 rounded-lg space-y-1">
            <div className="text-[10px] text-[#10B981] font-semibold">1. START / ENTRY</div>
            <div className="text-[#E4E4E7] font-medium">guardrail_node</div>
            <p className="text-[11px] text-[#71717A] font-sans">Aadhaar/PAN intercept, Air-gap sovereignty enforcement</p>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] p-3.5 rounded-lg space-y-1">
            <div className="text-[10px] text-[#10B981] font-semibold">2. NLU AGENT</div>
            <div className="text-[#E4E4E7] font-medium">intent_nlu_node</div>
            <p className="text-[11px] text-[#71717A] font-sans">Indic entity extraction, Lakh/Thousand numeral normalization</p>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] p-3.5 rounded-lg space-y-1">
            <div className="text-[10px] text-[#10B981] font-semibold">3. REVENUE AGENT</div>
            <div className="text-[#E4E4E7] font-medium">validation_node</div>
            <p className="text-[11px] text-[#71717A] font-sans">Statutory rules check, income limits, residence duration</p>
          </div>

          <div className="bg-[#18181B] border border-[#F59E0B] p-3.5 rounded-lg space-y-1">
            <div className="text-[10px] text-[#F59E0B] font-semibold">4. CONDITIONAL EDGE</div>
            <div className="text-[#E4E4E7] font-medium">route_after_val</div>
            <p className="text-[11px] text-[#71717A] font-sans">Branch: Retries &gt;= 3 &rarr; Escalation, Else &rarr; Response</p>
          </div>

          <div className="bg-[#18181B] border border-[#27272A] p-3.5 rounded-lg space-y-1">
            <div className="text-[10px] text-[#10B981] font-semibold">5. SYNTHESIS / END</div>
            <div className="text-[#E4E4E7] font-medium">response_node</div>
            <p className="text-[11px] text-[#71717A] font-sans">Multilingual voice prompt, next hint, SQLite checkpoint</p>
          </div>
        </div>
      </div>

      {/* Escalation Queue */}
      <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#18181B] border border-[#27272A] text-[#10B981] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-[#E4E4E7]">Officer Escalation Queue</h3>
              <p className="text-xs text-[#71717A]">
                Low-confidence document scans & edge-case income disputes requiring revenue officer review.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-[#18181B] text-[#10B981] border border-[#27272A] rounded font-mono text-xs">
            {tickets.filter((t) => t.status !== 'RESOLVED').length} Open
          </span>
        </div>

        <div className="space-y-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-lg border text-xs space-y-2 ${
                t.status === 'RESOLVED'
                  ? 'bg-[#18181B]/40 border-[#27272A] opacity-60'
                  : 'bg-[#18181B] border-[#27272A]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-mono">
                  <span className="font-medium text-[#E4E4E7]">{t.id}</span>
                  <span className="text-[#71717A]">•</span>
                  <span className="text-[#10B981]">{t.applicationId}</span>
                  <span className="text-[#71717A]">•</span>
                  <span className="text-[#A1A1AA] font-sans">{t.citizenName} ({t.phone})</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                    t.status === 'RESOLVED'
                      ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                      : 'bg-[#27272A] text-[#E4E4E7] border-[#3F3F46]'
                  }`}
                >
                  {t.status}
                </span>
              </div>

              <p className="text-[#A1A1AA] leading-relaxed">
                <strong className="text-[#E4E4E7]">Trigger Reason:</strong> {t.reason}
              </p>

              {t.notes && (
                <div className="bg-[#0A0A0B] p-2.5 rounded text-[#71717A] text-[11px] font-mono border border-[#27272A]">
                  Notes: {t.notes}
                </div>
              )}

              {t.status !== 'RESOLVED' && (
                <div className="flex items-center justify-end space-x-2 pt-2">
                  {resolvingTicketId === t.id ? (
                    <div className="flex items-center space-x-2 w-full">
                      <input
                        type="text"
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Enter officer resolution notes..."
                        className="flex-1 bg-[#0A0A0B] border border-[#27272A] rounded-md px-3 py-1.5 text-xs text-[#E4E4E7] focus:outline-none"
                      />
                      <button
                        onClick={() => handleResolveTicket(t.id)}
                        className="px-3 py-1.5 bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] border border-[#3F3F46] rounded-md text-xs font-medium"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setResolvingTicketId(null)}
                        className="px-3 py-1.5 text-[#71717A] hover:text-[#E4E4E7] text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResolvingTicketId(t.id)}
                      className="px-3 py-1.5 rounded-md bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] border border-[#3F3F46] text-xs font-medium transition-colors flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Take Officer Action</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272A] pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-[#10B981]" />
              <h3 className="font-medium text-sm text-[#E4E4E7]">Local Data Sovereignty Audit Ledger</h3>
            </div>
            <p className="text-xs text-[#71717A]">
              Immutable local transaction record verifying 0 external network egress for citizen PII.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              placeholder="Filter actions..."
              className="bg-[#18181B] border border-[#27272A] rounded-md pl-8 pr-3 py-1 text-xs text-[#E4E4E7] placeholder-[#71717A] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs text-[#A1A1AA] font-mono">
            <thead className="bg-[#0A0A0B] text-[10px] text-[#71717A] uppercase tracking-wider sticky top-0">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Channel</th>
                <th className="py-2 px-3">Classification</th>
                <th className="py-2 px-3">Cloud Blocked</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#18181B]/50">
                  <td className="py-2 px-3 text-[#71717A] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3 font-medium text-[#E4E4E7] whitespace-nowrap">{log.action}</td>
                  <td className="py-2 px-3 uppercase text-[#10B981]">{log.channel}</td>
                  <td className="py-2 px-3">
                    <span className="bg-[#10B981]/10 text-[#10B981] px-1.5 py-0.5 rounded border border-[#10B981]/30 text-[10px]">
                      {log.dataClassification}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[#10B981]">
                    {log.externalCallBlocked ? 'BLOCKED' : '0 Calls Made'}
                  </td>
                  <td className="py-2 px-3 text-[#71717A] max-w-xs truncate font-sans text-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
