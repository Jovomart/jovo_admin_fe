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
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiZap,
  FiCalendar,
  FiPackage,
  FiFilter,
} from "react-icons/fi";
import { MdCampaign } from "react-icons/md";

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

const inputCls = (err) =>
  `w-full rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white outline-none transition-all ${
    err
      ? "border-red-500/40 bg-red-500/5 placeholder-white/20"
      : "border-white/8 bg-[#1a1a24] placeholder-white/20 focus:border-[#FF8C00]/50 focus:bg-[#1f1f2a]"
  }`;

const selectStyle = { backgroundColor: "#1a1a24", color: "white" };

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
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}
            >
              <FiZap size={16} className="text-white" />
            </div>
            <div>
              <h3
                className="text-lg font-black text-white"
                style={{ fontFamily: "'Playfair Display',serif" }}
              >
                {isEdit ? "Edit Flash Sale" : "Schedule Flash Sale"}
              </h3>
              <p className="text-xs text-white/30">
                {isEdit ? "Update campaign details" : "Create a new platform-wide flash sale"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              Campaign Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g., Summer Mega Flash Sale"
              className={inputCls(errors.title)}
            />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setField("start_time", e.target.value)}
              className={inputCls(errors.start_time)}
              style={{ colorScheme: "dark" }}
            />
            {errors.start_time && <p className="text-xs text-red-400 mt-1">{errors.start_time}</p>}
          </div>

          {/* End Time */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setField("end_time", e.target.value)}
              className={inputCls(errors.end_time)}
              style={{ colorScheme: "dark" }}
            />
            {errors.end_time && <p className="text-xs text-red-400 mt-1">{errors.end_time}</p>}
          </div>

          {/* Active Toggle — edit only */}
          {isEdit && (
            <button
              type="button"
              onClick={() => setField("is_active", !form.is_active)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all hover:scale-[1.01]"
              style={{
                background: form.is_active ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)",
                border: form.is_active ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: form.is_active ? "#10B981" : "rgba(255,255,255,0.4)" }}
              >
                {form.is_active ? "✓ Active" : "✗ Inactive"}
              </span>
              {form.is_active ? (
                <FiToggleRight size={22} className="text-[#10B981]" />
              ) : (
                <FiToggleLeft size={22} className="text-white/20" />
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-5 py-4 border-t shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-98 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg,#B42225,#FF8C00)",
              boxShadow: "0 4px 16px rgba(180,34,37,0.3)",
            }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Update Campaign"
            ) : (
              "Schedule Flash Sale"
            )}
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
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)" }}
    onClick={onCancel}
  >
    <div
      className="w-full max-w-sm rounded-2xl sm:rounded-3xl p-6 text-center"
      style={{
        background: "#0d0d14",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <FiTrash2 size={22} className="text-red-400" />
      </div>
      <h3
        className="text-lg font-black text-white mb-2"
        style={{ fontFamily: "'Playfair Display',serif" }}
      >
        Delete "{campaignTitle}"?
      </h3>
      <p className="text-sm text-white/40 mb-6">
        This will permanently delete this flash sale and all associated seller applications. This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white hover:bg-white/5 transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Delete Permanently"
          )}
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   APPLICATION REVIEW MODAL
───────────────────────────────────────────────────────────── */
const ApplicationsModal = ({ applications, onClose, onApprove, onReject, actionId }) => {
  const [search, setSearch] = useState("");

  const filtered = applications.filter((app) => {
    const q = search.toLowerCase();
    return (
      !q ||
      app.product_name?.toLowerCase().includes(q) ||
      app.seller_name?.toLowerCase().includes(q) ||
      app.id?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl sm:rounded-3xl border flex flex-col"
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
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div>
            <h3
              className="text-lg font-black text-white"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              Product Applications
            </h3>
            <p className="text-xs text-white/30 mt-0.5">
              {applications.length} total application{applications.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 focus-within:border-[#FF8C00]/40 transition-all">
            <FiSearch size={14} className="text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Search by product, seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-xs text-white outline-none bg-transparent placeholder-white/20"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-white/30 hover:text-white transition">
                <FiX size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Applications list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <FiPackage size={36} className="text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">
                {search ? "No applications match your search" : "No applications yet"}
              </p>
            </div>
          ) : (
            filtered.map((app) => {
              const busy = actionId === app.id;
              const isApproved = app.is_approved === true;

              return (
                <div
                  key={app.id}
                  className="rounded-xl border p-4 transition-all"
                  style={{
                    background: isApproved ? "rgba(16,185,129,0.04)" : "rgba(255,255,255,0.03)",
                    border: isApproved ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-sm font-black text-white line-clamp-1">
                          {app.product_name || app.product?.name || "Unnamed Product"}
                        </h4>
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full"
                          style={{
                            background: isApproved ? "rgba(16,185,129,0.15)" : "rgba(255,140,0,0.12)",
                            color: isApproved ? "#10B981" : "#FF8C00",
                            border: isApproved ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,140,0,0.25)",
                          }}
                        >
                          {isApproved ? "✓ APPROVED" : "⏳ PENDING"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        {(app.seller_name || app.seller?.business_name) && (
                          <p className="text-[10px] text-white/40">
                            Seller: <span className="text-white/60">{app.seller_name || app.seller?.business_name}</span>
                          </p>
                        )}
                        {app.campaign_title && (
                          <p className="text-[10px] text-white/40">
                            Campaign: <span className="text-white/60">{app.campaign_title}</span>
                          </p>
                        )}
                        {app.discount_percentage !== undefined && app.discount_percentage !== null && (
                          <p className="text-[10px] text-white/40">
                            Discount: <span className="text-[#FF8C00] font-bold">{app.discount_percentage}%</span>
                          </p>
                        )}
                        {app.flash_price !== undefined && app.flash_price !== null && (
                          <p className="text-[10px] text-white/40">
                            Flash Price: <span className="text-white/60">₦{Number(app.flash_price).toLocaleString()}</span>
                          </p>
                        )}
                        {app.created_at && (
                          <p className="text-[10px] text-white/30">
                            Applied: {formatDateTime(app.created_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {!isApproved && (
                        <button
                          onClick={() => onApprove(app.id)}
                          disabled={busy}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                          style={{
                            background: "rgba(16,185,129,0.12)",
                            border: "1px solid rgba(16,185,129,0.3)",
                            color: "#10B981",
                          }}
                        >
                          {busy ? (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiCheck size={12} />
                          )}
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => onReject(app.id)}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                        style={{
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          color: "#EF4444",
                        }}
                      >
                        {busy ? (
                          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiX size={12} />
                        )}
                        {isApproved ? "Revoke" : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

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
    <div
      className="group relative rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
      style={{
        background: "#0d0d14",
        border: `1px solid ${cfg.border}`,
        opacity: isActive ? 1 : 0.65,
      }}
    >
      {/* Status bar */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg,${cfg.color},${cfg.color}88)` }}
      />

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg transition-all group-hover:scale-105"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <FiZap size={15} style={{ color: cfg.color }} />
            </div>
            <div>
              <h3
                className="text-sm font-black text-white leading-tight line-clamp-2 group-hover:text-[#FF8C00] transition-colors"
                style={{ fontFamily: "'Playfair Display',serif" }}
              >
                {campaign.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            {cfg.icon} {cfg.label}
          </span>
          <span
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black"
            style={{
              background: isActive ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)",
              color: isActive ? "#10B981" : "rgba(255,255,255,0.3)",
              border: isActive ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {isActive ? "✓ ACTIVE" : "✗ INACTIVE"}
          </span>
        </div>

        {/* Time info */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <FiCalendar size={9} className="text-white/20 shrink-0" />
            <span>
              <span className="text-white/25">Starts:</span>{" "}
              <span className="text-white/60">{formatDateTime(campaign.start_time)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <FiClock size={9} className="text-white/20 shrink-0" />
            <span>
              <span className="text-white/25">Ends:</span>{" "}
              <span className="text-white/60">{formatDateTime(campaign.end_time)}</span>
            </span>
          </div>
        </div>

        {/* Applications count */}
        {applicationCount !== null && (
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg mb-3 cursor-pointer hover:opacity-80 transition"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            onClick={() => onViewApplications(campaign)}
          >
            <span className="text-[10px] text-white/40 flex items-center gap-1.5">
              <FiPackage size={10} /> Product Applications
            </span>
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,140,0,0.12)", color: "#FF8C00" }}
            >
              {applicationCount}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/5">
          <button
            onClick={() => onViewApplications(campaign)}
            disabled={busy}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
            style={{
              background: "rgba(14,165,233,0.08)",
              border: "1px solid rgba(14,165,233,0.2)",
              color: "#0EA5E9",
            }}
            title="View applications"
          >
            <FiPackage size={11} />
            <span>Apps</span>
          </button>

          <button
            onClick={() => onEdit(campaign)}
            disabled={busy}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold transition-all hover:bg-white/10 disabled:opacity-40"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.6)",
            }}
            title="Edit campaign"
          >
            <FiEdit2 size={11} />
            <span>Edit</span>
          </button>

          <button
            onClick={() => onDelete(campaign)}
            disabled={busy}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "#EF4444",
            }}
            title="Delete campaign"
          >
            {busy ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiTrash2 size={11} />
            )}
            <span>Delete</span>
          </button>
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
  const [modal, setModal] = useState(null); // null | "create" | campaign object
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [appsModal, setAppsModal] = useState(null); // campaign object | null
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* Fetch campaigns */
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status_filter", statusFilter);
      const qs = params.toString();
      const response = await ApiService.makeRequest(
        `/admin/campaigns/flash-sale${qs ? `?${qs}` : ""}`,
        { method: "GET" }
      );
      const data = response?.data || response;
      if (Array.isArray(data)) {
        setCampaigns(data);
      } else if (Array.isArray(data?.campaigns)) {
        setCampaigns(data.campaigns);
      } else if (Array.isArray(data?.flash_sales)) {
        setCampaigns(data.flash_sales);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load flash sale campaigns.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  /* Fetch applications */
  const fetchApplications = useCallback(async () => {
    try {
      const response = await ApiService.makeRequest(
        "/admin/campaigns/flash-sale/applications",
        { method: "GET" }
      );
      const data = response?.data || response;
      if (Array.isArray(data)) {
        setApplications(data);
      } else if (Array.isArray(data?.applications)) {
        setApplications(data.applications);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    fetchApplications();
  }, [fetchCampaigns, fetchApplications]);

  /* Save (create or update) */
  const handleSave = async (payload, editId) => {
    setSaving(true);
    try {
      if (editId) {
        await ApiService.makeRequest(`/admin/campaigns/flash-sale/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("Flash sale updated successfully!");
      } else {
        await ApiService.makeRequest("/admin/campaigns/flash-sale", {
          method: "POST",
          body: JSON.stringify(payload),
        });
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

  /* Delete */
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionId(confirmDelete.id);
    const title = confirmDelete.title;
    setConfirmDelete(null);
    try {
      await ApiService.makeRequest(`/admin/campaigns/flash-sale/${confirmDelete.id}`, {
        method: "DELETE",
      });
      showToast(`"${title}" permanently deleted.`);
      await fetchCampaigns();
    } catch (err) {
      showToast(err.message || "Failed to delete campaign.", "error");
    } finally {
      setActionId(null);
    }
  };

  /* Approve application */
  const handleApprove = async (applicationId) => {
    setActionId(applicationId);
    try {
      await ApiService.makeRequest(
        `/admin/campaigns/flash-sale/applications/${applicationId}/approve`,
        { method: "POST" }
      );
      showToast("Application approved!");
      await fetchApplications();
      // Refresh applications shown in modal
      setAppsModal((prev) => prev); // triggers re-render with new applications
    } catch (err) {
      showToast(err.message || "Failed to approve application.", "error");
    } finally {
      setActionId(null);
    }
  };

  /* Reject application */
  const handleReject = async (applicationId) => {
    setActionId(applicationId);
    try {
      await ApiService.makeRequest(
        `/admin/campaigns/flash-sale/applications/${applicationId}/reject`,
        { method: "POST" }
      );
      showToast("Application rejected.");
      await fetchApplications();
    } catch (err) {
      showToast(err.message || "Failed to reject application.", "error");
    } finally {
      setActionId(null);
    }
  };

  /* View applications for a specific campaign */
  const handleViewApplications = (campaign) => {
    setAppsModal(campaign);
  };

  /* Get applications filtered by campaign */
  const getCampaignApplications = (campaign) => {
    if (!campaign) return applications;
    return applications.filter(
      (app) =>
        app.campaign_id === campaign.id ||
        app.flash_sale_id === campaign.id ||
        app.campaign_title === campaign.title
    );
  };

  /* Stats */
  const now = Date.now();
  const liveCount = campaigns.filter((c) => {
    const s = new Date(c.start_time).getTime();
    const e = new Date(c.end_time).getTime();
    return now >= s && now <= e;
  }).length;
  const upcomingCount = campaigns.filter((c) => new Date(c.start_time).getTime() > now).length;
  const pastCount = campaigns.filter((c) => new Date(c.end_time).getTime() < now).length;
  const pendingApps = applications.filter((a) => !a.is_approved).length;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-4">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold"
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

      {/* Modals */}
      {modal && (
        <FlashSaleModal
          initial={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
      {confirmDelete && (
        <DeleteConfirm
          campaignTitle={confirmDelete.title}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={actionId === confirmDelete.id}
        />
      )}
      {appsModal !== null && (
        <ApplicationsModal
          applications={getCampaignApplications(appsModal)}
          onClose={() => setAppsModal(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          actionId={actionId}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-black text-white"
            style={{ fontFamily: "'Playfair Display',serif" }}
          >
            Campaigns
          </h1>
          <p className="text-sm text-white/30 mt-0.5">
            Manage flash sales and seller product applications
            {campaigns.length > 0 && ` • ${liveCount} live, ${upcomingCount} upcoming`}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => { fetchCampaigns(); fetchApplications(); }}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white/50 hover:text-white transition-all disabled:opacity-40 flex-1 sm:flex-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => {
              setAppsModal({});
            }}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all hover:opacity-90 flex-1 sm:flex-none"
            style={{
              background: "rgba(14,165,233,0.12)",
              border: "1px solid rgba(14,165,233,0.3)",
              color: "#0EA5E9",
            }}
          >
            <FiPackage size={14} />
            <span>All Apps {pendingApps > 0 && `(${pendingApps})`}</span>
          </button>
          <button
            onClick={() => setModal("create")}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-98 flex-1 sm:flex-none"
            style={{
              background: "linear-gradient(135deg,#B42225,#FF8C00)",
              boxShadow: "0 4px 12px rgba(180,34,37,0.3)",
            }}
          >
            <FiPlus size={14} />
            <span>New Flash Sale</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total", value: campaigns.length, color: "#0EA5E9", icon: <MdCampaign size={16} /> },
          { label: "Live Now", value: liveCount, color: "#10B981", icon: <FiZap size={14} /> },
          { label: "Upcoming", value: upcomingCount, color: "#FF8C00", icon: <FiClock size={14} /> },
          { label: "Pending Apps", value: pendingApps, color: "#EF4444", icon: <FiPackage size={14} /> },
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
            <p className="text-2xl sm:text-3xl font-black" style={{ color }}>
              {loading ? <FiLoader className="animate-spin inline" size={20} /> : value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <FiFilter size={13} className="text-white/30 shrink-0" />
        <div className="flex gap-2 flex-wrap">
          {["", "current", "upcoming", "past"].map((val) => {
            const labels = { "": "All", current: "Live", upcoming: "Upcoming", past: "Past" };
            const active = statusFilter === val;
            return (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                style={{
                  background: active ? "linear-gradient(135deg,#B42225,#FF8C00)" : "rgba(255,255,255,0.05)",
                  color: active ? "white" : "rgba(255,255,255,0.4)",
                  border: active ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {labels[val]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-xl sm:rounded-2xl px-4 py-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <FiAlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-xs sm:text-sm">{error}</p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl sm:rounded-2xl animate-pulse"
              style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", height: "260px" }}
            />
          ))}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {campaigns.map((campaign) => (
            <FlashSaleCard
              key={campaign.id}
              campaign={campaign}
              onEdit={(c) => setModal(c)}
              onDelete={(c) => setConfirmDelete(c)}
              onViewApplications={handleViewApplications}
              actionId={actionId}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl sm:rounded-3xl p-12 sm:p-16 text-center border"
          style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <FiZap size={48} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm sm:text-base font-bold text-white/30">
            {statusFilter ? `No ${statusFilter} flash sales` : "No flash sales yet"}
          </p>
          {!statusFilter && (
            <button
              onClick={() => setModal("create")}
              className="mt-4 text-xs sm:text-sm font-black text-[#FF8C00] hover:underline"
            >
              + Schedule your first flash sale
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignManagement;