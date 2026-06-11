import { CircleUserRound, Settings } from "lucide-react";
import { SettingsDropdown } from "./settings-dropdown"
import { useTheme } from "../../context/ThemeContext";
import LoginStateButton from "../settingsItems/LoginStateButton";

const ProfileComponent = () => {
  const { currentTheme } = useTheme();

    return (
        <div
          className="flex items-center gap-3 px-4 py-2"
          style={{
            backgroundColor: currentTheme.colors.background,
            borderRadius: 18,
            boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
            border: `1.5px solid ${currentTheme.colors.border}`,
          }}
        >            
          {/* Settings Button */}
          <SettingsDropdown>
            <button
              type="button"
              aria-label="Settings"
              className="flex items-center justify-center p-1 cursor-pointer outline-none hover:opacity-80 transition-opacity"
              style={{
                background: 'none',
                border: 'none',
              }}
            >
              <Settings 
                size={22}
                color={currentTheme.colors.text}
              />
            </button>
          </SettingsDropdown>

          <LoginStateButton />

          {/* Profile Dropdown */}
          <button
            type="button"
            aria-label="Profile"
            className="flex items-center justify-center p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: currentTheme.colors.text }}
          >
            {/* Will be replaced with actual user icon or profile photo */}
            <CircleUserRound
              size={36}
              style={{ color: currentTheme.colors.text }}
              strokeWidth={1.2}
            />
          </button>
        </div>
    );
}

export default ProfileComponent;
