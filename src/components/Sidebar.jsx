// src/components/Sidebar.jsx
import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/images/logo.png";
import {
  FiGrid,
  FiUsers,
  FiShoppingBag,
  FiTruck,
  FiActivity,
  FiLogOut,
  FiChevronRight,
  FiX,
  FiSettings,
  FiUserPlus,
} from "react-icons/fi";
import { MdStorefront, MdOutlineSchool } from "react-icons/md";

const Sidebar = ({ mobileOpen, onClose }) => {
  const { admin, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Super Admin check
  const isSuperAdmin = admin?.email === "voltsourceinnovations@gmail.com";

  // Base nav items for all admins
  const baseNavItems = [
    { label: "Dashboard", icon: <FiGrid size={18} />, to: "/dashboard" },
    { label: "Sellers", icon: <MdStorefront size={18} />, to: "/sellers" },
    { label: "Revenue", icon: <FiGrid size={18} />, to: "/revenue" },
    { label: "Schools", icon: <MdOutlineSchool size={18} />, to: "/schools" },
    {
      label: "Pickup Stations",
      icon: <FiUsers size={18} />,
      to: "/pickup-stations",
    },
    { label: "Report System", icon: <FiActivity size={18} />, to: "/reporting" },
    { label: "Campus Guide", icon: <FiUsers size={18} />, to: "/campus-guide" },
    { label: "Categories", icon: <FiGrid size={18} />, to: "/categories" },
    {
      label: "Admin Products",
      icon: <FiShoppingBag size={18} />,
      to: "/admin-products",
    },
    { label: "Orders", icon: <FiShoppingBag size={18} />, to: "/orders" },
    { label: "Withdrawals", icon: <FiGrid size={18} />, to: "/withdrawals" },
    { label: "Delivery", icon: <FiTruck size={18} />, to: "/delivery" },
    {
      label: "Campaigns",
      icon: <FiGrid size={18} />,
      to: "/campaigns",
    },
    { label: "Settings", icon: <FiSettings size={18} />, to: "/settings" },
  ];

  // Super Admin only nav items
  const superAdminItems = [
    {
      label: "Admin Invitations",
      icon: <FiUserPlus size={18} />,
      to: "/admin-invitations",
    },
    {
      label: "Activity Logs",
      icon: <FiActivity size={18} />,
      to: "/activity-logs",
    },
  ];

  const navItems = isSuperAdmin
    ? [...baseNavItems, ...superAdminItems]
    : baseNavItems;

  const displayName =
    admin?.full_name || admin?.username || admin?.first_name || "Admin";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="JOVO"
            style={{ width: "57px", height: "40px", objectFit: "cover" }}
          />
          <div>
            <p className="text-[10px] font-bold text-white/30 tracking-[3px] uppercase">
              Admin
            </p>
            <p className="text-[10px] font-bold text-white/20 tracking-[1px]">
              Panel
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition"
        >
          <FiX size={15} />
        </button>
      </div>

      {/* Nav with custom scrollbar */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto sidebar-scroll">
        <p className="text-[9px] font-bold tracking-[3px] uppercase text-white/20 px-3 mb-3">
          Navigation
        </p>
        {navItems.map(({ label, icon, to }) => {
          const active =
            location.pathname === to || location.pathname.startsWith(to + "/");
          return (
            <button
              key={to}
              onClick={() => {
                navigate(to);
                onClose?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                active
                  ? "text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
              style={
                active
                  ? {
                      background:
                        "linear-gradient(135deg,rgba(180,34,37,0.3),rgba(255,140,0,0.15))",
                      boxShadow: "0 0 0 1px rgba(180,34,37,0.3)",
                    }
                  : {}
              }
            >
              <span
                className={
                  active
                    ? "text-[#FF8C00]"
                    : "text-white/30 group-hover:text-white/50 transition-colors"
                }
              >
                {icon}
              </span>
              {label}
              {active && (
                <FiChevronRight size={13} className="ml-auto text-white/30" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin profile + logout */}
      <div className="px-3 pb-4 border-t border-white/5 pt-4 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 mb-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white/80 truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-white/30 truncate">{admin?.email}</p>
          </div>
        </div>
        {isSuperAdmin && (
          <p className="text-[9px] font-bold text-[#FF8C00]/60 text-center mb-2">
            Super Admin
          </p>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all duration-200"
        >
          <FiLogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-white/5"
        style={{ background: "#0d0d14" }}
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside
            className="relative w-64 h-full border-r border-white/5 flex flex-col"
            style={{ background: "#0d0d14" }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
