import { LogInIcon, LogOutIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/authStore";

export default function LoginStateButton() {
  const navigate = useNavigate();
  const { state, logout } = useAuth();

  const handleAuthClick = () => {
    if (state.isAuthenticated) {
      logout();
      navigate("/login", { replace: true });
      return;
    }

    navigate("/login");
  };

  return (
    <button
      type="button"
      onClick={handleAuthClick}
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80 ${
        state.isAuthenticated ? "text-red-400" : "text-text"
      }`}
      aria-label={state.isAuthenticated ? "Log out" : "Log in"}
    >
      {state.isAuthenticated
        ? <LogOutIcon size={18} strokeWidth={1.5} />
        : <LogInIcon size={18} strokeWidth={1.5} />}
      {state.isAuthenticated ? "Logout" : "Login"}
    </button>
  );
}
