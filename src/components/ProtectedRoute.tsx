import { useAuth } from "../store/authStore";
import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute() {
  const { state } = useAuth();
  return state.isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}