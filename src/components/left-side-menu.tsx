
import { useTheme } from "../context/ThemeContext";
import React from "react";
//@ts-ignore
import GlobalStyles from "../app/GlobalStyles";

export function LeftSideMenu() {
  const { currentTheme } = useTheme();
  const styles = GlobalStyles(currentTheme);

  const menuItemStyle = {
    ...styles.settingsItem,
    padding: "8px 12px",
    borderRadius: "6px",
    textDecoration: "none",
    transition: "background-color 0.2s",
    display: "block"
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.backgroundColor = currentTheme.colors.accent;
    e.currentTarget.style.color = currentTheme.colors.background;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.backgroundColor = "transparent";
    e.currentTarget.style.color = currentTheme.colors.text;
  };

  return (
    <div
      style={{
        width: "220px",
        background: currentTheme.colors.primary,
        color: currentTheme.colors.text,
        borderRight: `1px solid ${currentTheme.colors.border}`,
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 16px",
        height: "100vh",
        overflowY: "auto",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 10
      }}
    >
      <h2 style={{ 
        ...styles.h2, 
        marginBottom: "20px", 
        paddingBottom: "12px",
        borderBottom: `1px solid ${currentTheme.colors.border}`
      }}>
        Menu
      </h2>
      
      {/* Menu Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <a 
          href="#" 
          style={menuItemStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Projects
        </a>
        <a 
          href="#" 
          style={menuItemStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Something
        </a>
        <a 
          href="#" 
          style={menuItemStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          Something else
        </a>
      </div>
    </div>
  );
}
