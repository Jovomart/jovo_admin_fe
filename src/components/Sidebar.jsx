// src/components/Sidebar.jsx
import { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/images/logo.png";
import {
  FiGrid, FiTruck,
  FiLogOut, FiChevronRight, FiX, FiSettings,
} from "react-icons/fi";
import { MdStorefront } from "react-icons/md";

const navItems = [
  { label: "Dashboard",   icon: <FiGrid size={18} />,        to: "/dashboard" },
  { label: "Sellers",     icon: <MdStorefront size={18} />,  to: "/sellers" },
  { label: "Delivery",    icon: <FiTruck size={18} />,       to: "/delivery" },
  { label: "Settings",    icon: <FiSettings size={18} />,    to: "/settings" },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const { admin, logout } = useContext(AuthContext);
  const navigate  = useNavigate();
  const location  = useLocation();

  const displayName = admin?.full_name || admin?.username || admin?.first_name || "Admin";
  const initials    = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => { logout(); navigate("/login"); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white ring-1 ring-ink/[.06]">
            <img src={logo} alt="JOVO" style={{ width: "34px", height: "24px", objectFit: "cover" }} />
          </div>
          <div>
            <p className="font-display text-[13px] font-semibold leading-tight text-ink">JOVO</p>
            <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/35">Admin</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-ink/50 hover:text-ink transition">
          <FiX size={15} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="admin-label px-3 mb-2">Navigation</p>
        {navItems.map(({ label, icon, to }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + "/");
          return (
            <button key={to} onClick={() => { navigate(to); onClose?.(); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-[13px] font-medium transition-colors duration-200 ${
                active ? "bg-ink text-cream" : "text-ink/55 hover:text-ink hover:bg-ink/5"
              }`}>
              <span className={active ? "text-cream" : "text-ink/35"}>{icon}</span>
              {label}
              {active && <FiChevronRight size={13} className="ml-auto text-cream/60" />}
            </button>
          );
        })}
      </nav>

      {/* Admin profile + logout */}
      <div className="px-3 pb-4 pt-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white ring-1 ring-ink/[.05] mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-ink text-[11px] font-semibold shrink-0 bg-lilac">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-ink truncate">{displayName}</p>
            <p className="text-[10px] text-ink/40 truncate">{admin?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-[12px] font-semibold text-ink/60 bg-white/70 ring-1 ring-ink/[.06] hover:bg-ink hover:text-cream transition-all duration-200">
          <FiLogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[244px] shrink-0 h-screen sticky top-0 border-r border-ink/[.07] bg-cream-light">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-[264px] h-full border-r border-ink/[.07] flex flex-col bg-cream-light">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
