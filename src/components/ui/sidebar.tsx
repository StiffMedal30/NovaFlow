import GlobalStyles from "../../app/GlobalStyles";
import { useTheme } from "../../context/ThemeContext";
import AccountSettings from "../settingsItems/AccountSettings";
import { X } from "lucide-react";
import AppearanceSettings from "../settingsItems/AppearanceSettings";


export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { currentTheme } = useTheme()
    const styles = GlobalStyles(currentTheme)

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "320px",
          background: currentTheme.colors.background,
          boxShadow: "-2px 0 8px rgba(0,0,0,0.2)",
          zIndex: 100,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(.4,0,.2,1)",
          borderLeft: `2px solid ${currentTheme.colors.text}`,
          borderWidth: 0.5,
        }}
      >


        {/* Header section with centered X icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: `1px solid ${currentTheme.colors.border}`,
          }}
        >
          <h1 style={{ ...styles.h2, margin: 0 }}>Settings</h1>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: currentTheme.colors.text,
              fontSize: 24,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
        {/* Account settings section */}
        <div style={{ padding: "16px" }}>
          <AccountSettings />
          <AppearanceSettings />
        </div>
      </div>
      {/* Optional overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: currentTheme.colors.background,
            opacity: 0.6,
            zIndex: 99,
            transition: "background 0.3s",
          }}
        />
      )}
    </>
  );
}
