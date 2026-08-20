import React, { useState } from 'react';
import { api } from '../../api/client';
import './WhatsAppSim.css';

export const WhatsAppSim = ({ currentLanguage = 'hi' }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'bot',
      text: 'नमस्ते! जनसेतु राजस्व सेवा बॉट में आपका स्वागत है। आय या जाति प्रमाण पत्र हेतु 1 दबाएं।',
      time: '10:00 AM'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: String(Date.now()),
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    const promptToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await api.whatsappInbound('+91 98765 11223', promptToSend, currentLanguage);
      const botMsg = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: res.reply || 'आपकी जानकारी दर्ज कर ली गई है।',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('WhatsApp adapter error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="whatsapp-sim-container">
      <div className="wa-header">
        <div className="wa-avatar">🏛️</div>
        <div className="wa-header-info">
          <div className="wa-name">JanSetu Revenue Official Bot</div>
          <div className="wa-status">Online • Verified State Service</div>
        </div>
      </div>

      <div className="wa-messages-body">
        {messages.map((m) => (
          <div key={m.id} className={`wa-bubble ${m.sender === 'user' ? 'outgoing' : 'incoming'}`}>
            <div>{m.text}</div>
            <div className="wa-time">{m.time}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="wa-footer-bar">
        <input
          type="text"
          className="form-input"
          style={{ backgroundColor: '#2a3942', borderColor: '#2a3942', borderRadius: '20px', padding: '0.5rem 1rem' }}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message (e.g. 1 or मेरी आय 1.2 लाख है)..."
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0 }}
          disabled={sending}
        >
          ➤
        </button>
      </form>
    </div>
  );
};
