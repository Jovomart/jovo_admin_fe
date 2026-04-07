// src/pages/Delivery.jsx - COMPLETE FIXED VERSION (Editing works)

import { useState, useEffect, useCallback } from "react";
import ApiService from "../services/apiService";
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiCheck,
  FiAlertCircle, FiRefreshCw, FiTruck,
  FiToggleLeft, FiToggleRight, FiSearch,
  FiPower, FiEye
} from "react-icons/fi";

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

/**
 * Parse delivery options - Combines BOTH active and inactive options
 */
const parseOptions = (raw) => {
  if (!raw) return [];

  const activeOptions = raw?.data?.active_options?.options || [];
  const inactiveOptions = raw?.data?.inactive_options?.options || [];
  const allOptions = [...activeOptions, ...inactiveOptions];
  
  console.log(`✅ Found ${activeOptions.length} active, ${inactiveOptions.length} inactive options`);
  
  return allOptions;
};

/**
 * Build payload for CREATE (includes delivery_type)
 */
const buildCreatePayload = (form) => ({
  delivery_type: String(form.delivery_type || ""),
  delivery_cost: Number(form.delivery_cost ?? 0),
  delivery_areas: String(form.delivery_areas || ""),
  estimated_days_min: Number(form.estimated_days_min ?? 0),
  estimated_days_max: Number(form.estimated_days_max ?? 0),
  delivery_description: String(form.delivery_description || ""),
  carrier_name: String(form.carrier_name || ""),
  is_free_delivery: Boolean(form.is_free_delivery),
  minimum_order_amount: Number(form.minimum_order_amount ?? 0),
  weight_limit_kg: Number(form.weight_limit_kg ?? 1),
  max_order_value: Number(form.max_order_value ?? 1),
  is_available: form.is_available === true,
  priority: Number(form.priority ?? 0),
});

/**
 * Build payload for UPDATE (NO delivery_type)
 */
const buildUpdatePayload = (form) => ({
  delivery_cost: Number(form.delivery_cost ?? 0),
  delivery_areas: String(form.delivery_areas || ""),
  estimated_days_min: Number(form.estimated_days_min ?? 0),
  estimated_days_max: Number(form.estimated_days_max ?? 0),
  delivery_description: String(form.delivery_description || ""),
  carrier_name: String(form.carrier_name || ""),
  is_free_delivery: Boolean(form.is_free_delivery),
  minimum_order_amount: Number(form.minimum_order_amount ?? 0),
  weight_limit_kg: Number(form.weight_limit_kg ?? 1),
  max_order_value: Number(form.max_order_value ?? 1),
  is_available: form.is_available === true,
  priority: Number(form.priority ?? 0),
});

const EMPTY_FORM = {
  delivery_type: "",
  delivery_cost: "",
  delivery_areas: "",
  estimated_days_min: "",
  estimated_days_max: "",
  delivery_description: "",
  carrier_name: "",
  is_free_delivery: false,
  minimum_order_amount: "0",
  weight_limit_kg: "1",
  max_order_value: "1",
  is_available: true,
  priority: "0",
};

const inputCls = (err) =>
  `w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none transition-all ${
    err
      ? "border-red-500/40 bg-red-500/5 placeholder-white/20"
      : "border-white/8 bg-white/4 placeholder-white/20 focus:border-[#FF8C00]/50 focus:bg-white/6"
  }`;

/* ─────────────────────────────────────────────────────────────
   FORM MODAL
───────────────────────────────────────────────────────────── */
const FormModal = ({ initial, onClose, onSave, saving }) => {
  const isEdit = !!(initial?.id);

  const [form, setForm] = useState(() => {
    if (!initial) return { ...EMPTY_FORM };
    return {
      delivery_type: initial.delivery_type || "",
      delivery_cost: String(initial.delivery_cost ?? "0"),
      delivery_areas: initial.delivery_areas || "",
      estimated_days_min: String(initial.estimated_days_min ?? "0"),
      estimated_days_max: String(initial.estimated_days_max ?? "0"),
      delivery_description: initial.delivery_description || "",
      carrier_name: initial.carrier_name || "",
      is_free_delivery: Boolean(initial.is_free_delivery),
      minimum_order_amount: String(initial.minimum_order_amount ?? "0"),
      weight_limit_kg: String(initial.weight_limit_kg ?? "1"),
      max_order_value: String(initial.max_order_value ?? "1"),
      is_available: initial.is_available !== undefined ? initial.is_available : true,
      priority: String(initial.priority ?? "0"),
    };
  });

  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.delivery_type?.trim() && !isEdit) e.delivery_type = "Required";
    if (form.delivery_cost === "") e.delivery_cost = "Required";
    if (!form.delivery_areas?.trim()) e.delivery_areas = "Required";
    if (form.estimated_days_min === "") e.estimated_days_min = "Required";
    if (form.estimated_days_max === "") e.estimated_days_max = "Required";
    if (!form.carrier_name?.trim()) e.carrier_name = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const optionId = initial?.id;
    // Use different payload builders for create vs update
    const payload = isEdit ? buildUpdatePayload(form) : buildCreatePayload(form);
    onSave(payload, optionId || null);
  };

  const Field = ({ label, field, type = "text", placeholder = "" }) => (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[field] ?? ""}
        onChange={(e) => set(field, e.target.value)}
        className={inputCls(errors[field])}
      />
      {errors[field] && <p className="text-xs text-red-400 mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-2xl rounded-3xl border flex flex-col"
        style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 80px rgba(0,0,0,0.7)", maxHeight: "90vh" }}>

        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div>
            <h3 className="text-base font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
              {isEdit ? "Edit Delivery Option" : "New Delivery Option"}
            </h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white transition"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <FiX size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Delivery Type is NOT editable in edit mode (matches backend) */}
            {!isEdit && (
              <Field label="Delivery Type" field="delivery_type" placeholder="e.g. Standard Shipping" />
            )}
            {isEdit && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                  Delivery Type (read-only)
                </label>
                <input
                  type="text"
                  value={form.delivery_type}
                  disabled
                  className="w-full rounded-2xl border px-4 py-3 text-sm text-white/50 outline-none cursor-not-allowed border-white/8 bg-white/4"
                />
              </div>
            )}
            <Field label="Carrier Name" field="carrier_name" placeholder="e.g. DHL, FedEx, GIG" />
            <Field label="Delivery Cost (₦)" field="delivery_cost" type="number" placeholder="0" />
            <Field label="Min Order Amount (₦)" field="minimum_order_amount" type="number" placeholder="0" />
            <Field label="Est. Days (Min)" field="estimated_days_min" type="number" placeholder="1" />
            <Field label="Est. Days (Max)" field="estimated_days_max" type="number" placeholder="3" />
            <Field label="Weight Limit (kg)" field="weight_limit_kg" type="number" placeholder="1" />
            <Field label="Max Order Value (₦)" field="max_order_value" type="number" placeholder="100000" />
            <Field label="Priority" field="priority" type="number" placeholder="0" />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              Delivery Areas
            </label>
            <textarea
              value={form.delivery_areas ?? ""}
              onChange={(e) => set("delivery_areas", e.target.value)}
              rows={2}
              placeholder="e.g. Lagos, Abuja, Owerri..."
              className={`${inputCls(errors.delivery_areas)} resize-none`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              Description
            </label>
            <textarea
              value={form.delivery_description ?? ""}
              onChange={(e) => set("delivery_description", e.target.value)}
              rows={2}
              placeholder="Brief description of this delivery option..."
              className="w-full rounded-2xl border px-4 py-3 text-sm text-white outline-none resize-none placeholder-white/20 border-white/8 bg-white/4 focus:border-[#FF8C00]/50 transition-all"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "Free Delivery", field: "is_free_delivery" },
              { label: "Available", field: "is_available" },
            ].map(({ label, field }) => (
              <button key={field} type="button" onClick={() => set(field, !form[field])}
                className="flex items-center justify-between px-4 py-3 rounded-2xl border transition-all"
                style={{
                  background: form[field] ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)",
                  border: form[field] ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.08)",
                }}>
                <span className="text-sm font-bold" style={{ color: form[field] ? "#10B981" : "rgba(255,255,255,0.4)" }}>
                  {label}
                </span>
                {form[field]
                  ? <FiToggleRight size={20} className="text-[#10B981]" />
                  : <FiToggleLeft size={20} className="text-white/20" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white/40 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3.5 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)", boxShadow: "0 6px 24px rgba(180,34,37,0.3)" }}>
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              : isEdit ? "Save Changes" : "Create Option"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   DELETE CONFIRM MODAL
───────────────────────────────────────────────────────────── */
const DeleteConfirm = ({ optionName, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
    <div className="w-full max-w-sm rounded-3xl p-6 text-center"
      style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <FiTrash2 size={20} className="text-red-400" />
      </div>
      <h3 className="text-base font-black text-white mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
        Permanently Delete "{optionName}"?
      </h3>
      <p className="text-sm text-white/40 mb-6">
        This will permanently delete this delivery option. This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white transition"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : "Delete Permanently"}
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   OPTION CARD
───────────────────────────────────────────────────────────── */
const OptionCard = ({ opt, onEdit, onDelete, onToggle, actionId }) => {
  const busy = actionId === opt.id;
  const active = opt.is_available === true && opt.is_active !== false;

  return (
    <div className="rounded-2xl p-5 transition-all"
      style={{
        background: "#0d0d14",
        border: `1px solid ${active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)"}`,
        opacity: active ? 1 : 0.6
      }}>

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: active ? "rgba(14,165,233,0.1)" : "rgba(255,255,255,0.04)",
              border: active ? "1px solid rgba(14,165,233,0.2)" : "1px solid rgba(255,255,255,0.06)",
            }}>
            <FiTruck size={18} style={{ color: active ? "#0EA5E9" : "rgba(255,255,255,0.2)" }} />
          </div>
          <div>
            <p className="text-sm font-black text-white">{opt.delivery_type}</p>
            <p className="text-xs text-white/30">{opt.carrier_name || "—"}</p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0"
          style={{
            color: active ? "#0EA5E9" : "rgba(255,255,255,0.3)",
            background: active ? "rgba(14,165,233,0.1)" : "rgba(255,255,255,0.04)",
            border: active ? "1px solid rgba(14,165,233,0.2)" : "1px solid rgba(255,255,255,0.08)",
          }}>
          {active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: "Cost", value: opt.is_free_delivery ? "Free" : `₦${Number(opt.delivery_cost || 0).toLocaleString()}` },
          { label: "Est. Days", value: `${opt.estimated_days_min ?? "?"}–${opt.estimated_days_max ?? "?"} days` },
          { label: "Min Order", value: `₦${Number(opt.minimum_order_amount || 0).toLocaleString()}` },
          { label: "Weight Limit", value: `${opt.weight_limit_kg ?? "?"}kg` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/20 mb-0.5">{label}</p>
            <p className="text-xs font-bold text-white/60">{value}</p>
          </div>
        ))}
      </div>

      {opt.delivery_areas && (
        <p className="text-xs text-white/25 mb-4 line-clamp-2">📍 {opt.delivery_areas}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onToggle(opt)}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
          style={{
            background: active ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
            border: active ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(16,185,129,0.2)",
            color: active ? "#EF4444" : "#10B981",
          }}>
          {busy
            ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            : <FiPower size={13} />}
          {active ? "Deactivate" : "Activate"}
        </button>

        <button
          onClick={() => onEdit(opt)}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <FiEdit2 size={13} /> Edit
        </button>

        <button
          onClick={() => onDelete(opt)}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#EF4444" }}>
          <FiTrash2 size={13} />
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
const Delivery = () => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOptions = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    setError("");
    try {
      console.log("🚀 Fetching delivery options...");
      const res = await ApiService.getAllDeliveryOptions();
      const parsed = parseOptions(res);
      console.log(`✅ Parsed ${parsed.length} total options`);
      setOptions(parsed);
    } catch (err) {
      console.error("❌ fetchOptions error:", err);
      setError(err.message || "Failed to load delivery options.");
      showToast(err.message || "Failed to load delivery options", "error");
    } finally {
      if (showLoadingIndicator) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Create or Update delivery option
  const handleSave = async (payload, editId) => {
    setSaving(true);
    console.log(`💾 ${editId ? "PUT" : "POST"} payload:`, payload);
    try {
      if (editId) {
        await ApiService.updateDeliveryOption(editId, payload);
        showToast("Delivery option updated successfully!");
      } else {
        await ApiService.createDeliveryOption(payload);
        showToast("Delivery option created successfully!");
      }
      setModal(null);
      await fetchOptions(true);
    } catch (err) {
      console.error("❌ handleSave error:", err);
      showToast(err.message || "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Toggle availability
  const handleToggle = async (opt) => {
    const willActivate = opt.is_available === false || opt.is_active === false;
    const optionId = opt.id;
    
    if (actionId === optionId) return;
    
    setActionId(optionId);
    console.log(`🔄 Toggle ${opt.delivery_type} (${optionId}) → ${willActivate ? "activate" : "deactivate"}`);

    try {
      if (willActivate) {
        await ApiService.reactivateDeliveryOption(optionId);
        showToast(`"${opt.delivery_type}" activated successfully.`);
      } else {
        await ApiService.deactivateDeliveryOption(optionId);
        showToast(`"${opt.delivery_type}" deactivated successfully.`);
      }
      await fetchOptions(false);
    } catch (err) {
      console.error("❌ handleToggle error:", err);
      let errorMessage = err.message || "Failed to update status.";
      if (errorMessage.toLowerCase().includes("already deactivated")) {
        errorMessage = `${opt.delivery_type} is already deactivated. Refreshing list...`;
        await fetchOptions(false);
      } else if (errorMessage.toLowerCase().includes("already activated")) {
        errorMessage = `${opt.delivery_type} is already activated. Refreshing list...`;
        await fetchOptions(false);
      }
      showToast(errorMessage, "error");
    } finally {
      setActionId(null);
    }
  };

  // Permanently delete
  const handleDelete = async () => {
    if (!confirmDelete) return;
    const opt = confirmDelete;
    const optionId = opt.id;
    setConfirmDelete(null);
    setActionId(optionId);

    console.log("🗑️ DELETE (hard):", optionId);
    try {
      await ApiService.permanentlyDeleteDeliveryOption(optionId);
      showToast(`"${opt.delivery_type}" permanently deleted.`);
      await fetchOptions(true);
    } catch (err) {
      console.error("❌ handleDelete error:", err);
      showToast(err.message || "Failed to delete. Make sure no orders are associated.", "error");
    } finally {
      setActionId(null);
    }
  };

  const filtered = options.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.delivery_type?.toLowerCase().includes(q) ||
      o.carrier_name?.toLowerCase().includes(q) ||
      o.delivery_areas?.toLowerCase().includes(q)
    );
  });

  const activeCount = options.filter((o) => o.is_available === true && o.is_active !== false).length;
  const inactiveCount = options.filter((o) => o.is_available === false || o.is_active === false).length;
  const freeCount = options.filter((o) => o.is_free_delivery).length;

  return (
    <div className="space-y-6 max-w-6xl">

      {toast && (
        <div className="fixed top-6 right-6 z-100 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold"
          style={{
            background: toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
            border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
            color: toast.type === "error" ? "#EF4444" : "#10B981",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}>
          {toast.type === "error" ? <FiAlertCircle size={15} /> : <FiCheck size={15} />}
          {toast.msg}
        </div>
      )}

      {modal && (
        <FormModal
          initial={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
      {confirmDelete && (
        <DeleteConfirm
          optionName={confirmDelete.delivery_type}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={actionId === confirmDelete.id}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
            Delivery Options
          </h1>
          <p className="text-sm text-white/30 mt-0.5">
            Configure delivery pricing and availability
            {options.length > 0 && ` • ${activeCount} active, ${inactiveCount} inactive`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <FiEye size={13} /> {showDebug ? "Hide" : "Debug"}
          </button>
          <button onClick={() => fetchOptions(true)} disabled={loading}
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: options.length, color: "#0EA5E9" },
          { label: "Active", value: activeCount, color: "#10B981" },
          { label: "Inactive", value: inactiveCount, color: "#EF4444" },
          { label: "Free Delivery", value: freeCount, color: "#FF8C00" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 border"
            style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-2xl font-black mb-1" style={{ color }}>{value}</p>
            <p className="text-xs text-white/30 font-semibold">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 focus-within:border-[#FF8C00]/40 transition-all">
        <FiSearch size={15} className="text-white/30 shrink-0" />
        <input
          type="text"
          placeholder="Search by type, carrier or area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-white/30 hover:text-white transition">
            <FiX size={14} />
          </button>
        )}
      </div>

      {showDebug && (
        <div className="rounded-2xl p-4 border bg-black/20"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-bold text-white/50 mb-2">DEBUG INFO:</p>
          <p className="text-xs text-white/30">Options in state: {options.length}</p>
          <p className="text-xs text-white/30">Active: {activeCount} | Inactive: {inactiveCount}</p>
          <button
            onClick={() => console.log("Current state:", options)}
            className="mt-2 text-xs text-[#FF8C00] underline">
            Log to Console
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl px-4 py-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl animate-pulse"
              style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", height: "260px" }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((opt) => (
            <OptionCard
              key={opt.id}
              opt={opt}
              onEdit={(o) => setModal(o)}
              onDelete={(o) => setConfirmDelete(o)}
              onToggle={handleToggle}
              actionId={actionId}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl p-16 text-center border"
          style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
          <FiTruck size={40} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm font-bold text-white/30">
            {search ? `No options match "${search}"` : "No delivery options yet"}
          </p>
          {!search && (
            <button onClick={() => setModal("create")}
              className="mt-4 text-xs font-black text-[#FF8C00] hover:underline">
              + Create your first option
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Delivery;