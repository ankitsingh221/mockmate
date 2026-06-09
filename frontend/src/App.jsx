import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Auth pages
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Home from "./pages/Home";

// Protected pages (you'll build these in later steps)
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import CreateInterview from "./pages/interview/CreateInterview";
import InterviewRoom from "./pages/interview/InterviewRoom";
import InterviewReport from "./pages/interview/InterviewReport";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/interview/create" element={<CreateInterview />} />
          <Route path="/interview/:id/room" element={<InterviewRoom />} />
          <Route path="/interview/:id/report" element={<InterviewReport />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/signin" replace />} />

      </Routes>
    </BrowserRouter>
  );
}