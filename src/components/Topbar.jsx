// src/components/Topbar.jsx
import { useContext } from "react";
import { useLocation } from "react-router-dom";
import { FiMenu, FiBell } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";

const pageTitles = {
  "/dashboard":  { title: "Dashboard",         sub: "Overview of your platform" },
  "/sellers":    { title: "Seller Management",  sub: "Manage seller applications & approved sellers" },
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
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 border-b border-ink/[.07] bg-cream/85 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-full bg-white flex items-center justify-center text-ink/60 ring-1 ring-ink/[.06] hover:text-ink transition">
          <FiMenu size={18} />
        </button>
        <div>
          <h1 className="font-display text-[17px] font-semibold text-ink leading-tight">{page.title}</h1>
          <p className="text-[11px] text-ink/40 hidden sm:block">{page.sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-full bg-white flex items-center justify-center text-ink/45 ring-1 ring-ink/[.06] hover:text-ink transition">
          <FiBell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand" />
        </button>

        {/* Admin avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-ink text-[11px] font-semibold bg-peach">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-semibold text-ink leading-tight">{displayName}</p>
            <p className="text-[10px] text-ink/40">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
