import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/axios";
import Loader from "../shared/Loader";

export default function ProtectedRoute() {
  const { isAuthenticated, setAuth, logout } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If already authenticated from persisted store — no need to verify
    if (isAuthenticated) {
      setChecking(false); 
      return;
    }

    // Not in store — try to verify session via cookie
    // This handles the case where cookie exists but store was cleared
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (data?.user) {
          setAuth(data.user);   // restore auth state
        } else {
          logout();
        }
      } catch {
        // Cookie invalid or expired — clear state
        logout();
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  // Show loader while checking —>>> prevents flash redirect to home
  if (checking) return <Loader />;

  // Auth confirmed   then we  render the page
  if (isAuthenticated) return <Outlet />;

  // Not authenticated — go to signin
  return <Navigate to="/login" replace />;
}