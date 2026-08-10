"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  defaultLocale,
  getDictionary,
  type Dictionary,
  type Locale,
} from "./dictionaries";

const STORAGE_KEY = "dtm-locale";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readLocale(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "uk" ? stored : defaultLocale;
}

function getServerLocale(): Locale {
  return defaultLocale;
}

type LocaleContextValue = {
  locale: Locale;
  dictionary: Dictionary;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  isSwitching: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readLocale, getServerLocale);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const apply = () => {
        window.localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.lang = next;
        emit();
      };

      if (reduced) {
        apply();
        return;
      }

      setIsSwitching(true);
      window.setTimeout(() => {
        apply();
        window.setTimeout(() => setIsSwitching(false), 40);
      }, 160);
    },
    [locale]
  );

  const toggleLocale = useCallback(() => {
    setLocale(locale === "uk" ? "en" : "uk");
  }, [locale, setLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dictionary: getDictionary(locale),
      setLocale,
      toggleLocale,
      isSwitching,
    }),
    [locale, setLocale, toggleLocale, isSwitching]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useDictionary() {
  return useLocale().dictionary;
}
