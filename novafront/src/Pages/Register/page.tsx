import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DarkVeil from "../../components/DarkVeil";
import toast, { Toaster } from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { MailCheck } from "lucide-react";
import {
  isGoogleOAuthEnabled,
  register,
  startGoogleOAuth,
} from "../../../apiClient/registrationClient";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [googleOAuthEnabled, setGoogleOAuthEnabled] = useState(false);

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

  React.useEffect(() => {
    isGoogleOAuthEnabled().then(setGoogleOAuthEnabled).catch(() => {
      setGoogleOAuthEnabled(false);
    });
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

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
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
      const response = await register({
        email: formData.email.trim(),
        name: formData.name.trim() || undefined,
        username: formData.username.trim(),
        password: formData.password,
      });
      setRegistrationComplete(true);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    if (!googleOAuthEnabled) {
      toast.error("Google sign-up is not configured yet.");
      return;
    }
    startGoogleOAuth();
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
            background: 'var(--color-primary)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            fontFamily: "'Didact Gothic', Arial, Helvetica, sans-serif",
            fontSize: 16,
          },
        }}
      />
      <div className="h-screen flex items-center justify-center bg-background relative overflow-hidden m-0 p-0 box-border">
        <DarkVeil 
          noiseIntensity={0.08}
          scanlineIntensity={0.08}
          speed={0.9}
          scanlineFrequency={0.05}
          warpAmount={0.5}
          resolutionScale={1}
        />
        <div className="bg-secondary-background/20 backdrop-blur-md rounded-xl border-2 border-border p-8 w-96 min-h-96 max-w-md flex flex-col items-stretch shadow-2xl relative z-10">
          <h1 className="text-3xl font-normal text-text font-['Didact_Gothic'] mb-6">NovaFlow</h1>
          <h2 className="text-2xl font-normal text-text font-['Didact_Gothic'] mb-6">
            {registrationComplete ? "Verification email sent" : "Create Account"}
          </h2>
          {registrationComplete ? (
            <div className="flex flex-col items-center gap-5 text-center text-text">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
                <MailCheck size={28} aria-hidden="true" />
              </div>
              <div className="space-y-3">
                <p className="leading-7 text-text/80">
                  Your account has been created. We sent a verification email to
                </p>
                <p className="max-w-full text-sm font-medium text-text [overflow-wrap:anywhere]">
                  {formData.email}
                </p>
                <p className="leading-7 text-text/70">
                  Check your mailbox and follow the activation link. If it is not in your inbox,
                  check your spam folder. The link expires after 24 hours.
                </p>
              </div>
              <button
                type="button"
                onClick={navigateToLogin}
                className="w-full rounded-lg bg-accent px-4 py-3 font-medium text-background transition-colors hover:bg-accent/90"
              >
                Back to login
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              name="name"
              placeholder="Full name (optional)"
              value={formData.name}
              onChange={handleInputChange}
              className="px-4 py-3 bg-secondary border border-border rounded-lg text-text placeholder-text/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              disabled={isLoading}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="px-4 py-3 bg-secondary border border-border rounded-lg text-text placeholder-text/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              disabled={isLoading}
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              className="px-4 py-3 bg-secondary border border-border rounded-lg text-text placeholder-text/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              disabled={isLoading}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="px-4 py-3 bg-secondary border border-border rounded-lg text-text placeholder-text/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              disabled={isLoading}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="px-4 py-3 bg-secondary border border-border rounded-lg text-text placeholder-text/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full px-4 py-3 bg-accent text-background border-0 rounded-lg font-medium text-base cursor-pointer transition-all hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
            <div className="flex flex-col items-center gap-2">
              <a
                onClick={navigateToLogin}
                className="text-text hover:text-accent transition-colors cursor-pointer underline-offset-4 hover:underline mb-2 mt-2"
              >
                Already have an account? Sign in
              </a>
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className={`w-full mt-3 px-4 py-3 bg-white text-gray-800 border-2 border-border rounded-lg font-medium text-base flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <FcGoogle size={20} />
                Continue with Google
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </>
  );
}
