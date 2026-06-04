// src/pages/WithdrawalManagement.jsx

import { useState, useEffect, useCallback } from "react";
import ApiService from "../services/apiService";
import {
  FiRefreshCw,
  FiSearch,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiClock,
  FiUser,
  FiMail,
  FiCalendar,
  FiInfo,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiCopy,
  FiExternalLink,
} from "react-icons/fi";
import { MdOutlinePayments, MdOutlineAccountBalance } from "react-icons/md";

/* ─────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
───────────────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
    icon: FiClock,
  },
  completed: {
    label: "Completed",
    color: "#10B981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.2)",
    icon: FiCheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.2)",
    icon: FiXCircle,
  },
};

const STATUS_FILTERS = [
  { value: "", label: "All Requests" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const truncate = (str, length = 20) => {
  if (!str) return "—";
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
};

const copyToClipboard = (text, onSuccess) => {
  navigator.clipboard.writeText(text);
  onSuccess?.();
};

/* ─────────────────────────────────────────────────────────────
   REVIEW MODAL
───────────────────────────────────────────────────────────── */

const ReviewModal = ({ withdrawal, onClose, onApprove, onReject, loading }) => {
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [rejectionReason, setRejectionReason] = useState("");
  const [reference, setReference] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    copyToClipboard(withdrawal?.id || withdrawal?.withdrawal_id || "", () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = () => {
    if (action === "approve") {
      onApprove(reference);
    } else if (action === "reject") {
      if (!rejectionReason.trim()) return;
      onReject(rejectionReason);
    }
  };

  if (!withdrawal) return null;

  const statusConfig = STATUS_CONFIG[withdrawal.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl sm:rounded-3xl border flex flex-col"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div>
            <h3
              className="text-lg sm:text-xl font-black text-white"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              Review Withdrawal Request
            </h3>
            <p className="text-xs text-white/30 mt-0.5">
              {withdrawal.status === "pending" ? "Approve or reject this withdrawal" : "Request has been processed"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: statusConfig.bg,
                border: `1px solid ${statusConfig.border}`,
                color: statusConfig.color,
              }}
            >
              <StatusIcon size={12} />
              {statusConfig.label}
            </div>
          </div>

          {/* Amount */}
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-black" style={{ color: "#FF8C00" }}>
              {formatCurrency(withdrawal.amount)}
            </p>
            <p className="text-xs text-white/30 mt-1">Withdrawal Amount</p>
          </div>

          {/* Withdrawal Details */}
          <div className="space-y-3 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Withdrawal ID</span>
              <div className="flex items-center gap-2">
                <code className="text-xs text-white/70">{truncate(withdrawal.id || withdrawal.withdrawal_id, 16)}</code>
                <button
                  onClick={handleCopyId}
                  className="text-white/30 hover:text-white/70 transition"
                  title="Copy ID"
                >
                  {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Method</span>
              <span className="text-white/70 flex items-center gap-1">
                <MdOutlineAccountBalance size={14} />
                {withdrawal.method || "Bank Transfer"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Account</span>
              <span className="text-white/70 font-mono text-xs">
                {withdrawal.account_number ? `${withdrawal.account_number} (${withdrawal.bank_name || "—"})` : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Account Name</span>
              <span className="text-white/70">{withdrawal.account_name || "—"}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Requested</span>
              <span className="text-white/70 flex items-center gap-1">
                <FiCalendar size={12} />
                {formatDate(withdrawal.requested_at || withdrawal.created_at)}
              </span>
            </div>

            {withdrawal.processed_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Processed</span>
                <span className="text-white/70">{formatDate(withdrawal.processed_at)}</span>
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="space-y-3 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-bold uppercase tracking-wider text-white/30 flex items-center gap-2">
              <FiUser size={10} />
              Requester Details
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Name</span>
                <span className="text-white/70">{withdrawal.user_name || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Email</span>
                <span className="text-white/70 flex items-center gap-1">
                  <FiMail size={10} />
                  {withdrawal.user_email || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Rejection Reason (if rejected) */}
          {withdrawal.status === "rejected" && withdrawal.rejection_reason && (
            <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-red-400/70 flex items-center gap-2">
                <FiAlertCircle size={10} />
                Rejection Reason
              </p>
              <p className="text-sm text-red-300/80 mt-1">{withdrawal.rejection_reason}</p>
            </div>
          )}

          {/* Reference (if completed) */}
          {withdrawal.status === "completed" && withdrawal.reference && (
            <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-green-400/70 flex items-center gap-2">
                <FiExternalLink size={10} />
                Transaction Reference
              </p>
              <code className="text-xs text-green-300/80 mt-1 block break-all">{withdrawal.reference}</code>
            </div>
          )}

          {/* Action Form (only for pending requests) */}
          {withdrawal.status === "pending" && (
            <div className="space-y-4">
              {!action && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setAction("approve")}
                    className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(135deg, #10B981, #059669)",
                      boxShadow: "0 4px 16px rgba(16,185,129,0.3)",
                    }}
                  >
                    <FiCheck size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => setAction("reject")}
                    className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(135deg, #EF4444, #DC2626)",
                      boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
                    }}
                  >
                    <FiX size={16} />
                    Reject
                  </button>
                </div>
              )}

              {action === "approve" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                      Transaction Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g., Bank transfer reference or transaction ID"
                      className="w-full rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white outline-none transition-all placeholder-white/20 border-white/8 bg-[#1a1a24] focus:border-[#FF8C00]/50"
                    />
                    <p className="text-[10px] text-white/20 mt-1">Add a reference number for tracking purposes</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAction(null)}
                      className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{
                        background: "linear-gradient(135deg, #10B981, #059669)",
                      }}
                    >
                      {loading ? <FiLoader className="animate-spin" size={16} /> : <FiCheck size={16} />}
                      Confirm Approval
                    </button>
                  </div>
                </div>
              )}

              {action === "reject" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      placeholder="Explain why this withdrawal is being rejected..."
                      className="w-full rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white outline-none transition-all resize-none placeholder-white/20 border-white/8 bg-[#1a1a24] focus:border-[#FF8C00]/50"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAction(null)}
                      className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !rejectionReason.trim()}
                      className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{
                        background: "linear-gradient(135deg, #EF4444, #DC2626)",
                      }}
                    >
                      {loading ? <FiLoader className="animate-spin" size={16} /> : <FiX size={16} />}
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {withdrawal.status !== "pending" && (
          <div
            className="flex gap-3 px-4 sm:px-6 py-4 border-t shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   WITHDRAWAL CARD (Mobile/Grid View)
───────────────────────────────────────────────────────────── */

const WithdrawalCard = ({ withdrawal, onReview, actionId }) => {
  const statusConfig = STATUS_CONFIG[withdrawal.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const busy = actionId === withdrawal.id;

  return (
    <div
      className="rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
      style={{
        background: "#0d0d14",
        border: `1px solid ${withdrawal.status === "pending" ? "rgba(255,140,0,0.2)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {/* Status Bar */}
      <div
        className="h-1 w-full"
        style={{ background: statusConfig.color }}
      />

      <div className="p-4">
        {/* Amount & Status */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xl font-black" style={{ color: "#FF8C00" }}>
              {formatCurrency(withdrawal.amount)}
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">Withdrawal</p>
          </div>
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
            style={{
              background: statusConfig.bg,
              border: `1px solid ${statusConfig.border}`,
              color: statusConfig.color,
            }}
          >
            <StatusIcon size={10} />
            {statusConfig.label}
          </div>
        </div>

        {/* Withdrawal Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs">
            <FiUser size={10} className="text-white/30" />
            <span className="text-white/60">{withdrawal.user_name || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <MdOutlineAccountBalance size={10} className="text-white/30" />
            <span className="text-white/60">
              {withdrawal.account_number ? `****${withdrawal.account_number.slice(-4)}` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <FiCalendar size={10} className="text-white/30" />
            <span className="text-white/40">{formatDate(withdrawal.requested_at || withdrawal.created_at)}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onReview(withdrawal)}
          disabled={busy}
          className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: withdrawal.status === "pending"
              ? "linear-gradient(135deg, #B42225, #FF8C00)"
              : "rgba(255,255,255,0.05)",
            border: withdrawal.status !== "pending" ? "1px solid rgba(255,255,255,0.08)" : "none",
            color: withdrawal.status === "pending" ? "white" : "rgba(255,255,255,0.5)",
          }}
        >
          {busy ? (
            <FiLoader className="animate-spin" size={14} />
          ) : (
            <FiEye size={14} />
          )}
          {withdrawal.status === "pending" ? "Review Request" : "View Details"}
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   WITHDRAWAL ROW (Desktop Table View)
───────────────────────────────────────────────────────────── */

const WithdrawalRow = ({ withdrawal, onReview, actionId }) => {
  const statusConfig = STATUS_CONFIG[withdrawal.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const busy = actionId === withdrawal.id;

  return (
    <tr
      className="border-b transition-all hover:bg-white/5"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-bold" style={{ color: "#FF8C00" }}>
            {formatCurrency(withdrawal.amount)}
          </p>
          <p className="text-[10px] text-white/30 font-mono">
            {truncate(withdrawal.id || withdrawal.withdrawal_id, 12)}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm text-white/80">{withdrawal.user_name || "—"}</p>
          <p className="text-xs text-white/40">{withdrawal.user_email || "—"}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-xs text-white/60 font-mono">
            {withdrawal.account_number ? `****${withdrawal.account_number.slice(-4)}` : "—"}
          </p>
          <p className="text-[10px] text-white/30">
            {withdrawal.bank_name || "—"}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{
            background: statusConfig.bg,
            border: `1px solid ${statusConfig.border}`,
            color: statusConfig.color,
          }}
        >
          <StatusIcon size={10} />
          {statusConfig.label}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-white/40 whitespace-nowrap">
          {formatDate(withdrawal.requested_at || withdrawal.created_at)}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onReview(withdrawal)}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{
            background: withdrawal.status === "pending"
              ? "linear-gradient(135deg, #B42225, #FF8C00)"
              : "rgba(255,255,255,0.05)",
            color: withdrawal.status === "pending" ? "white" : "rgba(255,255,255,0.5)",
          }}
        >
          {busy ? (
            <FiLoader className="animate-spin" size={12} />
          ) : (
            <FiEye size={12} />
          )}
          {withdrawal.status === "pending" ? "Review" : "View"}
        </button>
      </td>
    </tr>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */

const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // View mode (mobile uses cards, desktop uses table)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await ApiService.getWithdrawals({
        status_filter: statusFilter || null,
        skip,
        limit: itemsPerPage,
      });

      let items = [];
      let total = 0;

      const data = response?.data || response;

      if (Array.isArray(data)) {
        items = data;
        total = data.length;
      } else if (data?.withdrawals && Array.isArray(data.withdrawals)) {
        items = data.withdrawals;
        total = data.total || items.length;
      } else if (data?.items && Array.isArray(data.items)) {
        items = data.items;
        total = data.total || items.length;
      } else {
        items = [];
      }

      setWithdrawals(items);
      setTotalItems(total);
      setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
    } catch (err) {
      console.error("fetchWithdrawals error:", err);
      setError(err.message || "Failed to load withdrawal requests.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, itemsPerPage]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleApprove = async (withdrawalId, reference = "") => {
    setActionId(withdrawalId);
    try {
      await ApiService.approveWithdrawal(withdrawalId, reference);
      showToast("Withdrawal approved successfully!");
      setReviewModal(null);
      fetchWithdrawals();
    } catch (err) {
      showToast(err.message || "Failed to approve withdrawal.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (withdrawalId, rejectionReason) => {
    setActionId(withdrawalId);
    try {
      await ApiService.rejectWithdrawal(withdrawalId, rejectionReason);
      showToast("Withdrawal rejected successfully!");
      setReviewModal(null);
      fetchWithdrawals();
    } catch (err) {
      showToast(err.message || "Failed to reject withdrawal.", "error");
    } finally {
      setActionId(null);
    }
  };

  const clearFilters = () => {
    setStatusFilter("");
    setSearch("");
    setCurrentPage(1);
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      (w.user_name?.toLowerCase().includes(searchLower)) ||
      (w.user_email?.toLowerCase().includes(searchLower)) ||
      (w.id?.toLowerCase().includes(searchLower)) ||
      (w.withdrawal_id?.toLowerCase().includes(searchLower))
    );
  });

  const stats = {
    total: totalItems,
    pending: withdrawals.filter((w) => w.status === "pending").length,
    completed: withdrawals.filter((w) => w.status === "completed").length,
    rejected: withdrawals.filter((w) => w.status === "rejected").length,
    totalAmount: withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0),
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-4">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold animate-slide-in"
          style={{
            background: toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
            border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
            color: toast.type === "error" ? "#EF4444" : "#10B981",
            backdropFilter: "blur(12px)",
          }}
        >
          {toast.type === "error" ? <FiAlertCircle size={14} /> : <FiCheck size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          withdrawal={reviewModal}
          onClose={() => setReviewModal(null)}
          onApprove={(ref) => handleApprove(reviewModal.id, ref)}
          onReject={(reason) => handleReject(reviewModal.id, reason)}
          loading={actionId === reviewModal.id}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
            Withdrawal Management
          </h1>
          <p className="text-sm text-white/30 mt-0.5">
            Manage seller withdrawal requests and payment processing
          </p>
        </div>
        <button
          onClick={() => fetchWithdrawals()}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white/50 hover:text-white transition-all disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: "Total", value: stats.total, color: "#0EA5E9", icon: <MdOutlinePayments size={16} /> },
          { label: "Pending", value: stats.pending, color: "#F59E0B", icon: <FiClock size={14} /> },
          { label: "Completed", value: stats.completed, color: "#10B981", icon: <FiCheckCircle size={14} /> },
          { label: "Rejected", value: stats.rejected, color: "#EF4444", icon: <FiXCircle size={14} /> },
          { label: "Total Amount", value: formatCurrency(stats.totalAmount), color: "#FF8C00", icon: <FiDollarSign size={14} /> },
        ].map(({ label, value, color, icon }) => (
          <div
            key={label}
            className="rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all hover:scale-[1.02]"
            style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ color }}>{icon}</span>
              <p className="text-[10px] font-black uppercase tracking-wider text-white/20">{label}</p>
            </div>
            <p className="text-lg sm:text-xl font-black" style={{ color }}>
              {loading && label !== "Total Amount" ? <FiLoader className="animate-spin inline" /> : value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 rounded-xl sm:rounded-2xl border border-white/8 bg-white/5 px-3 sm:px-4 py-2.5 sm:py-3 focus-within:border-[#FF8C00]/40 transition-all">
          <FiSearch size={14} className="text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="flex-1 text-xs sm:text-sm text-white outline-none bg-transparent placeholder-white/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-white/30 hover:text-white transition">
              <FiX size={14} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-xl sm:rounded-2xl border border-white/8 bg-[#1a1a24] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white outline-none focus:border-[#FF8C00]/50 transition-all"
          style={{ backgroundColor: "#1a1a24", color: "white" }}
        >
          {STATUS_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value} style={{ backgroundColor: "#1a1a24", color: "white" }}>
              {filter.label}
            </option>
          ))}
        </select>

        {(search || statusFilter) && (
          <button
            onClick={clearFilters}
            className="px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white/50 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl sm:rounded-2xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-xs sm:text-sm">{error}</p>
        </div>
      )}

      {/* Withdrawals List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl sm:rounded-2xl animate-pulse" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", height: "200px" }} />
          ))}
        </div>
      ) : filteredWithdrawals.length > 0 ? (
        <>
          {/* Desktop Table View */}
          {!isMobile && (
            <div className="rounded-xl sm:rounded-2xl overflow-x-auto" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/30">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/30">Requester</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/30">Account</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/30">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/30">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/30">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <WithdrawalRow
                      key={withdrawal.id}
                      withdrawal={withdrawal}
                      onReview={setReviewModal}
                      actionId={actionId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Card View */}
          {isMobile && (
            <div className="grid grid-cols-1 gap-4">
              {filteredWithdrawals.map((withdrawal) => (
                <WithdrawalCard
                  key={withdrawal.id}
                  withdrawal={withdrawal}
                  onReview={setReviewModal}
                  actionId={actionId}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:scale-105"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <FiChevronLeft size={14} className="text-white/60" />
              </button>
              <span className="text-xs sm:text-sm text-white/60 px-3 sm:px-4">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:scale-105"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <FiChevronRight size={14} className="text-white/60" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl p-12 sm:p-16 text-center border" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
          <MdOutlinePayments size={48} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm sm:text-base font-bold text-white/30">
            {search || statusFilter ? "No withdrawals match your filters" : "No withdrawal requests yet"}
          </p>
          {(search || statusFilter) && (
            <button onClick={clearFilters} className="mt-4 text-xs sm:text-sm font-black text-[#FF8C00] hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagement;