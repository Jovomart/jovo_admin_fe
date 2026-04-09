// src/pages/Sellers.jsx
import { useState, useEffect } from "react";
import AdminApiService from "../services/apiService";
import {
  FiSearch,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiRefreshCw,
  FiCalendar,
} from "react-icons/fi";
import { MdStorefront } from "react-icons/md";

/* ── helpers ─────────────────────────────────────────────────── */
const normalizeList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.items)) return result.items;
  return [];
};

// Treat anything that isn't clearly APPROVED or REJECTED as pending
const PENDING_STATUSES = new Set([
  "PENDING",
  "NEW",
  "SUBMITTED",
  "PENDING_REVIEW",
  "",
]);

const normalizeStatus = (s) =>
  String(s ?? "")
    .toUpperCase()
    .trim();

const isPending = (s) => PENDING_STATUSES.has(normalizeStatus(s));
const isApproved = (s) => normalizeStatus(s) === "APPROVED";

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

/* ── Badge ───────────────────────────────────────────────────── */
const statusColors = {
  PENDING: {
    bg: "rgba(255,140,0,0.1)",
    border: "rgba(255,140,0,0.25)",
    text: "#FF8C00",
  },
  NEW: {
    bg: "rgba(255,140,0,0.1)",
    border: "rgba(255,140,0,0.25)",
    text: "#FF8C00",
  },
  SUBMITTED: {
    bg: "rgba(255,140,0,0.1)",
    border: "rgba(255,140,0,0.25)",
    text: "#FF8C00",
  },
  PENDING_REVIEW: {
    bg: "rgba(255,140,0,0.1)",
    border: "rgba(255,140,0,0.25)",
    text: "#FF8C00",
  },
  APPROVED: {
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
    text: "#10B981",
  },
  REJECTED: {
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
    text: "#EF4444",
  },
};

const Badge = ({ status }) => {
  const key = normalizeStatus(status) || "PENDING";
  const c = statusColors[key] || statusColors.PENDING;
  return (
    <span
      className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
      }}
    >
      {key}
    </span>
  );
};

/* ── Helper to get category IDs from seller (handles both field names) ── */
const getCategoryIds = (seller) => {
  return seller.category_ids || seller.business_category || [];
};

/* ── Category Display Component ─────────────────────────────── */
const CategoryDisplay = ({ seller, categoriesMap }) => {
  const categoryIds = getCategoryIds(seller);

  if (!categoryIds || categoryIds.length === 0) {
    return <span className="text-white/40">—</span>;
  }

  const categoryNames = categoryIds.map(
    (id) => categoriesMap[id] || id.slice(0, 8) + "…",
  );

  return (
    <div className="flex flex-wrap gap-1">
      {categoryNames.slice(0, 2).map((name, idx) => (
        <span
          key={idx}
          className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FF8C00]/10 text-[#FF8C00] truncate max-w-25"
        >
          {name}
        </span>
      ))}
      {categoryNames.length > 2 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">
          +{categoryNames.length - 2}
        </span>
      )}
    </div>
  );
};

/* ── SellerCard ──────────────────────────────────────────────── */
const SellerCard = ({ seller, onAction, tab, categoriesMap }) => {
  const status = normalizeStatus(seller.status || seller.seller_status);
  const showActions = tab === "pending";
  const appliedDate = formatDate(seller.created_at);

  return (
    <div
      className="rounded-2xl p-5 border transition-all hover:border-white/10"
      style={{
        background: "#0d0d14",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}
          >
            {(seller.business_name || seller.name || "S")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white truncate">
              {seller.business_name || seller.name || "Seller"}
            </p>
            <p className="text-xs text-white/30 truncate">
              {seller.email || "—"}
            </p>
          </div>
        </div>
        <Badge
          status={status || (tab === "approved" ? "APPROVED" : "PENDING")}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          {
            label: "ID",
            value: seller.id ? String(seller.id).slice(0, 12) + "…" : "—",
          },
          { label: "Phone", value: seller.phone || "—" },
          {
            label: "Categories",
            value: (
              <CategoryDisplay seller={seller} categoriesMap={categoriesMap} />
            ),
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
            <div className="text-xs font-semibold text-white/60 wrap-break-word">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAction(seller, "view", tab)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white/50 transition-all hover:text-white"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <FiEye size={13} /> View
        </button>
        {showActions && (
          <>
            <button
              onClick={() => onAction(seller, "approve")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all hover:opacity-90"
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
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all hover:opacity-90"
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
      </div>
    </div>
  );
};

/* ── RejectModal ─────────────────────────────────────────────── */
const RejectModal = ({ seller, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 border"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
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
            <p className="text-xs text-white/30">
              {seller?.business_name || seller?.name}
            </p>
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-2">
            Rejection Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Explain why this application is being rejected..."
            className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none resize-none placeholder-white/20"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
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
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50"
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
const DetailModal = ({ seller, onClose, categoriesMap }) => {
  const categoryIds = getCategoryIds(seller);
  const categoryNames = categoryIds
    .map((id) => categoriesMap[id] || id)
    .join(", ");
  const appliedDate = formatDate(seller.created_at);
  const updatedDate = formatDate(seller.updated_at);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border overflow-hidden"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
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
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white transition"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <FiX size={15} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Profile header */}
          <div
            className="flex items-center gap-4 p-4 rounded-2xl flex-wrap sm:flex-nowrap"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0"
              style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}
            >
              {(seller.business_name || seller.name || "S")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-white wrap-break-word">
                {seller.business_name || seller.name || "Seller"}
              </p>
              <p className="text-sm text-white/40 break-all">{seller.email}</p>
              <div className="mt-1">
                <Badge
                  status={
                    seller.status ||
                    seller.seller_status ||
                    (seller._tab === "approved" ? "APPROVED" : "PENDING")
                  }
                />
              </div>
            </div>
          </div>

          {/* Details grid - responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Application ID", value: seller.id || "—" },
              { label: "Phone", value: seller.phone || "—" },
              { label: "Categories", value: categoryNames || "—" },
              {
                label: "Location",
                value:
                  seller.business_address ||
                  seller.location ||
                  seller.city ||
                  "—",
              },
              { label: "Applied On", value: appliedDate },
              { label: "Last Updated", value: updatedDate },
              {
                label: "Document Type",
                value: seller.seller_document_type || "—",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-1">
                  {label}
                </p>
                <p className="text-xs font-semibold text-white/60 wrap-break-word">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Description - full width with proper wrapping */}
          {(seller.short_business_description || seller.description) && (
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-2">
                Description
              </p>
              <p className="text-xs text-white/50 leading-relaxed wrap-break-word whitespace-pre-wrap">
                {seller.short_business_description || seller.description}
              </p>
            </div>
          )}

          {/* Rejection reason if rejected */}
          {seller.rejection_reason && (
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-red-400/60 mb-2">
                Rejection Reason
              </p>
              <p className="text-xs text-red-300/70 leading-relaxed wrap-break-word whitespace-pre-wrap">
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
const Toast = ({ msg, type }) => (
  <div
    className="fixed top-6 right-6 z-100 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold"
    style={{
      background:
        type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
      border: `1px solid ${type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
      color: type === "error" ? "#EF4444" : "#10B981",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}
  >
    {type === "error" ? <FiAlertCircle size={15} /> : <FiCheck size={15} />}
    {msg}
  </div>
);

/* ── Main ────────────────────────────────────────────────────── */
const Sellers = () => {
  const [tab, setTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [toast, setToast] = useState(null);

  // Categories map for displaying category names
  const [categoriesMap, setCategoriesMap] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Fetch all categories to build a name map
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await AdminApiService.getAdminCategories(
        "PRODUCT",
        true,
      );
      let categoriesArray = [];
      if (Array.isArray(response)) {
        categoriesArray = response;
      } else if (
        response?.data?.categories &&
        Array.isArray(response.data.categories)
      ) {
        categoriesArray = response.data.categories;
      } else if (response?.categories && Array.isArray(response.categories)) {
        categoriesArray = response.categories;
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesArray = response.data;
      }

      const map = {};
      categoriesArray.forEach((cat) => {
        map[cat.id] = cat.name;
      });
      setCategoriesMap(map);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchData = async () => {
    setLoadingData(true);
    setError("");
    try {
      const [pRes, aRes] = await Promise.all([
        AdminApiService.getPendingSellers(),
        AdminApiService.getApprovedSellers(),
      ]);

      const pendingRaw = normalizeList(pRes);
      const approvedRaw = normalizeList(aRes);

      const pendingList = pendingRaw.filter((s) => {
        const st = normalizeStatus(s.status || s.seller_status);
        return !st || isPending(st);
      });

      const approvedList = approvedRaw.filter((s) => {
        const st = normalizeStatus(s.status || s.seller_status);
        return !st || isApproved(st);
      });

      setPending(pendingList);
      setApproved(approvedList);
    } catch (err) {
      setError(err.message || "Failed to fetch sellers");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (seller, action) => {
    if (action === "view") {
      setDetailModal({ ...seller, _tab: tab });
      return;
    }
    if (action === "reject") {
      setRejectModal(seller);
      return;
    }

    if (action === "approve") {
      setActionLoading(true);
      try {
        await AdminApiService.approveRejectSeller({
          appliedSellerId: seller.id,
          status: "APPROVED",
          rejectionReason: "",
        });

        const approvedSeller = { ...seller, status: "APPROVED" };
        setPending((prev) => prev.filter((s) => s.id !== seller.id));
        setApproved((prev) => {
          const without = prev.filter((s) => s.id !== seller.id);
          return [approvedSeller, ...without];
        });

        showToast(
          `${seller.business_name || seller.name || "Seller"} approved successfully!`,
        );
      } catch (err) {
        showToast(err.message || "Failed to approve seller.", "error");
        fetchData();
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRejectConfirm = async (reason) => {
    setActionLoading(true);
    try {
      await AdminApiService.approveRejectSeller({
        appliedSellerId: rejectModal.id,
        status: "REJECTED",
        rejectionReason: reason,
      });

      setPending((prev) => prev.filter((s) => s.id !== rejectModal.id));
      setRejectModal(null);
      showToast("Application rejected.");
    } catch (err) {
      showToast(err.message || "Failed to reject seller.", "error");
      fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const list = tab === "pending" ? pending : approved;
  const filtered = list.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (s.business_name || s.name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
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
          categoriesMap={categoriesMap}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-2xl font-black text-white"
            style={{ fontFamily: "'Playfair Display',serif" }}
          >
            Seller Management
          </h1>
          <p className="text-sm text-white/30 mt-0.5">
            Review applications and manage approved sellers
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loadingData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all disabled:opacity-40"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <FiRefreshCw
            size={13}
            className={loadingData ? "animate-spin" : ""}
          />{" "}
          Refresh
        </button>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {[
            { key: "pending", label: "Pending", count: pending.length },
            { key: "approved", label: "Approved", count: approved.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${tab === key ? "text-white" : "text-white/30 hover:text-white/60"}`}
              style={
                tab === key
                  ? {
                      background:
                        "linear-gradient(135deg,rgba(180,34,37,0.4),rgba(255,140,0,0.2))",
                      border: "1px solid rgba(180,34,37,0.3)",
                    }
                  : {}
              }
            >
              {label}
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${tab === key ? "bg-white/20 text-white" : "bg-white/8 text-white/30"}`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        <div
          className="flex-1 flex items-center gap-2 rounded-2xl border px-3 py-2.5"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <FiSearch size={14} className="text-white/25 shrink-0" />
          <input
            type="text"
            placeholder="Search sellers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <FiX
                size={13}
                className="text-white/25 hover:text-white transition-colors"
              />
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
                height: "220px",
              }}
            />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <SellerCard
              key={s.id}
              seller={s}
              onAction={handleAction}
              tab={tab}
              categoriesMap={categoriesMap}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-3xl p-16 text-center border"
          style={{
            background: "#0d0d14",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <MdStorefront size={40} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm font-bold text-white/30">
            No {tab} sellers found
          </p>
          {search && (
            <p className="text-xs text-white/15 mt-1">
              Try a different search term
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Sellers;
