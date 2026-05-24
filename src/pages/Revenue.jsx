// src/pages/Revenue.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import ApiService from "../services/apiService";
import {
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiX,
  FiCheck,
  FiLoader,
  FiBarChart2,
  FiArrowUpRight,
  FiArrowDownRight,
  FiPackage,
  FiCalendar,
  FiHash,
} from "react-icons/fi";

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════ */

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const formatDateShort = (dateStr) => {
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

/**
 * Parse the revenue summary from any API shape.
 */
const parseSummary = (raw) => {
  if (!raw) return null;
  const d = raw.data ?? raw;

  return {
    total_revenue: d.total_revenue ?? d.total ?? d.grand_total ?? 0,
    collected_revenue: d.collected_revenue ?? d.collected ?? d.collected_amount ?? 0,
    pending_revenue: d.pending_revenue ?? d.pending ?? d.pending_amount ?? 0,
    total_records: d.total_records ?? d.count ?? d.total_count ?? 0,
    collected_count: d.collected_count ?? d.collected_records ?? 0,
    pending_count: d.pending_count ?? d.pending_records ?? 0,
  };
};

/**
 * Parse revenue records list from any API shape.
 */
const parseRecords = (raw) => {
  if (!raw) return { items: [], total: 0 };
  const d = raw.data ?? raw;

  let items = [];
  let total = 0;

  if (Array.isArray(d?.records)) { items = d.records; total = d.total ?? items.length; }
  else if (Array.isArray(d?.items)) { items = d.items; total = d.total ?? items.length; }
  else if (Array.isArray(d?.results)) { items = d.results; total = d.count ?? d.total ?? items.length; }
  else if (Array.isArray(d?.revenue_records)) { items = d.revenue_records; total = d.total ?? items.length; }
  else if (Array.isArray(d)) { items = d; total = items.length; }

  const normalized = items.map((r) => ({
    ...r,
    id: r.id ?? r._id ?? r.record_id,
    order_id: r.order_id ?? r.orderId ?? r.order?.id,
    order_ref: r.order_ref ?? r.reference ?? r.order_reference ?? r.order_id,
    amount: r.amount ?? r.revenue_amount ?? r.platform_fee ?? 0,
    status: (r.status ?? r.payment_status ?? "pending").toLowerCase(),
    seller_name: r.seller_name ?? r.seller?.name ?? r.seller?.business_name ?? "—",
    created_at: r.created_at ?? r.createdAt ?? r.date,
    collected_at: r.collected_at ?? r.paid_at ?? r.settlement_date,
  }));

  return { items: normalized, total };
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
   SUMMARY SKELETON
═══════════════════════════════════════════════════════════════ */
const SummarySkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="rounded-2xl p-5 animate-pulse"
        style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", height: 110 }}
      >
        <div className="flex gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-2.5 rounded-lg w-1/2" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
        </div>
        <div className="h-7 rounded-lg w-2/3" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   SUMMARY CARDS
═══════════════════════════════════════════════════════════════ */
const SummaryCards = ({ summary }) => {
  const collected = Number(summary.collected_revenue);
  const pending = Number(summary.pending_revenue);
  const total = Number(summary.total_revenue);
  const collectedPct = total > 0 ? Math.round((collected / total) * 100) : 0;

  const cards = [
    {
      label: "Total Platform Revenue",
      value: formatCurrency(total),
      sub: `${summary.total_records ?? 0} total records`,
      Icon: FiBarChart2,
      color: "#FF8C00",
      bg: "rgba(255,140,0,0.08)",
      border: "rgba(255,140,0,0.18)",
      glow: "rgba(255,140,0,0.15)",
    },
    {
      label: "Collected Revenue",
      value: formatCurrency(collected),
      sub: `${summary.collected_count ?? 0} records · ${collectedPct}% of total`,
      Icon: FiCheckCircle,
      color: "#10B981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.18)",
      glow: "rgba(16,185,129,0.12)",
      trend: collectedPct,
      trendUp: true,
    },
    {
      label: "Pending Revenue",
      value: formatCurrency(pending),
      sub: `${summary.pending_count ?? 0} records awaiting settlement`,
      Icon: FiClock,
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.18)",
      glow: "rgba(245,158,11,0.10)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map(({ label, value, sub, Icon, color, bg, border, glow, trend, trendUp }) => (
        <div
          key={label}
          className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
          style={{ background: "#0d0d14", border: `1px solid ${border}` }}
        >
          {/* Glow blob */}
          <div
            className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }}
          />

          <div className="flex items-start justify-between relative">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            {trend !== undefined && (
              <span
                className="flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-xl"
                style={{
                  background: trendUp ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  color: trendUp ? "#10B981" : "#EF4444",
                }}
              >
                {trendUp ? <FiArrowUpRight size={11} /> : <FiArrowDownRight size={11} />}
                {trend}%
              </span>
            )}
          </div>

          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[1.5px] text-white/30 mb-1">
              {label}
            </p>
            <p className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {value}
            </p>
            <p className="text-[11px] text-white/30 mt-1">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   STATUS BADGE
═══════════════════════════════════════════════════════════════ */
const StatusBadge = ({ status }) => {
  const cfg =
    status === "collected"
      ? { color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.22)", Icon: FiCheckCircle, label: "Collected" }
      : { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.22)", Icon: FiClock, label: "Pending" };

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <cfg.Icon size={10} />
      {cfg.label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TABLE ROW SKELETON
═══════════════════════════════════════════════════════════════ */
const TableSkeleton = () => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        {[1, 2, 3, 4, 5].map((j) => (
          <td key={j} className="px-4 py-4">
            <div
              className="h-3 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.04)",
                width: j === 1 ? "60%" : j === 3 ? "80%" : "50%",
              }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/* ═══════════════════════════════════════════════════════════════
   FILTER PILL
═══════════════════════════════════════════════════════════════ */
const FilterPill = ({ label, active, onClick, color }) => (
  <button
    onClick={onClick}
    className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
    style={{
      background: active
        ? color
          ? `rgba(${color},0.12)`
          : "rgba(255,140,0,0.12)"
        : "rgba(255,255,255,0.04)",
      border: active
        ? `1px solid rgba(${color ?? "255,140,0"},0.3)`
        : "1px solid rgba(255,255,255,0.07)",
      color: active
        ? color
          ? `rgb(${color})`
          : "#FF8C00"
        : "rgba(255,255,255,0.35)",
    }}
  >
    {label}
  </button>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const Revenue = () => {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState("");
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState(""); // "" = all, "pending", "collected"
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const LIMIT = 20;

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  /* ── Fetch summary ───────────────────────────────────────── */
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const raw = await ApiService.getRevenueSummary();
      setSummary(parseSummary(raw));
    } catch (err) {
      console.error("fetchSummary error:", err);
      setSummaryError(err.message || "Failed to load revenue summary.");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  /* ── Fetch records ───────────────────────────────────────── */
  const fetchRecords = useCallback(
    async (showLoader = true) => {
      if (showLoader) setRecordsLoading(true);
      setRecordsError("");
      try {
        const raw = await ApiService.getRevenueRecords({
          status: statusFilter || undefined,
          skip,
          limit: LIMIT,
        });
        const { items, total: t } = parseRecords(raw);
        setRecords(items);
        setTotal(t);
      } catch (err) {
        console.error("fetchRecords error:", err);
        setRecordsError(err.message || "Failed to load revenue records.");
        showToast(err.message || "Failed to load revenue records", "error");
      } finally {
        if (showLoader) setRecordsLoading(false);
      }
    },
    [statusFilter, skip, showToast]
  );

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Reset to first page when filter changes
  useEffect(() => { setSkip(0); }, [statusFilter]);

  /* ── Client-side search (name / order ref) ───────────────── */
  const filtered = records.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(r.order_ref ?? "").toLowerCase().includes(q) ||
      String(r.order_id ?? "").toLowerCase().includes(q) ||
      String(r.seller_name ?? "").toLowerCase().includes(q)
    );
  });

  const currentPage = Math.floor(skip / LIMIT) + 1;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handlePrev = () => setSkip((p) => Math.max(0, p - LIMIT));
  const handleNext = () => setSkip((p) => p + LIMIT);

  return (
    <div className="space-y-6 max-w-7xl">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <Toast toast={toast} />

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
        <div>
          <h1
            className="text-2xl font-black text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Revenue Insights
          </h1>
          <p className="text-sm text-white/30 mt-0.5">
            Platform earnings — collected and pending settlements
          </p>
        </div>

        <div className="flex gap-2 self-start">
          <button
            onClick={() => { fetchSummary(); fetchRecords(true); }}
            disabled={summaryLoading || recordsLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all disabled:opacity-40"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <FiRefreshCw
              size={13}
              className={summaryLoading || recordsLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────── */}
      {summaryLoading ? (
        <SummarySkeleton />
      ) : summaryError ? (
        <div
          className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
          style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}
        >
          <FiAlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm flex-1">{summaryError}</p>
          <button
            onClick={fetchSummary}
            className="text-xs font-bold text-red-400/70 hover:text-red-400 underline shrink-0"
          >
            Retry
          </button>
        </div>
      ) : summary ? (
        <SummaryCards summary={summary} />
      ) : null}

      {/* ── Records Table ────────────────────────────────────── */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Table header bar */}
        <div
          className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2">
            <FiDollarSign size={15} className="text-[#FF8C00]" />
            <h2 className="text-sm font-black text-white">Revenue Ledger</h2>
            {!recordsLoading && (
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}
              >
                {total} records
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div
              className="flex items-center gap-2 rounded-xl border px-3 py-2 transition-all focus-within:border-[#FF8C00]/40"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <FiSearch size={13} className="text-white/25 shrink-0" />
              <input
                type="text"
                placeholder="Order ref, seller…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs text-white outline-none placeholder-white/20 w-36"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-white/25 hover:text-white transition-colors"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>

            {/* Status filters */}
            <FilterPill
              label="All"
              active={statusFilter === ""}
              onClick={() => setStatusFilter("")}
            />
            <FilterPill
              label="Collected"
              active={statusFilter === "collected"}
              onClick={() => setStatusFilter("collected")}
              color="16,185,129"
            />
            <FilterPill
              label="Pending"
              active={statusFilter === "pending"}
              onClick={() => setStatusFilter("pending")}
              color="245,158,11"
            />
          </div>
        </div>

        {/* Error */}
        {recordsError && (
          <div
            className="flex items-center gap-2.5 mx-5 my-4 rounded-2xl px-4 py-3"
            style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}
          >
            <FiAlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm flex-1">{recordsError}</p>
            <button
              onClick={() => fetchRecords(true)}
              className="text-xs font-bold text-red-400/70 hover:text-red-400 underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["Order Ref", "Seller", "Amount", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[10px] font-black uppercase tracking-[1.5px] text-white/25"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {recordsLoading ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "rgba(255,140,0,0.07)", border: "1px solid rgba(255,140,0,0.12)" }}
                    >
                      <FiDollarSign size={22} className="text-[#FF8C00]/30" />
                    </div>
                    <p className="text-sm font-bold text-white/30">
                      {search
                        ? `No records match "${search}"`
                        : `No ${statusFilter || ""} revenue records found`}
                    </p>
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="mt-2 text-xs font-bold text-[#FF8C00]/60 hover:text-[#FF8C00] transition-colors"
                      >
                        Clear search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr
                    key={r.id ?? i}
                    className="group transition-colors"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background:
                        i % 2 === 0
                          ? "transparent"
                          : "rgba(255,255,255,0.01)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(255,140,0,0.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)")
                    }
                  >
                    {/* Order ref */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <FiHash size={11} className="text-white/20 shrink-0" />
                        <span className="text-xs font-mono text-white/60 truncate max-w-32.5">
                          {r.order_ref ?? r.order_id ?? "—"}
                        </span>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="px-4 py-4">
                      <span className="text-xs font-semibold text-white/55 truncate max-w-35 block">
                        {r.seller_name}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-4">
                      <span
                        className="text-sm font-black"
                        style={{ color: "#FF8C00" }}
                      >
                        {formatCurrency(r.amount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <FiCalendar size={11} className="text-white/20 shrink-0" />
                        <span className="text-xs text-white/35">
                          {formatDateShort(r.created_at)}
                        </span>
                      </div>
                      {r.collected_at && r.status === "collected" && (
                        <p className="text-[10px] text-emerald-500/40 mt-0.5 ml-4">
                          Settled {formatDateShort(r.collected_at)}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!recordsLoading && total > LIMIT && (
          <div
            className="flex items-center justify-between px-5 py-4 border-t"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            <p className="text-xs text-white/25 font-semibold">
              Page {currentPage} of {totalPages} &nbsp;·&nbsp; {total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={skip === 0 || recordsLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                <FiChevronLeft size={13} /> Prev
              </button>

              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white"
                style={{
                  background: "linear-gradient(135deg, #B42225, #FF8C00)",
                  boxShadow: "0 4px 14px rgba(180,34,37,0.3)",
                }}
              >
                {currentPage}
              </span>

              <button
                onClick={handleNext}
                disabled={skip + LIMIT >= total || recordsLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Next <FiChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Revenue;