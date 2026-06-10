import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mic,
  LayoutDashboard,
  Store,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/axios";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/marketplace", label: "Marketplace", icon: Store },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
       console.log(e)
    } finally {
      logout();
      navigate("/signin");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
        style={{
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center shadow-md shadow-red-900/40">
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight text-sm">MockMate</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all duration-150 ${
                  isActive(to)
                    ? "text-white bg-white/8"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop right — profile dropdown */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl px-3 py-1.5 transition-colors"
              >
                {/* Avatar */}
                <div className="w-6 h-6 rounded-full bg-red-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {user?.name?.[0] ?? <User className="w-3 h-3" />}
                </div>
                <span className="text-xs text-zinc-300 font-medium max-w-[100px] truncate">
                  {user?.name ?? "Account"}
                </span>
                <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <>
                  {/* backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-white/8 overflow-hidden z-20"
                    style={{
                      background: "rgba(18,18,18,0.95)",
                      backdropFilter: "blur(20px)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                    }}
                  >
                    <div className="px-3 py-2.5 border-b border-white/6">
                      <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden text-zinc-400 hover:text-white transition-colors p-1"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden border-t border-white/5 px-4 py-4 flex flex-col gap-1"
            style={{ background: "rgba(10,10,10,0.97)" }}
          >
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl transition-colors ${
                  isActive(to)
                    ? "text-white bg-white/8"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

            <div className="border-t border-white/6 mt-2 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-red-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user?.name?.[0] ?? "?"}
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{user?.name}</p>
                  <p className="text-[10px] text-zinc-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer so content doesn't sit under fixed navbar */}
      <div className="h-14" />
    </>
  );
}