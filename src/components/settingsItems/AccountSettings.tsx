import GlobalStyles from "../../app/GlobalStyles";
import { useTheme } from "../../context/ThemeContext";
import { CircleUserRound, ChevronRight, ChevronDown, LogInIcon, LogOutIcon } from "lucide-react";
import React from "react";

export default function AccountSettings() {
  const { currentTheme } = useTheme();
  const styles = GlobalStyles(currentTheme);

  const [isClicked, setIsClicked] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

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
        {/* Account Settings Button*/}
        <div style={{ alignItems: "center", display: "flex" }}>
          <CircleUserRound style={{ strokeWidth: 1, color: currentTheme.colors.text }} size={30} />
          <a
            style={{
              ...styles.settingsItem,
              marginLeft: 12,
              display: "inline-block",
            }}
          >
            Account
          </a>
        </div>
        {!isClicked && (
          <ChevronRight style={{ strokeWidth: 1, color: currentTheme.colors.text }} size={30} />
        )}
        {isClicked && (
          <ChevronDown style={{ strokeWidth: 1, color: currentTheme.colors.text }} size={30} />
        )}
      </div>

      {/*Conditionally render Login/Logout button*/}
      {isClicked && isLoggedIn && (
        <div style={{ padding: "12px 16px" }}>
          {/* Logout Button*/}
          <div style={{ alignItems: "center", display: "flex", cursor: "pointer" }} onClick={() => setIsLoggedIn(false)}>
            <LogOutIcon style={{ strokeWidth: 1, color: "red" }} size={30} />
            <a
              style={{
                ...styles.settingsItem,
                marginLeft: 12,
                display: "inline-block",
                color: "red",
              }}
            >
              Logout
            </a>
          </div>
        </div>
      )}
      {isClicked && !isLoggedIn && (
        <div style={{ padding: "12px 16px" }}>
          {/* Login Button*/}
          <div style={{ alignItems: "center", display: "flex", cursor: "pointer" }} onClick={() => setIsLoggedIn(true)}>
            <LogInIcon style={{ strokeWidth: 1, color: currentTheme.colors.text }} size={30} />
            <a
              style={{
                ...styles.settingsItem,
                marginLeft: 12,
                display: "inline-block",
              }}
            >
              Login
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
