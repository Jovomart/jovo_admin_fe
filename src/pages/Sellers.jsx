// src/pages/Sellers.jsx
import { useState, useEffect, useCallback } from "react";
import ApiService from "../services/apiService";
import {
  FiSearch,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiRefreshCw,
  FiCalendar,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiFileText,
  FiClock,
  FiImage,
  FiLink,
} from "react-icons/fi";
import { MdStorefront, MdStore } from "react-icons/md";

/* ── helpers ─────────────────────────────────────────────────── */
const normalizeList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.items)) return result.items;
  if (result?.data && Array.isArray(result.data)) return result.data;
  return [];
};

// Seller status values from API: "APPROVED", "PENDING", "REJECTED"
const normalizeStatus = (s) => {
  const status = String(s ?? "").toUpperCase().trim();
  if (status === "APPROVED") return "APPROVED";
  if (status === "REJECTED") return "REJECTED";
  return "PENDING"; // Everything else is pending
};

const isPending = (s) => normalizeStatus(s) === "PENDING";
const isApproved = (s) => normalizeStatus(s) === "APPROVED";
const isRejected = (s) => normalizeStatus(s) === "REJECTED";

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const truncateId = (id) => {
  if (!id) return "—";
  return id.length > 12 ? id.slice(0, 12) + "…" : id;
};

// Get display email from seller
const getDisplayEmail = (seller) => {
  return seller.business_email || seller.user_id || "No email provided";
};

// Get display phone from seller
const getDisplayPhone = (seller) => {
  return seller.business_phone_number || seller.phone || "Not provided";
};

// Get display name from seller
const getDisplayName = (seller) => {
  return seller.business_name || seller.name || "Unnamed Business";
};

// Get display image from seller
const getDisplayImage = (seller) => {
  return seller.business_image || seller.cover_image || null;
};

/* ── Badge ───────────────────────────────────────────────────── */
const statusColors = {
  APPROVED: {
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.25)",
    text: "#10B981",
    icon: FiCheck,
  },
  PENDING: {
    bg: "rgba(255,140,0,0.12)",
    border: "rgba(255,140,0,0.25)",
    text: "#FF8C00",
    icon: FiClock,
  },
  REJECTED: {
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.25)",
    text: "#EF4444",
    icon: FiX,
  },
};

const Badge = ({ status }) => {
  const key = normalizeStatus(status);
  const c = statusColors[key] || statusColors.PENDING;
  const Icon = c.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
      }}
    >
      <Icon size={10} />
      {key}
    </span>
  );
};

/* ── SellerCard ──────────────────────────────────────────────── */
const SellerCard = ({ seller, onAction, tab }) => {
  const status = normalizeStatus(seller.seller_status);
  const showActions = tab === "pending";
  const appliedDate = formatDate(seller.created_at);
  const displayImage = getDisplayImage(seller);
  const displayName = getDisplayName(seller);
  const displayEmail = getDisplayEmail(seller);

  return (
    <div
      className="rounded-2xl p-5 border transition-all hover:border-white/10 hover:-translate-y-0.5"
      style={{
        background: "#0d0d14",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {displayImage ? (
            <img
              src={displayImage}
              alt={displayName}
              className="w-10 h-10 rounded-xl object-cover shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0" style="background: linear-gradient(135deg,#B42225,#FF8C00)">
                    ${displayName[0].toUpperCase()}
                  </div>
                `;
              }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0"
              style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}
            >
              {displayName[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-white/30 truncate">
              {displayEmail}
            </p>
          </div>
        </div>
        <Badge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          {
            label: "ID",
            value: truncateId(seller.id),
          },
          {
            label: "Phone",
            value: getDisplayPhone(seller),
          },
          {
            label: "Status",
            value: seller.seller_status || "PENDING",
          },
          {
            label: "Applied",
            value: (
              <span className="flex items-center gap-1 text-xs">
                <FiCalendar size={10} className="text-white/30" /> {appliedDate}
              </span>
            ),
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl p-2.5"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-0.5">
              {label}
            </p>
            <div className="text-xs font-semibold text-white/60 break-all">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAction(seller, "view")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white/50 transition-all hover:text-white"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <FiEye size={13} /> View
        </button>
        {showActions && status === "PENDING" && (
          <>
            <button
              onClick={() => onAction(seller, "approve")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.25)",
                color: "#10B981",
              }}
            >
              <FiCheck size={13} /> Approve
            </button>
            <button
              onClick={() => onAction(seller, "reject")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#EF4444",
              }}
            >
              <FiX size={13} /> Reject
            </button>
          </>
        )}
        {tab === "approved" && (
          <button
            onClick={() => onAction(seller, "reject")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "#EF4444",
            }}
          >
            <FiX size={13} /> Revoke
          </button>
        )}
      </div>
    </div>
  );
};

/* ── RejectModal ─────────────────────────────────────────────── */
const RejectModal = ({ seller, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }
    setError("");
    onConfirm(reason);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 border"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <FiAlertCircle size={18} className="text-red-400" />
          </div>
          <div>
            <h3
              className="text-base font-black text-white"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              Reject Application
            </h3>
            <p className="text-xs text-white/30 truncate">
              {getDisplayName(seller)}
            </p>
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-2">
            Rejection Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            rows={4}
            placeholder="Explain why this application is being rejected..."
            className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none resize-none placeholder-white/20 transition-all focus:border-[#FF8C00]/40"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: error ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)",
            }}
          />
          {error && (
            <p className="text-[10px] text-red-400 mt-1.5">{error}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white/40 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50 active:scale-95"
            style={{ background: "linear-gradient(135deg,#B42225,#EF4444)" }}
          >
            {loading ? "Rejecting..." : "Reject Application"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── DetailModal ─────────────────────────────────────────────── */
const DetailModal = ({ seller, onClose }) => {
  const status = normalizeStatus(seller.seller_status);
  const appliedDate = formatDate(seller.created_at);
  const updatedDate = formatDate(seller.updated_at);
  const displayImage = getDisplayImage(seller);
  const displayName = getDisplayName(seller);
  const displayEmail = getDisplayEmail(seller);
  const displayPhone = getDisplayPhone(seller);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border overflow-hidden"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b sticky top-0 bg-[#0d0d14] z-10"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <h3
            className="text-base font-black text-white"
            style={{ fontFamily: "'Playfair Display',serif" }}
          >
            Seller Details
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Profile header */}
          <div
            className="flex items-center gap-4 p-4 rounded-2xl flex-wrap sm:flex-nowrap"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            {displayImage ? (
              <img
                src={displayImage}
                alt={displayName}
                className="w-14 h-14 rounded-2xl object-cover shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0" style="background: linear-gradient(135deg,#B42225,#FF8C00)">
                      ${displayName[0].toUpperCase()}
                    </div>
                  `;
                }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0"
                style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}
              >
                {displayName[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-white break-all">
                {displayName}
              </p>
              <p className="text-sm text-white/40 break-all">
                {displayEmail}
              </p>
              <div className="mt-1.5">
                <Badge status={status} />
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Seller ID", value: seller.id || "—", icon: FiUser },
              { label: "Phone", value: displayPhone, icon: FiPhone },
              { label: "Email", value: displayEmail, icon: FiMail },
              { label: "Address", value: seller.business_address || "—", icon: FiMapPin },
              { label: "Document Type", value: seller.seller_document_type || "—", icon: FiFileText },
              { label: "Status", value: seller.seller_status || "PENDING", icon: FiBriefcase },
              { label: "Applied On", value: appliedDate, icon: FiCalendar },
              { label: "Last Updated", value: updatedDate, icon: FiCalendar },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-1 flex items-center gap-1.5">
                  {Icon && <Icon size={10} className="text-white/20" />}
                  {label}
                </p>
                <p className="text-xs font-semibold text-white/60 break-all">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>

          {/* Description */}
          {seller.short_business_description && (
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-2 flex items-center gap-1.5">
                <FiFileText size={10} className="text-white/20" />
                Description
              </p>
              <p className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap wrap-break-word">
                {seller.short_business_description}
              </p>
            </div>
          )}

          {/* Business Images */}
          {(seller.business_image || seller.cover_image) && (
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-2 flex items-center gap-1.5">
                <FiImage size={10} className="text-white/20" />
                Business Images
              </p>
              <div className="flex gap-3 flex-wrap">
                {seller.business_image && (
                  <div>
                    <p className="text-[8px] text-white/20">Logo</p>
                    <img
                      src={seller.business_image}
                      alt="Business Logo"
                      className="w-20 h-20 rounded-lg object-cover border border-white/10"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
                {seller.cover_image && (
                  <div>
                    <p className="text-[8px] text-white/20">Cover</p>
                    <img
                      src={seller.cover_image}
                      alt="Cover Image"
                      className="w-20 h-20 rounded-lg object-cover border border-white/10"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Links */}
          {(seller.business_facebook || seller.business_instagram || seller.business_twitter || seller.business_linkedin || seller.business_website) && (
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-2 flex items-center gap-1.5">
                <FiLink size={10} className="text-white/20" />
                Social & Web
              </p>
              <div className="grid grid-cols-2 gap-2">
                {seller.business_website && (
                  <div>
                    <p className="text-[8px] text-white/20">Website</p>
                    <p className="text-xs text-white/50 break-all">{seller.business_website}</p>
                  </div>
                )}
                {seller.business_facebook && (
                  <div>
                    <p className="text-[8px] text-white/20">Facebook</p>
                    <p className="text-xs text-white/50 break-all">{seller.business_facebook}</p>
                  </div>
                )}
                {seller.business_instagram && (
                  <div>
                    <p className="text-[8px] text-white/20">Instagram</p>
                    <p className="text-xs text-white/50 break-all">{seller.business_instagram}</p>
                  </div>
                )}
                {seller.business_twitter && (
                  <div>
                    <p className="text-[8px] text-white/20">Twitter</p>
                    <p className="text-xs text-white/50 break-all">{seller.business_twitter}</p>
                  </div>
                )}
                {seller.business_linkedin && (
                  <div>
                    <p className="text-[8px] text-white/20">LinkedIn</p>
                    <p className="text-xs text-white/50 break-all">{seller.business_linkedin}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection reason if rejected */}
          {status === "REJECTED" && seller.rejection_reason && (
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-red-400/60 mb-2 flex items-center gap-1.5">
                <FiAlertCircle size={10} className="text-red-400/40" />
                Rejection Reason
              </p>
              <p className="text-xs text-red-300/70 leading-relaxed whitespace-pre-wrap wrap-break-word">
                {seller.rejection_reason}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Toast ───────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => (
  <div
    className="fixed top-4 left-3 right-3 sm:left-auto sm:right-4 z-50 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold animate-slide-in sm:max-w-sm"
    style={{
      background: type === "error" ? "rgba(239,68,68,0.95)" :
                 type === "info" ? "rgba(59,130,246,0.95)" : "rgba(16,185,129,0.95)",
      border: `1px solid ${type === "error" ? "#EF4444" :
                              type === "info" ? "#3B82F6" : "#10B981"}`,
      color: "white",
      backdropFilter: "blur(12px)",
      zIndex: 9999,
    }}
  >
    {type === "error" ? <FiAlertCircle size={14} /> :
     type === "info" ? <FiAlertCircle size={14} /> : <FiCheck size={14} />}
    <span className="flex-1">{msg}</span>
    <button onClick={onClose} className="text-white/70 hover:text-white">
      <FiX size={14} />
    </button>
  </div>
);

/* ── Main ────────────────────────────────────────────────────── */
const Sellers = () => {
  const [tab, setTab] = useState("pending");
  const [pendingSellers, setPendingSellers] = useState([]);
  const [approvedSellers, setApprovedSellers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSellers = useCallback(async () => {
    setLoadingData(true);
    setError("");
    try {
      // Fetch pending and approved sellers using the correct endpoints
      const [pendingResponse, approvedResponse] = await Promise.all([
        ApiService.getPendingSellers(),
        ApiService.getApprovedSellers(),
      ]);

      // Parse responses
      let pending = [];
      let approved = [];

      if (Array.isArray(pendingResponse)) {
        pending = pendingResponse;
      } else if (pendingResponse?.data && Array.isArray(pendingResponse.data)) {
        pending = pendingResponse.data;
      }

      if (Array.isArray(approvedResponse)) {
        approved = approvedResponse;
      } else if (approvedResponse?.data && Array.isArray(approvedResponse.data)) {
        approved = approvedResponse.data;
      }

      // Filter by status just in case
      pending = pending.filter(s => normalizeStatus(s.seller_status) === "PENDING");
      approved = approved.filter(s => normalizeStatus(s.seller_status) === "APPROVED");

      setPendingSellers(pending);
      setApprovedSellers(approved);
    } catch (err) {
      console.error("fetchSellers error:", err);
      setError(err.message || "Failed to fetch sellers");
      // Try to recover by fetching individually
      try {
        const p = await ApiService.getPendingSellers();
        const a = await ApiService.getApprovedSellers();
        if (Array.isArray(p)) setPendingSellers(p);
        if (Array.isArray(a)) setApprovedSellers(a);
      } catch (e) {
        console.error("Recovery fetch failed:", e);
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const handleAction = async (seller, action) => {
    if (action === "view") {
      setDetailModal(seller);
      return;
    }
    if (action === "reject") {
      setRejectModal(seller);
      return;
    }

    if (action === "approve") {
      setActionLoading(true);
      try {
        await ApiService.approveRejectSeller({
          appliedSellerId: seller.id,
          status: "APPROVED",
          rejectionReason: "",
        });

        // Move from pending to approved
        setPendingSellers((prev) => prev.filter((s) => s.id !== seller.id));
        setApprovedSellers((prev) => [
          { ...seller, seller_status: "APPROVED" },
          ...prev,
        ]);

        showToast(`${getDisplayName(seller)} approved successfully!`);
      } catch (err) {
        showToast(err.message || "Failed to approve seller.", "error");
        fetchSellers();
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRejectConfirm = async (reason) => {
    setActionLoading(true);
    try {
      await ApiService.approveRejectSeller({
        appliedSellerId: rejectModal.id,
        status: "REJECTED",
        rejectionReason: reason,
      });

      // Remove from pending
      setPendingSellers((prev) => prev.filter((s) => s.id !== rejectModal.id));
      setRejectModal(null);
      showToast("Application rejected.");
    } catch (err) {
      showToast(err.message || "Failed to reject seller.", "error");
      fetchSellers();
    } finally {
      setActionLoading(false);
    }
  };

  const currentList = tab === "pending" ? pendingSellers : approvedSellers;
  const filtered = currentList.filter((s) => {
    const q = search.toLowerCase();
    const name = (s.business_name || "").toLowerCase();
    const email = (s.business_email || s.user_id || "").toLowerCase();
    const id = (s.id || "").toLowerCase();
    return !q || name.includes(q) || email.includes(q) || id.includes(q);
  });

  const tabCounts = {
    pending: pendingSellers.length,
    approved: approvedSellers.length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-4 pb-6 sm:pb-8">
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {rejectModal && (
        <RejectModal
          seller={rejectModal}
          onClose={() => setRejectModal(null)}
          onConfirm={handleRejectConfirm}
          loading={actionLoading}
        />
      )}
      {detailModal && (
        <DetailModal
          seller={detailModal}
          onClose={() => setDetailModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-black text-white"
            style={{ fontFamily: "'Playfair Display',serif" }}
          >
            <MdStore className="inline-block mr-2 text-[#FF8C00]" />
            Seller Management
          </h1>
          <p className="text-sm text-white/30 mt-0.5">
            Review applications and manage approved sellers
          </p>
        </div>
        <button
          onClick={fetchSellers}
          disabled={loadingData}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white/50 hover:text-white transition-all disabled:opacity-40 w-full sm:w-auto"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <FiRefreshCw
            size={13}
            className={loadingData ? "animate-spin" : ""}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div
          className="flex rounded-2xl p-1 gap-1 overflow-x-auto"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {[
            { key: "pending", label: "Pending", count: tabCounts.pending, color: "#FF8C00" },
            { key: "approved", label: "Approved", count: tabCounts.approved, color: "#10B981" },
          ].map(({ key, label, count, color }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                tab === key ? "text-white" : "text-white/30 hover:text-white/60"
              }`}
              style={
                tab === key
                  ? {
                      background: `rgba(255,255,255,0.08)`,
                      border: `1px solid ${color}30`,
                    }
                  : {}
              }
            >
              {label}
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                  tab === key ? "bg-white/20 text-white" : "bg-white/8 text-white/30"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        <div
          className="flex-1 flex items-center gap-2 rounded-2xl border px-3 py-2.5 focus-within:border-[#FF8C00]/40 transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <FiSearch size={14} className="text-white/25 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-white/25 hover:text-white transition-colors"
            >
              <FiX size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <FiAlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Grid */}
      {loadingData ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-5 border animate-pulse"
              style={{
                background: "#0d0d14",
                border: "1px solid rgba(255,255,255,0.05)",
                height: "240px",
              }}
            />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((seller) => (
            <SellerCard
              key={seller.id}
              seller={seller}
              onAction={handleAction}
              tab={tab}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-3xl p-12 sm:p-16 text-center border"
          style={{
            background: "#0d0d14",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <MdStorefront size={48} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm sm:text-base font-bold text-white/30">
            {search ? "No sellers match your search" : `No ${tab} sellers found`}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-4 text-xs font-black text-[#FF8C00] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      {!loadingData && filtered.length > 0 && (
        <p className="text-center text-[10px] text-white/30">
          Showing {filtered.length} {tab} seller{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

export default Sellers;