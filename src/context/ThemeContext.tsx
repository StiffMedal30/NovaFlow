import React, { createContext, useContext, useState} from "react";
import themesData from "../app/themes.json";

type Theme = typeof themesData.themes[0];

interface ThemeContextType {
  themes: Theme[];
  currentTheme: Theme;
  setTheme: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themes] = useState<Theme[]>(themesData.themes);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);

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