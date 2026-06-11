import { useAuth } from "../store/authStore";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export function ProtectedRoute() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.isLoading) {
    return null;
  }

  return state.isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
