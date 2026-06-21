import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme =
  | "dark-blue"
  | "dark-red"
  | "dark"
  | "dark-orange"
  | "dark-green"
  | "dark-pink"
  | "light"
  | "system";

export const THEMES: { id: Theme; label: string; icon: string }[] = [
  { id: "light",      label: "Light",      icon: "sun" },
  { id: "dark-blue",  label: "Dark Blue",  icon: "moon" },
  { id: "dark-red",   label: "Dark Red",   icon: "moon" },
  { id: "dark",       label: "Dark",       icon: "moon" },
  { id: "dark-orange",label: "Dark Orange",icon: "moon" },
  { id: "dark-green", label: "Dark Green", icon: "leaf" },
  { id: "dark-pink",  label: "Dark Pink",  icon: "heart" },
  { id: "system",     label: "System",     icon: "monitor" },
];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Exclude<Theme, "system">;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "xeioa-theme";

function getSystemResolved(): Exclude<Theme, "system"> {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark-blue";
}

function applyTheme(theme: Theme) {
  const resolved: Exclude<Theme, "system"> = theme === "system" ? getSystemResolved() : theme;
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  if (resolved === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try { return (localStorage.getItem(STORAGE_KEY) as Theme) || "dark-blue"; } catch { return "dark-blue"; }
  });

  const resolvedTheme: Exclude<Theme, "system"> = theme === "system" ? getSystemResolved() : theme;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
