import { useTheme } from "../context/ThemeContext"
import { CircleUserRound } from "lucide-react"
//@ts-ignore
import GlobalStyles from "../app/GlobalStyles"

export function Header() {
  const { currentTheme } = useTheme()
  const styles = GlobalStyles(currentTheme)
  return (
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
          ...styles.a,
          fontSize: 28,
        }}
      >
        NovaFlow
      </a>
      <CircleUserRound
        size={40}
        style={{
          color: currentTheme.colors.text,
          strokeWidth: 1,
          paddingBottom: "0.2rem",
        }}
      />
    </header>
  )
}