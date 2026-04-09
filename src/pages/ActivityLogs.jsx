// src/pages/ActivityLogs.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import ApiService from "../services/apiService";
import {
  FiActivity, FiClock, FiRefreshCw, FiAlertCircle, FiSearch,
  FiChevronLeft, FiChevronRight, FiFilter, FiX, FiShield,
  FiUserCheck, FiTruck, FiShoppingBag, FiEdit2, FiTrash2,
  FiCheckCircle, FiXCircle, FiUserPlus, FiMail, FiLogIn, FiLogOut,
} from "react-icons/fi";
import { MdStorefront, MdOutlineSchool } from "react-icons/md";

// Helper to get action icon and color
const getActionIcon = (action) => {
  const actionLower = (action || "").toLowerCase();
  if (actionLower.includes("seller") || actionLower.includes("approve") || actionLower.includes("reject")) {
    return { icon: <MdStorefront size={16} />, color: "#FF8C00", bg: "rgba(255,140,0,0.1)" };
  }
  if (actionLower.includes("delivery")) {
    return { icon: <FiTruck size={16} />, color: "#0EA5E9", bg: "rgba(14,165,233,0.1)" };
  }
  if (actionLower.includes("school")) {
    return { icon: <MdOutlineSchool size={16} />, color: "#10B981", bg: "rgba(16,185,129,0.1)" };
  }
  if (actionLower.includes("admin") || actionLower.includes("invitation")) {
    return { icon: <FiUserPlus size={16} />, color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" };
  }
  if (actionLower.includes("login")) {
    return { icon: <FiLogIn size={16} />, color: "#6B7280", bg: "rgba(107,114,128,0.1)" };
  }
  if (actionLower.includes("logout")) {
    return { icon: <FiLogOut size={16} />, color: "#6B7280", bg: "rgba(107,114,128,0.1)" };
  }
  if (actionLower.includes("create")) {
    return { icon: <FiCheckCircle size={16} />, color: "#10B981", bg: "rgba(16,185,129,0.1)" };
  }
  if (actionLower.includes("update") || actionLower.includes("edit")) {
    return { icon: <FiEdit2 size={16} />, color: "#3B82F6", bg: "rgba(59,130,246,0.1)" };
  }
  if (actionLower.includes("delete") || actionLower.includes("deactivate")) {
    return { icon: <FiTrash2 size={16} />, color: "#EF4444", bg: "rgba(239,68,68,0.1)" };
  }
  return { icon: <FiActivity size={16} />, color: "#6B7280", bg: "rgba(107,114,128,0.1)" };
};

// Helper to format date
const formatDate = (dateString) => {
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
  
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ActivityLogRow = ({ log, showAdminInfo = true }) => {
  const { icon, color, bg } = getActionIcon(log.action);
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 py-4 border-b border-white/5 hover:bg-white/5 transition-colors px-4 sm:px-6 rounded-xl">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 self-start"
        style={{ background: bg, border: `1px solid ${color}25` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-1 sm:gap-2">
          <p className="text-sm font-bold text-white wrap-break-word">
            {log.action || "Unknown action"}
          </p>
          <span className="text-[11px] text-white/30 flex items-center gap-1 shrink-0">
            <FiClock size={11} /> {formatDate(log.created_at)}
          </span>
        </div>
        <p className="text-sm text-white/50 mt-1 wrap-break-word">
          {log.description || `${log.action} performed`}
        </p>
        {showAdminInfo && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-white/30">
            {log.admin_name && (
              <span className="truncate">👤 {log.admin_name}</span>
            )}
            {log.admin_email && (
              <span className="truncate">📧 {log.admin_email}</span>
            )}
            {log.ip_address && (
              <span>🌐 IP: {log.ip_address}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const FilterBar = ({ filters, onFilterChange, onClearFilters, isSuperAdmin }) => {
  const actionOptions = [
    { value: "", label: "All Actions" },
    { value: "seller", label: "Sellers" },
    { value: "delivery", label: "Delivery" },
    { value: "school", label: "Schools" },
    { value: "admin", label: "Admins" },
    { value: "invitation", label: "Invitations" },
    { value: "login", label: "Login/Logout" },
  ];

  const dayOptions = [
    { value: 7, label: "Last 7 days" },
    { value: 14, label: "Last 14 days" },
    { value: 30, label: "Last 30 days" },
    { value: 60, label: "Last 60 days" },
    { value: 90, label: "Last 90 days" },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="flex-1 flex items-center gap-2 rounded-xl border px-3 sm:px-4 py-2.5"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <FiSearch size={15} className="text-white/30 shrink-0" />
        <input
          type="text"
          placeholder="Search by action or description..."
          value={filters.action || ""}
          onChange={(e) => onFilterChange("action", e.target.value)}
          className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20 min-w-0"
        />
        {filters.action && (
          <button onClick={() => onFilterChange("action", "")} className="text-white/30 hover:text-white/60 shrink-0">
            <FiX size={14} />
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap sm:flex-nowrap gap-2">
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 flex-1 sm:flex-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <FiFilter size={13} className="text-white/30 shrink-0" />
          <select
            value={filters.actionFilter || ""}
            onChange={(e) => onFilterChange("actionFilter", e.target.value)}
            className="text-sm text-white outline-none bg-transparent cursor-pointer w-full sm:w-auto"
          >
            {actionOptions.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-[#0d0d14]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 flex-1 sm:flex-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <FiClock size={13} className="text-white/30 shrink-0" />
          <select
            value={filters.days || 30}
            onChange={(e) => onFilterChange("days", parseInt(e.target.value))}
            className="text-sm text-white outline-none bg-transparent cursor-pointer w-full sm:w-auto"
          >
            {dayOptions.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-[#0d0d14]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {(filters.action || filters.actionFilter || filters.days !== 30) && (
          <button
            onClick={onClearFilters}
            className="px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors shrink-0"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

const ActivityLogs = () => {
  const { admin } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    action: "",
    actionFilter: "",
    days: 30,
  });

  // Role-based access
  const isSuperAdmin = admin?.email === "voltsourceinnovations@gmail.com";
  const adminId = admin?.id || null;

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      let actionParam = filters.action || filters.actionFilter;
      if (filters.action && filters.actionFilter) {
        actionParam = `${filters.actionFilter},${filters.action}`;
      } else if (filters.actionFilter) {
        actionParam = filters.actionFilter;
      }
      
      const response = await ApiService.getActivityLogs({
        page,
        pageSize: pagination.pageSize,
        action: actionParam || null,
        days: filters.days,
        adminId: !isSuperAdmin ? adminId : null,
      });
      
      const logsData = response?.data || response;
      let logsArray = logsData?.logs || logsData?.items || logsData?.data || [];
      const total = logsData?.total || logsData?.total_count || logsArray.length;
      const totalPages = Math.ceil(total / pagination.pageSize);
      
      setLogs(logsArray);
      setPagination({
        ...pagination,
        page,
        total,
        totalPages,
      });
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
      setError(err.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      action: "",
      actionFilter: "",
      days: 30,
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLogs(newPage);
    }
  };

  const sellerActions = logs.filter(l => (l.action || "").toLowerCase().includes("seller")).length;
  const deliveryActions = logs.filter(l => (l.action || "").toLowerCase().includes("delivery")).length;
  const adminActions = logs.filter(l => (l.action || "").toLowerCase().includes("admin")).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header with Role Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
            Activity Logs
          </h1>
          <p className="text-xs sm:text-sm text-white/30 mt-0.5">
            Track all administrative actions across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isSuperAdmin && (
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#3B82F6" }}>
              <FiShield size={12} />
              <span className="hidden sm:inline">Limited View</span>
            </div>
          )}
          {isSuperAdmin && (
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium"
              style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.2)", color: "#FF8C00" }}>
              <FiShield size={12} />
              <span className="hidden sm:inline">Full Access</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Info Banner for Normal Admins */}
      {!isSuperAdmin && (
        <div className="rounded-xl p-3 sm:p-4" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <div className="flex items-start gap-2 sm:gap-3">
            <FiShield size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-400">Limited Access Mode</p>
              <p className="text-[11px] sm:text-xs text-white/40 mt-0.5">
                You are viewing only your own activity logs. Super Admins have access to all admin activities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-xl p-3 sm:p-4 border border-white/5" style={{ background: "#0d0d14" }}>
          <p className="text-xl sm:text-2xl font-black text-white">{pagination.total}</p>
          <p className="text-[10px] sm:text-xs text-white/40 mt-1">
            {isSuperAdmin ? "Total Activities" : "Your Activities"}
          </p>
        </div>
        <div className="rounded-xl p-3 sm:p-4 border border-white/5" style={{ background: "#0d0d14" }}>
          <p className="text-xl sm:text-2xl font-black text-[#FF8C00]">{sellerActions}</p>
          <p className="text-[10px] sm:text-xs text-white/40 mt-1">Seller Actions</p>
        </div>
        <div className="rounded-xl p-3 sm:p-4 border border-white/5" style={{ background: "#0d0d14" }}>
          <p className="text-xl sm:text-2xl font-black text-[#0EA5E9]">{deliveryActions}</p>
          <p className="text-[10px] sm:text-xs text-white/40 mt-1">Delivery Actions</p>
        </div>
        <div className="rounded-xl p-3 sm:p-4 border border-white/5" style={{ background: "#0d0d14" }}>
          <p className="text-xl sm:text-2xl font-black text-[#8B5CF6]">{adminActions}</p>
          <p className="text-[10px] sm:text-xs text-white/40 mt-1">Admin Actions</p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-white/60 hover:text-white transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Activity Logs List */}
      {loading && logs.length === 0 ? (
        <div className="rounded-2xl border border-white/5 p-6 sm:p-8" style={{ background: "#0d0d14" }}>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-white/5 rounded animate-pulse w-1/2 sm:w-1/3 mb-2" />
                  <div className="h-3 bg-white/5 rounded animate-pulse w-3/4 sm:w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border p-8 sm:p-12 text-center" style={{ background: "#0d0d14", borderColor: "rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={40} className="text-red-400/50 mx-auto mb-3" />
          <p className="text-sm sm:text-base text-white/60">{error}</p>
          <button
            onClick={() => fetchLogs(1)}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#B42225] hover:bg-[#9e1e20] transition"
          >
            Try Again
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-white/5 p-8 sm:p-12 text-center" style={{ background: "#0d0d14" }}>
          <FiActivity size={48} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm sm:text-base text-white/40 font-medium">No activity logs found</p>
          <p className="text-xs sm:text-sm text-white/20 mt-1">
            {!isSuperAdmin 
              ? "You haven't performed any actions yet. Activities will appear here as you use the platform."
              : "Try adjusting your filters or check back later"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "#0d0d14" }}>
            <div className="divide-y divide-white/5">
              {logs.map((log, index) => (
                <ActivityLogRow 
                  key={log.id || index} 
                  log={log} 
                  showAdminInfo={isSuperAdmin}
                />
              ))}
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 sm:gap-2 pt-4">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <FiChevronLeft size={14} />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition ${
                        pagination.page === pageNum
                          ? "text-white"
                          : "text-white/40 hover:text-white/60"
                      }`}
                      style={pagination.page === pageNum ? { background: "linear-gradient(135deg,#B42225,#FF8C00)" } : {}}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityLogs;