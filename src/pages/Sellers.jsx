// src/pages/Sellers.jsx
import { useState, useEffect } from "react";
import ApiService from "../services/apiService";
import { FiSearch, FiX, FiCheck, FiAlertCircle, FiEye, FiRefreshCw, FiChevronDown } from "react-icons/fi";
import { MdStorefront, MdVerified } from "react-icons/md";

const statusColors = {
  PENDING:  { bg: "rgba(255,140,0,0.1)",   border: "rgba(255,140,0,0.25)",  text: "#0E0E10"  },
  APPROVED: { bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)", text: "#10B981"  },
  REJECTED: { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",  text: "#EF4444"  },
};

const Badge = ({ status }) => {
  const c = statusColors[status] || statusColors.PENDING;
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {status}
    </span>
  );
};

const SellerCard = ({ seller, onAction }) => (
  <div className="rounded-2xl p-5 border transition-all hover:border-ink/10"
    style={{ background: "#0d0d14", border: "1px solid rgba(14,14,16,0.005)" }}>
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-ink text-sm font-semibold shrink-0"
          style={{ background: "linear-gradient(135deg,#0E0E10,#0E0E10)" }}>
          {(seller.business_name || seller.name || "S")[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{seller.business_name || seller.name || "Seller"}</p>
          <p className="text-xs text-ink/30">{seller.email || "-"}</p>
        </div>
      </div>
      <Badge status={seller.status || "PENDING"} />
    </div>

    <div className="grid grid-cols-2 gap-2 mb-4">
      {[
        { label: "ID",       value: seller.id?.slice(0, 12) + "..." || "-" },
        { label: "Phone",    value: seller.phone || "-" },
        { label: "Category", value: seller.category || "-" },
        { label: "Location", value: seller.location || seller.city || "-" },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-xl p-2.5" style={{ background: "rgba(14,14,16,0.003)" }}>
          <p className="text-[9px] font-bold uppercase tracking-wider text-ink/20 mb-0.5">{label}</p>
          <p className="text-xs font-semibold text-ink/60 truncate">{value}</p>
        </div>
      ))}
    </div>

    <div className="flex gap-2">
      <button onClick={() => onAction(seller, "view")}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-ink/50 transition-all hover:text-ink"
        style={{ background: "rgba(14,14,16,0.005)", border: "1px solid rgba(14,14,16,0.008)" }}>
        <FiEye size={13} /> View
      </button>
      {(!seller.status || seller.status === "PENDING") && (
        <>
          <button onClick={() => onAction(seller, "approve")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)", color: "#10B981" }}>
            <FiCheck size={13} /> Approve
          </button>
          <button onClick={() => onAction(seller, "reject")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
            <FiX size={13} /> Reject
          </button>
        </>
      )}
    </div>
  </div>
);

/* ── Reject modal ── */
const RejectModal = ({ seller, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(14,14,16,0.10)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-3xl p-6 border"
        style={{ background: "#0d0d14", border: "1px solid rgba(14,14,16,0.008)", boxShadow: "0 30px 80px rgba(14,14,16,0.10)" }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <FiAlertCircle size={18} className="text-brand" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>Reject Application</h3>
            <p className="text-xs text-ink/30">{seller?.business_name || seller?.name}</p>
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-[10px] font-semibold uppercase tracking-[2px] text-ink/30 mb-2">Rejection Reason</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
            placeholder="Explain why this application is being rejected..."
            className="w-full rounded-2xl px-4 py-3 text-sm text-ink outline-none resize-none placeholder-white/20"
            style={{ background: "rgba(14,14,16,0.004)", border: "1px solid rgba(14,14,16,0.008)" }} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-ink/40 hover:text-ink transition-colors"
            style={{ background: "rgba(14,14,16,0.005)" }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)} disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ink transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#0E0E10,#EF4444)" }}>
            {loading ? "Rejecting..." : "Reject Application"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Detail modal ── */
const DetailModal = ({ seller, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(14,14,16,0.10)", backdropFilter: "blur(8px)" }}>
    <div className="w-full max-w-lg rounded-3xl border overflow-hidden"
      style={{ background: "#0d0d14", border: "1px solid rgba(14,14,16,0.008)", boxShadow: "0 30px 80px rgba(14,14,16,0.10)", maxHeight: "90vh", overflowY: "auto" }}>
      <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(14,14,16,0.006)" }}>
        <h3 className="text-base font-semibold text-ink" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>Seller Details</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-ink/30 hover:text-ink transition" style={{ background: "rgba(14,14,16,0.005)" }}>
          <FiX size={15} />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(14,14,16,0.003)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-ink text-xl font-semibold"
            style={{ background: "linear-gradient(135deg,#0E0E10,#0E0E10)" }}>
            {(seller.business_name || seller.name || "S")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-base font-semibold text-ink">{seller.business_name || seller.name || "Seller"}</p>
            <p className="text-sm text-ink/40">{seller.email}</p>
            <Badge status={seller.status || "PENDING"} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries({
            "Application ID": seller.id || "-",
            "Phone":          seller.phone || "-",
            "Category":       seller.category || "-",
            "Location":       seller.location || seller.city || "-",
            "Joined":         seller.created_at ? new Date(seller.created_at).toLocaleDateString() : "-",
            "Status":         seller.status || "PENDING",
          }).map(([k, v]) => (
            <div key={k} className="rounded-xl p-3" style={{ background: "rgba(14,14,16,0.003)" }}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-ink/20 mb-1">{k}</p>
              <p className="text-xs font-semibold text-ink/60 break-all">{v}</p>
            </div>
          ))}
        </div>
        {seller.description && (
          <div className="rounded-xl p-4" style={{ background: "rgba(14,14,16,0.003)" }}>
            <p className="text-[9px] font-bold uppercase tracking-wider text-ink/20 mb-2">Description</p>
            <p className="text-xs text-ink/50 leading-relaxed">{seller.description}</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const Sellers = () => {
  const [tab, setTab]               = useState("pending");
  const [pending, setPending]       = useState([]);
  const [approved, setApproved]     = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoadingData(true); setError("");
    try {
      const [p, a] = await Promise.all([ApiService.getPendingSellers(), ApiService.getApprovedSellers()]);
      setPending(Array.isArray(p) ? p : []);
      setApproved(Array.isArray(a) ? a : []);
    } catch (err) { setError(err.message); }
    finally { setLoadingData(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (seller, action) => {
    if (action === "view")   { setDetailModal(seller); return; }
    if (action === "reject") { setRejectModal(seller); return; }
    if (action === "approve") {
      setActionLoading(true);
      try {
        await ApiService.approveRejectSeller({ appliedSellerId: seller.id, status: "APPROVED", rejectionReason: "" });
        showToast(`${seller.business_name || seller.name || "Seller"} approved successfully!`);
        fetchData();
      } catch (err) { showToast(err.message, "error"); }
      finally { setActionLoading(false); }
    }
  };

  const handleRejectConfirm = async (reason) => {
    setActionLoading(true);
    try {
      await ApiService.approveRejectSeller({ appliedSellerId: rejectModal.id, status: "REJECTED", rejectionReason: reason });
      showToast(`Application rejected.`);
      setRejectModal(null);
      fetchData();
    } catch (err) { showToast(err.message, "error"); }
    finally { setActionLoading(false); }
  };

  const list     = tab === "pending" ? pending : approved;
  const filtered = list.filter((s) => {
    const q = search.toLowerCase();
    return !q || (s.business_name || s.name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-100 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold"
          style={{ background: toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)", border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`, color: toast.type === "error" ? "#EF4444" : "#10B981", boxShadow: "0 8px 32px rgba(14,14,16,0.10)" }}>
          {toast.type === "error" ? <FiAlertCircle size={15} /> : <FiCheck size={15} />}
          {toast.msg}
        </div>
      )}

      {rejectModal && <RejectModal seller={rejectModal} onClose={() => setRejectModal(null)} onConfirm={handleRejectConfirm} loading={actionLoading} />}
      {detailModal && <DetailModal seller={detailModal} onClose={() => setDetailModal(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>Seller Management</h1>
          <p className="text-sm text-ink/30 mt-0.5">Review applications and manage approved sellers</p>
        </div>
        <button onClick={fetchData} disabled={loadingData}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-ink/50 hover:text-ink transition-all disabled:opacity-40"
          style={{ background: "rgba(14,14,16,0.005)", border: "1px solid rgba(14,14,16,0.008)" }}>
          <FiRefreshCw size={13} className={loadingData ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex rounded-2xl p-1 gap-1" style={{ background: "rgba(14,14,16,0.004)", border: "1px solid rgba(14,14,16,0.006)" }}>
          {[
            { key: "pending",  label: "Pending",  count: pending.length },
            { key: "approved", label: "Approved", count: approved.length },
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${tab === key ? "text-ink" : "text-ink/30 hover:text-ink/60"}`}
              style={tab === key ? { background: "linear-gradient(135deg,rgba(180,34,37,0.4),rgba(255,140,0,0.2))", border: "1px solid rgba(180,34,37,0.3)" } : {}}>
              {label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${tab === key ? "bg-sand text-ink" : "bg-sand text-ink/30"}`}>{count}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-2 rounded-2xl border px-3 py-2.5"
          style={{ background: "rgba(14,14,16,0.004)", border: "1px solid rgba(14,14,16,0.008)" }}>
          <FiSearch size={14} className="text-ink/25 shrink-0" />
          <input type="text" placeholder="Search sellers..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm text-ink outline-none bg-transparent placeholder-white/20" />
          {search && <button onClick={() => setSearch("")}><FiX size={13} className="text-ink/25 hover:text-ink transition-colors" /></button>}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={14} className="text-brand shrink-0" />
          <p className="text-brand text-sm">{error}</p>
        </div>
      )}

      {/* Grid */}
      {loadingData ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="rounded-2xl p-5 border animate-pulse" style={{ background: "#0d0d14", border: "1px solid rgba(14,14,16,0.005)", height: "200px" }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <SellerCard key={s.id} seller={s} onAction={handleAction} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl p-16 text-center border" style={{ background: "#0d0d14", border: "1px solid rgba(14,14,16,0.005)" }}>
          <MdStorefront size={40} className="text-ink/10 mx-auto mb-3" />
          <p className="text-sm font-bold text-ink/30">No {tab} sellers found</p>
          {search && <p className="text-xs text-ink/15 mt-1">Try a different search term</p>}
        </div>
      )}
    </div>
  );
};

export default Sellers;