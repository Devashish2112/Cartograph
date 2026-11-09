"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  isThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_CHANGE_EVENT = "cartograph-theme-change";

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function subscribeToPreference(onChange: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      onChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

function subscribeToSystem(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getPreferenceSnapshot(): ThemePreference {
  return readStoredPreference();
}

function getServerPreferenceSnapshot(): ThemePreference {
  return "system";
}

function getSystemSnapshot(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSystemSnapshot(): boolean {
  return false;
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore(
    subscribeToPreference,
    getPreferenceSnapshot,
    getServerPreferenceSnapshot,
  );
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystem,
    getSystemSnapshot,
    getServerSystemSnapshot,
  );
  const resolvedTheme = resolveTheme(preference, systemPrefersDark);

  // The boot script in the document head handles the first paint. This listener
  // keeps the root element correct when the system or another tab changes.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const sync = () => {
      applyTheme(resolveTheme(readStoredPreference(), media.matches));
    };

    media.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    window.addEventListener(THEME_CHANGE_EVENT, sync);

    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener(THEME_CHANGE_EVENT, sync);
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Persistence is best-effort; the choice still applies for this session.
    }

    applyTheme(resolveTheme(next, getSystemSnapshot()));
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
