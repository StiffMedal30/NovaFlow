import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import DarkVeil from "../../components/DarkVeil";
import { useAuth } from "../../store/authStore";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) {
      return;
    }
    handled.current = true;

    const parameters = new URLSearchParams(window.location.hash.substring(1));
    const token = parameters.get("token");
    const username = parameters.get("username");

    if (!token || !username) {
      toast.error("Google sign-in could not be completed.");
      navigate("/login?oauth=failed", { replace: true });
      return;
    }

    login({ token, username });
    window.history.replaceState(null, "", "/oauth/callback");
    navigate("/", { replace: true });
  }, [login, navigate]);

  return (
    <>
      <Toaster position="top-center" />
      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-background">
        <DarkVeil
          noiseIntensity={0.08}
          scanlineIntensity={0.08}
          speed={0.9}
          scanlineFrequency={0.05}
          warpAmount={0.5}
          resolutionScale={1}
        />
        <div className="relative z-10 rounded-lg border border-border bg-secondary-background/70 px-8 py-6 text-text backdrop-blur-md">
          Completing Google sign-in...
        </div>
      </div>
    </>
  );
}
