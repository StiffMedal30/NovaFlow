import React from "react";
import { useTheme } from "../../context/ThemeContext";
import AccountSettings from "../settingsItems/AccountSettings";
import AppearanceSettings from "../settingsItems/AppearanceSettings";
import LoginStateButton from "../settingsItems/LoginStateButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";
//@ts-ignore
import GlobalStyles from "../../app/GlobalStyles";

interface SettingsDropdownProps {
  children: React.ReactNode;
}

export function SettingsDropdown({ children }: SettingsDropdownProps) {
  const { currentTheme } = useTheme();
  const styles = GlobalStyles(currentTheme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        style={{
          width: "280px",
          maxHeight: "400px",
          background: currentTheme.colors.background,
          border: `1px solid ${currentTheme.colors.border}`,
          borderRadius: "8px",
          padding: "12px",
          color: currentTheme.colors.text,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        }}
      >
        {/* Menu Header */}
        <div
          style={{
            ...styles.settingsItem,
            marginBottom: "12px",
            paddingBottom: "8px",
            borderBottom: `1px solid ${currentTheme.colors.border}`,
          }}
        >
          Settings
        </div>

        {/* Menu Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ padding: "4px 0" }}>
            <AccountSettings />
          </div>
          <div style={{ padding: "4px 0" }}>
            
            <AppearanceSettings />
          </div>
          <div style={{ padding: "4px 0" }}>
            
            <LoginStateButton />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
