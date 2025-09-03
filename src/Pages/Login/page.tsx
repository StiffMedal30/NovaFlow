import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DynamicSvgBackground from "../../components/DynamicSvgBackground";
import toast, { Toaster } from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { login } from "../../../apiClient/loginClient";
import { useAuth } from "../../store/authStore";

export default function LoginPage() {
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
            background: 'var(--color-primary)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            fontFamily: "'Didact Gothic', Arial, Helvetica, sans-serif",
            fontSize: 16,
          },
        }}
      />
      <div className="h-screen flex items-center justify-center bg-background relative overflow-hidden m-0 p-0 box-border">
        <DynamicSvgBackground opacity={0.15} />
        <div className="bg-secondary-background rounded-xl border-2 border-border p-8 w-96 min-h-96 max-w-md flex flex-col items-stretch shadow-2xl relative z-10">
          <h1 className="text-3xl font-normal text-text font-['Didact_Gothic'] mb-6">NovaFlow</h1>
          <h2 className="text-2xl font-normal text-text font-['Didact_Gothic'] mb-6">Login</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              className="px-4 py-3 bg-secondary border border-border rounded-lg text-text placeholder-text/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              disabled={state.isLoading}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="px-4 py-3 bg-secondary border border-border rounded-lg text-text placeholder-text/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              disabled={state.isLoading}
            />
            <button
              type="submit"
              disabled={state.isLoading}
              className={`w-full px-4 py-3 bg-accent text-background border-0 rounded-lg font-medium text-base cursor-pointer transition-all hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${
                state.isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {state.isLoading ? "Logging In..." : "Log In"}
            </button>
            <div className="flex flex-col items-center gap-2">
              <a
                onClick={handleForgotPassword}
                className="text-text hover:text-accent transition-colors cursor-pointer underline-offset-4 hover:underline mb-2 mt-2"
              >
                Forgot your password?
              </a>
              <a
                onClick={navigateToRegister}
                className="text-text hover:text-accent transition-colors cursor-pointer underline-offset-4 hover:underline"
              >
                Don't have an account? Sign up
              </a>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={state.isLoading}
                className={`w-full mt-3 px-4 py-3 bg-white text-gray-800 border-2 border-border rounded-lg font-medium text-base flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${
                  state.isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <FcGoogle size={20} />
                Continue with Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
