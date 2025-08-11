import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import GlobalStyles from "../../app/GlobalStyles";
import DynamicSvgBackground from "../../components/DynamicSvgBackground";
import toast, { Toaster } from "react-hot-toast";
import { FaGoogle } from "react-icons/fa";

export default function RegisterPage() {
  const { currentTheme } = useTheme();
  const styles = GlobalStyles(currentTheme);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.email || !formData.username || !formData.password) {
      toast.error("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      toast.success("Account created successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
      
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    toast.success("Under construction!");
  };

  const navigateToLogin = () => {
    navigate("/login");
  };
  
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
          height: "auto",
          minHeight: "400px",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 4px 0 rgba(0,0,0,0.10)",
          position: "relative",
          zIndex: 10
        }}>
          <h1 style={{ ...styles.h1, marginBottom: 24 }}>NovaFlow</h1>
          <h2 style={{ ...styles.h2, marginBottom: 24 }}>Create Account</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              style={styles.textInput}
              disabled={isLoading}
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              style={styles.textInput}
              disabled={isLoading}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              style={styles.textInput}
              disabled={isLoading}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={styles.textInput}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{ 
                ...styles.button1, 
                width: "100%", 
                boxSizing: "border-box" as const,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer"
              }}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
            <div style={{justifyItems: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              
              {(() => {
                const [hover1, setHover1] = React.useState(false);
                return (
                  <>
                    <a
                      onClick={navigateToLogin}
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
                      Already have an account? Sign in
                    </a>
                    <button
                      type="button"
                      onClick={handleGoogleSignup}
                      disabled={isLoading}
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
                        cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.7 : 1
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