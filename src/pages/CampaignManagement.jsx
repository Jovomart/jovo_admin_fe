// src/pages/CampaignManagement.jsx

import { useState, useEffect, useCallback } from "react";
import ApiService from "../services/apiService";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiSearch,
  FiAlertCircle,
  FiRefreshCw,
  FiClock,
  FiToggleLeft,
  FiToggleRight,
  FiLoader,
  FiZap,
  FiCalendar,
  FiPackage,
  FiFilter,
  FiUser,
  FiTag,
} from "react-icons/fi";
import { MdCampaign } from "react-icons/md";

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

const inputCls = (err) =>
  `w-full rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white outline-none transition-all ${
    err
      ? "border-red-500/40 bg-red-500/5 placeholder-white/20"
      : "border-white/8 bg-[#1a1a24] placeholder-white/20 focus:border-[#FF8C00]/50 focus:bg-[#1f1f2a]"
  }`;

const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const toLocalDateTimeInput = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
};

const getCampaignStatus = (campaign) => {
  const now = Date.now();
  const start = new Date(campaign.start_time).getTime();
  const end = new Date(campaign.end_time).getTime();
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "current";
};

const STATUS_CONFIG = {
  upcoming: { label: "Upcoming", color: "#0EA5E9", bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.25)", icon: "🕐" },
  current: { label: "Live Now", color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", icon: "🔴" },
  past: { label: "Ended", color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", icon: "✓" },
};

const EMPTY_FORM = { title: "", start_time: "", end_time: "", is_active: true };

/* ─────────────────────────────────────────────────────────────
   APPLICATION REVIEW MODAL
───────────────────────────────────────────────────────────── */
const ApplicationsModal = ({ applications, onClose, onApprove, onReject, actionId, onRefresh }) => {
  const [search, setSearch] = useState("");
  const [productDetails, setProductDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingId, setRejectingId] = useState(null);

  // Fetch product details for each application
  useEffect(() => {
    const fetchProductDetails = async () => {
      const productIds = [...new Set(applications.map(app => app.product_id).filter(Boolean))];
      
      for (const productId of productIds) {
        if (!productDetails[productId] && !loadingDetails[`product_${productId}`]) {
          setLoadingDetails(prev => ({ ...prev, [`product_${productId}`]: true }));
          try {
            const response = await ApiService.getProductById(productId);
            const product = response?.data || response;
            setProductDetails(prev => ({
              ...prev,
              [productId]: {
                name: product.name || product.product_name || product.title || `Product #${productId.slice(0, 8)}`,
                price: product.price,
                stock: product.stock_quantity || product.stock || 0,
              }
            }));
          } catch (err) {
            console.error(`Failed to fetch product ${productId}:`, err);
            setProductDetails(prev => ({
              ...prev,
              [productId]: { name: `Product #${productId.slice(0, 8)}`, error: true, stock: 0 }
            }));
          } finally {
            setLoadingDetails(prev => ({ ...prev, [`product_${productId}`]: false }));
          }
        }
      }
    };
    
    if (applications.length > 0) {
      fetchProductDetails();
    }
  }, [applications]);

  const filtered = applications.filter((app) => {
    const q = search.toLowerCase();
    const product = productDetails[app.product_id];
    const productName = (product?.name || app.product_id || "").toLowerCase();
    return !q || productName.includes(q);
  });

  const handleRejectClick = (app) => {
    const product = productDetails[app.product_id];
    const productName = product?.name || `Product #${app.product_id?.slice(0, 8)}`;
    setRejectModal({ applicationId: app.id, productName });
    setRejectionReason("");
  };

  const confirmReject = async () => {
    if (!rejectModal) return;
    setRejectingId(rejectModal.applicationId);
    try {
      await onReject(rejectModal.applicationId, rejectionReason);
    } finally {
      setRejectingId(null);
      setRejectModal(null);
      setRejectionReason("");
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <div
          className="w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl sm:rounded-b-2xl border flex flex-col max-h-[90vh] sm:max-h-[85vh]"
          style={{
            background: "#0d0d14",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b shrink-0 sticky top-0 z-10"
            style={{ background: "#0d0d14", borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Product Applications</h3>
              <p className="text-[10px] sm:text-xs text-white/30 mt-0.5">
                {applications.length} total application{applications.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={onRefresh}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition"
              >
                <FiRefreshCw size={14} />
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 sm:px-5 py-3 border-b shrink-0 sticky top-14.25 sm:top-16.25 z-10" style={{ background: "#0d0d14", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-white/8 bg-white/5 px-2 sm:px-3 py-2 focus-within:border-[#FF8C00]/40 transition-all">
              <FiSearch size={12} className="text-white/30 shrink-0" />
              <input
                type="text"
                placeholder="Search by product name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-xs sm:text-sm text-white outline-none bg-transparent placeholder-white/20"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-white/30 hover:text-white transition p-1">
                  <FiX size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Applications list */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2 sm:space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <FiPackage size={28} className="text-white/10 mx-auto mb-3" />
                <p className="text-xs sm:text-sm text-white/30">
                  {search ? "No applications match your search" : "No applications yet"}
                </p>
              </div>
            ) : (
              filtered.map((app) => {
                const busy = actionId === app.id || rejectingId === app.id;
                const isApproved = app.is_approved === true;
                const product = productDetails[app.product_id];
                const isLoading = loadingDetails[`product_${app.product_id}`];
                const productName = product?.name || (isLoading ? "Loading..." : `Product #${app.product_id?.slice(0, 8)}`);
                const stockWarning = product && app.flash_stock > product.stock;

                return (
                  <div
                    key={app.id}
                    className="rounded-lg sm:rounded-xl border p-3 sm:p-4 transition-all"
                    style={{
                      background: isApproved ? "rgba(16,185,129,0.04)" : "rgba(255,255,255,0.03)",
                      border: isApproved ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <h4 className="text-sm sm:text-base font-black text-white line-clamp-2 flex items-center gap-1.5 sm:gap-2">
                            {isLoading ? (
                              <>
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span className="text-white/40 text-xs sm:text-sm">Loading...</span>
                              </>
                            ) : (
                              <>
                                <FiTag size={12} className="text-[#FF8C00] shrink-0" />
                                <span className="wrap-break-word">{productName}</span>
                              </>
                            )}
                          </h4>
                          <span
                            className="text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              background: isApproved ? "rgba(16,185,129,0.15)" : "rgba(255,140,0,0.12)",
                              color: isApproved ? "#10B981" : "#FF8C00",
                              border: isApproved ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,140,0,0.25)",
                            }}
                          >
                            {isApproved ? "✓ APPROVED" : "⏳ PENDING"}
                          </span>
                          {stockWarning && !isApproved && (
                            <span
                              className="text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-full shrink-0"
                              style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}
                            >
                              ⚠️ Stock Issue
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-0.5">
                          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-white/40">
                            <FiUser size={8} className="text-white/20 shrink-0" />
                            <span className="truncate">
                              Product ID: <span className="text-white/50">{app.product_id?.slice(0, 8)}...</span>
                            </span>
                          </div>
                          
                          {app.flash_price !== undefined && app.flash_price !== null && (
                            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-white/40">
                              <FiZap size={8} className="text-[#FF8C00] shrink-0" />
                              <span>
                                Flash Price: <span className="text-[#FF8C00] font-bold">₦{Number(app.flash_price).toLocaleString()}</span>
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-white/40">
                            <FiPackage size={8} className="text-white/20 shrink-0" />
                            <span>
                              Flash Stock: <span className={stockWarning ? "text-red-400" : "text-white/60"}>{app.flash_stock} units</span>
                              {product && (
                                <span className="ml-1 text-white/30">
                                  (Available: {product.stock})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {stockWarning && !isApproved && (
                          <div className="mt-2 flex items-start gap-1.5 py-1.5 px-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            <FiAlertCircle size={10} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="text-[9px] sm:text-[10px] text-red-400">
                              Flash stock ({app.flash_stock}) exceeds available inventory ({product?.stock || 0}). 
                              Please ask seller to adjust before approving.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1.5 sm:gap-2 shrink-0 mt-2 sm:mt-0">
                        {!isApproved ? (
                          <>
                            <button
                              onClick={() => onApprove(app.id, app.flash_stock, product?.stock)}
                              disabled={busy || isLoading || stockWarning}
                              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-40 min-w-17.5 sm:min-w-20 ${
                                stockWarning ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              style={{
                                background: "rgba(16,185,129,0.12)",
                                border: "1px solid rgba(16,185,129,0.3)",
                                color: "#10B981",
                              }}
                              title={stockWarning ? "Cannot approve - stock issue" : "Approve application"}
                            >
                              {busy ? (
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FiCheck size={10} />
                              )}
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRejectClick(app)}
                              disabled={busy || isLoading}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-40 min-w-15 sm:min-w-17.5"
                              style={{
                                background: "rgba(239,68,68,0.08)",
                                border: "1px solid rgba(239,68,68,0.2)",
                                color: "#EF4444",
                              }}
                            >
                              {busy ? (
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FiX size={10} />
                              )}
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onReject(app.id, "Revoked by admin")}
                            disabled={busy || isLoading}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-40 min-w-17.5 sm:min-w-20"
                            style={{
                              background: "rgba(239,68,68,0.08)",
                              border: "1px solid rgba(239,68,68,0.2)",
                              color: "#EF4444",
                            }}
                          >
                            {busy ? (
                              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FiX size={10} />
                            )}
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)" }}
          onClick={() => setRejectModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border"
            style={{
              background: "#0d0d14",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="text-lg font-black text-white">Reject Application</h3>
              <button onClick={() => setRejectModal(null)} className="text-white/30 hover:text-white">
                <FiX size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-white/60">
                Reject application for: <span className="text-white font-bold">{rejectModal.productName}</span>
              </p>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-white/30 mb-2">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-sm text-white outline-none focus:border-[#FF8C00]/50"
                  rows="3"
                  placeholder="e.g., Flash stock exceeds available inventory..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={rejectingId === rejectModal.applicationId}
                className="flex-1 py-2.5 rounded-xl text-sm font-black text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rejectingId === rejectModal.applicationId ? (
                  <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Rejecting...</>
                ) : (
                  "Confirm Rejection"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ─────────────────────────────────────────────────────────────
   FLASH SALE FORM MODAL
───────────────────────────────────────────────────────────── */
const FlashSaleModal = ({ initial, onClose, onSave, saving }) => {
  const isEdit = !!initial?.id;

  const [form, setForm] = useState(() => {
    if (!initial) return { ...EMPTY_FORM };
    return {
      title: initial.title || "",
      start_time: toLocalDateTimeInput(initial.start_time),
      end_time: toLocalDateTimeInput(initial.end_time),
      is_active: initial.is_active !== undefined ? initial.is_active : true,
    };
  });

  const [errors, setErrors] = useState({});

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = "Required";
    if (!form.start_time) e.start_time = "Required";
    if (!form.end_time) e.end_time = "Required";
    if (form.start_time && form.end_time && new Date(form.start_time) >= new Date(form.end_time)) {
      e.end_time = "End time must be after start time";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(
      {
        title: form.title.trim(),
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        ...(isEdit ? { is_active: form.is_active } : {}),
      },
      initial?.id || null
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border flex flex-col max-h-[90vh]"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b shrink-0 sticky top-0 z-10" style={{ background: "#0d0d14", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}>
              <FiZap size={14} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black text-white">{isEdit ? "Edit Flash Sale" : "Schedule Flash Sale"}</h3>
              <p className="text-[10px] sm:text-xs text-white/30">{isEdit ? "Update campaign details" : "Create a new platform-wide flash sale"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition">
            <FiX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[1px] text-white/30 mb-1">Campaign Title *</label>
            <input type="text" value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="e.g., Summer Mega Flash Sale" className={inputCls(errors.title)} />
            {errors.title && <p className="text-[10px] text-red-400 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[1px] text-white/30 mb-1">Start Date & Time *</label>
            <input type="datetime-local" value={form.start_time} onChange={(e) => setField("start_time", e.target.value)} className={inputCls(errors.start_time)} style={{ colorScheme: "dark" }} />
            {errors.start_time && <p className="text-[10px] text-red-400 mt-1">{errors.start_time}</p>}
          </div>
          <div>
            <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-[1px] text-white/30 mb-1">End Date & Time *</label>
            <input type="datetime-local" value={form.end_time} onChange={(e) => setField("end_time", e.target.value)} className={inputCls(errors.end_time)} style={{ colorScheme: "dark" }} />
            {errors.end_time && <p className="text-[10px] text-red-400 mt-1">{errors.end_time}</p>}
          </div>
          {isEdit && (
            <button type="button" onClick={() => setField("is_active", !form.is_active)} className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 rounded-lg sm:rounded-xl border transition-all active:scale-[0.98]"
              style={{ background: form.is_active ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)", border: form.is_active ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-xs sm:text-sm font-bold" style={{ color: form.is_active ? "#10B981" : "rgba(255,255,255,0.4)" }}>{form.is_active ? "✓ Active" : "✗ Inactive"}</span>
              {form.is_active ? <FiToggleRight size={18} className="text-[#10B981]" /> : <FiToggleLeft size={18} className="text-white/20" />}
            </button>
          )}
        </div>

        <div className="flex gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button type="button" onClick={onClose} className="flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)", boxShadow: "0 4px 16px rgba(180,34,37,0.3)" }}>
            {saving ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : isEdit ? "Update Campaign" : "Schedule Flash Sale"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   DELETE CONFIRM MODAL
───────────────────────────────────────────────────────────── */
const DeleteConfirm = ({ campaignTitle, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }} onClick={onCancel}>
    <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 text-center" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }} onClick={(e) => e.stopPropagation()}>
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4"><FiTrash2 size={18} className="text-red-400" /></div>
      <h3 className="text-base sm:text-lg font-black text-white mb-1.5 sm:mb-2">Delete Campaign?</h3>
      <p className="text-xs sm:text-sm text-white/40 mb-4 wrap-break-word">"{campaignTitle?.substring(0, 50)}"</p>
      <p className="text-[10px] text-white/30 mb-4">This action cannot be undone.</p>
      <div className="flex gap-2 sm:gap-3">
        <button onClick={onCancel} className="flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Delete"}
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   FLASH SALE CARD
───────────────────────────────────────────────────────────── */
const FlashSaleCard = ({ campaign, onEdit, onDelete, actionId, onViewApplications }) => {
  const busy = actionId === campaign.id;
  const status = getCampaignStatus(campaign);
  const cfg = STATUS_CONFIG[status];
  const isActive = campaign.is_active !== false;
  const applicationCount = campaign.application_count ?? campaign.applications?.length ?? null;

  return (
    <div className="group relative rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden active:scale-[0.98]" style={{ background: "#0d0d14", border: `1px solid ${cfg.border}`, opacity: isActive ? 1 : 0.65 }}>
      <div className="h-0.5 sm:h-1 w-full" style={{ background: `linear-gradient(90deg,${cfg.color},${cfg.color}88)` }} />
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <FiZap size={12} style={{ color: cfg.color }} />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-white leading-tight line-clamp-2 group-hover:text-[#FF8C00] transition-colors wrap-break-word">{campaign.title}</h3>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
          <span className="inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.icon} {cfg.label}</span>
          <span className="inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black" style={{ background: isActive ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)", color: isActive ? "#10B981" : "rgba(255,255,255,0.3)", border: isActive ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>{isActive ? "✓ ACTIVE" : "✗ INACTIVE"}</span>
        </div>
        <div className="space-y-1 mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-white/40"><FiCalendar size={7} className="text-white/20" /><span><span className="text-white/25">Starts:</span> <span className="text-white/60">{formatDateTime(campaign.start_time)}</span></span></div>
          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-white/40"><FiClock size={7} className="text-white/20" /><span><span className="text-white/25">Ends:</span> <span className="text-white/60">{formatDateTime(campaign.end_time)}</span></span></div>
        </div>
        {applicationCount !== null && (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg mb-2 cursor-pointer hover:opacity-80 transition active:scale-[0.98]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} onClick={() => onViewApplications(campaign)}>
            <span className="text-[9px] text-white/40 flex items-center gap-1"><FiPackage size={8} /> Product Apps</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,140,0,0.12)", color: "#FF8C00" }}>{applicationCount}</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-white/5">
          <button onClick={() => onViewApplications(campaign)} disabled={busy} className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40" style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", color: "#0EA5E9" }}><FiPackage size={9} /><span>Apps</span></button>
          <button onClick={() => onEdit(campaign)} disabled={busy} className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold transition-all hover:bg-white/10 active:scale-95 disabled:opacity-40" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}><FiEdit2 size={9} /><span>Edit</span></button>
          <button onClick={() => onDelete(campaign)} disabled={busy} className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#EF4444" }}>{busy ? <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" /> : <FiTrash2 size={9} />}<span>Del</span></button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [appsModal, setAppsModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ApiService.getFlashSales(statusFilter);
      const data = response?.data || response;
      if (Array.isArray(data)) setCampaigns(data);
      else if (Array.isArray(data?.campaigns)) setCampaigns(data.campaigns);
      else if (Array.isArray(data?.flash_sales)) setCampaigns(data.flash_sales);
      else setCampaigns([]);
    } catch (err) {
      setError(err.message || "Failed to load flash sale campaigns.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchApplications = useCallback(async () => {
    try {
      const response = await ApiService.getFlashSaleApplications();
      const data = response?.data || response;
      let appsList = [];
      if (Array.isArray(data)) appsList = data;
      else if (Array.isArray(data?.applications)) appsList = data.applications;
      else if (Array.isArray(data?.data)) appsList = data.data;

      // Filter to only show pending and approved applications (hide rejected)
      const filteredApps = appsList.filter(app => {
        if (app.status === 'rejected') return false;
        if (app.is_approved === false && app.rejection_reason) return false;
        return true;
      });

      console.log("📊 Applications - Original:", appsList.length, "Filtered:", filteredApps.length);
      if (appsList.length > filteredApps.length) {
        console.log(`🔍 Hidden ${appsList.length - filteredApps.length} rejected applications`);
      }

      setApplications(filteredApps);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchApplications();
  }, [fetchCampaigns, fetchApplications]);

  const handleSave = async (payload, editId) => {
    setSaving(true);
    try {
      if (editId) {
        await ApiService.updateFlashSale(editId, payload);
        showToast("Flash sale updated successfully!");
      } else {
        await ApiService.createFlashSale(payload);
        showToast("Flash sale scheduled successfully!");
      }
      setModal(null);
      await fetchCampaigns();
    } catch (err) {
      showToast(err.message || "Failed to save campaign.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionId(confirmDelete.id);
    const title = confirmDelete.title;
    setConfirmDelete(null);
    try {
      await ApiService.deleteFlashSale(confirmDelete.id);
      showToast(`"${title}" permanently deleted.`);
      await fetchCampaigns();
    } catch (err) {
      showToast(err.message || "Failed to delete campaign.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleApprove = async (applicationId, flashStock, availableStock) => {
    if (flashStock && availableStock && flashStock > availableStock) {
      showToast(`Cannot approve: Flash stock (${flashStock}) exceeds available inventory (${availableStock}). Please ask seller to adjust.`, "error");
      return;
    }

    setActionId(applicationId);
    try {
      await ApiService.approveFlashSaleApplication(applicationId);
      showToast("Application approved successfully!");
      await fetchApplications();
      if (appsModal) setAppsModal((prev) => ({ ...prev }));
    } catch (err) {
      console.error("Approve error:", err);
      showToast(err.message || "Failed to approve application.", "error");
    } finally {
      setActionId(null);
    }
  };

  // ✅ FIXED: rejection reason is now passed to the API, and no race condition
  const handleReject = async (applicationId, rejectionReason = "") => {
    console.log("🚫 handleReject called with:", { applicationId, rejectionReason });

    setActionId(applicationId);

    try {
      await ApiService.rejectFlashSaleApplication(applicationId, rejectionReason);
      showToast(
        rejectionReason
          ? `Application rejected: ${rejectionReason}`
          : "Application rejected successfully!"
      );

      // fetchApplications already filters out rejected items, so the
      // modal list will update correctly after this single refresh
      await fetchApplications();

      // Trigger a re-render of the modal with the refreshed applications
      if (appsModal) {
        setAppsModal((prev) => ({ ...prev }));
      }
    } catch (err) {
      console.error("❌ Reject error:", err);
      showToast(err.message || "Failed to reject application.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleViewApplications = (campaign) => {
    setAppsModal(campaign);
  };

  const getCampaignApplications = (campaign) => {
    if (!campaign || Object.keys(campaign).length === 0) return applications;
    return applications.filter((app) => {
      const matchesCampaign = app.flash_sale_id === campaign.id || app.campaign_id === campaign.id;
      const isNotRejected = app.status !== 'rejected' && !(app.is_approved === false && app.rejection_reason);
      return matchesCampaign && isNotRejected;
    });
  };

  const now = Date.now();
  const liveCount = campaigns.filter((c) => { const s = new Date(c.start_time).getTime(); const e = new Date(c.end_time).getTime(); return now >= s && now <= e; }).length;
  const upcomingCount = campaigns.filter((c) => new Date(c.start_time).getTime() > now).length;
  const pendingApps = applications.filter((a) => !a.is_approved).length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-4 pb-4 sm:pb-6">
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:top-4 sm:bottom-auto sm:right-4 sm:left-auto z-50 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold animate-in slide-in-from-bottom-2"
          style={{ background: toast.type === "error" ? "rgba(239,68,68,0.95)" : toast.type === "info" ? "rgba(59,130,246,0.95)" : "rgba(16,185,129,0.95)", border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.2)"}`, color: "white", backdropFilter: "blur(12px)" }}>
          {toast.type === "error" ? <FiAlertCircle size={14} /> : <FiCheck size={14} />}
          <span className="text-center">{toast.msg}</span>
        </div>
      )}

      {modal && <FlashSaleModal initial={modal === "create" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />}
      {confirmDelete && <DeleteConfirm campaignTitle={confirmDelete.title} onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} loading={actionId === confirmDelete.id} />}
      {appsModal !== null && (
        <ApplicationsModal
          applications={getCampaignApplications(appsModal)}
          onClose={() => setAppsModal(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          actionId={actionId}
          onRefresh={() => { fetchApplications(); if (appsModal) setAppsModal((prev) => ({ ...prev })); }}
        />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white">Campaigns</h1>
          <p className="text-xs sm:text-sm text-white/30 mt-0.5">Manage flash sales and seller product applications{campaigns.length > 0 && ` • ${liveCount} live, ${upcomingCount} upcoming`}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => { fetchCampaigns(); fetchApplications(); }} disabled={loading} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white/50 hover:text-white transition-all disabled:opacity-40 flex-1 sm:flex-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}><FiRefreshCw size={12} className={loading ? "animate-spin" : ""} /><span>Refresh</span></button>
          <button onClick={() => setAppsModal({})} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 flex-1 sm:flex-none" style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.3)", color: "#0EA5E9" }}><FiPackage size={12} /><span>Apps {pendingApps > 0 && `(${pendingApps})`}</span></button>
          <button onClick={() => setModal("create")} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black text-white transition-all hover:opacity-90 active:scale-95 flex-1 sm:flex-none" style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)", boxShadow: "0 4px 12px rgba(180,34,37,0.3)" }}><FiPlus size={12} /><span>New</span></button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Total", value: campaigns.length, color: "#0EA5E9", icon: <MdCampaign size={14} /> },
          { label: "Live", value: liveCount, color: "#10B981", icon: <FiZap size={12} /> },
          { label: "Upcoming", value: upcomingCount, color: "#FF8C00", icon: <FiClock size={12} /> },
          { label: "Pending", value: pendingApps, color: "#EF4444", icon: <FiPackage size={12} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="rounded-lg sm:rounded-2xl p-2.5 sm:p-4 border transition-all active:scale-[0.98]" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between mb-1"><span style={{ color }} className="text-sm">{icon}</span><p className="text-[8px] font-black uppercase tracking-wider text-white/20">{label}</p></div>
            <p className="text-lg sm:text-3xl font-black" style={{ color }}>{loading ? <FiLoader className="animate-spin inline" size={14} /> : value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <FiFilter size={11} className="text-white/30 shrink-0" />
        <div className="flex gap-1.5">
          {["", "current", "upcoming", "past"].map((val) => {
            const labels = { "": "All", current: "Live", upcoming: "Upcoming", past: "Past" };
            const active = statusFilter === val;
            return (<button key={val} onClick={() => setStatusFilter(val)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all active:scale-95 whitespace-nowrap ${active ? "text-white" : "text-white/40"}`} style={{ background: active ? "linear-gradient(135deg,#B42225,#FF8C00)" : "rgba(255,255,255,0.05)", border: active ? "none" : "1px solid rgba(255,255,255,0.08)" }}>{labels[val]}</button>);
          })}
        </div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}><FiAlertCircle size={12} className="text-red-400" /><p className="text-red-400 text-xs">{error}</p></div>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (<div key={i} className="rounded-xl animate-pulse" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", height: "220px" }} />))}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {campaigns.map((campaign) => (<FlashSaleCard key={campaign.id} campaign={campaign} onEdit={(c) => setModal(c)} onDelete={(c) => setConfirmDelete(c)} onViewApplications={handleViewApplications} actionId={actionId} />))}
        </div>
      ) : (
        <div className="rounded-xl p-8 text-center border" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
          <FiZap size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm font-bold text-white/30">{statusFilter ? `No ${statusFilter} flash sales` : "No flash sales yet"}</p>
          {!statusFilter && (<button onClick={() => setModal("create")} className="mt-3 text-xs font-black text-[#FF8C00] hover:underline">+ Schedule your first flash sale</button>)}
        </div>
      )}
    </div>
  );
};

export default CampaignManagement;