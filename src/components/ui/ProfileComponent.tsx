import { CircleUserRound, Settings } from "lucide-react";
import { SettingsDropdown } from "./settings-dropdown"
import { useTheme } from "../../context/ThemeContext";


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
          <button
            className="flex items-center justify-center p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: currentTheme.colors.text }}
          >
            <Settings 
              size={20}
              color={currentTheme.colors.text}
            />
          </button>
          
          {/* Profile Dropdown */}
          <SettingsDropdown>
            <button
              className="flex items-center justify-center p-1 cursor-pointer outline-none hover:opacity-80 transition-opacity"
              style={{
                background: 'none',
                border: 'none',
              }}
            >
              <CircleUserRound
                size={36}
                style={{ color: currentTheme.colors.text }}
                strokeWidth={1.2}
              />
            </button>
          </SettingsDropdown>
        </div>
    );
}

export default ProfileComponent;