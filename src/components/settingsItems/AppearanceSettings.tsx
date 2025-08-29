import { Palette, ChevronRight, ChevronDown } from "lucide-react";
import React from "react";
import { useTheme } from "../../context/ThemeContext";

export default function AppearanceSettings() {
  const { themes, currentTheme, setTheme } = useTheme();
  const [isClicked, setIsClicked] = React.useState(false);

  return (
    <div>
      <div
        onClick={() => setIsClicked(!isClicked)}
        tabIndex={0}
        role="button"
        className="flex flex-row items-center justify-between cursor-pointer outline-none select-none"
        onKeyPress={e => {
          if (e.key === "Enter" || e.key === " ") setIsClicked(!isClicked);
        }}
        aria-pressed={isClicked}
      >
        {/* Appearance Settings Button */}
        <div className="flex items-center">
          <Palette className="text-text" size={25} strokeWidth={1} />
          <a className="ml-3 text-text hover:text-primary transition-colors inline-block text-sm font-normal">
            Appearance
          </a>
        </div>
        {!isClicked && (
          <ChevronRight className="text-text" size={25} strokeWidth={1} />
        )}
        {isClicked && (
          <ChevronDown className="text-text" size={25} strokeWidth={1} />
        )}
      </div>

      {isClicked && (
        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-2 mt-3 max-w-xs">
            {themes.map(theme => (
              <button
                key={theme.name}
                onClick={() => setTheme(theme.name)}
                className={`px-4 py-1.5 rounded-md border font-medium cursor-pointer outline-none transition-all duration-200 min-w-24 max-w-28 flex-1 basis-1/3 box-border ${
                  currentTheme.name === theme.name
                    ? 'bg-accent text-background border-accent'
                    : 'bg-primary text-text border-border hover:bg-secondary'
                }`}
                aria-pressed={currentTheme.name === theme.name}
              >
                {theme.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}