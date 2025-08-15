import { useTheme } from "../context/ThemeContext"
import { CircleUserRound, MessageSquareText } from "lucide-react"
import { SettingsDropdown } from "./ui/settings-dropdown"
//@ts-ignore
import GlobalStyles from "../app/GlobalStyles"
import { useNavigate } from "react-router-dom";

export function Header() {
  const { currentTheme } = useTheme()
  const styles = GlobalStyles(currentTheme)
  const navigate = useNavigate();
  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "4rem",
          padding: "0 2rem",
          paddingTop: "2rem",
          paddingBottom: "1rem",
          zIndex: 50,
          backgroundColor: currentTheme.colors.background,
          color: currentTheme.colors.text,
          borderBottom: `2px solid ${currentTheme.colors.text}`,
          borderWidth: 1
        }}
      >
        <a
          href="#"
          style={{
            ...styles.h1,
          }}
        >
          NovaFlow
        </a>
        <div style={{ justifyContent: "space-between", display: "flex", gap: 20 }}>
          {/* Message Button */}
          <button
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            onClick={() => {navigate('/SuperSecret')}}
          >
            <MessageSquareText
              size={40}
              style={{
                color: currentTheme.colors.text,
                strokeWidth: 1,
                paddingBottom: "0.2rem",
              }}
            />
          </button>
          {/* Settings Dropdown */}
          <SettingsDropdown>
            <button
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                outline: "none",
              }}
            >
              <CircleUserRound
                size={40}
                style={{
                  color: currentTheme.colors.text,
                  strokeWidth: 1,
                  paddingBottom: "0.2rem",
                }}
              />
            </button>
          </SettingsDropdown>
        </div>
      </header>
    </>
  )
}


