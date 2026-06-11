import React, { createContext, useContext, useState, useEffect} from "react";
import themesData from "../app/themes.json";

export type Theme = typeof themesData.themes[0];

interface ThemeContextType {
  themes: Theme[];
  currentTheme: Theme;
  setTheme: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themes] = useState<Theme[]>(themesData.themes);
  // Default to Dark theme instead of first theme
  const [currentTheme, setCurrentTheme] = useState<Theme>(
    themes.find(t => t.name === "Dark") || themes[0]
  );

  // Apply theme colors to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-background', currentTheme.colors.background);
    root.style.setProperty('--color-secondary-background', currentTheme.colors.secondary_background);
    root.style.setProperty('--color-primary', currentTheme.colors.primary);
    root.style.setProperty('--color-secondary', currentTheme.colors.secondary);
    root.style.setProperty('--color-accent', currentTheme.colors.accent);
    root.style.setProperty('--color-text', currentTheme.colors.text);
    root.style.setProperty('--color-border', currentTheme.colors.border);
  }, [currentTheme]);

  const setTheme = (name: string) => {
    const found = themes.find(t => t.name === name);
    if (found) setCurrentTheme(found);
  };

  return (
    <ThemeContext.Provider value={{ themes, currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
