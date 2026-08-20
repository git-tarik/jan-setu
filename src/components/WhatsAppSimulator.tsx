import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, CheckCheck, FileText, Download, Phone, MoreVertical, ShieldCheck } from 'lucide-react';
import { LanguageCode } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  isVoice?: boolean;
  hasDocument?: boolean;
  docName?: string;
  quickReplies?: string[];
}

interface WhatsAppSimulatorProps {
  currentLanguage: LanguageCode;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({ currentLanguage }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: '🙏 Namaste! Welcome to Government Revenue & Certificate Services. I am your automated digital assistant.',
      time: '10:14 AM',
      quickReplies: ['Apply for Income Certificate', 'Apply for Domicile', 'Track Application Status'],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let replyText = 'Thank you. Please enter your 10-digit mobile number for OTP verification.';
      let quickReplies: string[] | undefined = undefined;
      let hasDocument = false;
      let docName = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('income')) {
        replyText = 'Great! For Income Certificate, please state your full legal name and annual household income.';
        quickReplies = ['Radha Devi, ₹72,000 / year', 'Arjun Sharma, ₹1,20,000 / year'];
      } else if (lower.includes('domicile') || lower.includes('residence')) {
        replyText = 'For Domicile Certificate, please state your full name and continuous years of residence in the state.';
        quickReplies = ['15 Years in Uttar Pradesh', '22 Years in Tamil Nadu'];
      } else if (lower.includes('radha') || lower.includes('arjun') || lower.includes('year') || lower.includes('₹')) {
        replyText = '✅ Captured form fields: \n• Name: Radha Devi\n• Income: ₹72,000\n\nPlease upload photo of your Aadhaar or Ration card for local OCR verification.';
        quickReplies = ['📷 Upload Aadhaar Scan'];
      } else if (lower.includes('upload') || lower.includes('aadhaar')) {
        replyText = '🔍 Local Tesseract OCR verified your Aadhaar Card (96% match). \n\nStatutory Fee: ₹50. Please confirm payment via UPI deep-link.';
        quickReplies = ['💳 Pay ₹50 via UPI QR'];
      } else if (lower.includes('pay') || lower.includes('upi')) {
        replyText = '🎉 Payment of ₹50 confirmed via Treasury! Your application (REV-2024-UP-0099182) has been submitted to Tehsildar office. \n\nHere is your official digital receipt:';
        hasDocument = true;
        docName = 'Income_Certificate_Receipt_REV99182.pdf';
        quickReplies = ['Track Status: TRK-INC-99182', 'Apply Another Certificate'];
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasDocument,
        docName,
        quickReplies,
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-[#0A0A0B] border border-[#27272A] rounded-xl overflow-hidden shadow-2xl flex flex-col h-[640px]">
        {/* Top Header Bar */}
        <div className="bg-[#0E0E10] text-[#E4E4E7] px-4 py-3 flex items-center justify-between border-b border-[#27272A]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center font-mono text-sm text-[#10B981]">
              🏛️
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-medium text-xs text-[#E4E4E7]">JanSetu Revenue Bot</h3>
                <span className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 text-[9px] px-1.5 py-0.2 rounded font-mono">
                  Official ✅
                </span>
              </div>
              <p className="text-[10px] text-[#71717A] font-mono">Omnichannel Engine • Zero Cloud Egress</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[#71717A]">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <Phone className="w-4 h-4 hover:text-[#E4E4E7] cursor-pointer" />
            <MoreVertical className="w-4 h-4 hover:text-[#E4E4E7] cursor-pointer" />
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0A0A0B]">
          <div className="text-center my-1">
            <span className="inline-block bg-[#18181B] text-[#71717A] border border-[#27272A] text-[10px] px-3 py-0.5 rounded-full font-mono">
              🔒 End-to-end local data boundary
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs shadow-sm space-y-1.5 ${
                  msg.sender === 'user'
                    ? 'bg-[#18181B] text-[#E4E4E7] border border-[#3F3F46]'
                    : 'bg-[#0E0E10] text-[#A1A1AA] border border-[#27272A]'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                {msg.hasDocument && (
                  <div className="p-2 rounded bg-[#18181B] border border-[#27272A] flex items-center justify-between text-[#E4E4E7] mt-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#10B981]" />
                      <div>
                        <span className="font-mono text-[11px] block text-[#E4E4E7]">{msg.docName}</span>
                        <span className="text-[9px] text-[#71717A]">Digitally Signed PDF • 240 KB</span>
                      </div>
                    </div>
                    <button className="p-1 rounded bg-[#27272A] text-[#E4E4E7] hover:bg-[#3F3F46]">
                      <Download className="w-3.5 h-3.5 text-[#10B981]" />
                    </button>
                  </div>
                )}

                <div
                  className={`text-[9px] font-mono flex items-center justify-end space-x-1 ${
                    msg.sender === 'user' ? 'text-[#71717A]' : 'text-[#52525B]'
                  }`}
                >
                  <span>{msg.time}</span>
                  {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-[#10B981]" />}
                </div>
              </div>

              {msg.quickReplies && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(reply)}
                      className="text-[10px] font-mono bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#27272A] px-2.5 py-1 rounded transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-1 text-[#71717A] text-[10px] font-mono bg-[#18181B] border border-[#27272A] px-2.5 py-1 rounded w-fit">
              <span>Assistant is typing</span>
              <span className="animate-pulse">...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-[#0E0E10] border-t border-[#27272A] p-2.5 flex items-center space-x-2">
          <button
            onClick={() => handleSendMessage('📷 Upload Aadhaar Scan')}
            className="p-1.5 text-[#71717A] hover:text-[#E4E4E7] rounded hover:bg-[#18181B] transition-colors"
            title="Attach Document"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Type message or reply..."
            className="flex-1 bg-[#18181B] border border-[#27272A] rounded-md px-3 py-1.5 text-xs text-[#E4E4E7] placeholder-[#71717A] focus:outline-none focus:border-[#3F3F46]"
          />

          {inputText.trim() ? (
            <button
              onClick={() => handleSendMessage()}
              className="p-1.5 bg-[#27272A] hover:bg-[#3F3F46] text-[#E4E4E7] border border-[#3F3F46] rounded transition-colors"
            >
              <Send className="w-4 h-4 text-[#10B981]" />
            </button>
          ) : (
            <button
              onClick={() => handleSendMessage('मेरा नाम राधा देवी है और मेरी पारिवारिक आय 72,000 रुपये है')}
              className="p-1.5 bg-[#18181B] hover:bg-[#27272A] text-[#10B981] border border-[#27272A] rounded transition-colors"
              title="Simulate Voice Note"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
