// src/pages/Dashboard.jsx
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AdminApiService from "../services/apiService";
import {
  FiTruck, FiArrowRight, FiActivity, FiClock,
  FiUserCheck, FiTruck as FiDelivery,
  FiAlertCircle, FiRefreshCw, FiEdit2, FiTrash2,
  FiCheckCircle, FiUserPlus, FiDollarSign, FiTrendingUp,
} from "react-icons/fi";
import { MdStorefront, MdOutlineSchool } from "react-icons/md";

/* ═══════════════════════════════════════════════════════════════
   UTILITIES  (unchanged from original)
═══════════════════════════════════════════════════════════════ */

const normalizeList = (result, type = "sellers") => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  const data = result?.data ?? result;
  if (Array.isArray(data)) return data;
  if (type === "delivery") {
    if (data?.all_options?.options && Array.isArray(data.all_options.options)) return data.all_options.options;
    if (data?.active_options?.options && Array.isArray(data.active_options.options)) return data.active_options.options;
    if (data?.inactive_options?.options && Array.isArray(data.inactive_options.options)) return data.inactive_options.options;
  }
  if (data?.sellers && Array.isArray(data.sellers)) return data.sellers;
  if (data?.applications && Array.isArray(data.applications)) return data.applications;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.results && Array.isArray(data.results)) return data.results;
  if (data?.delivery_options && Array.isArray(data.delivery_options)) return data.delivery_options;
  if (result?.pending && Array.isArray(result.pending)) return result.pending;
  if (result?.approved && Array.isArray(result.approved)) return result.approved;
  if (result?.sellers && Array.isArray(result.sellers)) return result.sellers;
  const values = Object.values(data);
  if (values.length > 0 && Array.isArray(values[0])) return values[0];
  return [];
};

/**
 * Parse revenue summary from any API shape.
 */
const parseRevenueSummary = (raw) => {
  if (!raw) return null;
  const d = raw.data ?? raw;
  return {
    total: Number(d.total_revenue ?? d.total ?? d.grand_total ?? 0),
    collected: Number(d.collected_revenue ?? d.collected ?? d.collected_amount ?? 0),
    pending: Number(d.pending_revenue ?? d.pending ?? d.pending_amount ?? 0),
  };
};

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n ?? 0);

/* ═══════════════════════════════════════════════════════════════
   STAT CARD  (unchanged)
═══════════════════════════════════════════════════════════════ */
const StatCard = ({ icon, label, value, sub, color, onClick, loading }) => (
  <div
    onClick={onClick}
    className={`rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-1 ${onClick ? "cursor-pointer" : ""}`}
    style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
  >
    <div className="flex items-start justify-between mb-5">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}
      >
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

/* ═══════════════════════════════════════════════════════════════
   REVENUE WIDGET  (new)
═══════════════════════════════════════════════════════════════ */
const RevenueWidget = ({ revenue, loading, error, onNavigate }) => {
  if (error) {
    return (
      <div
        className="rounded-3xl p-6 flex items-center gap-3 border"
        style={{ background: "#0d0d14", border: "1px solid rgba(239,68,68,0.15)" }}
      >
        <FiAlertCircle size={16} className="text-red-400/60 shrink-0" />
        <p className="text-sm text-white/30">Revenue data unavailable</p>
      </div>
    );
  }

  const total = revenue?.total ?? 0;
  const collected = revenue?.collected ?? 0;
  const pending = revenue?.pending ?? 0;
  const collectedPct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div
      className="rounded-3xl border overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-0.5 group"
      style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
      onClick={onNavigate}
    >
      {/* Top */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.2)" }}
          >
            <FiDollarSign size={20} className="text-[#FF8C00]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[2px] text-white/30">
              Platform Revenue
            </p>
            {loading ? (
              <div className="w-28 h-6 rounded-lg bg-white/5 animate-pulse mt-1" />
            ) : (
              <p className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
                {formatCurrency(total)}
              </p>
            )}
          </div>
        </div>
        <FiArrowRight size={14} className="text-white/20 mt-1 group-hover:text-[#FF8C00] transition-colors" />
      </div>

      {/* Progress bar */}
      {!loading && total > 0 && (
        <div className="px-6 mb-4">
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 5, background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${collectedPct}%`,
                background: "linear-gradient(90deg, #10B981, #34D399)",
              }}
            />
          </div>
          <p className="text-[10px] text-white/25 mt-1.5">
            {collectedPct}% collected
          </p>
        </div>
      )}

      {/* Split stats */}
      <div
        className="grid grid-cols-2 border-t"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="px-6 py-4 border-r" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <FiCheckCircle size={11} className="text-emerald-400" />
            <p className="text-[10px] font-black uppercase tracking-[1.5px] text-white/25">
              Collected
            </p>
          </div>
          {loading ? (
            <div className="w-20 h-5 rounded bg-white/5 animate-pulse" />
          ) : (
            <p className="text-sm font-black" style={{ color: "#10B981" }}>
              {formatCurrency(collected)}
            </p>
          )}
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center gap-1.5 mb-1">
            <FiClock size={11} className="text-amber-400" />
            <p className="text-[10px] font-black uppercase tracking-[1.5px] text-white/25">
              Pending
            </p>
          </div>
          {loading ? (
            <div className="w-20 h-5 rounded bg-white/5 animate-pulse" />
          ) : (
            <p className="text-sm font-black" style={{ color: "#F59E0B" }}>
              {formatCurrency(pending)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY HELPERS  (unchanged)
═══════════════════════════════════════════════════════════════ */
const getActionIcon = (action) => {
  const a = (action || "").toLowerCase();
  if (a.includes("seller") || a.includes("approve") || a.includes("reject"))
    return { icon: <MdStorefront size={14} />, color: "#FF8C00" };
  if (a.includes("delivery"))
    return { icon: <FiDelivery size={14} />, color: "#0EA5E9" };
  if (a.includes("school"))
    return { icon: <MdOutlineSchool size={14} />, color: "#10B981" };
  if (a.includes("admin") || a.includes("invitation"))
    return { icon: <FiUserPlus size={14} />, color: "#8B5CF6" };
  if (a.includes("login") || a.includes("logout"))
    return { icon: <FiUserCheck size={14} />, color: "#6B7280" };
  if (a.includes("create"))
    return { icon: <FiCheckCircle size={14} />, color: "#10B981" };
  if (a.includes("update") || a.includes("edit"))
    return { icon: <FiEdit2 size={14} />, color: "#3B82F6" };
  if (a.includes("delete") || a.includes("deactivate"))
    return { icon: <FiTrash2 size={14} />, color: "#EF4444" };
  return { icon: <FiActivity size={14} />, color: "#6B7280" };
};

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const diffMs = new Date() - date;
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
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}
      >
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

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { admin } = useContext(AuthContext);
  const navigate = useNavigate();
  const displayName = admin?.full_name || admin?.first_name || "Admin";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const isSuperAdmin = admin?.email === "voltsourceinnovations@gmail.com";

  // Platform counts
  const [counts, setCounts] = useState({
    pending: null,
    approved: null,
    deliveryOptions: null,
    activeDeliveryOptions: null,
  });
  const [loading, setLoading] = useState(true);

  // Revenue
  const [revenue, setRevenue] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState("");

  // Activity
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState("");
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityHasMore, setActivityHasMore] = useState(false);

  /* ── fetch platform counts ─────────────────────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pendingSellers, approvedSellers, deliveryOptions] = await Promise.all([
          AdminApiService.getPendingSellers(),
          AdminApiService.getApprovedSellers(),
          AdminApiService.getAllDeliveryOptions(),
        ]);
        const pendingList = normalizeList(pendingSellers);
        const approvedList = normalizeList(approvedSellers);
        const deliveryArr = normalizeList(deliveryOptions, "delivery");
        setCounts({
          pending: pendingList.length,
          approved: approvedList.length,
          deliveryOptions: deliveryArr.length,
          activeDeliveryOptions: deliveryArr.filter((o) => o.is_available === true).length,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard counts:", err);
        setCounts({ pending: "—", approved: "—", deliveryOptions: "—", activeDeliveryOptions: "—" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── fetch revenue summary ─────────────────────────────── */
  useEffect(() => {
    (async () => {
      setRevenueLoading(true);
      setRevenueError("");
      try {
        const raw = await AdminApiService.getRevenueSummary();
        setRevenue(parseRevenueSummary(raw));
      } catch (err) {
        console.error("Failed to fetch revenue summary:", err);
        setRevenueError(err.message || "Failed to load revenue");
      } finally {
        setRevenueLoading(false);
      }
    })();
  }, []);

  /* ── fetch activities ──────────────────────────────────── */
  const fetchActivities = async (page = 1) => {
    setActivitiesLoading(true);
    setActivitiesError("");
    try {
      const response = await AdminApiService.getActivityLogs({
        page,
        pageSize: 10,
        days: 30,
        adminId: !isSuperAdmin ? admin?.id : null,
      });
      const logsData = response?.data || response;
      const logs = logsData?.logs || logsData?.items || logsData?.data || [];
      const total = logsData?.total || logsData?.total_count || logs.length;
      if (page === 1) setActivities(logs);
      else setActivities((prev) => [...prev, ...logs]);
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

  useEffect(() => { fetchActivities(1); }, []);

  const loadMoreActivities = () => {
    if (!activitiesLoading && activityHasMore) fetchActivities(activityPage + 1);
  };

  const quickActions = [
    { label: "Review Pending Sellers", sub: "Approve or reject new applications", icon: <MdStorefront size={20} />, color: "#FF8C00", to: "/sellers" },
    { label: "Manage Delivery Options", sub: "Configure pricing & availability", icon: <FiTruck size={20} />, color: "#0EA5E9", to: "/delivery" },
    { label: "Revenue Insights", sub: "View collected and pending earnings", icon: <FiDollarSign size={20} />, color: "#10B981", to: "/revenue" },
  ];
  if (isSuperAdmin) {
    quickActions.push({ label: "View Activity Logs", sub: "See all admin actions", icon: <FiActivity size={20} />, color: "#8B5CF6", to: "/activity-logs" });
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Greeting banner */}
      <div
        className="rounded-3xl p-8 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0d0d14 0%,#100a0a 50%,#1a0505 100%)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(180,34,37,0.15),transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "28px 28px" }}
        />
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

      {/* ── Platform Overview stat cards ─────────────────────── */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-[2px] text-white/30 mb-4">
          Platform Overview
        </h2>
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

      {/* ── Revenue Widget (full-width) ──────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-[2px] text-white/30">
            Revenue Summary
          </h2>
          <button
            onClick={() => navigate("/revenue")}
            className="text-xs font-bold text-[#FF8C00] hover:underline transition-colors flex items-center gap-1"
          >
            Full Report <FiArrowRight size={12} />
          </button>
        </div>
        <RevenueWidget
          revenue={revenue}
          loading={revenueLoading}
          error={revenueError}
          onNavigate={() => navigate("/revenue")}
        />
      </div>

      {/* ── Quick Actions + Activity ─────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-black uppercase tracking-[2px] text-white/30 mb-4">
            Quick Actions
          </h2>
          <div className="grid gap-4">
            {quickActions.map(({ label, sub, icon, color, to }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex items-center gap-4 p-5 rounded-3xl border text-left transition-all duration-300 hover:-translate-y-1 group"
                style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `${color}15`, border: `1px solid ${color}25`, color }}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white group-hover:text-[#FF8C00] transition-colors">
                    {label}
                  </p>
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

          <div
            className="rounded-3xl border"
            style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
          >
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
                  {[1, 2, 3, 4, 5].map((i) => (
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
                  <button onClick={() => fetchActivities(1)} className="mt-3 text-xs text-[#FF8C00] hover:underline">
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