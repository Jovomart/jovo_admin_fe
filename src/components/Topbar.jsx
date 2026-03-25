// src/components/Topbar.jsx
import { useContext } from "react";
import { useLocation } from "react-router-dom";
import { FiMenu, FiBell } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";

const pageTitles = {
  "/dashboard":  { title: "Dashboard",         sub: "Overview of your platform" },
  "/sellers":    { title: "Seller Management",  sub: "Manage seller applications & approved sellers" },
  "/schools":    { title: "School Management",  sub: "Manage registered schools on the platform" },
  "/delivery":   { title: "Delivery Options",   sub: "Manage delivery settings & pricing" },
  "/settings":   { title: "Settings",           sub: "Admin account settings" },
};

const Topbar = ({ onMenuClick }) => {
  const { admin }  = useContext(AuthContext);
  const location   = useLocation();
  const page       = pageTitles[location.pathname] || { title: "Admin", sub: "" };
  const displayName = admin?.full_name || admin?.username || "Admin";
  const initials    = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/5"
      style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(20px)" }}>
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition">
          <FiMenu size={18} />
        </button>
        <div>
          <h1 className="text-base font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{page.title}</h1>
          <p className="text-xs text-white/30 hidden sm:block">{page.sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition">
          <FiBell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B42225]" />
        </button>

        {/* Admin avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}>
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-white/80 leading-tight">{displayName}</p>
            <p className="text-[10px] text-white/30">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;