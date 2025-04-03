import { createContext, useState, useEffect, ReactNode } from "react";
import { locales, LocaleCode, Locale } from "./locales";

type I18nContextType = {
  locale: LocaleCode;
  t: Locale;
  changeLocale: (locale: LocaleCode) => void;
};

export const I18nContext = createContext<I18nContextType | undefined>(
  undefined
);

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: LocaleCode;
}

export const I18nProvider = ({
  children,
  defaultLocale = "es",
}: I18nProviderProps) => {
  const [locale, setLocale] = useState<LocaleCode>(() => {
    // Recuperar idioma de localStorage o usar el predeterminado
    const savedLocale = localStorage.getItem("cleanNotes-locale");
    return (savedLocale as LocaleCode) || defaultLocale;
  });

  // Obtener las traducciones para el idioma actual
  const t = locales[locale];

  // Cambiar idioma y guardar preferencia
  const changeLocale = (newLocale: LocaleCode) => {
    setLocale(newLocale);
    localStorage.setItem("cleanNotes-locale", newLocale);
  };

  // Establecer atributo lang en el documento HTML
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t, changeLocale }}>
      {children}
    </I18nContext.Provider>
  );
};
