// src/pages/AdminProducts.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import ApiService from "../services/apiService";
import {
  FiPackage,
  FiSearch,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiLoader,
  FiStar,
  FiTag,
  FiUser,
  FiCalendar,
  FiImage,
  FiLayers,
  FiArrowLeft,
} from "react-icons/fi";

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════ */

/* Maps whatever the API sends → one of: "pending" | "approved" | "rejected"
   hint: the tab we fetched from — used as authoritative fallback when the
   product's own status field is missing or unrecognised                      */
const normalizeStatus = (raw, hint) => {
  if (raw !== null && raw !== undefined) {
    const s = String(raw).toLowerCase().trim();
    if (["approved", "active", "accepted", "published", "1", "true"].includes(s)) return "approved";
    if (["rejected", "declined", "denied", "banned", "0", "false"].includes(s)) return "rejected";
    if (["pending", "review", "awaiting", "under_review", "in_review"].includes(s)) return "pending";
  }
  // Fall back to the tab we fetched from — it's always correct
  if (hint && hint !== "all") return hint;
  return "pending";
};

const parseProducts = (raw, statusHint = null) => {
  if (!raw) return { items: [], total: 0, page: 1, pages: 1 };

  const data = raw.data || raw;

  let items = [];
  let total = 0;
  let page = 1;
  let pages = 1;

  if (Array.isArray(data?.products)) {
    items = data.products;
    total = data.total ?? data.total_count ?? items.length;
    page = data.page ?? data.current_page ?? 1;
    pages = (data.pages ?? data.total_pages ?? Math.ceil(total / 20)) || 1;
  } else if (Array.isArray(data?.items)) {
    items = data.items;
    total = data.total ?? items.length;
    page = data.page ?? 1;
    pages = (data.pages ?? Math.ceil(total / 20)) || 1;
  } else if (Array.isArray(data?.results)) {
    items = data.results;
    total = data.count ?? data.total ?? items.length;
    page = data.page ?? 1;
    pages = (data.pages ?? Math.ceil(total / 20)) || 1;
  } else if (Array.isArray(data?.data)) {
    items = data.data;
    total = data.total ?? items.length;
    page = data.page ?? 1;
    pages = data.pages ?? 1;
  } else if (Array.isArray(data)) {
    items = data;
    total = items.length;
  }

  const normalized = items.map((p) => {
    // ── id ────────────────────────────────────────────────────────
    const id =
      p.id ?? p._id ?? p.product_id ?? p.productId ?? p.uuid ?? null;

    // ── name ──────────────────────────────────────────────────────
    const name =
      p.product_name || p.productName || p.name || p.title || p.item_name || "—";

    // ── price ─────────────────────────────────────────────────────
    // API schema: product_original_price + product_discount_price (when is_on_sale)
    const rawPrice =
      (p.is_on_sale && (p.product_discount_price ?? p.productDiscountPrice))
        ? (p.product_discount_price ?? p.productDiscountPrice)
        : p.product_original_price ??
          p.productOriginalPrice ??
          p.price ??
          p.selling_price ??
          p.sellingPrice ??
          p.sale_price ??
          p.salePrice ??
          p.unit_price ??
          p.unitPrice ??
          p.amount ??
          p.product_price ??
          p.productPrice ??
          p.base_price ??
          p.basePrice ??
          p.cost ??
          p.retail_price ??
          p.retailPrice ??
          p.list_price ??
          p.listPrice ??
          null;
    const price = rawPrice !== null ? parseFloat(rawPrice) : null;
    const original_price = p.product_original_price ?? p.productOriginalPrice ?? null;
    const is_on_sale = p.is_on_sale ?? p.isOnSale ?? false;

    // ── status ────────────────────────────────────────────────────
    const status = normalizeStatus(
      p.status ??
        p.approval_status ??
        p.approvalStatus ??
        p.product_status ??
        p.productStatus ??
        p.state ??
        p.listing_status ??
        p.listingStatus,
      statusHint
    );

    // ── seller name ───────────────────────────────────────────────
    const seller_name =
      p.seller_name ||
      p.sellerName ||
      p.seller?.business_name ||
      p.seller?.businessName ||
      p.seller?.shop_name ||
      p.seller?.shopName ||
      p.seller?.store_name ||
      p.seller?.storeName ||
      p.seller?.name ||
      p.seller?.full_name ||
      p.seller?.fullName ||
      p.seller?.username ||
      p.vendor_name ||
      p.vendorName ||
      p.vendor?.name ||
      p.vendor?.business_name ||
      p.store_name ||
      p.storeName ||
      p.shop_name ||
      p.shopName ||
      p.business_name ||
      p.businessName ||
      null;

    // ── category ──────────────────────────────────────────────────
    const category =
      p.category_name ||
      p.categoryName ||
      p.category?.name ||
      (typeof p.category === "string" ? p.category : null) ||
      p.subcategory?.name ||
      p.sub_category ||
      "Uncategorised";

    // ── images ────────────────────────────────────────────────────
    const images = (() => {
      const raw =
        p.images ||
        p.product_images ||
        p.productImages ||
        p.image_urls ||
        p.imageUrls ||
        p.photos ||
        null;
      if (Array.isArray(raw)) return raw.filter(Boolean);
      // single-image fields
      const single =
        p.image_url ||
        p.imageUrl ||
        p.thumbnail ||
        p.image ||
        p.photo ||
        null;
      return single ? [single] : [];
    })();

    // ── dates ─────────────────────────────────────────────────────
    const created_at =
      p.created_at || p.createdAt || p.date_created || p.dateCreated || null;

    // ── description ───────────────────────────────────────────────
    const description =
      p.product_description ||
      p.productDescription ||
      p.description ||
      p.details ||
      p.summary ||
      "";

    // ── stock ─────────────────────────────────────────────────────
    const stock =
      p.stock ??
      p.quantity ??
      p.stock_quantity ??
      p.stockQuantity ??
      p.quantity_available ??
      p.available_quantity ??
      p.inventory ??
      null;

    // ── rating ────────────────────────────────────────────────────
    const average_rating =
      p.average_rating ??
      p.averageRating ??
      p.rating ??
      p.avg_rating ??
      undefined;

    return {
      ...p,
      id,
      name,
      price,
      original_price,
      is_on_sale,
      status,
      seller_name,
      category,
      images,
      created_at,
      description,
      stock,
      average_rating,
    };
  });

  return { items: normalized, total, page, pages };
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const statusConfig = {
  pending: {
    label: "Pending",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    Icon: FiClock,
  },
  approved: {
    label: "Approved",
    color: "#10B981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
    Icon: FiCheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
    Icon: FiXCircle,
  },
};

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
const Toast = ({ toast }) => {
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div
      className="fixed top-5 right-5 z-200 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold pointer-events-none"
      style={{
        background: isErr ? "rgba(239,68,68,0.14)" : "rgba(16,185,129,0.14)",
        border: `1px solid ${isErr ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
        color: isErr ? "#EF4444" : "#10B981",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
        animation: "slideInRight 0.25s ease",
      }}
    >
      {isErr ? <FiAlertCircle size={15} /> : <FiCheck size={15} />}
      <span style={{ maxWidth: 340 }}>{toast.msg}</span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   STATUS BADGE
═══════════════════════════════════════════════════════════════ */
const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.pending;
  const { Icon } = cfg;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full"
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════
   REJECT MODAL
═══════════════════════════════════════════════════════════════ */
const RejectModal = ({ product, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = () => {
    if (!reason.trim()) {
      setErr("Please provide a rejection reason.");
      return;
    }
    onConfirm(product.id, reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}
    >
      <div
        className="w-full max-w-md rounded-3xl flex flex-col"
        style={{
          background: "#0c0c13",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <FiXCircle size={16} className="text-red-400" />
          </div>
          <div>
            <h3
              className="text-sm font-black text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Reject Product
            </h3>
            <p className="text-[11px] text-white/30 mt-0.5 truncate max-w-xs">
              {product?.name}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              Rejection Reason *
            </label>
            <textarea
              placeholder="Explain why this product is being rejected — the seller will see this feedback…"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErr("");
              }}
              rows={4}
              className="w-full rounded-2xl border px-4 py-3 text-sm text-white bg-transparent outline-none transition-all placeholder-white/20 resize-none"
              style={{
                border: err
                  ? "1px solid rgba(239,68,68,0.4)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: err
                  ? "rgba(239,68,68,0.05)"
                  : "rgba(255,255,255,0.04)",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = err
                  ? "rgba(239,68,68,0.5)"
                  : "rgba(255,140,0,0.5)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = err
                  ? "rgba(239,68,68,0.4)"
                  : "rgba(255,255,255,0.08)")
              }
              disabled={loading}
            />
            {err && <p className="text-xs text-red-400 mt-1">{err}</p>}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white/40 hover:text-white transition-colors disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #7f1d1d, #ef4444)",
              boxShadow: "0 6px 20px rgba(239,68,68,0.25)",
            }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FiXCircle size={14} />
                Reject Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   APPROVE CONFIRM MODAL
═══════════════════════════════════════════════════════════════ */
const ApproveConfirm = ({ product, onConfirm, onCancel, loading }) => (
  <div
    className="fixed inset-0 z-100 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
    onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}
  >
    <div
      className="w-full max-w-sm rounded-3xl p-7 text-center"
      style={{
        background: "#0c0c13",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(16,185,129,0.2)",
        }}
      >
        <FiCheckCircle size={24} className="text-emerald-400" />
      </div>
      <h3
        className="text-base font-black text-white mb-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Approve Product?
      </h3>
      <p className="text-sm text-white/40 leading-relaxed mb-1">
        You are about to approve
      </p>
      <p className="text-sm font-bold text-white mb-5 line-clamp-2 px-2">
        "{product?.name}"
      </p>
      <p className="text-xs text-white/25 mb-6">
        This will make the product visible to buyers on the platform.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white transition-colors disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(product.id)}
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, #065f46, #10b981)",
            boxShadow: "0 6px 20px rgba(16,185,129,0.25)",
          }}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <FiCheck size={14} />
              Approve
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   PRODUCT DETAIL DRAWER
═══════════════════════════════════════════════════════════════ */
const ProductDetailDrawer = ({
  product,
  onClose,
  onApprove,
  onReject,
  actionId,
}) => {
  const [imgIdx, setImgIdx] = useState(0);
  const busy = actionId === product?.id;

  if (!product) return null;

  const images = product.images || [];
  const status = product.status || "pending";
  const isPending = status === "pending";

  return (
    <div
      className="fixed inset-0 z-90 flex justify-end"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-xl h-full flex flex-col overflow-hidden"
        style={{
          background: "#0c0c13",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "-40px 0 100px rgba(0,0,0,0.6)",
          animation: "slideInDrawer 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold"
          >
            <FiArrowLeft size={16} />
            Back
          </button>
          <StatusBadge status={status} />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Image gallery */}
          <div
            className="relative flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.02)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              minHeight: 220,
              maxHeight: 280,
            }}
          >
            {images.length > 0 ? (
              <>
                <img
                  src={images[imgIdx]}
                  alt={product.name}
                  className="object-contain w-full"
                  style={{ maxHeight: 260 }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling &&
                      (e.target.nextSibling.style.display = "flex");
                  }}
                />
                <div
                  className="hidden items-center justify-center w-full h-52 flex-col gap-2"
                  style={{ color: "rgba(255,255,255,0.1)" }}
                >
                  <FiImage size={36} />
                  <span className="text-xs">Image unavailable</span>
                </div>
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIdx(i)}
                        className="rounded-full transition-all"
                        style={{
                          width: i === imgIdx ? 20 : 6,
                          height: 6,
                          background:
                            i === imgIdx ? "#FF8C00" : "rgba(255,255,255,0.2)",
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 h-52"
                style={{ color: "rgba(255,255,255,0.1)" }}
              >
                <FiImage size={40} />
                <span className="text-xs text-white/20">No images</span>
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="p-6 space-y-5">
            {/* Name & price */}
            <div>
              <h2
                className="text-xl font-black text-white leading-tight mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {product.name}
              </h2>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black" style={{ color: "#FF8C00" }}>
                  {formatCurrency(product.price)}
                </p>
                {product.is_on_sale && product.original_price != null && (
                  <p className="text-sm line-through" style={{ color: "rgba(255,255,255,0.2)" }}>
                    {formatCurrency(product.original_price)}
                  </p>
                )}
              </div>
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2">
              {product.category && (
                <span
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl"
                  style={{
                    background: "rgba(255,140,0,0.08)",
                    border: "1px solid rgba(255,140,0,0.15)",
                    color: "#FF8C00",
                  }}
                >
                  <FiLayers size={10} />
                  {product.category}
                </span>
              )}
              {product.stock !== null && product.stock !== undefined && (
                <span
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl"
                  style={{
                    background: "rgba(14,165,233,0.08)",
                    border: "1px solid rgba(14,165,233,0.15)",
                    color: "#0EA5E9",
                  }}
                >
                  <FiTag size={10} />
                  Stock: {product.stock}
                </span>
              )}
            </div>

            {/* Detail rows */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                { icon: FiUser, label: "Seller", value: product.seller_name || "Seller name unavailable" },
                {
                  icon: FiCalendar,
                  label: "Submitted",
                  value: formatDate(product.created_at),
                },
                {
                  icon: FiStar,
                  label: "Rating",
                  value:
                    product.average_rating !== undefined
                      ? `${product.average_rating} / 5`
                      : "No ratings yet",
                },
              ].map(({ icon: Icon, label, value }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{
                    borderBottom:
                      i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background:
                      i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                  }}
                >
                  <Icon size={13} className="text-white/25 shrink-0" />
                  <span className="text-xs text-white/35 font-semibold w-20 shrink-0">
                    {label}
                  </span>
                  <span className="text-xs text-white/70 font-bold truncate">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[2px] text-white/25 mb-2">
                  Description
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {product.description}
                </p>
              </div>
            )}

            {/* Rejection reason if rejected */}
            {status === "rejected" && product.rejection_reason && (
              <div
                className="rounded-2xl px-4 py-4"
                style={{
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.18)",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[2px] text-red-400/60 mb-1.5">
                  Rejection Reason
                </p>
                <p className="text-sm text-red-400/80 leading-relaxed">
                  {product.rejection_reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action footer — only for pending */}
        {isPending && (
          <div
            className="flex gap-3 px-6 py-4 border-t shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => onReject(product)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black transition-all disabled:opacity-50 hover:opacity-90"
              style={{
                background: "rgba(239,68,68,0.09)",
                border: "1px solid rgba(239,68,68,0.22)",
                color: "#EF4444",
              }}
            >
              {busy ? (
                <FiLoader size={14} className="animate-spin" />
              ) : (
                <FiXCircle size={14} />
              )}
              Reject
            </button>
            <button
              onClick={() => onApprove(product)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #B42225, #FF8C00)",
                boxShadow: "0 6px 24px rgba(180,34,37,0.3)",
              }}
            >
              {busy ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiCheckCircle size={14} />
              )}
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PRODUCT CARD
═══════════════════════════════════════════════════════════════ */
const ProductCard = ({ product, onView, onApprove, onReject, actionId }) => {
  const busy = actionId === product.id;
  const status = product.status || "pending";
  const isPending = status === "pending";
  const image = product.images?.[0];

  return (
    <div
      className="rounded-2xl flex flex-col transition-all group"
      style={{
        background: "#0d0d14",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Image */}
      <div
        className="relative rounded-t-2xl overflow-hidden flex items-center justify-center"
        style={{
          background: "rgba(255,255,255,0.02)",
          height: 160,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="object-contain w-full h-full transition-transform group-hover:scale-102 p-2"
            style={{ background: "rgba(255,255,255,0.03)" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`${image ? "hidden" : "flex"} items-center justify-center w-full h-full flex-col gap-1`}
        >
          <FiImage size={28} className="text-white/10" />
          <span className="text-[10px] text-white/15">No image</span>
        </div>

        <div className="absolute top-2.5 right-2.5">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-sm font-black text-white leading-tight line-clamp-2 mb-1">
          {product.name}
        </p>
        <p className="text-[11px] mb-2 truncate" style={{ color: product.seller_name ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)" }}>
          {product.seller_name || "Seller name unavailable"}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-base font-black" style={{ color: "#FF8C00" }}>
              {formatCurrency(product.price)}
            </span>
            {product.is_on_sale && product.original_price != null && (
              <span className="text-[10px] line-through" style={{ color: "rgba(255,255,255,0.2)" }}>
                {formatCurrency(product.original_price)}
              </span>
            )}
          </div>
          {product.category && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg truncate max-w-27.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              {product.category}
            </span>
          )}
        </div>

        <p className="text-[11px] text-white/20 mb-4">
          <FiCalendar className="inline mr-1" size={10} />
          {formatDate(product.created_at)}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onView(product)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <FiEye size={12} />
            View
          </button>

          {isPending && (
            <>
              <button
                onClick={() => onReject(product)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  color: "#EF4444",
                }}
              >
                {busy ? (
                  <FiLoader size={12} className="animate-spin" />
                ) : (
                  <FiXCircle size={12} />
                )}
                Reject
              </button>
              <button
                onClick={() => onApprove(product)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #B42225, #FF8C00)",
                  boxShadow: "0 4px 14px rgba(180,34,37,0.25)",
                }}
              >
                {busy ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiCheckCircle size={12} />
                )}
                Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SKELETON CARD
═══════════════════════════════════════════════════════════════ */
const SkeletonCard = () => (
  <div
    className="rounded-2xl animate-pulse overflow-hidden"
    style={{
      background: "#0d0d14",
      border: "1px solid rgba(255,255,255,0.05)",
    }}
  >
    <div style={{ height: 160, background: "rgba(255,255,255,0.04)" }} />
    <div className="p-4 space-y-3">
      <div
        className="h-3.5 rounded-lg w-3/4"
        style={{ background: "rgba(255,255,255,0.05)" }}
      />
      <div
        className="h-2.5 rounded-lg w-1/2"
        style={{ background: "rgba(255,255,255,0.03)" }}
      />
      <div
        className="h-4 rounded-lg w-1/3"
        style={{ background: "rgba(255,255,255,0.05)" }}
      />
      <div className="flex gap-2 pt-1">
        <div
          className="h-9 rounded-xl flex-1"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="h-9 rounded-xl flex-1"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="h-9 rounded-xl flex-1"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   FILTER PILL
═══════════════════════════════════════════════════════════════ */
const FilterPill = ({ label, count, active, onClick, color }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
    style={{
      background: active
        ? color
          ? `rgba(${color},0.12)`
          : "rgba(255,140,0,0.12)"
        : "rgba(255,255,255,0.04)",
      border: active
        ? color
          ? `1px solid rgba(${color},0.3)`
          : "1px solid rgba(255,140,0,0.3)"
        : "1px solid rgba(255,255,255,0.07)",
      color: active
        ? color
          ? `rgb(${color})`
          : "#FF8C00"
        : "rgba(255,255,255,0.35)",
    }}
  >
    {label}
    {count !== undefined && (
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
        style={{
          background: active
            ? color
              ? `rgba(${color},0.2)`
              : "rgba(255,140,0,0.2)"
            : "rgba(255,255,255,0.07)",
        }}
      >
        {count}
      </span>
    )}
  </button>
);

/* ═══════════════════════════════════════════════════════════════
   PAGINATION
═══════════════════════════════════════════════════════════════ */
const Pagination = ({ page, pages, total, onPageChange, loading }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-white/25 font-semibold">
        Page {page} of {pages} &nbsp;·&nbsp; {total} products
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <FiChevronLeft size={13} />
          Prev
        </button>

        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          let p;
          if (pages <= 5) p = i + 1;
          else if (page <= 3) p = i + 1;
          else if (page >= pages - 2) p = pages - 4 + i;
          else p = page - 2 + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={loading}
              className="w-8 h-8 rounded-xl text-xs font-black transition-all disabled:opacity-50"
              style={{
                background:
                  p === page
                    ? "linear-gradient(135deg, #B42225, #FF8C00)"
                    : "rgba(255,255,255,0.05)",
                border:
                  p === page ? "none" : "1px solid rgba(255,255,255,0.08)",
                color: p === page ? "#fff" : "rgba(255,255,255,0.35)",
                boxShadow:
                  p === page ? "0 4px 14px rgba(180,34,37,0.3)" : "none",
              }}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages || loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Next
          <FiChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // separate loading for approve/reject
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const PAGE_SIZE = 18;

  const [viewProduct, setViewProduct] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  /* ── Counts (all three statuses, always visible) ────────────── */
  const [counts, setCounts] = useState({ pending: null, approved: null, rejected: null });

  const fetchCounts = useCallback(async () => {
    try {
      const [pendingRaw, approvedRaw, rejectedRaw] = await Promise.all([
        ApiService.getPendingProducts({ page: 1, page_size: 1 }),
        ApiService.getAllProducts({ status_filter: "approved", page: 1, page_size: 1 }),
        ApiService.getAllProducts({ status_filter: "rejected", page: 1, page_size: 1 }),
      ]);
      setCounts({
        pending: parseProducts(pendingRaw, "pending").total,
        approved: parseProducts(approvedRaw, "approved").total,
        rejected: parseProducts(rejectedRaw, "rejected").total,
      });
    } catch {
      // Counts are non-critical — fail silently
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  /* ── Fetch products ─────────────────────────────────────────── */
  const fetchProducts = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      setError("");
      try {
        let raw;
        if (statusFilter === "pending") {
          raw = await ApiService.getPendingProducts({
            page,
            page_size: PAGE_SIZE,
          });
        } else {
          raw = await ApiService.getAllProducts({
            status_filter: statusFilter === "all" ? undefined : statusFilter,
            page,
            page_size: PAGE_SIZE,
          });
        }
        const { items, total, pages } = parseProducts(raw, statusFilter);
        // DEBUG — remove once fields are confirmed correct:
        if (items.length > 0) {
          console.log("📦 Raw product sample:", JSON.stringify(items[0].__proto__ ? Object.assign({}, raw?.data?.products?.[0] || raw?.data?.items?.[0] || raw?.data?.[0] || (Array.isArray(raw?.data) ? raw.data[0] : null) || raw?.products?.[0] || raw?.items?.[0] || raw?.[0] || "see raw below") : null, 2));
          console.log("📦 Normalized sample:", { id: items[0].id, name: items[0].name, price: items[0].price, status: items[0].status, seller_name: items[0].seller_name, images: items[0].images });
          console.log("📦 Full raw response:", raw);
        }
        setProducts(items);
        setPagination({ total, pages });
      } catch (err) {
        console.error("fetchProducts error:", err);
        setError(err.message || "Failed to load products.");
        showToast(err.message || "Failed to load products", "error");
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [statusFilter, page, showToast]
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  /* ── Approve ──────────────────────────────────────────────────
     Flow:
     1. Optimistically remove / update the product in local state immediately
        so the UI reflects the change without waiting for a re-fetch.
     2. Call the API.
     3. On success → silent background re-fetch to sync server truth.
     4. On failure → roll back the optimistic change and show an error.
  ─────────────────────────────────────────────────────────────── */
  const handleApprove = async (productId) => {
    setActionId(productId);
    setActionLoading(true);

    // Snapshot for rollback
    const prevProducts = products;
    const prevPagination = pagination;

    // Close modals immediately for snappy UX
    setApproveTarget(null);
    setViewProduct(null);

    // Optimistic update:
    // • On "pending" tab  → remove from list (it's no longer pending)
    // • On "approved" tab → update status in place
    // • On "all" tab      → update status in place
    setProducts((prev) => {
      if (statusFilter === "pending") {
        const next = prev.filter((p) => p.id !== productId);
        setPagination((pg) => ({
          ...pg,
          total: Math.max(0, pg.total - 1),
        }));
        return next;
      }
      return prev.map((p) =>
        p.id === productId ? { ...p, status: "approved" } : p
      );
    });

    // Optimistically adjust counts
    setCounts((prev) => ({
      ...prev,
      pending: Math.max(0, (prev.pending ?? 1) - 1),
      approved: (prev.approved ?? 0) + 1,
    }));

    try {
      await ApiService.approveProduct(productId);
      showToast("Product approved successfully!");
      // Background sync — don't show full-page loader
      await Promise.all([fetchProducts(false), fetchCounts()]);
    } catch (err) {
      // Roll back optimistic change
      setProducts(prevProducts);
      setPagination(prevPagination);
      setCounts((prev) => ({
        ...prev,
        pending: (prev.pending ?? 0) + 1,
        approved: Math.max(0, (prev.approved ?? 1) - 1),
      }));
      showToast(err.message || "Failed to approve product.", "error");
    } finally {
      setActionId(null);
      setActionLoading(false);
    }
  };

  /* ── Reject ───────────────────────────────────────────────────
     Same optimistic pattern as approve.
  ─────────────────────────────────────────────────────────────── */
  const handleReject = async (productId, reason) => {
    setActionId(productId);
    setActionLoading(true);

    const prevProducts = products;
    const prevPagination = pagination;

    // Close modals immediately
    setRejectTarget(null);
    setViewProduct(null);

    // Optimistic update
    setProducts((prev) => {
      if (statusFilter === "pending") {
        const next = prev.filter((p) => p.id !== productId);
        setPagination((pg) => ({
          ...pg,
          total: Math.max(0, pg.total - 1),
        }));
        return next;
      }
      if (statusFilter === "approved") {
        // Remove from approved list since it's now rejected
        const next = prev.filter((p) => p.id !== productId);
        setPagination((pg) => ({
          ...pg,
          total: Math.max(0, pg.total - 1),
        }));
        return next;
      }
      // "all" or "rejected" → update status in place
      return prev.map((p) =>
        p.id === productId ? { ...p, status: "rejected" } : p
      );
    });

    // Optimistic counts update
    setCounts((prev) => ({
      ...prev,
      pending: Math.max(0, (prev.pending ?? 1) - 1),
      rejected: (prev.rejected ?? 0) + 1,
    }));

    try {
      await ApiService.rejectProduct(productId, reason);
      showToast("Product rejected.");
      await Promise.all([fetchProducts(false), fetchCounts()]);
    } catch (err) {
      setProducts(prevProducts);
      setPagination(prevPagination);
      setCounts((prev) => ({
        ...prev,
        pending: (prev.pending ?? 0) + 1,
        rejected: Math.max(0, (prev.rejected ?? 1) - 1),
      }));
      showToast(err.message || "Failed to reject product.", "error");
    } finally {
      setActionId(null);
      setActionLoading(false);
    }
  };

  /* ── Client-side search filter ───────────────────────────────── */
  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.seller_name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInDrawer {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <Toast toast={toast} />

      {/* Modals */}
      {approveTarget && (
        <ApproveConfirm
          product={approveTarget}
          onConfirm={handleApprove}
          onCancel={() => !actionLoading && setApproveTarget(null)}
          loading={actionLoading && actionId === approveTarget.id}
        />
      )}
      {rejectTarget && (
        <RejectModal
          product={rejectTarget}
          onConfirm={handleReject}
          onCancel={() => !actionLoading && setRejectTarget(null)}
          loading={actionLoading && actionId === rejectTarget.id}
        />
      )}
      {viewProduct && (
        <ProductDetailDrawer
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          onApprove={(p) => {
            setViewProduct(null);
            setApproveTarget(p);
          }}
          onReject={(p) => {
            setViewProduct(null);
            setRejectTarget(p);
          }}
          actionId={actionId}
        />
      )}

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
        <div>
          <h1
            className="text-2xl font-black text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Product Management
          </h1>
          <p className="text-sm text-white/30 mt-0.5">
            Review, approve, and manage seller products
          </p>
        </div>

        <button
          onClick={() => fetchProducts(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all disabled:opacity-40 self-start"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Pending Review",
            value: counts.pending,
            color: "#F59E0B",
            bg: "rgba(245,158,11,0.07)",
            border: "rgba(245,158,11,0.15)",
            Icon: FiClock,
          },
          {
            label: "Approved",
            value: counts.approved,
            color: "#10B981",
            bg: "rgba(16,185,129,0.07)",
            border: "rgba(16,185,129,0.15)",
            Icon: FiCheckCircle,
          },
          {
            label: "Rejected",
            value: counts.rejected,
            color: "#EF4444",
            bg: "rgba(239,68,68,0.07)",
            border: "rgba(239,68,68,0.15)",
            Icon: FiXCircle,
          },
          {
            label: "Shown on Page",
            value: loading ? null : filtered.length,
            color: "#0EA5E9",
            bg: "rgba(14,165,233,0.07)",
            border: "rgba(14,165,233,0.15)",
            Icon: FiPackage,
          },
        ].map(({ label, value, color, bg, border, Icon }) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{
              background: "#0d0d14",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <Icon size={15} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-black mb-0.5" style={{ color }}>
                {value === null ? (
                  <span
                    className="inline-block h-6 w-8 rounded-lg animate-pulse"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  />
                ) : (
                  value
                )}
              </p>
              <p className="text-[11px] text-white/30 font-semibold leading-tight">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Filters ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex items-center gap-3 flex-1 rounded-2xl border px-4 py-3 transition-all focus-within:border-[#FF8C00]/40"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <FiSearch size={15} className="text-white/25 shrink-0" />
          <input
            type="text"
            placeholder="Search by product name, seller, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-white/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-white/25 hover:text-white transition-colors"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <FilterPill
            label="Pending"
            count={counts.pending ?? undefined}
            active={statusFilter === "pending"}
            onClick={() => setStatusFilter("pending")}
            color="245,158,11"
          />
          <FilterPill
            label="Approved"
            count={counts.approved ?? undefined}
            active={statusFilter === "approved"}
            onClick={() => setStatusFilter("approved")}
            color="16,185,129"
          />
          <FilterPill
            label="Rejected"
            count={counts.rejected ?? undefined}
            active={statusFilter === "rejected"}
            onClick={() => setStatusFilter("rejected")}
            color="239,68,68"
          />
          <FilterPill
            label="All"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────── */}
      {error && (
        <div
          className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
          style={{
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.18)",
          }}
        >
          <FiAlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button
            onClick={() => fetchProducts(true)}
            className="text-xs font-bold text-red-400/70 hover:text-red-400 transition-colors underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <>
          {search && (
            <p className="text-xs text-white/25">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "
              <span className="text-white/40">{search}</span>"
            </p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={setViewProduct}
                onApprove={setApproveTarget}
                onReject={setRejectTarget}
                actionId={actionId}
              />
            ))}
          </div>
          <Pagination
            page={page}
            pages={pagination.pages}
            total={pagination.total}
            onPageChange={setPage}
            loading={loading}
          />
        </>
      ) : (
        <div
          className="rounded-3xl p-16 text-center border"
          style={{
            background: "#0d0d14",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {search ? (
            <>
              <FiSearch size={36} className="text-white/10 mx-auto mb-3" />
              <p className="text-sm font-bold text-white/30">
                No products match "{search}"
              </p>
              <button
                onClick={() => setSearch("")}
                className="mt-3 text-xs font-bold text-[#FF8C00]/60 hover:text-[#FF8C00] transition-colors"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: "rgba(255,140,0,0.07)",
                  border: "1px solid rgba(255,140,0,0.12)",
                }}
              >
                <FiPackage size={28} className="text-[#FF8C00]/30" />
              </div>
              <p className="text-sm font-bold text-white/30 mb-1">
                No {statusFilter === "all" ? "" : statusFilter} products found
              </p>
              <p className="text-xs text-white/20">
                {statusFilter === "pending"
                  ? "All caught up — no products awaiting review."
                  : `There are no ${statusFilter} products at this time.`}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;