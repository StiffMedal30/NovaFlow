import React from "react";
import { useTheme } from "../../context/ThemeContext";
import GlobalStyles from "../../app/GlobalStyles";

export default function LoginPage() {
  const { currentTheme } = useTheme();
  const styles = GlobalStyles(currentTheme);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: currentTheme.colors.background }}>
      <div style={{ 
        background: currentTheme.colors.primary,
        borderRadius: 16,
        boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)",
        border: `1.5px solid ${currentTheme.colors.border}`,
        padding: "2rem 2.5rem",
        width: "clamp(220px, 90vw, 340px)",
        height: "clamp(300px, 60vh, 600px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}>
        <h1 style={{ ...styles.h1, marginBottom: 24 }}>NovaFlow</h1>
        <h2 style={{ ...styles.h2, marginBottom: 24 }}>Login</h2>
        <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="text"
            placeholder="Username"
            style={styles.textInput}
          />
          <input
            type="password"
            placeholder="Password"
            style={styles.textInput}
          />
          <button
            type="submit"
            style={{ ...styles.button1, width: "100%", boxSizing: "border-box" as const }}
          >
            Log In
          </button>
          <div style={{justifyItems: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            
            {(() => {
              const [hover1, setHover1] = React.useState(false);
              const [hover2, setHover2] = React.useState(false);
              return (
                <>
                  <a
                    href="#"
                    style={{
                      ...styles.textLink,
                      marginBottom: 8,
                      marginTop: 8,
                      textDecoration: hover1 ? "underline" : "none",
                      cursor: "pointer"
                    }}
                    onMouseEnter={() => setHover1(true)}
                    onMouseLeave={() => setHover1(false)}
                    onClick={e => { e.preventDefault(); }}
                  >
                    Forgot your password?
                  </a>
                  <a
                    href="#"
                    style={{
                      ...styles.textLink,
                      textDecoration: hover2 ? "underline" : "none",
                      cursor: "pointer"
                    }}
                    onMouseEnter={() => setHover2(true)}
                    onMouseLeave={() => setHover2(false)}
                    onClick={e => { e.preventDefault(); }}
                  >
                    Don't have an account? Sign up
                  </a>
                  <button
                    type="button"
                    style={{
                      ...styles.button1,
                      width: "100%",
                      marginTop: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      background: "#fff",
                      color: "#222",
                      border: `1.5px solid ${currentTheme.colors.border}`,
                      fontWeight: 500,
                      fontSize: 16,
                      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
                      cursor: "pointer"
                    }}
                    onClick={() => {/* Add Google auth logic here */}}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_17_40)">
                        <path d="M19.805 10.23c0-.68-.06-1.36-.18-2.02H10.2v3.84h5.44c-.23 1.22-.93 2.26-1.98 2.94v2.44h3.2c1.87-1.72 2.94-4.26 2.94-7.2z" fill="#4285F4"/>
                        <path d="M10.2 20c2.52 0 4.64-.84 6.18-2.28l-3.2-2.44c-.89.6-2.03.96-2.98.96-2.29 0-4.23-1.54-4.92-3.62H2.01v2.28C3.54 18.36 6.67 20 10.2 20z" fill="#34A853"/>
                        <path d="M5.28 12.62c-.21-.6-.33-1.24-.33-1.92s.12-1.32.33-1.92V6.5H2.01A9.8 9.8 0 0 0 0 10.7c0 1.6.39 3.12 1.08 4.2l3.27-2.28z" fill="#FBBC05"/>
                        <path d="M10.2 4.04c1.37 0 2.6.47 3.57 1.39l2.66-2.66C14.83 1.08 12.71 0 10.2 0 6.67 0 3.54 1.64 2.01 4.5l3.27 2.28c.69-2.08 2.63-3.62 4.92-3.62z" fill="#EA4335"/>
                      </g>
                      <defs>
                        <clipPath id="clip0_17_40">
                          <rect width="20" height="20" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                    Continue with Google
                  </button>
                </>
              );
            })()}
          </div>
        </form>
      </div>
    </div>
  );
}
