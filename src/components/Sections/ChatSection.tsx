import { useTheme } from "../../context/ThemeContext";
import GlobalStyles from "../../app/GlobalStyles";

export function ChatSection() {
  const { currentTheme } = useTheme();
  const styles = GlobalStyles(currentTheme);
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 600,
        background: currentTheme.colors.primary,
        borderRadius: 18,
        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
        border: `1.5px solid ${currentTheme.colors.border}`,
        padding: "2rem 1.5rem",
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "4.5rem",
      }}
    >
      <h2 style={{ ...styles.h2, marginBottom: 12 }}>Chat</h2>
      <div style={{ color: currentTheme.colors.text, opacity: 0.5, fontSize: 16 }}>
        {/* Chat content will go here */}
        <span>Start a conversation...</span>
      </div>
    </div>
  );
}
