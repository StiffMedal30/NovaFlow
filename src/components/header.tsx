import { useTheme } from "../context/ThemeContext"
import React from "react"
import { CircleUserRound, MessageSquareText } from "lucide-react"
import { Sidebar } from "./ui/sidebar"
//@ts-ignore
import GlobalStyles from "../app/GlobalStyles"

export function Header() {
  const { currentTheme } = useTheme()
  const styles = GlobalStyles(currentTheme)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
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
          {/* Sidebar Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
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
        </div>
      </header>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  )
}


