import GlobalStyles from "../../app/GlobalStyles";
import { useTheme } from "../../context/ThemeContext";
import { Palette, ChevronRight, ChevronDown } from "lucide-react";
import React from "react";

export default function AppearanceSettings() {
  const { themes, currentTheme, setTheme } = useTheme();
  const styles = GlobalStyles(currentTheme);

  const [isClicked, setIsClicked] = React.useState(false);

  return (
    <div>
      <div
        onClick={() => setIsClicked(!isClicked)}
        tabIndex={0}
        role="button"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          outline: "none",
          userSelect: "none",
        }}
        onKeyPress={e => {
          if (e.key === "Enter" || e.key === " ") setIsClicked(!isClicked);
        }}
        aria-pressed={isClicked}
      >
        {/* Appearance Settings Button*/}
        <div style={{ alignItems: "center", display: "flex" }}>
          <Palette style={{ strokeWidth: 1, color: currentTheme.colors.text }} size={30} />
          <a
            style={{
              ...styles.settingsItem,
              marginLeft: 12,
              display: "inline-block",
            }}
          >
            Appearance
          </a>
        </div>
        {!isClicked && (
          <ChevronRight style={{ strokeWidth: 1, color: currentTheme.colors.text }} size={30} />
        )}
        {isClicked && (
          <ChevronDown style={{ strokeWidth: 1, color: currentTheme.colors.text }} size={30} />
        )}
      </div>

      {isClicked && (
        <div style={{ padding: "12px 16px" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
              maxWidth: 3 * 120 + 2 * 8,
            }}
          >
            {themes.map(theme => (
              <button
                key={theme.name}
                onClick={() => setTheme(theme.name)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  border: `1px solid ${currentTheme.colors.border}`,
                  background: currentTheme.name === theme.name ? currentTheme.colors.accent : currentTheme.colors.primary,
                  color: currentTheme.name === theme.name ? currentTheme.colors.background : currentTheme.colors.text,
                  fontWeight: 500,
                  cursor: "pointer",
                  outline: "none",
                  transition: "background 0.2s, color 0.2s",
                  minWidth: 100,
                  maxWidth: 120,
                  flex: "1 0 30%",
                  boxSizing: "border-box",
                }}
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