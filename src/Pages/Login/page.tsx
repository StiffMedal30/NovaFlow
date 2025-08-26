import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import GlobalStyles from "../../app/GlobalStyles";
import DynamicSvgBackground from "../../components/DynamicSvgBackground";
import toast, { Toaster } from "react-hot-toast";
import { FaGoogle } from "react-icons/fa";
import { login } from "../../../apiClient/loginClient";
import { useAuth } from "../../store/authStore";

export default function LoginPage() {
  const { currentTheme } = useTheme();
  const styles = GlobalStyles(currentTheme);
  const navigate = useNavigate();
  const { state, login: authLogin, startLogin, loginFailure } = useAuth();
  
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error("Please enter both username and password");
      return;
    }
    startLogin();

    try {
      const response = await login({
        username: formData.username,
        password: formData.password
      });

      // Store in auth store (this saves to local storage)
      authLogin({
        username: response.username,
        token: response.token
      });

      toast.success("Login successful!");
      setTimeout(() => {
        navigate("/");
      }, 1000);
      
    } catch (error) {
      loginFailure();
      toast.error("Login failed. Please check your credentials.");
    }
  };

  const handleGoogleLogin = () => {
    toast.success("Under construction!");
  };

  const navigateToRegister = () => {
    navigate("/register");
  };

  const handleForgotPassword = () => {
    toast("Under construction!");
  };

  // Remove body margins and overflow to prevent scroll bars
  React.useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.overflow = "hidden";
    
    // Cleanup function to restore body styles when component unmounts
    return () => {
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.overflow = "";
      document.documentElement.style.margin = "";
      document.documentElement.style.padding = "";
      document.documentElement.style.overflow = "";
    };
  }, []);
  
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: currentTheme.colors.primary,
            color: currentTheme.colors.text,
            border: `1px solid ${currentTheme.colors.border}`,
            fontFamily: "'Didact Gothic', Arial, Helvetica, sans-serif",
            fontSize: 16,
          },
        }}
      />
      <div style={{ 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      background: currentTheme.colors.background,
      position: "relative",
      overflow: "hidden",
      margin: 0,
      padding: 0,
      boxSizing: "border-box"
    }}>
      <DynamicSvgBackground opacity={0.15} />
      <div style={{ 
        background: currentTheme.colors.primary,
        borderRadius: 16,
        border: `1.5px solid ${currentTheme.colors.border}`,
        padding: "2rem 2.5rem",
        width: "clamp(220px, 90vw, 340px)",
        height: "clamp(300px, 60vh, 600px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 4px 0 rgba(0,0,0,0.10)",
        position: "relative",
        zIndex: 10
      }}>
        <h1 style={{ ...styles.h1, marginBottom: 24 }}>NovaFlow</h1>
        <h2 style={{ ...styles.h2, marginBottom: 24 }}>Login</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange}
            style={styles.textInput}
            disabled={state.isLoading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            style={styles.textInput}
            disabled={state.isLoading}
          />
          <button
            type="submit"
            disabled={state.isLoading}
            style={{ 
              ...styles.button1, 
              width: "100%", 
              boxSizing: "border-box" as const,
              opacity: state.isLoading ? 0.7 : 1,
              cursor: state.isLoading ? "not-allowed" : "pointer"
            }}
          >
            {state.isLoading ? "Logging In..." : "Log In"}
          </button>
          <div style={{justifyItems: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            
            {(() => {
              const [hover1, setHover1] = React.useState(false);
              const [hover2, setHover2] = React.useState(false);
              return (
                <>
                  <a
                    onClick={handleForgotPassword}
                    style={{
                      ...styles.textLink,
                      marginBottom: 8,
                      marginTop: 8,
                      textDecoration: hover1 ? "underline" : "none",
                      cursor: "pointer"
                    }}
                    onMouseEnter={() => setHover1(true)}
                    onMouseLeave={() => setHover1(false)}
                  >
                    Forgot your password? 
                  </a>
                  <a
                    onClick={navigateToRegister}
                    style={{
                      ...styles.textLink,
                      textDecoration: hover2 ? "underline" : "none",
                      cursor: "pointer"
                    }}
                    onMouseEnter={() => setHover2(true)}
                    onMouseLeave={() => setHover2(false)}
                  >
                    Don't have an account? Sign up
                  </a>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={state.isLoading}
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
                      cursor: state.isLoading ? "not-allowed" : "pointer",
                      opacity: state.isLoading ? 0.7 : 1
                    }}
                  >
                    <FaGoogle size={20} />
                    Continue with Google
                  </button>
                </>
              );
            })()}
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
