import GlobalStyles from "../../app/GlobalStyles";
import { useTheme } from "../../context/ThemeContext";
import { LogInIcon, LogOutIcon } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export default function LoginStateButton() {
  const { currentTheme } = useTheme();
  const styles = GlobalStyles(currentTheme);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  return (
    <div>
        {isLoggedIn && (
        <div>
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
        {!isLoggedIn && (
          <div>
            {/* Login Button*/}
            <div
              style={{ alignItems: "center", display: "flex", cursor: "pointer" }}
              onClick={() => {
                // Route to login page
                navigate("/login");
                setIsLoggedIn(true); //For testing only, remove in production
              }}
            >
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