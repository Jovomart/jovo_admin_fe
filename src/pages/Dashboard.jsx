// src/pages/Dashboard.jsx
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AdminApiService from "../services/apiService";
import { 
  FiTruck, FiArrowRight, FiActivity, FiClock, 
  FiUserCheck, FiTruck as FiDelivery, 
  FiAlertCircle, FiRefreshCw, FiEdit2, FiTrash2,
  FiCheckCircle, FiUserPlus
} from "react-icons/fi";
import { MdStorefront, MdOutlineSchool } from "react-icons/md";

const normalizeList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.items)) return result.items;
  if (result?.data?.delivery_options && Array.isArray(result.data.delivery_options)) return result.data.delivery_options;
  return [];
};

const StatCard = ({ icon, label, value, sub, color, onClick, loading }) => (
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
    {loading
      ? <div className="w-16 h-7 rounded-lg bg-white/5 animate-pulse mb-1" />
      : <p className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>{value}</p>
    }
    <p className="text-sm font-semibold text-white/50">{label}</p>
    {sub && <p className="text-xs text-white/25 mt-1">{sub}</p>}
  </div>
);

// Helper to get action icon and color
const getActionIcon = (action) => {
  const actionLower = (action || "").toLowerCase();
  if (actionLower.includes("seller") || actionLower.includes("approve") || actionLower.includes("reject")) {
    return { icon: <MdStorefront size={14} />, color: "#FF8C00" };
  }
  if (actionLower.includes("delivery")) {
    return { icon: <FiDelivery size={14} />, color: "#0EA5E9" };
  }
  if (actionLower.includes("school")) {
    return { icon: <MdOutlineSchool size={14} />, color: "#10B981" };
  }
  if (actionLower.includes("admin") || actionLower.includes("invitation")) {
    return { icon: <FiUserPlus size={14} />, color: "#8B5CF6" };
  }
  if (actionLower.includes("login") || actionLower.includes("logout")) {
    return { icon: <FiUserCheck size={14} />, color: "#6B7280" };
  }
  if (actionLower.includes("create")) {
    return { icon: <FiCheckCircle size={14} />, color: "#10B981" };
  }
  if (actionLower.includes("update") || actionLower.includes("edit")) {
    return { icon: <FiEdit2 size={14} />, color: "#3B82F6" };
  }
  if (actionLower.includes("delete") || actionLower.includes("deactivate")) {
    return { icon: <FiTrash2 size={14} />, color: "#EF4444" };
  }
  return { icon: <FiActivity size={14} />, color: "#6B7280" };
};

// Helper to format relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const ActivityItem = ({ log, isSuperAdmin }) => {
  const { icon, color } = getActionIcon(log.action);
  
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white/80 truncate">
            {log.action || "Unknown action"}
          </p>
          <span className="text-[10px] text-white/30 flex items-center gap-1 shrink-0">
            <FiClock size={10} /> {formatRelativeTime(log.created_at)}
          </span>
        </div>
        <p className="text-xs text-white/40 mt-0.5">
          {log.description || `${log.action} performed`}
        </p>
        {isSuperAdmin && log.admin_name && (
          <p className="text-[10px] text-white/25 mt-1">
            By: {log.admin_name} {log.admin_email ? `(${log.admin_email})` : ""}
          </p>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { admin } = useContext(AuthContext);
  const navigate = useNavigate();
  const displayName = admin?.full_name || admin?.first_name || "Admin";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Role detection
  const isSuperAdmin = admin?.email === "voltsourceinnovations@gmail.com";

  const [counts, setCounts] = useState({ 
    pending: null, 
    approved: null, 
    deliveryOptions: null,
    activeDeliveryOptions: null 
  });
  const [loading, setLoading] = useState(true);
  
  // Activity logs state
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityHasMore, setActivityHasMore] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      try {
        const [pendingSellers, approvedSellers, deliveryOptions] = await Promise.all([
          AdminApiService.getPendingSellers(),
          AdminApiService.getApprovedSellers(),
          AdminApiService.getDeliveryOptions(),
        ]);
        
        let deliveryOptionsArray = normalizeList(deliveryOptions);
        const activeCount = deliveryOptionsArray.filter(opt => opt.is_available === true).length;
        
        setCounts({
          pending: normalizeList(pendingSellers).length,
          approved: normalizeList(approvedSellers).length,
          deliveryOptions: deliveryOptionsArray.length,
          activeDeliveryOptions: activeCount,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard counts:", error);
        setCounts({ 
          pending: "—", 
          approved: "—", 
          deliveryOptions: "—",
          activeDeliveryOptions: "—"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const fetchActivities = async (page = 1) => {
    setActivitiesLoading(true);
    setActivitiesError("");
    try {
      const response = await AdminApiService.getActivityLogs({ 
        page, 
        pageSize: 10, 
        days: 30,
        adminId: !isSuperAdmin ? admin?.id : null
      });
      const logsData = response?.data || response;
      const logs = logsData?.logs || logsData?.items || logsData?.data || [];
      const total = logsData?.total || logsData?.total_count || logs.length;
      
      if (page === 1) {
        setActivities(logs);
      } else {
        setActivities(prev => [...prev, ...logs]);
      }
      setActivityTotal(total);
      setActivityHasMore(logs.length === 10 && activities.length + logs.length < total);
      setActivityPage(page);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      setActivitiesError(err.message || "Failed to load activities");
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(1);
  }, []);

  const loadMoreActivities = () => {
    if (!activitiesLoading && activityHasMore) {
      fetchActivities(activityPage + 1);
    }
  };

  const quickActions = [
    { label: "Review Pending Sellers", sub: "Approve or reject new applications", icon: <MdStorefront size={20} />, color: "#FF8C00", to: "/sellers" },
    { label: "Manage Delivery Options", sub: "Configure pricing & availability", icon: <FiTruck size={20} />, color: "#0EA5E9", to: "/delivery" },
  ];

  // Add Activity Logs to quick actions for Super Admins
  if (isSuperAdmin) {
    quickActions.push({ 
      label: "View Activity Logs", 
      sub: "See all admin actions", 
      icon: <FiActivity size={20} />, 
      color: "#8B5CF6", 
      to: "/activity-logs" 
    });
  }

  return (
    <div className="space-y-8 max-w-7xl">
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
            {greeting},{" "}
            <span style={{ background: "linear-gradient(90deg,#FF8C00,#FFB347)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {displayName}
            </span>
          </h1>
          <p className="text-white/35 text-sm">Here's what's happening on your platform today.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-[2px] text-white/30 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<MdStorefront size={20} />} 
            label="Pending Sellers"
            value={counts.pending ?? "—"} 
            sub="Awaiting review"
            color="#FF8C00" 
            loading={loading}
            onClick={() => navigate("/sellers")}
          />
          <StatCard
            icon={<MdStorefront size={20} />} 
            label="Approved Sellers"
            value={counts.approved ?? "—"} 
            sub="Active on platform"
            color="#10B981" 
            loading={loading}
            onClick={() => navigate("/sellers")}
          />
          <StatCard
            icon={<FiTruck size={20} />} 
            label="Total Delivery Options"
            value={counts.deliveryOptions ?? "—"} 
            sub={`${counts.activeDeliveryOptions ?? "—"} active`}
            color="#0EA5E9"
            loading={loading}
            onClick={() => navigate("/delivery")}
          />
          <StatCard
            icon={<FiActivity size={20} />} 
            label="Platform Status"
            value="Live" 
            sub="All systems normal"
            color="#B42225"
          />
        </div>
      </div>

      {/* Two column layout for Quick Actions + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-black uppercase tracking-[2px] text-white/30 mb-4">Quick Actions</h2>
          <div className="grid gap-4">
            {quickActions.map(({ label, sub, icon, color, to }) => (
              <button key={to} onClick={() => navigate(to)}
                className="flex items-center gap-4 p-5 rounded-3xl border text-left transition-all duration-300 hover:-translate-y-1 group"
                style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
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

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-[2px] text-white/30">
              Recent Activity
              {!isSuperAdmin && <span className="ml-2 text-[10px] text-white/20">(Your activity only)</span>}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchActivities(1)} 
                disabled={activitiesLoading}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <FiRefreshCw size={14} className={activitiesLoading ? "animate-spin" : ""} />
              </button>
              <button 
                onClick={() => navigate("/activity-logs")}
                className="text-xs font-medium text-[#FF8C00] hover:underline transition-colors"
              >
                View All →
              </button>
            </div>
          </div>
          
          <div className="rounded-3xl border" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
            <div className="p-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <FiActivity size={16} className="text-[#FF8C00]" />
                <h3 className="text-sm font-black text-white">Activity Feed</h3>
              </div>
              <p className="text-xs text-white/30 mt-1">
                {isSuperAdmin ? "Recent actions by all administrators" : "Your recent actions"}
              </p>
            </div>
            
            <div className="p-5 max-h-100 overflow-y-auto custom-scrollbar">
              {activitiesLoading && activities.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-start gap-3 py-2">
                      <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 bg-white/5 rounded animate-pulse w-3/4 mb-2" />
                        <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activitiesError ? (
                <div className="text-center py-8">
                  <FiAlertCircle size={32} className="text-red-400/50 mx-auto mb-2" />
                  <p className="text-sm text-white/40">{activitiesError}</p>
                  <button 
                    onClick={() => fetchActivities(1)}
                    className="mt-3 text-xs text-[#FF8C00] hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <FiActivity size={32} className="text-white/10 mx-auto mb-2" />
                  <p className="text-sm text-white/30">No activity yet</p>
                  <p className="text-xs text-white/20 mt-1">
                    {isSuperAdmin 
                      ? "Actions will appear here as admins use the platform"
                      : "Actions will appear here as you use the platform"}
                  </p>
                </div>
              ) : (
                <>
                  {activities.map((log, index) => (
                    <ActivityItem key={log.id || index} log={log} isSuperAdmin={isSuperAdmin} />
                  ))}
                  {activityHasMore && (
                    <button
                      onClick={loadMoreActivities}
                      disabled={activitiesLoading}
                      className="w-full mt-4 py-2 text-center text-xs font-medium text-white/40 hover:text-white/60 transition-colors"
                    >
                      {activitiesLoading ? (
                        <div className="w-4 h-4 border-2 border-[#FF8C00]/30 border-t-[#FF8C00] rounded-full animate-spin mx-auto" />
                      ) : (
                        "Load more"
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;