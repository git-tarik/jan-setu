import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, X, Smartphone, ArrowRight, Shield } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  certificateName: string;
  applicantName: string;
  onPaymentSuccess: (paymentRef: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  certificateName,
  applicantName,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(180);

  useEffect(() => {
    if (!isOpen) return;
    setTimerSeconds(180);
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const mockRef = `UPI/REV/${Date.now().toString().slice(-8)}/OKGOV`;
      onPaymentSuccess(mockRef);
      onClose();
    }, 1200);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#0A0A0B] border border-[#27272A] rounded-xl w-full max-w-md overflow-hidden shadow-2xl text-[#E4E4E7]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#0E0E10]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-[#27272A] text-[#10B981] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-[#E4E4E7]">State Treasury Gateway</h3>
              <p className="text-xs text-[#71717A]">Mock UPI Payment Orchestrator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#71717A] hover:text-[#E4E4E7] hover:bg-[#18181B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="bg-[#18181B] p-3.5 rounded-lg border border-[#27272A] text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-[#71717A]">
              <span>Service Fee:</span>
              <span className="text-[#E4E4E7] font-sans">{certificateName}</span>
            </div>
            <div className="flex justify-between text-[#71717A]">
              <span>Applicant:</span>
              <span className="text-[#A1A1AA] font-sans">{applicantName}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#27272A] text-xs">
              <span className="text-[#71717A]">Payable Fee:</span>
              <span className="text-[#10B981] font-semibold text-sm">₹{amount}.00</span>
            </div>
          </div>

          {/* QR Pattern visual */}
          <div className="inline-block p-4 bg-white rounded-xl shadow-inner border border-[#27272A]">
            <div className="w-40 h-40 bg-[#0A0A0B] rounded-lg p-3 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="grid grid-cols-6 gap-1 w-full h-full opacity-90 p-1">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-[2px] ${
                      i % 2 === 0 || i % 5 === 0 || i < 6 || i > 30 || i % 6 === 0
                        ? 'bg-white'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-[#0A0A0B] text-[#10B981] border border-[#10B981] font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow">
                  UPI • GOV
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-1.5 text-xs text-[#71717A]">
            <Smartphone className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Scan with GPay, PhonePe, Paytm, or BHIM</span>
          </div>

          <div className="text-xs text-[#71717A] font-mono">
            QR expires in: <span className="font-semibold text-[#E4E4E7]">{formatTime(timerSeconds)}</span>
          </div>

          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-[#71717A]">
            <Shield className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Direct Treasury / Bharatkosh Gateway Adapter</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 py-4 bg-[#0E0E10] border-t border-[#27272A] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-[#71717A] hover:text-[#E4E4E7] transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-simulate-payment-success"
            disabled={isProcessing}
            onClick={handleSimulatePayment}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] border border-[#3F3F46] shadow-sm transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{isProcessing ? 'Confirming...' : 'Simulate Payment Success'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
