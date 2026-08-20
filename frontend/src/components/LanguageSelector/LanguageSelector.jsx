import React from 'react';
import './LanguageSelector.css';

export const LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'ur', name: 'Urdu', native: 'اردو' }
];

export const LanguageSelector = ({ currentLanguage, onLanguageChange }) => {
  return (
    <div className="language-selector">
      <select
        className="language-select-input"
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        aria-label="Select language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.native} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
};
