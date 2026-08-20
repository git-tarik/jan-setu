import React, { useState } from 'react';
import { api } from '../../api/client';
import './IVRPhone.css';

export const IVRPhone = ({ currentLanguage = 'hi' }) => {
  const [callActive, setCallActive] = useState(false);
  const [screenText, setScreenText] = useState('Call 1800-REV-SEVA (Toll-Free)');
  const [dtmfLog, setDtmfLog] = useState('');

  const keys = [
    { digit: '1', sub: 'आय प्रमाण' },
    { digit: '2', sub: 'ABC' },
    { digit: '3', sub: 'DEF' },
    { digit: '4', sub: 'GHI' },
    { digit: '5', sub: 'JKL' },
    { digit: '6', sub: 'MNO' },
    { digit: '7', sub: 'PQRS' },
    { digit: '8', sub: 'TUV' },
    { digit: '9', sub: 'WXYZ' },
    { digit: '*', sub: 'REPEAT' },
    { digit: '0', sub: 'OPERATOR' },
    { digit: '#', sub: 'ENTER' }
  ];

  const handleStartCall = () => {
    setCallActive(true);
    setScreenText('Connected • जनसेतु राजस्व सेवा में आपका स्वागत है। आय प्रमाण पत्र के लिए 1 दबाएं।');
    setDtmfLog('');
  };

  const handleEndCall = () => {
    setCallActive(false);
    setScreenText('Call Ended • धन्यवाद।');
  };

  const handleKeyPress = async (digit) => {
    if (!callActive) return;

    setDtmfLog((prev) => prev + digit);
    setScreenText(`DTMF [${digit}] Pressed. Processing routing...`);

    try {
      const res = await api.ivrDtmf('+91 98765 99887', digit, currentLanguage);
      setScreenText(res.say || 'विकल्प चुना गया। अगला विवरण दर्ज करें।');
    } catch (err) {
      console.warn('IVR error:', err);
    }
  };

  return (
    <div className="ivr-phone-container">
      <div className="ivr-screen">
        <div className="ivr-status-pill">
          {callActive ? '🟢 Call In Progress (00:24)' : '⚪ Standby (IVR PSTN Gateway)'}
        </div>
        <div className="ivr-prompt-text">{screenText}</div>
        {dtmfLog && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            Digits: {dtmfLog}
          </div>
        )}
      </div>

      <div className="ivr-keypad-grid">
        {keys.map((k) => (
          <button
            key={k.digit}
            type="button"
            className="ivr-key-btn"
            onClick={() => handleKeyPress(k.digit)}
            disabled={!callActive}
          >
            <span className="key-digit">{k.digit}</span>
            <span className="key-sub">{k.sub}</span>
          </button>
        ))}
      </div>

      <div className="ivr-call-bar">
        {!callActive ? (
          <button
            type="button"
            className="btn btn-primary"
            style={{ borderRadius: '50px', padding: '0.75rem 2rem' }}
            onClick={handleStartCall}
          >
            📞 Dial Toll-Free (1800)
          </button>
        ) : (
          <button
            type="button"
            className="btn"
            style={{ backgroundColor: 'var(--danger)', color: '#fff', borderRadius: '50px', padding: '0.75rem 2rem' }}
            onClick={handleEndCall}
          >
            📵 Hang Up
          </button>
        )}
      </div>
    </div>
  );
};
