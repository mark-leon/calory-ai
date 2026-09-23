import React, { createContext, useContext, useMemo, useState } from 'react';
import { BN, EN, Strings } from './strings';
import { scriptFonts } from '../theme/tokens';

export type Lang = 'bn' | 'en';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: Strings;
  fonts: ReturnType<typeof scriptFonts>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('bn');

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang((l) => (l === 'bn' ? 'en' : 'bn')),
      t: lang === 'bn' ? BN : EN,
      fonts: scriptFonts(lang),
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
