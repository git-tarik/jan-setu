import React, { useState } from 'react';
import {
  ARCHITECTURE_PHASES,
  FREE_TECH_MATRIX,
  ADR_LIST,
  DOCKER_COMPOSE_SPEC,
} from '../data/architecturePlan';
import {
  Layers,
  FileCode2,
  CheckCircle2,
  Copy,
  Check,
  Server,
  ArrowRight,
  Cpu,
  Database,
  FileCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const ArchitecturePlanView: React.FC = () => {
  const [copiedCompose, setCopiedCompose] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'matrix' | 'adrs' | 'docker'>('plan');

  const handleCopyCompose = () => {
    navigator.clipboard.writeText(DOCKER_COMPOSE_SPEC);
    setCopiedCompose(true);
    setTimeout(() => setCopiedCompose(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Blueprint Header */}
      <div className="bg-[#0E0E10] border border-[#27272A] p-6 sm:p-8 rounded-xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#71717A] font-semibold block">
              Architectural Feasibility & Roadmap
            </span>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] text-[#10B981] flex items-center justify-center">
                <FileCode2 className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-light tracking-tight text-[#E4E4E7]">
                Voice-First Revenue Services: <span className="text-[#71717A]">Zero-Cost Free Stack</span>
              </h1>
            </div>
            <p className="text-xs text-[#A1A1AA] max-w-3xl leading-relaxed pt-1">
              Deterministic finite state machine orchestration, local neural speech synthesis (Coqui VITS), on-premise Whisper STT, and quantized Llama 3.2 on local CPU/RAM boundaries with strict air-gapped data sovereignty.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <span className="block text-[10px] uppercase tracking-wider text-[#71717A]">Budget Allocation</span>
              <span className="text-sm font-mono text-[#10B981] font-semibold">$0.00 (Total Free Tier)</span>
            </div>
            <div className="w-10 h-10 rounded-full border border-[#27272A] flex items-center justify-center bg-[#18181B]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation tabs */}
        <div className="flex overflow-x-auto space-x-2 pt-3 border-t border-[#27272A] scrollbar-none">
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === 'plan'
                ? 'bg-[#18181B] text-[#E4E4E7] border border-[#3F3F46] shadow-sm'
                : 'text-[#71717A] hover:text-[#E4E4E7] hover:bg-[#18181B]/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#10B981]" />
            <span>5-Phase Roadmap</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === 'matrix'
                ? 'bg-[#18181B] text-[#E4E4E7] border border-[#3F3F46] shadow-sm'
                : 'text-[#71717A] hover:text-[#E4E4E7] hover:bg-[#18181B]/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Free Tech Stack Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('adrs')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === 'adrs'
                ? 'bg-[#18181B] text-[#E4E4E7] border border-[#3F3F46] shadow-sm'
                : 'text-[#71717A] hover:text-[#E4E4E7] hover:bg-[#18181B]/50'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Architecture Decision Records (ADRs)</span>
          </button>

          <button
            onClick={() => setActiveTab('docker')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === 'docker'
                ? 'bg-[#18181B] text-[#E4E4E7] border border-[#3F3F46] shadow-sm'
                : 'text-[#71717A] hover:text-[#E4E4E7] hover:bg-[#18181B]/50'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Docker Compose Specification</span>
          </button>
        </div>
      </div>

      {/* TAB 1: 5-Phase Implementation Plan */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {ARCHITECTURE_PHASES.map((phase, idx) => (
              <div
                key={phase.id}
                className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-6 shadow-sm space-y-4 hover:border-[#3F3F46] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27272A] pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-full bg-[#18181B] border border-[#27272A] text-xs font-mono font-medium text-[#10B981] flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <div>
                      <h3 className="font-medium text-base text-[#E4E4E7]">{phase.name}</h3>
                      <p className="text-xs text-[#71717A] font-mono">{phase.duration}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 w-fit">
                    Status: {phase.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Tasks Checklist */}
                  <div className="bg-[#18181B] p-4 rounded-lg border border-[#27272A] space-y-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A] block">
                      Core Implementation Tasks:
                    </span>
                    <ul className="space-y-2 text-xs text-[#A1A1AA]">
                      {phase.keyDeliverables.map((task, tIdx) => (
                        <li key={tIdx} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tech Stack & Verification */}
                  <div className="bg-[#18181B] p-4 rounded-lg border border-[#27272A] space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A] block mb-1.5">
                        Free Open-Source Components:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {phase.openSourceStack.map((tech, techIdx) => (
                          <span
                            key={techIdx}
                            className="px-2 py-0.5 bg-[#27272A] text-[#E4E4E7] rounded text-[10px] font-mono"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#27272A]">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#10B981] block mb-1">
                        Verification Criteria:
                      </span>
                      <p className="text-xs text-[#71717A] leading-relaxed italic">
                        "{phase.verificationCriteria}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Free Tech Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-[#27272A] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-[#E4E4E7]">Zero-Cost Open-Source Technology Stack</h2>
              <p className="text-xs text-[#71717A]">
                100% on-premise execution with zero cloud billing and air-gapped data sovereignty.
              </p>
            </div>
            <span className="text-xs font-mono text-[#10B981] px-2.5 py-1 bg-[#10B981]/10 rounded border border-[#10B981]/30">
              Total Stack: $0/mo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FREE_TECH_MATRIX.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#18181B] p-5 rounded-lg border border-[#27272A] space-y-3 flex flex-col justify-between hover:border-[#3F3F46] transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">
                      {item.component}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-[9px] font-mono">
                      {item.dataSovereignty}
                    </span>
                  </div>

                  <div className="text-sm font-mono font-medium text-[#E4E4E7]">
                    {item.freeChoice}
                  </div>

                  <p className="text-xs text-[#A1A1AA] leading-relaxed font-sans">
                    {item.whyFreeIsFeasible}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#27272A] flex items-center justify-between text-[11px]">
                  <span className="text-[#71717A]">Commercial Alternative:</span>
                  <span className="line-through text-[#71717A] font-mono text-[10px]">
                    {item.paidAlternative}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Architecture Decision Records (ADRs) */}
      {activeTab === 'adrs' && (
        <div className="space-y-4">
          {ADR_LIST.map((adr) => (
            <div
              key={adr.id}
              className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27272A] pb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-medium bg-[#18181B] text-[#10B981] px-2.5 py-1 rounded border border-[#27272A]">
                    {adr.id}
                  </span>
                  <h3 className="font-medium text-base text-[#E4E4E7]">{adr.title}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 w-fit">
                  Status: {adr.status}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <strong className="text-[#71717A] block mb-1 uppercase tracking-wider text-[10px]">
                    Context & Constraint:
                  </strong>
                  <p className="text-[#A1A1AA] leading-relaxed bg-[#18181B] p-3 rounded-lg border border-[#27272A]">
                    {adr.context}
                  </p>
                </div>

                <div>
                  <strong className="text-[#10B981] block mb-1 uppercase tracking-wider text-[10px]">
                    Architectural Decision:
                  </strong>
                  <p className="text-[#E4E4E7] leading-relaxed bg-[#18181B] p-3 rounded-lg border border-[#27272A] font-mono text-[11px]">
                    {adr.decision}
                  </p>
                </div>

                <div>
                  <strong className="text-[#71717A] block mb-1 uppercase tracking-wider text-[10px]">
                    Consequences & Benefits:
                  </strong>
                  <p className="text-[#A1A1AA] leading-relaxed bg-[#18181B] p-3 rounded-lg border border-[#27272A]">
                    {adr.consequences}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Docker Compose Specification */}
      {activeTab === 'docker' && (
        <div className="bg-[#0E0E10] border border-[#27272A] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272A] pb-3">
            <div>
              <h3 className="font-medium text-base text-[#E4E4E7]">Docker Compose Specification</h3>
              <p className="text-xs text-[#71717A]">
                Single-command production orchestration for Whisper, Ollama Llama 3.2, PostgreSQL 16, and Redis 7.
              </p>
            </div>
            <button
              onClick={handleCopyCompose}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#18181B] hover:bg-[#27272A] text-[#E4E4E7] border border-[#27272A] rounded-lg text-xs font-mono transition-colors w-fit"
            >
              {copiedCompose ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCompose ? 'Copied YAML!' : 'Copy docker-compose.yml'}</span>
            </button>
          </div>

          <div className="bg-[#0A0A0B] rounded-lg p-4 border border-[#27272A] overflow-x-auto text-xs font-mono text-[#A1A1AA] leading-relaxed">
            <pre>{DOCKER_COMPOSE_SPEC}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
