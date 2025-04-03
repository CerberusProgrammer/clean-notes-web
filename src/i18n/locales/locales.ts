import es from "./es";
import en from "./en";

export type LocaleKey = keyof typeof es;
export type Locale = typeof es;

export const locales = {
  es,
  en,
};

export type LocaleCode = keyof typeof locales;
