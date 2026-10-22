import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Avatar from "./Avatar";

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { on } = useSocket();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const refreshUnread = () => {
    api
      .get("/notifications/unread-count")
      .then((res) => setUnread(res.data.unread))
      .catch(() => {});
  };

  useEffect(() => {
    refreshUnread();
    const off1 = on("notification:new", refreshUnread);
    const off2 = on("message:new", refreshUnread);
    return () => {
      off1();
      off2();
    };
  }, [on]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
            S
          </span>
          <span className="text-lg font-bold text-gray-900">SocialNet</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/search" className={navLinkClass}>
            Search
          </NavLink>
          <NavLink to="/messages" className={navLinkClass}>
            Messages
          </NavLink>
          <NavLink to="/notifications" className={navLinkClass}>
            Notifications
            {unread > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">
                {unread}
              </span>
            )}
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-brand-100 p-1"
          >
            <Avatar user={user} size={36} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500">@{user?.username}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      <nav className="md:hidden flex items-center justify-around border-t border-gray-100 px-2 py-1.5">
        <NavLink to="/" className={navLinkClass} end>
          Home
        </NavLink>
        <NavLink to="/search" className={navLinkClass}>
          Search
        </NavLink>
        <NavLink to="/messages" className={navLinkClass}>
          Chat
        </NavLink>
        <NavLink to="/notifications" className={navLinkClass}>
          Alerts{unread > 0 ? ` (${unread})` : ""}
        </NavLink>
      </nav>
    </header>
  );
}