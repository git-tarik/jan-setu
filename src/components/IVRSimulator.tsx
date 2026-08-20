import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, ShieldCheck } from 'lucide-react';
import { LanguageCode } from '../types';

interface IVRSimulatorProps {
  currentLanguage: LanguageCode;
}

export const IVRSimulator: React.FC<IVRSimulatorProps> = ({ currentLanguage }) => {
  const [callState, setCallState] = useState<'IDLE' | 'DIALING' | 'CONNECTED' | 'ENDED'>('IDLE');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [dialedDigits, setDialedDigits] = useState<string>('');
  const [ivrStep, setIvrStep] = useState<number>(1);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [smsSent, setSmsSent] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let timer: any;
    if (callState === 'CONNECTED') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const playDtmfTone = (freq1: number, freq2: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = freq1;
      osc2.frequency.value = freq2;
      gain.gain.value = 0.08;

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      setTimeout(() => {
        osc1.stop();
        osc2.stop();
      }, 150);
    } catch (e) {
      console.warn('AudioContext not allowed without gesture', e);
    }
  };

  const dtmfFrequencies: Record<string, [number, number]> = {
    '1': [697, 1209],
    '2': [697, 1336],
    '3': [697, 1477],
    '4': [770, 1209],
    '5': [770, 1336],
    '6': [770, 1477],
    '7': [852, 1209],
    '8': [852, 1336],
    '9': [852, 1477],
    '*': [941, 1209],
    '0': [941, 1336],
    '#': [941, 1477],
  };

  const handleKeyPress = (key: string) => {
    if (dtmfFrequencies[key]) {
      playDtmfTone(dtmfFrequencies[key][0], dtmfFrequencies[key][1]);
    }
    setDialedDigits((prev) => prev + key);

    if (callState === 'CONNECTED') {
      if (ivrStep === 1) {
        if (key === '1') {
          setCurrentPrompt('हिन्दी चुनी गई। आय प्रमाण पत्र के लिए 1 दबाएं, अधिवास के लिए 2 दबाएं, जाति के लिए 3 दबाएं।');
          setIvrStep(2);
        } else if (key === '2') {
          setCurrentPrompt('English selected. Press 1 for Income Certificate, 2 for Domicile, 3 for Caste.');
          setIvrStep(2);
        }
      } else if (ivrStep === 2) {
        if (key === '1') {
          setCurrentPrompt('आय प्रमाण पत्र चयनित। बीप के बाद अपना पूरा नाम और वार्षिक आय बोलें, या 1 दबाकर टेस्ट प्रोफाइल राधा देवी लोड करें।');
          setIvrStep(3);
        }
      } else if (ivrStep === 3) {
        setCurrentPrompt('धन्यवाद। आपकी जानकारी दर्ज हो गई है। आपके मोबाइल पर दस्तावेज अपलोड एवं रसीद लिंक का एसएमएस भेज दिया गया है।');
        setSmsSent('SMS Sent to +91 98765 43210: "Your application token is TRK-INC-99182. Track at https://jansetu.gov.in"');
        setIvrStep(4);
      }
    }
  };

  const handleStartCall = () => {
    setCallState('DIALING');
    setDialedDigits('');
    setSmsSent(null);
    setTimeout(() => {
      setCallState('CONNECTED');
      setIvrStep(1);
      setCurrentPrompt(
        'नमस्ते! राजस्व विभाग की आईवीआर सेवा में आपका स्वागत है। हिन्दी के लिए 1 दबाएं। For English, press 2.'
      );
    }, 1500);
  };

  const handleEndCall = () => {
    setCallState('ENDED');
    setCurrentPrompt('कॉल समाप्त हुई। Call ended.');
    setTimeout(() => {
      setCallState('IDLE');
    }, 2000);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="bg-[#0A0A0B] border border-[#27272A] rounded-xl overflow-hidden shadow-xl p-6 space-y-5">
        {/* Telephone Screen */}
        <div className="bg-[#0E0E10] border border-[#27272A] rounded-lg p-4 text-center space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#71717A] font-mono">
            <span className="flex items-center text-[#10B981]">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Toll-Free 1800-180-REV
            </span>
            <span className="font-medium text-[#E4E4E7]">
              {callState === 'CONNECTED' ? formatTimer(callDuration) : callState}
            </span>
          </div>

          <div className="py-2">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A]">
              {callState === 'CONNECTED' ? 'Automated IVR Voice Engine' : 'Press Call to Dial'}
            </div>
            <div className="font-mono text-base font-semibold text-[#E4E4E7] tracking-widest min-h-[26px]">
              {dialedDigits || (callState === 'CONNECTED' ? '1800-180-7388' : '—')}
            </div>
          </div>

          {callState === 'CONNECTED' && (
            <div className="bg-[#18181B] p-3 rounded-lg border border-[#27272A] text-left text-xs text-[#A1A1AA] animate-fadeIn space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#10B981] font-mono">
                <span className="flex items-center">
                  <Volume2 className="w-3 h-3 mr-1" /> IVR Audio Output:
                </span>
                <span className="animate-pulse">● Speaking</span>
              </div>
              <p className="leading-relaxed font-sans text-xs text-[#E4E4E7]">{currentPrompt}</p>
            </div>
          )}

          {smsSent && (
            <div className="bg-[#18181B] border border-[#27272A] p-2.5 rounded-lg text-left text-xs text-[#10B981] animate-fadeIn">
              <span className="font-mono block text-[10px] uppercase tracking-wider">Simulated SMS Delivery:</span>
              <p className="text-[11px] font-mono mt-0.5 text-[#A1A1AA]">{smsSent}</p>
            </div>
          )}
        </div>

        {/* DTMF Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {[
            { num: '1', sub: '.,' },
            { num: '2', sub: 'ABC' },
            { num: '3', sub: 'DEF' },
            { num: '4', sub: 'GHI' },
            { num: '5', sub: 'JKL' },
            { num: '6', sub: 'MNO' },
            { num: '7', sub: 'PQRS' },
            { num: '8', sub: 'TUV' },
            { num: '9', sub: 'WXYZ' },
            { num: '*', sub: ' ' },
            { num: '0', sub: '+' },
            { num: '#', sub: ' ' },
          ].map((k) => (
            <button
              key={k.num}
              onClick={() => handleKeyPress(k.num)}
              className="w-16 h-14 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] hover:border-[#3F3F46] text-[#E4E4E7] flex flex-col items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <span className="text-base font-semibold font-mono">{k.num}</span>
              <span className="text-[8px] text-[#71717A] font-semibold uppercase">{k.sub}</span>
            </button>
          ))}
        </div>

        {/* Call Action Bar */}
        <div className="flex items-center justify-center space-x-4 pt-1">
          {callState !== 'CONNECTED' ? (
            <button
              id="btn-ivr-start-call"
              onClick={handleStartCall}
              className="w-14 h-14 rounded-full bg-[#18181B] hover:bg-[#27272A] text-[#10B981] border border-[#27272A] flex items-center justify-center shadow-md transition-all"
              title="Start Call"
            >
              <Phone className="w-6 h-6 text-[#10B981]" />
            </button>
          ) : (
            <button
              id="btn-ivr-end-call"
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800 flex items-center justify-center shadow-md transition-all"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}

          {callState === 'CONNECTED' && (
            <button
              onClick={() => {
                setIsMicActive(!isMicActive);
                if (!isMicActive) {
                  setTimeout(() => {
                    handleKeyPress('1');
                  }, 1800);
                }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                isMicActive
                  ? 'bg-[#18181B] border-[#10B981] text-[#10B981]'
                  : 'bg-[#18181B] border-[#27272A] text-[#71717A] hover:text-[#E4E4E7]'
              }`}
              title="Speak over Phone"
            >
              {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
