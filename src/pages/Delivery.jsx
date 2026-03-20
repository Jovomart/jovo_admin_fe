// src/pages/Delivery.jsx
import { useState, useEffect } from "react";
import ApiService from "../services/apiService";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiAlertCircle, FiRefreshCw, FiTruck, FiToggleLeft, FiToggleRight } from "react-icons/fi";

const inputCls = (err) =>
  `w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none transition-all ${
    err
      ? "border-red-500/40 bg-red-500/5 placeholder-white/20"
      : "border-white/8 bg-white/4 placeholder-white/20 focus:border-[#FF8C00]/50 focus:bg-white/6"
  }`;

const EMPTY_FORM = {
  delivery_type: "", delivery_cost: "", delivery_areas: "",
  estimated_days_min: "", estimated_days_max: "", delivery_description: "",
  carrier_name: "", is_free_delivery: false, minimum_order_amount: "",
  weight_limit_kg: 1, max_order_value: 1, is_available: true, priority: 0,
};

/* ── Option Card ── */
const OptionCard = ({ opt, onEdit, onDelete, onToggle }) => (
  <div className="rounded-2xl p-5 border transition-all hover:border-white/10"
    style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: opt.is_available ? "rgba(14,165,233,0.1)" : "rgba(255,255,255,0.05)", border: opt.is_available ? "1px solid rgba(14,165,233,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>
          <FiTruck size={18} style={{ color: opt.is_available ? "#0EA5E9" : "rgba(255,255,255,0.2)" }} />
        </div>
        <div>
          <p className="text-sm font-black text-white">{opt.delivery_type}</p>
          <p className="text-xs text-white/30">{opt.carrier_name || "—"}</p>
        </div>
      </div>
      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
        opt.is_available ? "text-[#0EA5E9]" : "text-white/25"
      }`} style={{ background: opt.is_available ? "rgba(14,165,233,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${opt.is_available ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.08)"}` }}>
        {opt.is_available ? "Active" : "Inactive"}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-2 mb-4">
      {[
        { label: "Cost",      value: opt.is_free_delivery ? "Free" : `₦${Number(opt.delivery_cost || 0).toLocaleString()}` },
        { label: "Est. Days", value: `${opt.estimated_days_min}–${opt.estimated_days_max} days` },
        { label: "Min Order", value: `₦${Number(opt.minimum_order_amount || 0).toLocaleString()}` },
        { label: "Max Weight",value: `${opt.weight_limit_kg}kg` },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-0.5">{label}</p>
          <p className="text-xs font-bold text-white/60">{value}</p>
        </div>
      ))}
    </div>

    {opt.delivery_areas && (
      <p className="text-xs text-white/25 mb-4 line-clamp-1">📍 {opt.delivery_areas}</p>
    )}

    <div className="flex gap-2">
      <button onClick={() => onToggle(opt)}
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
        style={{ background: opt.is_available ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: opt.is_available ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(16,185,129,0.2)", color: opt.is_available ? "#EF4444" : "#10B981" }}>
        {opt.is_available ? <FiToggleRight size={13} /> : <FiToggleLeft size={13} />}
        {opt.is_available ? "Disable" : "Enable"}
      </button>
      <button onClick={() => onEdit(opt)}
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <FiEdit2 size={13} /> Edit
      </button>
      <button onClick={() => onDelete(opt.id)}
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#EF4444" }}>
        <FiTrash2 size={13} />
      </button>
    </div>
  </div>
);

/* ── Form Modal ── */
const FormModal = ({ initial, onClose, onSave, loading }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const isEdit = !!initial?.id;

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.delivery_type.trim())          e.delivery_type      = "Required";
    if (form.delivery_cost === "")           e.delivery_cost      = "Required";
    if (!form.delivery_areas.trim())         e.delivery_areas     = "Required";
    if (form.estimated_days_min === "")      e.estimated_days_min = "Required";
    if (form.estimated_days_max === "")      e.estimated_days_max = "Required";
    if (!form.carrier_name.trim())           e.carrier_name       = "Required";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      delivery_cost:        Number(form.delivery_cost),
      estimated_days_min:   Number(form.estimated_days_min),
      estimated_days_max:   Number(form.estimated_days_max),
      minimum_order_amount: Number(form.minimum_order_amount || 0),
      weight_limit_kg:      Number(form.weight_limit_kg || 1),
      max_order_value:      Number(form.max_order_value || 1),
      priority:             Number(form.priority || 0),
    }, isEdit ? initial.id : null);
  };

  const Field = ({ label, field, type = "text", placeholder = "" }) => (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">{label}</label>
      <input type={type} placeholder={placeholder} value={form[field]}
        onChange={(e) => set(field, e.target.value)}
        className={inputCls(errors[field])} />
      {errors[field] && <p className="text-xs text-red-400 mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-2xl rounded-3xl border overflow-hidden"
        style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 80px rgba(0,0,0,0.7)", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b sticky top-0 z-10" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0d0d14" }}>
          <h3 className="text-base font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
            {isEdit ? "Edit Delivery Option" : "New Delivery Option"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white transition" style={{ background: "rgba(255,255,255,0.05)" }}>
            <FiX size={15} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Delivery Type"    field="delivery_type"    placeholder="e.g. Standard Shipping" />
            <Field label="Carrier Name"     field="carrier_name"     placeholder="e.g. DHL, FedEx" />
            <Field label="Delivery Cost (₦)" field="delivery_cost"  type="number" placeholder="0" />
            <Field label="Min Order Amount" field="minimum_order_amount" type="number" placeholder="0" />
            <Field label="Est. Days (Min)"  field="estimated_days_min"  type="number" placeholder="1" />
            <Field label="Est. Days (Max)"  field="estimated_days_max"  type="number" placeholder="3" />
            <Field label="Weight Limit (kg)" field="weight_limit_kg" type="number" placeholder="1" />
            <Field label="Max Order Value"  field="max_order_value"  type="number" placeholder="1" />
            <Field label="Priority"         field="priority"         type="number" placeholder="0" />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Delivery Areas</label>
            <textarea value={form.delivery_areas} onChange={(e) => set("delivery_areas", e.target.value)} rows={2}
              placeholder="e.g. Lagos, Abuja, Owerri..."
              className={`${inputCls(errors.delivery_areas)} resize-none`} />
            {errors.delivery_areas && <p className="text-xs text-red-400 mt-1">{errors.delivery_areas}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Description</label>
            <textarea value={form.delivery_description} onChange={(e) => set("delivery_description", e.target.value)} rows={2}
              placeholder="Brief description of this delivery option..."
              className="w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none resize-none placeholder-white/20 border-white/8 bg-white/4 focus:border-[#FF8C00]/50" />
          </div>

          {/* Toggles */}
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "Free Delivery", field: "is_free_delivery" },
              { label: "Available",     field: "is_available" },
            ].map(({ label, field }) => (
              <button key={field} type="button" onClick={() => set(field, !form[field])}
                className="flex items-center justify-between px-4 py-3 rounded-2xl border transition-all"
                style={{ background: form[field] ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)", border: form[field] ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-sm font-bold" style={{ color: form[field] ? "#10B981" : "rgba(255,255,255,0.4)" }}>{label}</span>
                {form[field] ? <FiToggleRight size={20} className="text-[#10B981]" /> : <FiToggleLeft size={20} className="text-white/20" />}
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white/40 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3.5 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)", boxShadow: "0 6px 24px rgba(180,34,37,0.3)" }}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Option"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Delivery = () => {
  const [options, setOptions]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]         = useState("");
  const [modal, setModal]         = useState(null); // null | "create" | {edit object}
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const fetchOptions = async () => {
    setLoading(true); setError("");
    try {
      const data = await ApiService.getDeliveryOptions();
      setOptions(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOptions(); }, []);

  const handleSave = async (form, editId) => {
    setActionLoading(true);
    try {
      if (editId) await ApiService.updateDeliveryOption(editId, form);
      else        await ApiService.createDeliveryOption(form);
      showToast(editId ? "Delivery option updated!" : "Delivery option created!");
      setModal(null);
      fetchOptions();
    } catch (err) { showToast(err.message, "error"); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this delivery option?")) return;
    setActionLoading(true);
    try { await ApiService.deleteDeliveryOption(id); showToast("Delivery option deactivated."); fetchOptions(); }
    catch (err) { showToast(err.message, "error"); }
    finally { setActionLoading(false); }
  };

  const handleToggle = async (opt) => {
    setActionLoading(true);
    try {
      await ApiService.updateDeliveryOption(opt.id, { ...opt, is_available: !opt.is_available });
      showToast(`Option ${!opt.is_available ? "enabled" : "disabled"}.`);
      fetchOptions();
    } catch (err) { showToast(err.message, "error"); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {toast && (
        <div className="fixed top-6 right-6 z-100 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold"
          style={{ background: toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)", border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`, color: toast.type === "error" ? "#EF4444" : "#10B981", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          {toast.type === "error" ? <FiAlertCircle size={15} /> : <FiCheck size={15} />}
          {toast.msg}
        </div>
      )}

      {modal && (
        <FormModal
          initial={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>Delivery Options</h1>
          <p className="text-sm text-white/30 mt-0.5">Configure delivery pricing and availability</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOptions} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => setModal("create")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)", boxShadow: "0 4px 16px rgba(180,34,37,0.3)" }}>
            <FiPlus size={14} /> New Option
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Options", value: options.length,                                  color: "#0EA5E9" },
          { label: "Active",        value: options.filter(o => o.is_available).length,       color: "#10B981" },
          { label: "Free Delivery", value: options.filter(o => o.is_free_delivery).length,   color: "#FF8C00" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 border" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Playfair Display',serif", color }}>{value}</p>
            <p className="text-xs text-white/30 font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="rounded-2xl border animate-pulse" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", height: "240px" }} />)}
        </div>
      ) : options.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {options.map(opt => (
            <OptionCard key={opt.id} opt={opt}
              onEdit={(o) => setModal(o)}
              onDelete={handleDelete}
              onToggle={handleToggle} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl p-16 text-center border" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
          <FiTruck size={40} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm font-bold text-white/30">No delivery options yet</p>
          <button onClick={() => setModal("create")} className="mt-4 text-xs font-black text-[#FF8C00] hover:underline">
            + Create your first option
          </button>
        </div>
      )}
    </div>
  );
};

export default Delivery;