import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // To test Urdu by default, we can set this to 'ur', but instructions say default 'en'
  // "We'll test by manually setting the default language to 'ur' temporarily to check RTL layout"
  // I will set it to 'ur' as requested to prove it works. Wait, the instruction says:
  // "just build the underlying system and prove it works on these 3 screens. We'll test by manually setting the default language to 'ur' temporarily to check RTL layout, then switch it back."
  // So I'll default to 'ur' right now to show it working.
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const root = document.documentElement;
    if (language === 'ur') {
      root.setAttribute('dir', 'rtl');
      root.style.fontFamily = "'Noto Nastaliq Urdu', sans-serif";
    } else {
      root.setAttribute('dir', 'ltr');
      root.style.fontFamily = "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif";
    }
  }, [language]);

  const value = {
    language,
    setLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const { language, setLanguage } = useContext(LanguageContext);
  const t = translations[language];
  return { t, language, setLanguage };
}
