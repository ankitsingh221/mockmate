import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import ProtectedRoute from "./components/layout/ProtectedRoute";
import Navbar from "./components/layout/Navbar";
import { useAuthStore } from "./store/authStore";

// Public pages
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/Signup";

// Protected pages
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import CreateInterview from "./pages/interview/CreateInterview";
import InterviewRoom from "./pages/interview/InterviewRoom";
import InterviewReport from "./pages/interview/InterviewReport";
import VoiceInterviewRoom from "./pages/interview/VoiceInterviewRoom"; // ← FIX 1: wrong path alias

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      {children}
    </div>
  );
}

function AuthRoute({ children }) {
  const { isAuthenticated, isHydrated } = useAuthStore();
  if (!isHydrated) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}
export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        visibleToasts={3}
        duration={4000}
        toastOptions={{
          style: {
            background: "rgba(18,18,18,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#fff",
            fontSize: "13px",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          },
          className: "my-toast",
          success: {
            style: { border: "1px solid rgba(34,197,94,0.3)" },
            iconTheme: { primary: "#22c55e", secondary: "#fff" },
          },
          error: {
            style: { border: "1px solid rgba(239,68,68,0.3)" },
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />

      <Routes>
        {/* Public — no Navbar */}
        <Route path="/" element={<Home />} />
        <Route
          path="/signup"
          element={
            <AuthRoute>
              <SignUp />
            </AuthRoute>
          }
        />
        <Route
          path="/login"
          element={
            <AuthRoute>
              <SignIn />
            </AuthRoute>
          }
        />

        {/* Protected — Navbar via AppLayout */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/marketplace"
            element={
              <AppLayout>
                <Marketplace />
              </AppLayout>
            }
          />
          <Route
            path="/interview/create"
            element={
              <AppLayout>
                <CreateInterview />
              </AppLayout>
            }
          />
          <Route
            path="/interview/:id/room"
            element={
              <AppLayout>
                <InterviewRoom />
              </AppLayout>
            }
          />

          {/* FIX 2: was "/interview':id/voice" — missing / and colon was wrong */}
          <Route
            path="/interview/:id/voice"
            element={
              <AppLayout>
                <VoiceInterviewRoom />
              </AppLayout>
            }
          />

          <Route
            path="/interview/:id/report"
            element={
              <AppLayout>
                <InterviewReport />
              </AppLayout>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
