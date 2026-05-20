// src/pages/Categories.jsx
import { useState, useEffect, useCallback } from "react";
import ApiService from "../services/apiService";
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiCheck,
  FiAlertCircle, FiRefreshCw, FiGrid, FiSearch,
  FiToggleLeft, FiToggleRight, FiChevronDown,
  FiChevronRight, FiPlusCircle, FiMinusCircle,
  FiImage, FiLink, FiLayers, FiTag,
} from "react-icons/fi";
import { MdOutlineCategory } from "react-icons/md";

// ─── Shared helpers ────────────────────────────────────────────────────────────

const inputCls = (err) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm text-white outline-none transition-all placeholder-white/20 ${
    err
      ? "border-red-500/50 bg-red-500/5 focus:border-red-500/70"
      : "border-white/10 bg-white/5 focus:border-[#FF8C00]/50 focus:bg-white/8"
  }`;

const labelCls = "block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5";

const ATTRIBUTE_TYPES = [
  { value: "text",        label: "Text (short input)" },
  { value: "textarea",   label: "Text Area (multi-line)" },
  { value: "number",     label: "Number" },
  { value: "boolean",    label: "Boolean (Yes/No)" },
  { value: "select",     label: "Select (dropdown)" },
  { value: "multiselect",label: "Multi-Select" },
];

const EMPTY_ATTRIBUTE = { key: "", label: "", type: "text", required: false, options: [] };

// ─── Parse any API response shape into an array ───────────────────────────────
const parseList = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  if (response?.categories && Array.isArray(response.categories)) return response.categories;
  if (response?.data?.categories && Array.isArray(response.data.categories)) return response.data.categories;
  if (response?.subcategories && Array.isArray(response.subcategories)) return response.subcategories;
  if (response?.data?.subcategories && Array.isArray(response.data.subcategories)) return response.data.subcategories;
  return [];
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      className="fixed top-4 right-4 z-200 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold shadow-2xl"
      style={{
        background: toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
        border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.35)" : "rgba(16,185,129,0.35)"}`,
        color: toast.type === "error" ? "#EF4444" : "#10B981",
        backdropFilter: "blur(12px)",
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      {toast.type === "error" ? <FiAlertCircle size={15} className="shrink-0" /> : <FiCheck size={15} className="shrink-0" />}
      <span className="line-clamp-2">{toast.msg}</span>
    </div>
  );
};

// ─── Attribute Schema Builder ──────────────────────────────────────────────────
const AttributeBuilder = ({ schema, onChange, errors, label = "Attribute Schema" }) => {
  const add = () => onChange([...schema, { ...EMPTY_ATTRIBUTE }]);
  const remove = (i) => { const s = [...schema]; s.splice(i, 1); onChange(s); };
  const update = (i, field, value) => {
    const s = [...schema];
    s[i] = { ...s[i], [field]: value };
    if (field === "type" && !["select", "multiselect"].includes(value)) s[i].options = [];
    onChange(s);
  };
  const addOpt = (i) => { const s = [...schema]; s[i].options = [...(s[i].options || []), ""]; onChange(s); };
  const removeOpt = (i, j) => { const s = [...schema]; const o = [...s[i].options]; o.splice(j, 1); s[i].options = o; onChange(s); };
  const updateOpt = (i, j, val) => { const s = [...schema]; const o = [...s[i].options]; o[j] = val; s[i].options = o; onChange(s); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={labelCls}>{label}</label>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs font-bold text-[#FF8C00] hover:text-[#FF8C00]/80 transition-colors">
          <FiPlus size={12} /> Add Attribute
        </button>
      </div>

      {schema.length === 0 && (
        <div className="text-center py-6 rounded-xl border border-dashed border-white/10">
          <FiGrid size={28} className="text-white/15 mx-auto mb-1.5" />
          <p className="text-xs text-white/25">No attributes defined</p>
          <p className="text-[10px] text-white/15 mt-0.5">Attributes let sellers fill in structured info per listing</p>
        </div>
      )}

      {schema.map((attr, idx) => (
        <div key={idx} className="rounded-xl p-3 sm:p-4 border border-white/10 bg-white/3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
              Attribute #{idx + 1}
            </span>
            <button type="button" onClick={() => remove(idx)}
              className="text-red-400/60 hover:text-red-400 transition-colors">
              <FiTrash2 size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5">
            <div>
              <label className={labelCls}>Key *</label>
              <input type="text" placeholder="e.g. size" value={attr.key}
                onChange={(e) => update(idx, "key", e.target.value)}
                className={inputCls(errors?.[`attr_${idx}_key`])} />
              <p className="text-[9px] text-white/20 mt-0.5">Used as property name in JSON</p>
            </div>
            <div>
              <label className={labelCls}>Label *</label>
              <input type="text" placeholder="e.g. Size" value={attr.label}
                onChange={(e) => update(idx, "label", e.target.value)}
                className={inputCls()} />
            </div>
            <div>
              <label className={labelCls}>Field Type</label>
              <select value={attr.type} onChange={(e) => update(idx, "type", e.target.value)}
                className={inputCls() + " cursor-pointer"}>
                {ATTRIBUTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-[#0d0d14]">{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={attr.required}
                  onChange={(e) => update(idx, "required", e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#FF8C00]" />
                <span className="text-xs text-white/50">Required field</span>
              </label>
            </div>
          </div>

          {["select", "multiselect"].includes(attr.type) && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <label className={labelCls}>Options *</label>
              <div className="space-y-2">
                {(attr.options || []).map((opt, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <input type="text" placeholder={`Option ${j + 1}`} value={opt}
                      onChange={(e) => updateOpt(idx, j, e.target.value)}
                      className="flex-1 rounded-lg border px-3 py-2 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none placeholder-white/20" />
                    <button type="button" onClick={() => removeOpt(idx, j)} className="text-red-400/60 hover:text-red-400 transition-colors">
                      <FiMinusCircle size={15} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addOpt(idx)}
                  className="flex items-center gap-1 text-xs text-[#FF8C00] hover:text-[#FF8C00]/80 transition-colors mt-1">
                  <FiPlusCircle size={12} /> Add Option
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Image & URL fields section ────────────────────────────────────────────────
const MediaFields = ({ form, set }) => (
  <div className="space-y-3">
    <label className={labelCls}>Media & URLs <span className="text-white/20 normal-case tracking-normal font-normal">(optional)</span></label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={labelCls + " mb-1"}><FiImage size={10} className="inline mr-1" />Image URL</label>
        <input type="url" placeholder="https://..." value={form.category_image_url || ""}
          onChange={(e) => set("category_image_url", e.target.value)}
          className={inputCls()} />
      </div>
      <div>
        <label className={labelCls + " mb-1"}><FiTag size={10} className="inline mr-1" />Icon URL</label>
        <input type="url" placeholder="https://..." value={form.category_icon_url || ""}
          onChange={(e) => set("category_icon_url", e.target.value)}
          className={inputCls()} />
      </div>
    </div>
  </div>
);

// ─── Category Modal (Create / Edit) ───────────────────────────────────────────
const CategoryModal = ({ category, onClose, onSave, saving }) => {
  const isEdit = !!category?.id;
  const [form, setForm] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    category_type: category?.category_type || "PRODUCT",
    attribute_schema: category?.attribute_schema || [],
    category_image_url: category?.category_image_url || "",
    category_icon_url: category?.category_icon_url || "",
  });
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Category name is required";
    if (!form.category_type) e.category_type = "Category type is required";
    const keys = form.attribute_schema.map((a) => a.key).filter(Boolean);
    if (keys.length !== new Set(keys).size) e.attribute_schema = "Attribute keys must be unique";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    onSave(form, isEdit ? category.id : null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border flex flex-col"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          maxHeight: "92dvh",
        }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}>
              <MdOutlineCategory size={16} className="text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
              {isEdit ? "Edit Category" : "Create Category"}
            </h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <FiX size={15} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {errors.general && (
            <div className="flex items-start gap-2 rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20">
              <FiAlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category Name *</label>
              <input type="text" placeholder="e.g. Fashion, Electronics"
                value={form.name} onChange={(e) => set("name", e.target.value)}
                className={inputCls(errors.name)} />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className={labelCls}>Slug <span className="text-white/20 normal-case tracking-normal font-normal">(optional)</span></label>
              <input type="text" placeholder="auto-generated from name"
                value={form.slug} onChange={(e) => set("slug", e.target.value)}
                className={inputCls()} />
              <p className="text-[9px] text-white/20 mt-0.5">Leave empty to auto-generate</p>
            </div>
          </div>

          {/* Type selector — only show on create */}
          {!isEdit && (
            <div>
              <label className={labelCls}>Category Type *</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { val: "PRODUCT", icon: "📦", label: "Product" },
                  { val: "SERVICE", icon: "⚙️", label: "Service" },
                ].map(({ val, icon, label }) => (
                  <button key={val} type="button" onClick={() => set("category_type", val)}
                    className={`py-2.5 sm:py-3 rounded-xl border text-sm font-bold transition-all ${
                      form.category_type === val
                        ? "border-[#FF8C00] bg-[#FF8C00]/10 text-white"
                        : "border-white/10 bg-white/5 text-white/40 hover:text-white/70"
                    }`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
              {errors.category_type && <p className="text-xs text-red-400 mt-1">{errors.category_type}</p>}
            </div>
          )}

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} placeholder="Brief description of this category..."
              value={form.description} onChange={(e) => set("description", e.target.value)}
              className="w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none resize-none placeholder-white/20 transition-all" />
          </div>

          {/* Media fields */}
          <MediaFields form={form} set={set} />

          {/* Attribute schema */}
          <AttributeBuilder
            schema={form.attribute_schema}
            onChange={(s) => set("attribute_schema", s)}
            errors={errors}
            label="Attribute Schema"
          />
          {errors.attribute_schema && <p className="text-xs text-red-400">{errors.attribute_schema}</p>}
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-5 sm:px-6 py-4 border-t shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 bg-white/5 hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}>
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              : isEdit ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Subcategory Modal (Create / Edit) ────────────────────────────────────────
const SubcategoryModal = ({ subcategory, parentCategories, defaultParentId, onClose, onSave, saving }) => {
  const isEdit = !!subcategory?.id;
  const [form, setForm] = useState({
    name: subcategory?.name || "",
    slug: subcategory?.slug || "",
    description: subcategory?.description || "",
    category_id: subcategory?.category_id || defaultParentId || "",
    additional_attribute_schema: subcategory?.additional_attribute_schema || [],
    category_image_url: subcategory?.category_image_url || "",
    category_icon_url: subcategory?.category_icon_url || "",
  });
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const selectedParent = parentCategories.find((c) => c.id === form.category_id);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Subcategory name is required";
    if (!form.category_id) e.category_id = "Please select a parent category";
    const keys = form.additional_attribute_schema.map((a) => a.key).filter(Boolean);
    if (keys.length !== new Set(keys).size) e.additional_attribute_schema = "Attribute keys must be unique";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    onSave(form, isEdit ? subcategory.id : null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border flex flex-col"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          maxHeight: "92dvh",
        }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
              <FiLayers size={15} className="text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
              {isEdit ? "Edit Subcategory" : "Create Subcategory"}
            </h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <FiX size={15} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {errors.general && (
            <div className="flex items-start gap-2 rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20">
              <FiAlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Parent category picker */}
          <div>
            <label className={labelCls}>Parent Category *</label>
            {isEdit ? (
              <div className="rounded-xl px-4 py-2.5 text-sm text-white/60 bg-white/5 border border-white/10">
                {selectedParent?.name || "Unknown"}
                <span className="text-[10px] text-white/30 ml-2">(cannot change parent after creation)</span>
              </div>
            ) : (
              <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}
                className={inputCls(errors.category_id) + " cursor-pointer"}>
                <option value="" className="bg-[#0d0d14]">— Select parent category —</option>
                {parentCategories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0d0d14]">
                    {c.category_type === "PRODUCT" ? "📦" : "⚙️"} {c.name}
                  </option>
                ))}
              </select>
            )}
            {errors.category_id && <p className="text-xs text-red-400 mt-1">{errors.category_id}</p>}
          </div>

          {/* Inherited schema info */}
          {selectedParent && selectedParent.attribute_schema?.length > 0 && (
            <div className="rounded-xl px-4 py-3 bg-indigo-500/5 border border-indigo-500/15">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1.5">
                Inherited from parent ({selectedParent.attribute_schema.length} attribute{selectedParent.attribute_schema.length !== 1 ? "s" : ""})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedParent.attribute_schema.map((a, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300">
                    {a.label || a.key}
                  </span>
                ))}
              </div>
              <p className="text-[9px] text-white/25 mt-2">These are automatically merged. Add extra attributes below.</p>
            </div>
          )}

          {/* Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Subcategory Name *</label>
              <input type="text" placeholder="e.g. Men's Clothing"
                value={form.name} onChange={(e) => set("name", e.target.value)}
                className={inputCls(errors.name)} />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className={labelCls}>Slug <span className="text-white/20 normal-case tracking-normal font-normal">(optional)</span></label>
              <input type="text" placeholder="auto-generated"
                value={form.slug} onChange={(e) => set("slug", e.target.value)}
                className={inputCls()} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={3} placeholder="Brief description..."
              value={form.description} onChange={(e) => set("description", e.target.value)}
              className="w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none resize-none placeholder-white/20 transition-all" />
          </div>

          {/* Media fields */}
          <MediaFields form={form} set={set} />

          {/* Additional attribute schema */}
          <AttributeBuilder
            schema={form.additional_attribute_schema}
            onChange={(s) => set("additional_attribute_schema", s)}
            errors={errors}
            label="Additional Attributes (on top of parent)"
          />
          {errors.additional_attribute_schema && (
            <p className="text-xs text-red-400">{errors.additional_attribute_schema}</p>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-5 sm:px-6 py-4 border-t shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 bg-white/5 hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              : isEdit ? "Save Changes" : "Create Subcategory"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Toggle Status Confirm Modal ───────────────────────────────────────────────
const ToggleStatusModal = ({ item, action, onConfirm, onCancel, loading }) => {
  const isDeactivate = action === "deactivate";
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className={`w-12 h-12 rounded-2xl ${isDeactivate ? "bg-amber-500/10" : "bg-emerald-500/10"} flex items-center justify-center mx-auto mb-4`}>
          {isDeactivate
            ? <FiToggleLeft size={20} className="text-amber-400" />
            : <FiToggleRight size={20} className="text-emerald-400" />}
        </div>
        <h3 className="text-base font-black text-white mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
          {isDeactivate ? "Deactivate?" : "Reactivate?"}
        </h3>
        <p className="text-sm text-white/40 mb-1.5">
          {isDeactivate ? `Deactivate "${item.name}"?` : `Reactivate "${item.name}"?`}
        </p>
        <p className="text-xs text-white/25 mb-5">
          {isDeactivate
            ? "It won't appear in public listings. Active products must be unlinked first."
            : "It will become visible to users again."}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 bg-white/5 hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50 ${
              isDeactivate ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"
            }`}>
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Permanent Delete Confirm Modal ───────────────────────────────────────────
const DeleteConfirm = ({ item, label = "category", warningNote, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-60 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
    <div className="w-full max-w-sm rounded-3xl p-6 text-center"
      style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <FiTrash2 size={20} className="text-red-400" />
      </div>
      <h3 className="text-base font-black text-white mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
        Permanently Delete?
      </h3>
      <p className="text-sm text-white/40 mb-2">
        You are about to permanently delete <strong className="text-white/70">{item.name}</strong>.
      </p>
      <p className="text-xs text-amber-400/70 mb-5 bg-amber-500/5 rounded-xl px-3 py-2 border border-amber-500/15">
        ⚠️ {warningNote || "This cannot be undone."}
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 bg-white/5 hover:bg-white/10 transition-all">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Delete"}
        </button>
      </div>
    </div>
  </div>
);

// ─── Subcategory Row (compact inside parent card) ─────────────────────────────
const SubcategoryRow = ({ sub, onEdit, onDeactivate, onReactivate, onDelete }) => {
  const isActive = sub.is_active !== false;
  const [toggleModal, setToggleModal] = useState(null); // "deactivate" | "reactivate" | null
  const [showDelete, setShowDelete] = useState(false);

  return (
    <>
      {toggleModal && (
        <ToggleStatusModal
          item={sub} action={toggleModal}
          onConfirm={() => {
            toggleModal === "deactivate" ? onDeactivate(sub) : onReactivate(sub);
            setToggleModal(null);
          }}
          onCancel={() => setToggleModal(null)}
          loading={false}
        />
      )}
      {showDelete && (
        <DeleteConfirm
          item={sub}
          label="subcategory"
          warningNote="Only allowed if no products have ever been listed under this subcategory."
          onConfirm={() => { onDelete(sub); setShowDelete(false); }}
          onCancel={() => setShowDelete(false)}
          loading={false}
        />
      )}

      <div className="flex flex-wrap items-center gap-2 py-2.5 px-3 rounded-xl bg-white/3 hover:bg-white/5 border border-white/5 transition-all group">
        {/* Icon */}
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
          <FiLayers size={11} className="text-white" />
        </div>

        {/* Name & badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-white/80 truncate">{sub.name}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
              isActive ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
            }`}>
              {isActive ? "● Active" : "● Inactive"}
            </span>
            {(sub.additional_attribute_schema?.length || 0) > 0 && (
              <span className="text-[9px] text-indigo-300/60 bg-indigo-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                +{sub.additional_attribute_schema.length} attr
              </span>
            )}
          </div>
          {sub.description && (
            <p className="text-[10px] text-white/30 truncate mt-0.5">{sub.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <button onClick={() => onEdit(sub)}
            className="p-1.5 rounded-lg text-white/30 hover:text-[#FF8C00] hover:bg-[#FF8C00]/5 transition-all" title="Edit">
            <FiEdit2 size={11} />
          </button>
          {isActive ? (
            <button onClick={() => setToggleModal("deactivate")}
              className="p-1.5 rounded-lg text-white/30 hover:text-amber-400 hover:bg-amber-400/5 transition-all" title="Deactivate">
              <FiToggleLeft size={12} />
            </button>
          ) : (
            <button onClick={() => setToggleModal("reactivate")}
              className="p-1.5 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-400/5 transition-all" title="Reactivate">
              <FiToggleRight size={12} />
            </button>
          )}
          <button onClick={() => setShowDelete(true)}
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/5 transition-all" title="Delete">
            <FiTrash2 size={11} />
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Category Card ─────────────────────────────────────────────────────────────
const CategoryCard = ({
  category, subcategories,
  onEdit, onDeactivate, onReactivate, onDelete,
  onAddSubcategory, onEditSubcategory,
  onDeactivateSub, onReactivateSub, onDeleteSub,
}) => {
  const isActive = category.is_active !== false;
  const [expanded, setExpanded] = useState(false);
  const [toggleModal, setToggleModal] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  const attrCount = category.attribute_schema?.length || 0;
  const subCount = subcategories?.length || 0;

  return (
    <>
      {toggleModal && (
        <ToggleStatusModal
          item={category} action={toggleModal}
          onConfirm={() => {
            toggleModal === "deactivate" ? onDeactivate(category) : onReactivate(category);
            setToggleModal(null);
          }}
          onCancel={() => setToggleModal(null)}
          loading={false}
        />
      )}
      {showDelete && (
        <DeleteConfirm
          item={category}
          warningNote="Only allowed if no subcategories depend on this category."
          onConfirm={() => { onDelete(category); setShowDelete(false); }}
          onCancel={() => setShowDelete(false)}
          loading={false}
        />
      )}

      <div className="rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-200 overflow-hidden"
        style={{ background: "#0d0d14", boxShadow: "0 2px 16px rgba(0,0,0,0.25)" }}>

        {/* Card top */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 mb-3">
            {/* Icon / image */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}>
              {category.category_icon_url
                ? <img src={category.category_icon_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                : <MdOutlineCategory size={20} className="text-white" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white/90 leading-tight truncate">{category.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-[#FF8C00] bg-[#FF8C00]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {category.category_type === "PRODUCT" ? "📦 Product" : "⚙️ Service"}
                    </span>
                    {attrCount > 0 && (
                      <span className="text-[9px] text-white/30 whitespace-nowrap">
                        {attrCount} attr{attrCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {subCount > 0 && (
                      <span className="text-[9px] text-indigo-300/60 bg-indigo-500/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        {subCount} sub{subCount !== 1 ? "cats" : "cat"}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                  isActive ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
                }`}>
                  {isActive ? "● Active" : "● Inactive"}
                </span>
              </div>
            </div>
          </div>

          {category.description && (
            <p className="text-xs text-white/40 mb-3 line-clamp-2">{category.description}</p>
          )}

          {category.slug && (
            <p className="text-[10px] text-white/25 mb-3 flex items-center gap-1">
              <FiLink size={9} /> /{category.slug}
            </p>
          )}

          {/* Attribute preview chips */}
          {attrCount > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {category.attribute_schema.slice(0, 4).map((a, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">
                  {a.label || a.key}
                </span>
              ))}
              {attrCount > 4 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">
                  +{attrCount - 4} more
                </span>
              )}
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center gap-1 pt-3 border-t border-white/5 flex-wrap">
            <button onClick={() => onEdit(category)}
              className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-[#FF8C00] transition-colors px-2.5 py-1.5 rounded-xl hover:bg-[#FF8C00]/5">
              <FiEdit2 size={11} /> Edit
            </button>
            {isActive ? (
              <button onClick={() => setToggleModal("deactivate")}
                className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-amber-400 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-amber-400/5">
                <FiToggleLeft size={12} /> Deactivate
              </button>
            ) : (
              <button onClick={() => setToggleModal("reactivate")}
                className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-emerald-400 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-emerald-400/5">
                <FiToggleRight size={12} /> Reactivate
              </button>
            )}
            <button onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-red-400 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-red-500/5 ml-auto">
              <FiTrash2 size={11} /> Delete
            </button>
          </div>
        </div>

        {/* Subcategories section */}
        <div className="border-t border-white/5">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-left hover:bg-white/2 transition-all">
            <div className="flex items-center gap-2">
              <FiLayers size={12} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Subcategories
              </span>
              {subCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300">
                  {subCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onAddSubcategory(category); }}
                className="flex items-center gap-1 text-[10px] font-black text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-indigo-500/10 transition-all">
                <FiPlus size={10} /> Add
              </button>
              {subCount > 0 && (
                expanded
                  ? <FiChevronDown size={13} className="text-white/30" />
                  : <FiChevronRight size={13} className="text-white/30" />
              )}
            </div>
          </button>

          {expanded && subCount > 0 && (
            <div className="px-4 sm:px-5 pb-4 space-y-2">
              {subcategories.map((sub) => (
                <SubcategoryRow
                  key={sub.id}
                  sub={sub}
                  onEdit={onEditSubcategory}
                  onDeactivate={onDeactivateSub}
                  onReactivate={onReactivateSub}
                  onDelete={onDeleteSub}
                />
              ))}
            </div>
          )}

          {expanded && subCount === 0 && (
            <div className="px-4 sm:px-5 pb-4">
              <div className="rounded-xl border border-dashed border-white/8 py-4 text-center">
                <p className="text-[10px] text-white/25">No subcategories yet</p>
                <button
                  onClick={() => onAddSubcategory(category)}
                  className="mt-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                  + Create one
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Main Categories Page ──────────────────────────────────────────────────────
const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]); // all subcats
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Modal state:
  // catModal: null | "create" | categoryObject
  // subModal: null | "create" | subcategoryObject
  const [catModal, setCatModal] = useState(null);
  const [subModal, setSubModal] = useState(null);
  const [subModalParentId, setSubModalParentId] = useState(null); // pre-fill parent when adding from card

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showInactive, setShowInactive] = useState(true);

  // Which tab: "categories" | "subcategories"
  const [activeTab, setActiveTab] = useState("categories");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catRes, subRes] = await Promise.all([
        ApiService.getAdminCategories(
          filterType === "all" ? null : filterType,
          showInactive,
          false
        ),
        ApiService.getAdminSubcategories(null, showInactive, false),
      ]);
      setCategories(parseList(catRes));
      setSubcategories(parseList(subRes));
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, [filterType, showInactive]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Category CRUD ─────────────────────────────────────────────────────────────

  const handleSaveCategory = async (formData, editId) => {
    setSaving(true);
    try {
      if (editId) {
        await ApiService.updateCategory(editId, formData);
        showToast("Category updated successfully!");
      } else {
        await ApiService.createCategory(formData);
        showToast("Category created successfully!");
      }
      setCatModal(null);
      await fetchAll();
    } catch (err) {
      console.error("Save category error:", err);
      showToast(err.message || "Failed to save category.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateCategory = async (cat) => {
    try {
      await ApiService.deactivateCategory(cat.id);
      showToast(`"${cat.name}" deactivated.`);
      await fetchAll();
    } catch (err) { showToast(err.message || "Failed to deactivate.", "error"); }
  };

  const handleReactivateCategory = async (cat) => {
    try {
      await ApiService.reactivateCategory(cat.id);
      showToast(`"${cat.name}" reactivated.`);
      await fetchAll();
    } catch (err) { showToast(err.message || "Failed to reactivate.", "error"); }
  };

  const handleDeleteCategory = async (cat) => {
    try {
      await ApiService.deleteCategory(cat.id);
      showToast(`"${cat.name}" permanently deleted.`);
      await fetchAll();
    } catch (err) { showToast(err.message || "Failed to delete. Category may have subcategories linked.", "error"); }
  };

  // ── Subcategory CRUD ──────────────────────────────────────────────────────────

  const handleSaveSubcategory = async (formData, editId) => {
    setSaving(true);
    try {
      if (editId) {
        await ApiService.updateSubcategory(editId, formData);
        showToast("Subcategory updated successfully!");
      } else {
        await ApiService.createSubcategory(formData);
        showToast("Subcategory created successfully!");
      }
      setSubModal(null);
      setSubModalParentId(null);
      await fetchAll();
    } catch (err) {
      console.error("Save subcategory error:", err);
      showToast(err.message || "Failed to save subcategory.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateSubcategory = async (sub) => {
    try {
      await ApiService.deactivateSubcategory(sub.id);
      showToast(`"${sub.name}" deactivated.`);
      await fetchAll();
    } catch (err) { showToast(err.message || "Failed to deactivate.", "error"); }
  };

  const handleReactivateSubcategory = async (sub) => {
    try {
      await ApiService.reactivateSubcategory(sub.id);
      showToast(`"${sub.name}" reactivated.`);
      await fetchAll();
    } catch (err) { showToast(err.message || "Failed to reactivate.", "error"); }
  };

  const handleDeleteSubcategory = async (sub) => {
    try {
      await ApiService.deleteSubcategory(sub.id);
      showToast(`"${sub.name}" permanently deleted.`);
      await fetchAll();
    } catch (err) { showToast(err.message || "Failed to delete. Subcategory may have products linked.", "error"); }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────────

  const filteredCategories = categories.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q);
  });

  const filteredSubcategories = subcategories.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.slug?.toLowerCase().includes(q);
  });

  // Group subcats by parent
  const subsByCategory = (categoryId) =>
    subcategories.filter((s) => s.category_id === categoryId);

  // Stats
  const activeCount = categories.filter((c) => c.is_active !== false).length;
  const inactiveCount = categories.filter((c) => c.is_active === false).length;
  const productCount = categories.filter((c) => c.category_type === "PRODUCT").length;
  const serviceCount = categories.filter((c) => c.category_type === "SERVICE").length;

  const activeSubCount = subcategories.filter((s) => s.is_active !== false).length;

  // ── Active parent categories (for subcategory modal selector) ─────────────────
  const activeParentCategories = categories.filter((c) => c.is_active !== false);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-10">
      <Toast toast={toast} />

      {/* ── Modals ── */}
      {catModal && (
        <CategoryModal
          category={catModal === "create" ? null : catModal}
          onClose={() => setCatModal(null)}
          onSave={handleSaveCategory}
          saving={saving}
        />
      )}
      {subModal && (
        <SubcategoryModal
          subcategory={subModal === "create" ? null : subModal}
          parentCategories={activeParentCategories}
          defaultParentId={subModalParentId}
          onClose={() => { setSubModal(null); setSubModalParentId(null); }}
          onSave={handleSaveSubcategory}
          saving={saving}
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col xs:flex-row xs:items-start sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
            Category Management
          </h1>
          <p className="text-xs sm:text-sm text-white/30 mt-0.5">
            Manage categories, subcategories & dynamic attribute schemas
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={fetchAll} disabled={loading}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={() => setSubModal("create")}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
            <FiPlus size={13} />
            <span className="hidden sm:inline">New Sub</span>
            <span className="sm:hidden">Sub</span>
          </button>
          <button onClick={() => setCatModal("create")}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)", boxShadow: "0 4px 16px rgba(180,34,37,0.25)" }}>
            <FiPlus size={13} />
            <span className="hidden sm:inline">New Category</span>
            <span className="sm:hidden">Cat</span>
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {[
          { label: "Total Cats", value: categories.length, color: "#0EA5E9" },
          { label: "Active", value: activeCount, color: "#10B981" },
          { label: "Inactive", value: inactiveCount, color: "#EF4444" },
          { label: "Products", value: productCount, color: "#FF8C00" },
          { label: "Services", value: serviceCount, color: "#8B5CF6" },
          { label: "Subcats", value: subcategories.length, color: "#6366F1" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-3 sm:p-4 border border-white/5" style={{ background: "#0d0d14" }}>
            <p className="text-xl sm:text-2xl font-black mb-0.5" style={{ color }}>{value}</p>
            <p className="text-[9px] sm:text-[10px] text-white/30 font-semibold leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search */}
        <div className="flex-1 flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-2.5 focus-within:border-[#FF8C00]/40 transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <FiSearch size={14} className="text-white/30 shrink-0" />
          <input type="text" placeholder="Search by name or slug..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20" />
          {search && (
            <button onClick={() => setSearch("")} className="text-white/30 hover:text-white transition-colors">
              <FiX size={13} />
            </button>
          )}
        </div>

        {/* Type filter */}
        <div className="flex gap-1 p-1 rounded-2xl shrink-0 overflow-x-auto"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {["all", "PRODUCT", "SERVICE"].map((type) => (
            <button key={type} onClick={() => setFilterType(type)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === type ? "text-white" : "text-white/30 hover:text-white/60"
              }`}
              style={filterType === type ? { background: "linear-gradient(135deg,#B42225,#FF8C00)" } : {}}>
              {type === "all" ? "All" : type === "PRODUCT" ? "📦 Products" : "⚙️ Services"}
            </button>
          ))}
        </div>

        {/* Show inactive toggle */}
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`shrink-0 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            showInactive
              ? "text-white border border-[#EF4444]/30 bg-[#EF4444]/10"
              : "text-white/30 hover:text-white/60"
          }`}
          style={{ background: showInactive ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)", border: showInactive ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
          {showInactive ? "✓ Inactive" : "Inactive"}
        </button>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 p-1 rounded-2xl w-full sm:w-auto"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { key: "categories", label: `Categories (${filteredCategories.length})`, icon: <MdOutlineCategory size={13} /> },
          { key: "subcategories", label: `Subcategories (${filteredSubcategories.length})`, icon: <FiLayers size={12} /> },
        ].map(({ key, label, icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === key ? "text-white" : "text-white/30 hover:text-white/60"
            }`}
            style={activeTab === key ? { background: "linear-gradient(135deg,#B42225,#FF8C00)" } : {}}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-2 rounded-2xl px-4 py-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl animate-pulse"
              style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", height: "200px" }} />
          ))}
        </div>
      ) : activeTab === "categories" ? (
        filteredCategories.length === 0 ? (
          <div className="rounded-3xl p-10 sm:p-16 text-center border"
            style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
            <MdOutlineCategory size={40} className="text-white/10 mx-auto mb-3" />
            <p className="text-sm font-bold text-white/30">
              {search ? `No categories match "${search}"` : "No categories found"}
            </p>
            {!search && (
              <button onClick={() => setCatModal("create")}
                className="mt-4 text-xs font-black text-[#FF8C00] hover:underline">
                + Create your first category
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                subcategories={subsByCategory(cat.id)}
                onEdit={(c) => setCatModal(c)}
                onDeactivate={handleDeactivateCategory}
                onReactivate={handleReactivateCategory}
                onDelete={handleDeleteCategory}
                onAddSubcategory={(parentCat) => {
                  setSubModalParentId(parentCat.id);
                  setSubModal("create");
                }}
                onEditSubcategory={(sub) => setSubModal(sub)}
                onDeactivateSub={handleDeactivateSubcategory}
                onReactivateSub={handleReactivateSubcategory}
                onDeleteSub={handleDeleteSubcategory}
              />
            ))}
          </div>
        )
      ) : (
        /* ── Subcategories flat list tab ── */
        filteredSubcategories.length === 0 ? (
          <div className="rounded-3xl p-10 sm:p-16 text-center border"
            style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
            <FiLayers size={40} className="text-white/10 mx-auto mb-3" />
            <p className="text-sm font-bold text-white/30">
              {search ? `No subcategories match "${search}"` : "No subcategories found"}
            </p>
            {!search && (
              <button onClick={() => setSubModal("create")}
                className="mt-4 text-xs font-black text-indigo-400 hover:underline">
                + Create your first subcategory
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredSubcategories.map((sub) => {
              const parent = categories.find((c) => c.id === sub.category_id);
              const isActive = sub.is_active !== false;
              const attrCount = (sub.additional_attribute_schema?.length || 0);
              return (
                <div key={sub.id}
                  className="rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-200 p-4 sm:p-5"
                  style={{ background: "#0d0d14", boxShadow: "0 2px 16px rgba(0,0,0,0.25)" }}>

                  {/* Parent badge */}
                  {parent && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}>
                        <MdOutlineCategory size={11} className="text-white" />
                      </div>
                      <span className="text-[10px] text-white/40 font-bold truncate">{parent.name}</span>
                      <FiChevronRight size={10} className="text-white/20 shrink-0" />
                    </div>
                  )}

                  {/* Sub header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)" }}>
                        {sub.category_icon_url
                          ? <img src={sub.category_icon_url} alt="" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.target.style.display = "none"; }} />
                          : <FiLayers size={14} className="text-white" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-white/90 truncate">{sub.name}</h3>
                        {sub.slug && (
                          <p className="text-[10px] text-white/25 flex items-center gap-1 mt-0.5">
                            <FiLink size={8} /> /{sub.slug}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                      isActive ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
                    }`}>
                      {isActive ? "● Active" : "● Inactive"}
                    </span>
                  </div>

                  {sub.description && (
                    <p className="text-xs text-white/40 mb-3 line-clamp-2">{sub.description}</p>
                  )}

                  {attrCount > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="text-[9px] text-indigo-300/60 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        +{attrCount} extra attr{attrCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-3 border-t border-white/5 flex-wrap">
                    <button onClick={() => setSubModal(sub)}
                      className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-[#FF8C00] transition-colors px-2.5 py-1.5 rounded-xl hover:bg-[#FF8C00]/5">
                      <FiEdit2 size={11} /> Edit
                    </button>
                    {isActive ? (
                      <SubcategoryToggleBtn
                        action="deactivate" sub={sub}
                        onConfirm={handleDeactivateSubcategory}
                      />
                    ) : (
                      <SubcategoryToggleBtn
                        action="reactivate" sub={sub}
                        onConfirm={handleReactivateSubcategory}
                      />
                    )}
                    <SubcategoryDeleteBtn sub={sub} onConfirm={handleDeleteSubcategory} />
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

// ── Tiny inline helpers for the flat subcategory grid ───────────────────────────
const SubcategoryToggleBtn = ({ action, sub, onConfirm }) => {
  const [show, setShow] = useState(false);
  return (
    <>
      {show && (
        <ToggleStatusModal
          item={sub} action={action}
          onConfirm={() => { onConfirm(sub); setShow(false); }}
          onCancel={() => setShow(false)}
          loading={false}
        />
      )}
      <button onClick={() => setShow(true)}
        className={`flex items-center gap-1.5 text-xs font-bold transition-colors px-2.5 py-1.5 rounded-xl ${
          action === "deactivate"
            ? "text-white/40 hover:text-amber-400 hover:bg-amber-400/5"
            : "text-white/40 hover:text-emerald-400 hover:bg-emerald-400/5"
        }`}>
        {action === "deactivate" ? <FiToggleLeft size={12} /> : <FiToggleRight size={12} />}
        {action === "deactivate" ? "Deactivate" : "Reactivate"}
      </button>
    </>
  );
};

const SubcategoryDeleteBtn = ({ sub, onConfirm }) => {
  const [show, setShow] = useState(false);
  return (
    <>
      {show && (
        <DeleteConfirm
          item={sub} label="subcategory"
          warningNote="Only allowed if no products have ever been listed under this subcategory."
          onConfirm={() => { onConfirm(sub); setShow(false); }}
          onCancel={() => setShow(false)}
          loading={false}
        />
      )}
      <button onClick={() => setShow(true)}
        className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-red-400 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-red-500/5 ml-auto">
        <FiTrash2 size={11} /> Delete
      </button>
    </>
  );
};

export default Categories;