import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Download, Printer, CheckCircle, ShieldCheck, X, QrCode } from 'lucide-react';
import { ApplicationRecord } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ApplicationRecord | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  application,
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#E4E4E7', '#3F3F46'],
      });
    }
  }, [isOpen]);

  if (!isOpen || !application) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-[#0A0A0B] border border-[#27272A] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl text-[#E4E4E7] my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#0E0E10]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] text-[#10B981] flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-[#E4E4E7]">Official Application Receipt</h3>
              <p className="text-xs text-[#71717A]">Department of Revenue & Citizen Services</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#71717A] hover:text-[#E4E4E7] hover:bg-[#18181B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Official Receipt Body */}
        <div id="printable-receipt" className="p-6 bg-[#0A0A0B] text-[#E4E4E7] space-y-5 text-xs">
          {/* Header Banner */}
          <div className="border-b border-[#27272A] pb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full border border-[#27272A] flex items-center justify-center bg-[#18181B] text-base shadow">
                🏛️
              </div>
              <div>
                <h4 className="font-mono font-medium text-xs text-[#E4E4E7] tracking-wider uppercase">
                  Government Revenue Services
                </h4>
                <p className="text-[11px] text-[#A1A1AA]">Digital Certificate Authority</p>
                <p className="text-[10px] text-[#71717A] font-mono">Air-Gapped Sovereign Trust Boundary</p>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="inline-block px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-semibold text-[10px]">
                PAID & SUBMITTED
              </span>
              <p className="text-[10px] text-[#71717A] mt-1 uppercase">Channel: {application.channel}</p>
            </div>
          </div>

          {/* Reference Grid */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="bg-[#18181B] p-3 rounded-lg border border-[#27272A]">
              <span className="text-[#71717A] block text-[9px] uppercase">APPLICATION NUMBER</span>
              <span className="font-medium text-[#E4E4E7] text-xs">{application.applicationNumber}</span>
            </div>
            <div className="bg-[#18181B] p-3 rounded-lg border border-[#27272A]">
              <span className="text-[#71717A] block text-[9px] uppercase">TRACKING TOKEN</span>
              <span className="font-medium text-[#10B981] text-xs">{application.trackingToken}</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-[#18181B] rounded-lg p-4 border border-[#27272A] space-y-2 text-[#A1A1AA]">
            <div className="flex justify-between py-1 border-b border-[#27272A]">
              <span className="text-[#71717A]">Service Name:</span>
              <span className="font-medium text-[#E4E4E7]">{application.certificateName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#27272A]">
              <span className="text-[#71717A]">Applicant Name:</span>
              <span className="text-[#E4E4E7]">{application.citizenName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#27272A]">
              <span className="text-[#71717A]">Registered Mobile:</span>
              <span className="font-mono text-[#E4E4E7]">{application.phone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#27272A]">
              <span className="text-[#71717A]">Submission Time:</span>
              <span className="font-mono text-[#E4E4E7]">{new Date(application.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#27272A]">
              <span className="text-[#71717A]">Target SLA Delivery:</span>
              <span className="font-medium text-[#10B981] font-mono">{application.estimatedCompletionDate}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#71717A]">Payment Reference:</span>
              <span className="font-mono text-xs text-[#E4E4E7]">{application.paymentRef} (₹{application.amount})</span>
            </div>
          </div>

          {/* Captured Fields */}
          <div className="bg-[#18181B] p-3 rounded-lg border border-[#27272A]">
            <span className="text-[9px] text-[#71717A] font-semibold uppercase tracking-wider block mb-1">
              Captured Citizen Data:
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#A1A1AA]">
              {Object.entries(application.formData).map(([k, v]) => (
                <div key={k} className="truncate">
                  <span className="text-[#71717A] capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>{' '}
                  <span className="text-[#E4E4E7]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Barcode */}
          <div className="flex items-center justify-between pt-2 border-t border-[#27272A] text-[11px] text-[#71717A]">
            <div className="flex items-center space-x-2">
              <QrCode className="w-6 h-6 text-[#A1A1AA]" />
              <div>
                <span className="font-mono block text-[9px] uppercase">DIGITALLY SIGNED</span>
                <span className="text-[9px] text-[#52525B]">Public QR verification supported</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono block text-[#10B981] flex items-center justify-end">
                <ShieldCheck className="w-3 h-3 mr-1" /> Zero Cloud PII Egress
              </span>
              <span className="text-[9px] text-[#52525B]">Local Revenue DB Cluster</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-[#0E0E10] border-t border-[#27272A] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs text-[#71717A] hover:text-[#E4E4E7] transition-colors"
          >
            Close
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#18181B] hover:bg-[#27272A] text-[#E4E4E7] border border-[#27272A] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] border border-[#3F3F46] shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
