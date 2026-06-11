import React from "react";
import AccountSettings from "../settingsItems/AccountSettings";
import AppearanceSettings from "../settingsItems/AppearanceSettings";
import LoginStateButton from "../settingsItems/LoginStateButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface SettingsDropdownProps {
  children: React.ReactNode;
}

export function SettingsDropdown({ children }: SettingsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
                className="w-80 max-h-100 bg-background border border-border rounded-lg p-3 text-text shadow-lg"
      >
        {/* Menu Header */}
        <div className="mb-3 pb-2 border-b border-border text-lg font-normal text-text">
          Settings
        </div>

        {/* Menu Items */}
        <div className="flex flex-col gap-2">
          <div className="py-1">
            <AccountSettings />
          </div>
          <div className="py-1">
            <AppearanceSettings />
          </div>
          <div className="py-1">
            <LoginStateButton />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
