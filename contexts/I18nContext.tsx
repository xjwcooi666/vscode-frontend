import React, { createContext, useState, useCallback, useMemo } from 'react';
import en from '../locales/en.json';
import zh from '../locales/zh.json';

// A simple type assertion to help TypeScript with nested keys
const translations: { [key: string]: any } = { en, zh };

export type Language = 'en' | 'zh';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  // Fix: Changed return type to 'any' to allow returning translation objects, not just strings.
  t: (key: string, params?: { [key: string]: string | number }) => any;
}

export const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback((key: string, params?: { [key: string]: string | number }) => {
    const keys = key.split('.');
    let result = translations[language];
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        // Fallback to English if key not found in current language
        let fallbackResult = translations['en'];
        for (const fk of keys) {
            if (fallbackResult && typeof fallbackResult === 'object' && fk in fallbackResult) {
                fallbackResult = fallbackResult[fk];
            } else {
                return key; // Fallback to key if not found anywhere
            }
        }
        result = fallbackResult;
        break;
      }
    }

    if (typeof result === 'string' && params) {
        let tempResult = result;
        Object.keys(params).forEach(paramKey => {
            const regex = new RegExp(`{${paramKey}}`, 'g');
            tempResult = tempResult.replace(regex, String(params[paramKey]));
        });
        result = tempResult;
    }

    // Fix: Allow returning objects from translations, not just strings. This is necessary for dynamically populating UI elements like select boxes.
    if (typeof result === 'object' && result !== null) {
        return result;
    }
    return typeof result === 'string' ? result : key;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};