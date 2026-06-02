"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeToDOM(t: Theme): "light" | "dark" {
  const isDark =
    t === "dark" ||
    (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    document.documentElement.classList.add("dark");
    return "dark";
  } else {
    document.documentElement.classList.remove("dark");
    return "light";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const themeRef = useRef<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const initial: Theme = stored ?? "system";
    themeRef.current = initial;
    setThemeState(initial);
    setResolvedTheme(applyThemeToDOM(initial));

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (themeRef.current === "system") {
        setResolvedTheme(applyThemeToDOM("system"));
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    themeRef.current = t;
    setThemeState(t);
    localStorage.setItem("theme", t);
    setResolvedTheme(applyThemeToDOM(t));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}