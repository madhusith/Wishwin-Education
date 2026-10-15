import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('wishwin_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('wishwin_lang', language);
    document.documentElement.lang = language === 'si' ? 'si' : 'en';
  }, [language]);

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'si') {
      setLanguageState(lang);
    }
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'si' : 'en'));
  };

  // Safe translation resolver
  const t = (key, fallback = '') => {
    if (!key) return fallback;
    const currentDict = translations[language] || translations.en;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    // Fallback to English dictionary
    if (translations.en && translations.en[key] !== undefined) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
