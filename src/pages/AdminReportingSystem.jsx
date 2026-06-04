import { useState, useEffect, useCallback } from "react";
import ApiService from "../services/apiService";
import {
  FiFlag,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiUser,
  FiPackage,
  FiBriefcase,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiEye,
  FiMessageSquare,
  FiClock,
  FiThumbsUp,
  FiThumbsDown,
  FiShield,
  FiBarChart2,
  FiUsers,
  FiShoppingBag,
  FiMapPin,
  FiCalendar,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import { MdWarning, MdReportProblem } from "react-icons/md";

/* ─────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
───────────────────────────────────────────────────────────── */

const REPORT_STATUS = {
  open: { label: "Open", color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: FiAlertCircle },
  resolved: { label: "Resolved", color: "#10B981", bg: "rgba(16,185,129,0.1)", icon: FiCheckCircle },
  dismissed: { label: "Dismissed", color: "#6B7280", bg: "rgba(107,114,128,0.1)", icon: FiXCircle },
};

const REPORT_TYPES = {
  seller: { label: "Seller Reports", icon: FiUser, color: "#3B82F6" },
  provider: { label: "Provider Reports", icon: FiBriefcase, color: "#8B5CF6" },
  product: { label: "Product Reports", icon: FiPackage, color: "#F59E0B" },
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

const truncateText = (text, maxLength = 120) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/* ─────────────────────────────────────────────────────────────
   STATS CARD COMPONENT (Mobile Optimized)
───────────────────────────────────────────────────────────── */
const StatsCard = ({ title, value, icon: Icon, color, onClick, active }) => (
  <div
    onClick={onClick}
    className={`rounded-xl p-3 border transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
      active ? "ring-2 ring-offset-2 ring-offset-[#0d0d14]" : ""
    }`}
    style={{
      background: active ? `${color}10` : "#0d0d14",
      border: active ? `1px solid ${color}50` : "1px solid rgba(255,255,255,0.05)",
      boxShadow: active ? `0 2px 8px ${color}20` : "none",
    }}
  >
    <div className="flex items-center justify-between mb-1.5">
      <Icon size={16} style={{ color }} />
      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/30">
        {title}
      </span>
    </div>
    <p className="text-xl sm:text-2xl font-black" style={{ color }}>
      {value}
    </p>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   REPORT CARD COMPONENT (Mobile Optimized)
───────────────────────────────────────────────────────────── */
const ReportCard = ({ report, type, onResolve, onDismiss, onViewDetails, actionLoading }) => {
  const status = REPORT_STATUS[report.status] || REPORT_STATUS.open;
  const StatusIcon = status.icon;
  const isOpen = report.status === "open";
  const isLoading = actionLoading === report.id;

  const renderReportContent = () => {
    switch (type) {
      case "seller":
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <FiUser size={12} className="text-white/40 shrink-0" />
              <span className="text-xs sm:text-sm text-white/80 font-medium truncate">
                {report.seller?.business_name || report.seller?.full_name || "Unknown Seller"}
              </span>
            </div>
            {report.seller?.email && (
              <div className="flex items-center gap-1.5">
                <FiMail size={10} className="text-white/30 shrink-0" />
                <span className="text-[10px] sm:text-xs text-white/40 truncate">
                  {report.seller.email}
                </span>
              </div>
            )}
            <p className="text-xs sm:text-sm text-white/60 mt-2 border-l-2 border-red-500/30 pl-2 leading-relaxed">
              {truncateText(report.reason, 120)}
            </p>
          </div>
        );
      case "provider":
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <FiBriefcase size={12} className="text-white/40 shrink-0" />
              <span className="text-xs sm:text-sm text-white/80 font-medium truncate">
                {report.provider?.business_name || report.provider?.name || "Unknown Provider"}
              </span>
            </div>
            {report.provider?.service_type && (
              <div className="flex items-center gap-1.5">
                <FiMapPin size={10} className="text-white/30 shrink-0" />
                <span className="text-[10px] sm:text-xs text-white/40 truncate">
                  {report.provider.service_type}
                </span>
              </div>
            )}
            <p className="text-xs sm:text-sm text-white/60 mt-2 border-l-2 border-purple-500/30 pl-2 leading-relaxed">
              {truncateText(report.reason, 120)}
            </p>
          </div>
        );
      case "product":
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <FiPackage size={12} className="text-white/40 shrink-0" />
              <span className="text-xs sm:text-sm text-white/80 font-medium truncate">
                {report.product?.name || "Unknown Product"}
              </span>
            </div>
            {report.product?.price && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-[10px] sm:text-xs text-white/40">
                  ₦{report.product.price.toLocaleString()}
                </span>
                <span className="text-white/20 text-[8px] sm:text-[9px]">•</span>
                <span className="text-[10px] sm:text-xs text-white/40 truncate">
                  Seller: {report.seller?.business_name || "Unknown"}
                </span>
              </div>
            )}
            <p className="text-xs sm:text-sm text-white/60 mt-2 border-l-2 border-amber-500/30 pl-2 leading-relaxed">
              {truncateText(report.reason, 120)}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="group rounded-xl transition-all duration-300 active:scale-[0.99] overflow-hidden"
      style={{
        background: "#0d0d14",
        border: `1px solid ${isOpen ? status.color + "30" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {/* Status Bar */}
      <div className="h-0.5 w-full" style={{ background: status.color }} />

      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: status.bg }}
            >
              <StatusIcon size={12} style={{ color: status.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: status.bg, color: status.color }}
                >
                  {status.label}
                </span>
                <span className="text-[9px] sm:text-[10px] text-white/30 flex items-center gap-0.5">
                  <FiClock size={8} />
                  {getRelativeTime(report.created_at)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onViewDetails(report)}
            className="text-white/30 hover:text-white transition p-1.5 -mt-1 -mr-1 shrink-0"
            title="View Details"
          >
            <FiEye size={14} />
          </button>
        </div>

        {/* Report Content */}
        {renderReportContent()}

        {/* Reporter Info */}
        {report.reporter && (
          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[9px] sm:text-[10px] text-white/30">
            <FiFlag size={8} />
            <span className="truncate">
              Reported by: {report.reporter.email || report.reporter.username || "Anonymous"}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {isOpen && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onResolve(report)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-40"
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "#10B981",
              }}
            >
              {isLoading ? (
                <FiLoader size={10} className="animate-spin" />
              ) : (
                <FiThumbsUp size={11} />
              )}
              Resolve
            </button>
            <button
              onClick={() => onDismiss(report)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-40"
              style={{
                background: "rgba(107,114,128,0.1)",
                border: "1px solid rgba(107,114,128,0.3)",
                color: "#9CA3AF",
              }}
            >
              {isLoading ? (
                <FiLoader size={10} className="animate-spin" />
              ) : (
                <FiThumbsDown size={11} />
              )}
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   DETAIL MODAL (Mobile Optimized)
───────────────────────────────────────────────────────────── */
const ReportDetailModal = ({ report, type, onClose, onResolve, onDismiss, actionLoading }) => {
  if (!report) return null;

  const status = REPORT_STATUS[report.status] || REPORT_STATUS.open;
  const StatusIcon = status.icon;
  const isOpen = report.status === "open";
  const isLoading = actionLoading === report.id;

  const renderDetailedContent = () => {
    switch (type) {
      case "seller":
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-1">
                  Seller Info
                </p>
                <p className="text-xs sm:text-sm font-medium text-white wrap-break-word">
                  {report.seller?.business_name || "N/A"}
                </p>
                <p className="text-[10px] sm:text-xs text-white/40 mt-1 wrap-break-word">
                  {report.seller?.email || "No email"}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-1">
                  Contact
                </p>
                <p className="text-[10px] sm:text-xs text-white/60 wrap-break-word">
                  {report.seller?.phone || "No phone"}
                </p>
                <p className="text-[9px] sm:text-[10px] text-white/40 mt-1 wrap-break-word">
                  ID: {report.seller?.id || "N/A"}
                </p>
              </div>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 sm:p-4">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-red-400 mb-2">
                Report Reason
              </p>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed wrap-break-word">
                {report.reason}
              </p>
            </div>
            {report.evidence && report.evidence.length > 0 && (
              <div>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-2">
                  Evidence ({report.evidence.length})
                </p>
                <div className="space-y-1.5">
                  {report.evidence.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-2 text-[10px] sm:text-xs text-white/40 wrap-break-word">
                      {typeof item === "string" ? truncateText(item, 100) : JSON.stringify(item).slice(0, 100)}
                    </div>
                  ))}
                  {report.evidence.length > 3 && (
                    <p className="text-[9px] sm:text-[10px] text-white/30 text-center">
                      +{report.evidence.length - 3} more items
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case "provider":
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-1">
                  Provider Info
                </p>
                <p className="text-xs sm:text-sm font-medium text-white wrap-break-word">
                  {report.provider?.business_name || "N/A"}
                </p>
                <p className="text-[10px] sm:text-xs text-white/40 mt-1 wrap-break-word">
                  {report.provider?.service_type || "No service type"}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-1">
                  Location
                </p>
                <p className="text-[10px] sm:text-xs text-white/60 wrap-break-word">
                  {report.provider?.location || "No location"}
                </p>
              </div>
            </div>
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 sm:p-4">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-400 mb-2">
                Report Reason
              </p>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed wrap-break-word">
                {report.reason}
              </p>
            </div>
          </div>
        );
      case "product":
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-1">
                  Product Info
                </p>
                <p className="text-xs sm:text-sm font-medium text-white wrap-break-word">
                  {report.product?.name || "N/A"}
                </p>
                <p className="text-[10px] sm:text-xs text-white/40 mt-1 wrap-break-word">
                  ₦{report.product?.price?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-1">
                  Seller
                </p>
                <p className="text-[10px] sm:text-xs text-white/60 wrap-break-word">
                  {report.seller?.business_name || "Unknown"}
                </p>
                <p className="text-[9px] sm:text-[10px] text-white/40 mt-1 wrap-break-word">
                  {report.seller?.email || "No email"}
                </p>
              </div>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 sm:p-4">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-400 mb-2">
                Report Reason
              </p>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed wrap-break-word">
                {report.reason}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl border flex flex-col animate-slide-up sm:animate-none"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b shrink-0 sticky top-0 bg-[#0d0d14] z-10"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: status.bg }}>
              <StatusIcon size={16} style={{ color: status.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-black text-white truncate" style={{ fontFamily: "'Playfair Display',serif" }}>
                Report Details
              </h3>
              <p className="text-[10px] sm:text-xs text-white/30 truncate">
                {type.toUpperCase()} • {status.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition shrink-0"
          >
            <FiXCircle size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
          {renderDetailedContent()}

          {/* Admin Notes */}
          {report.admin_notes && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 sm:p-4">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-blue-400 mb-2">
                Admin Notes
              </p>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed wrap-break-word">
                {report.admin_notes}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white/5 rounded-lg p-3 sm:p-4">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-3">
              Timeline
            </p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: status.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-white/60">Report Created</p>
                  <p className="text-[9px] sm:text-[10px] text-white/30 wrap-break-word">{formatDate(report.created_at)}</p>
                </div>
              </div>
              {report.resolved_at && (
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-green-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-white/60">Resolved</p>
                    <p className="text-[9px] sm:text-[10px] text-white/30 wrap-break-word">{formatDate(report.resolved_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {isOpen && (
          <div
            className="flex gap-2 sm:gap-3 px-4 py-3 sm:px-6 sm:py-4 border-t shrink-0 sticky bottom-0 bg-[#0d0d14]"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => {
                onResolve(report);
                onClose();
              }}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "white",
              }}
            >
              {isLoading ? <FiLoader size={14} className="animate-spin" /> : <FiCheckCircle size={14} />}
              Resolve
            </button>
            <button
              onClick={() => {
                onDismiss(report);
                onClose();
              }}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50"
              style={{
                background: "rgba(107,114,128,0.2)",
                border: "1px solid rgba(107,114,128,0.3)",
                color: "#9CA3AF",
              }}
            >
              {isLoading ? <FiLoader size={14} className="animate-spin" /> : <FiXCircle size={14} />}
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   AUDIT SUMMARY COMPONENT (Mobile Optimized)
───────────────────────────────────────────────────────────── */
const AuditSummary = ({ summary, onViewSellerReports }) => {
  if (!summary || summary.length === 0) {
    return (
      <div className="rounded-xl p-6 text-center border" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
        <FiShield size="28" className="text-white/10 mx-auto mb-2" />
        <p className="text-xs sm:text-sm text-white/30">No repeat offender data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs sm:text-sm font-black text-white/80 flex items-center gap-1.5">
          <FiBarChart2 size={12} className="text-[#FF8C00]" />
          Repeat Offenders Summary
        </h3>
        <span className="text-[8px] sm:text-[9px] text-white/30">{summary.length} sellers with reports</span>
      </div>
      <div className="space-y-1.5">
        {summary.slice(0, 5).map((seller, idx) => (
          <div
            key={seller.seller_id || idx}
            className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all active:scale-[0.99] hover:bg-white/5"
            onClick={() => onViewSellerReports(seller.seller_id)}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-white truncate">
                {seller.seller_business_name || seller.seller_name || "Unknown Seller"}
              </p>
              <p className="text-[8px] sm:text-[9px] text-white/30 truncate">
                {seller.seller_email || "No email"}
              </p>
            </div>
            <div className="text-right ml-2 shrink-0">
              <p className="text-base sm:text-lg font-black" style={{ color: seller.total_reports > 3 ? "#EF4444" : "#F59E0B" }}>
                {seller.total_reports}
              </p>
              <p className="text-[7px] sm:text-[8px] text-white/30">reports</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE (Mobile Optimized)
───────────────────────────────────────────────────────────── */
const AdminReportingSystem = () => {
  const [activeTab, setActiveTab] = useState("seller");
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [toast, setToast] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Reduced for mobile

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      const status = statusFilter === "all" ? null : statusFilter;
      
      switch (activeTab) {
        case "seller":
          response = await ApiService.getSellerReports(status);
          break;
        case "provider":
          response = await ApiService.getProviderReports(status);
          break;
        case "product":
          response = await ApiService.getProductReports(status);
          break;
        default:
          response = { data: [] };
      }
      
      const reportsData = response?.data || response || [];
      setReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (err) {
      console.error("fetchReports error:", err);
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await ApiService.getSellerReportSummary();
      const summaryData = response?.data || response;
      setSummary(Array.isArray(summaryData) ? summaryData : []);
    } catch (err) {
      console.error("fetchSummary error:", err);
      setSummary([]);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    if (activeTab === "seller") {
      fetchSummary();
    }
  }, [fetchReports, fetchSummary, activeTab]);

  const handleResolve = async (report) => {
    setActionLoading(report.id);
    try {
      switch (activeTab) {
        case "seller":
          await ApiService.resolveSellerReport(report.id, "resolved", "Resolved by admin");
          break;
        case "provider":
          await ApiService.resolveProviderReport(report.id, "resolved", "Resolved by admin");
          break;
        case "product":
          await ApiService.resolveProductReport(report.id, "resolved", "Resolved by admin");
          break;
      }
      showToast("Report resolved successfully!");
      await fetchReports();
      if (activeTab === "seller") await fetchSummary();
    } catch (err) {
      showToast(err.message || "Failed to resolve report", "error");
    } finally {
      setActionLoading(null);
      setSelectedReport(null);
    }
  };

  const handleDismiss = async (report) => {
    setActionLoading(report.id);
    try {
      switch (activeTab) {
        case "seller":
          await ApiService.resolveSellerReport(report.id, "dismissed", "Dismissed by admin");
          break;
        case "provider":
          await ApiService.resolveProviderReport(report.id, "dismissed", "Dismissed by admin");
          break;
        case "product":
          await ApiService.resolveProductReport(report.id, "dismissed", "Dismissed by admin");
          break;
      }
      showToast("Report dismissed!");
      await fetchReports();
      if (activeTab === "seller") await fetchSummary();
    } catch (err) {
      showToast(err.message || "Failed to dismiss report", "error");
    } finally {
      setActionLoading(null);
      setSelectedReport(null);
    }
  };

  const handleViewSellerReports = (sellerId) => {
    setActiveTab("product");
    showToast(`Viewing products for seller ID: ${sellerId}`, "info");
  };

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    switch (activeTab) {
      case "seller":
        return report.seller?.business_name?.toLowerCase().includes(searchLower) ||
               report.seller?.email?.toLowerCase().includes(searchLower) ||
               report.reason?.toLowerCase().includes(searchLower);
      case "provider":
        return report.provider?.business_name?.toLowerCase().includes(searchLower) ||
               report.reason?.toLowerCase().includes(searchLower);
      case "product":
        return report.product?.name?.toLowerCase().includes(searchLower) ||
               report.seller?.business_name?.toLowerCase().includes(searchLower) ||
               report.reason?.toLowerCase().includes(searchLower);
      default:
        return true;
    }
  });

  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const stats = {
    total: reports.length,
    open: reports.filter(r => r.status === "open").length,
    resolved: reports.filter(r => r.status === "resolved").length,
    dismissed: reports.filter(r => r.status === "dismissed").length,
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-4 pb-6 sm:pb-8">
      {/* Toast - Mobile Optimized */}
      {toast && (
        <div
          className="fixed top-4 left-3 right-3 sm:left-auto sm:right-4 z-50 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold animate-slide-in sm:max-w-sm"
          style={{
            background: toast.type === "error" ? "rgba(239,68,68,0.95)" : 
                       toast.type === "info" ? "rgba(59,130,246,0.95)" : "rgba(16,185,129,0.95)",
            border: `1px solid ${toast.type === "error" ? "#EF4444" : 
                                   toast.type === "info" ? "#3B82F6" : "#10B981"}`,
            color: "white",
            backdropFilter: "blur(12px)",
            zIndex: 9999,
          }}
        >
          {toast.type === "error" ? <FiAlertCircle size={14} /> : 
           toast.type === "info" ? <FiAlertCircle size={14} /> : <FiCheckCircle size={14} />}
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="text-white/70 hover:text-white">
            <FiXCircle size={14} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          type={activeTab}
          onClose={() => setSelectedReport(null)}
          onResolve={handleResolve}
          onDismiss={handleDismiss}
          actionLoading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display',serif" }}>
            <MdReportProblem size={22} className="text-[#FF8C00]" />
            Reports Management
          </h1>
          <p className="text-xs sm:text-sm text-white/30 mt-0.5">
            Manage and resolve user-reported issues
          </p>
        </div>
        <button
          onClick={() => { fetchReports(); fetchSummary(); }}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all active:scale-95 disabled:opacity-40 w-full xs:w-auto"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards - Grid optimized for mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <StatsCard
          title="Total"
          value={stats.total}
          icon={MdWarning}
          color="#6B7280"
        />
        <StatsCard
          title="Open"
          value={stats.open}
          icon={FiAlertCircle}
          color="#EF4444"
        />
        <StatsCard
          title="Resolved"
          value={stats.resolved}
          icon={FiCheckCircle}
          color="#10B981"
        />
        <StatsCard
          title="Dismissed"
          value={stats.dismissed}
          icon={FiXCircle}
          color="#6B7280"
        />
      </div>

      {/* Tabs - Scrollable on mobile */}
      <div className="overflow-x-auto -mx-3 px-3 pb-1">
        <div className="flex gap-1 sm:gap-2 border-b border-white/10 min-w-max">
          {Object.entries(REPORT_TYPES).map(([key, { label, icon: Icon, color }]) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setCurrentPage(1); setStatusFilter("all"); }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-t-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === key
                  ? "text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
              style={{
                borderBottom: activeTab === key ? `2px solid ${color}` : "2px solid transparent",
                color: activeTab === key ? color : undefined,
              }}
            >
              <Icon size={12} />
              <span className="hidden xs:inline">{label}</span>
              <span className="xs:hidden">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters - Stack on mobile */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-3 py-2 focus-within:border-[#FF8C00]/40 transition-all">
          <FiSearch size={12} className="text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="flex-1 text-xs text-white outline-none bg-transparent placeholder-white/20 min-w-0"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-white/30 hover:text-white transition p-0.5">
              <FiXCircle size={12} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="flex-1 sm:flex-none rounded-xl border border-white/8 bg-[#1a1a24] px-3 py-2 text-xs text-white outline-none focus:border-[#FF8C00]/50 transition-all"
            style={{ backgroundColor: "#1a1a24", color: "white" }}
          >
            <option value="all" style={{ backgroundColor: "#1a1a24", color: "white" }}>All Status</option>
            <option value="open" style={{ backgroundColor: "#1a1a24", color: "white" }}>Open</option>
            <option value="resolved" style={{ backgroundColor: "#1a1a24", color: "white" }}>Resolved</option>
            <option value="dismissed" style={{ backgroundColor: "#1a1a24", color: "white" }}>Dismissed</option>
          </select>

          {(statusFilter !== "all" || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all whitespace-nowrap"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Audit Summary (only for seller tab) */}
      {activeTab === "seller" && summary && summary.length > 0 && (
        <div className="rounded-xl p-3 sm:p-4 border" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
          <AuditSummary summary={summary} onViewSellerReports={handleViewSellerReports} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={12} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {/* Reports Grid - Single column on mobile, 2 on tablet */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl animate-pulse" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", height: "260px" }} />
          ))}
        </div>
      ) : paginatedReports.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {paginatedReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                type={activeTab}
                onResolve={handleResolve}
                onDismiss={handleDismiss}
                onViewDetails={setSelectedReport}
                actionLoading={actionLoading}
              />
            ))}
          </div>

          {/* Pagination - Mobile optimized */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 sm:gap-2 pt-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <FiChevronLeft size={12} className="text-white/60" />
              </button>
              
              {/* Mobile pagination - show fewer buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage <= 2) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        currentPage === pageNum
                          ? "text-white"
                          : "text-white/40 hover:text-white/60"
                      }`}
                      style={{
                        background: currentPage === pageNum ? "linear-gradient(135deg,#B42225,#FF8C00)" : "rgba(255,255,255,0.05)",
                        border: currentPage === pageNum ? "none" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <FiChevronRight size={12} className="text-white/60" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl p-8 sm:p-12 text-center border" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
          <FiFlag size={32} className="text-white/10 mx-auto mb-2" />
          <p className="text-sm font-bold text-white/30">
            {searchTerm || statusFilter !== "all" ? "No reports match your filters" : "No reports found"}
          </p>
          {(searchTerm || statusFilter !== "all") && (
            <button onClick={clearFilters} className="mt-3 text-xs font-black text-[#FF8C00] hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReportingSystem;