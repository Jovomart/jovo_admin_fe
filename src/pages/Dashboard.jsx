// src/pages/Dashboard.jsx
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FiUsers, FiTruck, FiShoppingBag, FiArrowRight, FiTrendingUp, FiActivity } from "react-icons/fi";
import { MdStorefront } from "react-icons/md";

const StatCard = ({ icon, label, value, sub, color, onClick }) => (
  <div onClick={onClick}
    className={`rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 ${onClick ? "cursor-pointer" : ""}`}
    style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
    <div className="flex items-start justify-between mb-5">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      {onClick && <FiArrowRight size={14} className="text-white/20 mt-1" />}
    </div>
    <p className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>{value}</p>
    <p className="text-sm font-semibold text-white/50">{label}</p>
    {sub && <p className="text-xs text-white/25 mt-1">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const { admin }  = useContext(AuthContext);
  const navigate   = useNavigate();
  const displayName = admin?.full_name || admin?.first_name || "Admin";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const quickActions = [
    { label: "Review Pending Sellers", sub: "Approve or reject new applications", icon: <MdStorefront size={20} />, color: "#FF8C00", to: "/sellers" },
    { label: "Manage Delivery Options", sub: "Configure pricing & availability", icon: <FiTruck size={20} />, color: "#0EA5E9", to: "/delivery" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Greeting */}
      <div className="rounded-3xl p-8 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0d0d14 0%,#100a0a 50%,#1a0505 100%)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(180,34,37,0.15),transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="relative z-10">
          <p className="text-[10px] font-bold tracking-[3px] uppercase text-white/25 mb-2">
            {now.toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
            {greeting}, <span style={{ background: "linear-gradient(90deg,#FF8C00,#FFB347)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{displayName}</span> 👋
          </h1>
          <p className="text-white/35 text-sm">Here's what's happening on your platform today.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-[2px] text-white/30 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<MdStorefront size={20} />} label="Pending Sellers"  value="—" sub="Awaiting review" color="#FF8C00" onClick={() => navigate("/sellers")} />
          <StatCard icon={<MdStorefront size={20} />} label="Approved Sellers" value="—" sub="Active on platform" color="#10B981" onClick={() => navigate("/sellers")} />
          <StatCard icon={<FiTruck size={20} />}      label="Delivery Options" value="—" sub="Active routes"     color="#0EA5E9" onClick={() => navigate("/delivery")} />
          <StatCard icon={<FiActivity size={20} />}   label="Platform Status" value="Live" sub="All systems normal" color="#B42225" />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-[2px] text-white/30 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {quickActions.map(({ label, sub, icon, color, to }) => (
            <button key={to} onClick={() => navigate(to)}
              className="flex items-center gap-4 p-5 rounded-3xl border text-left transition-all duration-300 hover:-translate-y-1 group"
              style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all"
                style={{ background: `${color}15`, border: `1px solid ${color}25`, color }}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white group-hover:text-[#FF8C00] transition-colors">{label}</p>
                <p className="text-xs text-white/30 mt-0.5">{sub}</p>
              </div>
              <FiArrowRight size={16} className="text-white/20 group-hover:text-[#FF8C00] group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-[2px] text-white/30 mb-4">Recent Activity</h2>
        <div className="rounded-3xl p-8 border text-center"
          style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.06)" }}>
          <FiActivity size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm font-bold text-white/30">Activity feed will appear here</p>
          <p className="text-xs text-white/15 mt-1">Actions like seller approvals and delivery updates will be logged</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;