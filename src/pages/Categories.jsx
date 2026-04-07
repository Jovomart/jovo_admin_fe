// src/pages/Categories.jsx
import { useState, useEffect, useCallback } from "react";
import ApiService from "../services/apiService";
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiCheck,
  FiAlertCircle, FiRefreshCw, FiGrid, FiTag,
  FiToggleLeft, FiToggleRight, FiSearch, FiInfo,
  FiPlusCircle, FiMinusCircle,
} from "react-icons/fi";
import { MdOutlineCategory } from "react-icons/md";

const inputCls = (err) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm text-white outline-none transition-all ${
    err
      ? "border-red-500/50 bg-red-500/5"
      : "border-white/10 bg-white/5 focus:border-[#FF8C00]/50"
  }`;

const ATTRIBUTE_TYPES = [
  { value: "text", label: "Text (short input)" },
  { value: "textarea", label: "Text Area (multi-line)" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean (Yes/No toggle)" },
  { value: "select", label: "Select (dropdown - single choice)" },
  { value: "multiselect", label: "Multi-Select (multiple choices)" },
];

const EMPTY_ATTRIBUTE = {
  key: "",
  label: "",
  type: "text",
  required: false,
  options: [],
};

/* ─── Attribute Schema Builder ─── */
const AttributeBuilder = ({ schema, onChange, errors }) => {
  const addAttribute = () => {
    onChange([...schema, { ...EMPTY_ATTRIBUTE }]);
  };

  const removeAttribute = (index) => {
    const newSchema = [...schema];
    newSchema.splice(index, 1);
    onChange(newSchema);
  };

  const updateAttribute = (index, field, value) => {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], [field]: value };
    // Clear options if type is not select or multiselect
    if (field === "type" && !["select", "multiselect"].includes(value)) {
      newSchema[index].options = [];
    }
    onChange(newSchema);
  };

  const updateOption = (attrIndex, optIndex, value) => {
    const newSchema = [...schema];
    const options = [...(newSchema[attrIndex].options || [])];
    options[optIndex] = value;
    newSchema[attrIndex].options = options;
    onChange(newSchema);
  };

  const addOption = (attrIndex) => {
    const newSchema = [...schema];
    const options = [...(newSchema[attrIndex].options || []), ""];
    newSchema[attrIndex].options = options;
    onChange(newSchema);
  };

  const removeOption = (attrIndex, optIndex) => {
    const newSchema = [...schema];
    const options = [...(newSchema[attrIndex].options || [])];
    options.splice(optIndex, 1);
    newSchema[attrIndex].options = options;
    onChange(newSchema);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-[2px] text-white/30">
          Attribute Schema
        </label>
        <button
          type="button"
          onClick={addAttribute}
          className="flex items-center gap-1 text-xs font-bold text-[#FF8C00] hover:underline"
        >
          <FiPlus size={12} /> Add Attribute
        </button>
      </div>

      {schema.length === 0 && (
        <div className="text-center py-8 rounded-xl border border-white/10 bg-white/5">
          <FiGrid size={32} className="text-white/20 mx-auto mb-2" />
          <p className="text-sm text-white/30">No attributes defined</p>
          <p className="text-xs text-white/20">Click "Add Attribute" to create custom fields for this category</p>
        </div>
      )}

      {schema.map((attr, idx) => (
        <div key={idx} className="rounded-xl p-4 border border-white/10 bg-white/5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white/70">Attribute #{idx + 1}</h4>
            <button
              type="button"
              onClick={() => removeAttribute(idx)}
              className="text-red-400 hover:text-red-300 transition"
            >
              <FiTrash2 size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1">
                Key *
              </label>
              <input
                type="text"
                placeholder="e.g. size, color, material"
                value={attr.key}
                onChange={(e) => updateAttribute(idx, "key", e.target.value)}
                className={inputCls(errors?.[`attr_${idx}_key`])}
              />
              <p className="text-[9px] text-white/20 mt-0.5">Used as property name in JSON</p>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1">
                Label *
              </label>
              <input
                type="text"
                placeholder="e.g. Size, Color, Material"
                value={attr.label}
                onChange={(e) => updateAttribute(idx, "label", e.target.value)}
                className={inputCls()}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1">
                Field Type *
              </label>
              <select
                value={attr.type}
                onChange={(e) => updateAttribute(idx, "type", e.target.value)}
                className={inputCls()}
              >
                {ATTRIBUTE_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="bg-[#0d0d14]">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attr.required}
                  onChange={(e) => updateAttribute(idx, "required", e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-[#FF8C00]"
                />
                <span className="text-xs text-white/60">Required field</span>
              </label>
            </div>
          </div>

          {/* Options for select/multiselect */}
          {["select", "multiselect"].includes(attr.type) && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-2">
                Options *
              </label>
              <div className="space-y-2">
                {(attr.options || []).map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${optIdx + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                      className="flex-1 rounded-lg border px-3 py-2 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(idx, optIdx)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <FiMinusCircle size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(idx)}
                  className="flex items-center gap-1 text-xs text-[#FF8C00] hover:underline"
                >
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

/* ─── Category Modal (Create / Edit) ─── */
const CategoryModal = ({ category, onClose, onSave, saving }) => {
  const isEdit = !!category?.id;
  const [form, setForm] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    category_type: category?.category_type || "PRODUCT",
    attribute_schema: category?.attribute_schema || [],
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
    
    // Validate attribute schema keys are unique
    const keys = form.attribute_schema.map((a) => a.key).filter(Boolean);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      e.attribute_schema = "Attribute keys must be unique";
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form, isEdit ? category.id : null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-3xl rounded-3xl border flex flex-col max-h-[90vh]"
        style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>

        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h3 className="text-lg font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
            {isEdit ? "Edit Category" : "Create New Category"}
          </h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errors.general && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20">
              <FiAlertCircle size={14} className="text-red-400" />
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Fashion, Electronics, Tutoring"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputCls(errors.name)}
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                Slug (URL-friendly)
              </label>
              <input
                type="text"
                placeholder="auto-generated from name"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                className={inputCls()}
              />
              <p className="text-[9px] text-white/20 mt-0.5">Leave empty to auto-generate</p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              Category Type *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => set("category_type", "PRODUCT")}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  form.category_type === "PRODUCT"
                    ? "border-[#FF8C00] bg-[#FF8C00]/10 text-white"
                    : "border-white/10 bg-white/5 text-white/40 hover:text-white/60"
                }`}
              >
                📦 Product
              </button>
              <button
                type="button"
                onClick={() => set("category_type", "SERVICE")}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                  form.category_type === "SERVICE"
                    ? "border-[#FF8C00] bg-[#FF8C00]/10 text-white"
                    : "border-white/10 bg-white/5 text-white/40 hover:text-white/60"
                }`}
              >
                ⚙️ Service
              </button>
            </div>
            {errors.category_type && <p className="text-xs text-red-400 mt-1">{errors.category_type}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of this category..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none resize-none"
            />
          </div>

          <AttributeBuilder
            schema={form.attribute_schema}
            onChange={(schema) => set("attribute_schema", schema)}
            errors={errors}
          />
          {errors.attribute_schema && (
            <p className="text-xs text-red-400 mt-1">{errors.attribute_schema}</p>
          )}
        </form>

        <div className="flex gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 bg-white/5 hover:bg-white/10 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}>
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              : isEdit ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Deactivate/Reactivate Confirm Modal ─── */
const ToggleStatusModal = ({ category, action, onConfirm, onCancel, loading }) => {
  const isDeactivate = action === "deactivate";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className={`w-12 h-12 rounded-2xl ${isDeactivate ? "bg-amber-500/10" : "bg-emerald-500/10"} flex items-center justify-center mx-auto mb-4`}>
          {isDeactivate ? <FiToggleLeft size={20} className="text-amber-400" /> : <FiToggleRight size={20} className="text-emerald-400" />}
        </div>
        <h3 className="text-lg font-black text-white mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
          {isDeactivate ? "Deactivate Category?" : "Reactivate Category?"}
        </h3>
        <p className="text-sm text-white/40 mb-2">
          {isDeactivate 
            ? `You are about to deactivate "${category.name}".`
            : `You are about to reactivate "${category.name}".`}
        </p>
        <p className="text-xs text-white/25 mb-5">
          {isDeactivate 
            ? "Deactivated categories will not appear in public listings."
            : "Reactivated categories will become visible to users again."}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 bg-white/5 hover:bg-white/10 transition">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white transition disabled:opacity-50 ${
              isDeactivate ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"
            }`}>
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Permanent Delete Confirm Modal ─── */
const DeleteConfirm = ({ category, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
    <div className="w-full max-w-sm rounded-3xl p-6 text-center"
      style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <FiTrash2 size={20} className="text-red-400" />
      </div>
      <h3 className="text-lg font-black text-white mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
        Permanently Delete?
      </h3>
      <p className="text-sm text-white/40 mb-2">
        You are about to permanently delete <strong className="text-white/70">{category.name}</strong>.
      </p>
      <p className="text-xs text-amber-400/70 mb-5 bg-amber-500/5 rounded-xl px-3 py-2 border border-amber-500/15">
        ⚠️ This cannot be undone. Only allowed if no products are linked to this category.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 bg-white/5 hover:bg-white/10 transition">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Delete"}
        </button>
      </div>
    </div>
  </div>
);

/* ─── Category Card ─── */
const CategoryCard = ({ category, onEdit, onDeactivate, onReactivate, onDelete }) => {
  const isActive = category.is_active !== false;
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [toggleAction, setToggleAction] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleToggleClick = (action) => {
    setToggleAction(action);
    setShowToggleModal(true);
  };

  const handleToggleConfirm = () => {
    if (toggleAction === "deactivate") {
      onDeactivate(category);
    } else {
      onReactivate(category);
    }
    setShowToggleModal(false);
    setToggleAction(null);
  };

  const attributeCount = category.attribute_schema?.length || 0;

  return (
    <>
      {showToggleModal && (
        <ToggleStatusModal
          category={category}
          action={toggleAction}
          onConfirm={handleToggleConfirm}
          onCancel={() => setShowToggleModal(false)}
          loading={false}
        />
      )}
      {showDeleteModal && (
        <DeleteConfirm
          category={category}
          onConfirm={() => {
            onDelete(category);
            setShowDeleteModal(false);
          }}
          onCancel={() => setShowDeleteModal(false)}
          loading={false}
        />
      )}
      <div className="rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all duration-200"
        style={{ background: "#0d0d14", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}>
            <MdOutlineCategory size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-white/90 leading-tight">{category.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-[#FF8C00] bg-[#FF8C00]/10 px-2 py-0.5 rounded-full">
                    {category.category_type === "PRODUCT" ? "📦 Product" : "⚙️ Service"}
                  </span>
                  <span className="text-[9px] text-white/30">
                    {attributeCount} attribute{attributeCount !== 1 ? "s" : ""}
                  </span>
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
          <p className="text-[10px] text-white/25 mb-3">🔗 /{category.slug}</p>
        )}

        {/* Attribute preview */}
        {attributeCount > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {category.attribute_schema.slice(0, 3).map((attr, idx) => (
                <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">
                  {attr.label}
                </span>
              ))}
              {attributeCount > 3 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">
                  +{attributeCount - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          <button onClick={() => onEdit(category)}
            className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-[#FF8C00] transition-colors px-3 py-2 rounded-xl hover:bg-[#FF8C00]/5">
            <FiEdit2 size={12} /> Edit
          </button>
          {isActive ? (
            <button onClick={() => handleToggleClick("deactivate")}
              className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-amber-400 transition-colors px-3 py-2 rounded-xl hover:bg-amber-400/5">
              <FiToggleLeft size={13} /> Deactivate
            </button>
          ) : (
            <button onClick={() => handleToggleClick("reactivate")}
              className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-emerald-400 transition-colors px-3 py-2 rounded-xl hover:bg-emerald-400/5">
              <FiToggleRight size={13} /> Reactivate
            </button>
          )}
          <button onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-red-400 transition-colors px-3 py-2 rounded-xl hover:bg-red-500/5 ml-auto">
            <FiTrash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </>
  );
};

/* ─── Main Categories Page ─── */
const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | "create" | category object
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, PRODUCT, SERVICE
  const [showInactive, setShowInactive] = useState(true);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ApiService.getAdminCategories(
        filterType === "all" ? null : filterType,
        showInactive
      );
      // Parse response
      let categoriesArray = [];
      if (Array.isArray(response)) {
        categoriesArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesArray = response.data;
      } else if (response?.categories && Array.isArray(response.categories)) {
        categoriesArray = response.categories;
      } else if (response?.data?.categories && Array.isArray(response.data.categories)) {
        categoriesArray = response.data.categories;
      }
      setCategories(categoriesArray);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, [filterType, showInactive]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSave = async (formData, editId) => {
    setSaving(true);
    try {
      if (editId) {
        await ApiService.updateCategory(editId, formData);
        showToast("Category updated successfully!");
      } else {
        await ApiService.createCategory(formData);
        showToast("Category created successfully!");
      }
      setModal(null);
      await fetchCategories();
    } catch (err) {
      console.error("Save error:", err);
      showToast(err.message || "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (category) => {
    try {
      await ApiService.deactivateCategory(category.id);
      showToast(`"${category.name}" has been deactivated.`);
      await fetchCategories();
    } catch (err) {
      showToast(err.message || "Failed to deactivate.", "error");
    }
  };

  const handleReactivate = async (category) => {
    try {
      await ApiService.reactivateCategory(category.id);
      showToast(`"${category.name}" has been reactivated.`);
      await fetchCategories();
    } catch (err) {
      showToast(err.message || "Failed to reactivate.", "error");
    }
  };

  const handleDelete = async (category) => {
    try {
      await ApiService.deleteCategory(category.id);
      showToast(`"${category.name}" has been permanently deleted.`);
      await fetchCategories();
    } catch (err) {
      showToast(err.message || "Failed to delete. Category may have products linked.", "error");
    }
  };

  const filtered = categories.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q);
  });

  const activeCount = categories.filter(c => c.is_active !== false).length;
  const inactiveCount = categories.filter(c => c.is_active === false).length;
  const productCount = categories.filter(c => c.category_type === "PRODUCT").length;
  const serviceCount = categories.filter(c => c.category_type === "SERVICE").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">

      {toast && (
        <div className="fixed top-6 right-6 z-100 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold"
          style={{
            background: toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
            border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
            color: toast.type === "error" ? "#EF4444" : "#10B981",
          }}>
          {toast.type === "error" ? <FiAlertCircle size={15} /> : <FiCheck size={15} />}
          {toast.msg}
        </div>
      )}

      {modal && (
        <CategoryModal
          category={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
            Category Management
          </h1>
          <p className="text-sm text-white/30 mt-0.5">Manage product and service categories with dynamic attribute schemas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCategories} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => setModal("create")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)", boxShadow: "0 4px 16px rgba(180,34,37,0.3)" }}>
            <FiPlus size={14} /> New Category
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: categories.length, color: "#0EA5E9" },
          { label: "Active", value: activeCount, color: "#10B981" },
          { label: "Inactive", value: inactiveCount, color: "#EF4444" },
          { label: "Products", value: productCount, color: "#FF8C00" },
          { label: "Services", value: serviceCount, color: "#8B5CF6" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 border border-white/5" style={{ background: "#0d0d14" }}>
            <p className="text-2xl font-black mb-1" style={{ color }}>{value}</p>
            <p className="text-xs text-white/30 font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 focus-within:border-[#FF8C00]/40 transition-all">
          <FiSearch size={15} className="text-white/30 shrink-0" />
          <input type="text" placeholder="Search by name or slug..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20" />
          {search && (
            <button onClick={() => setSearch("")} className="text-white/30 hover:text-white">
              <FiX size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {["all", "PRODUCT", "SERVICE"].map((type) => (
              <button key={type} onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  filterType === type ? "text-white" : "text-white/30 hover:text-white/60"
                }`}
                style={filterType === type ? { background: "linear-gradient(135deg,#B42225,#FF8C00)" } : {}}>
                {type === "all" ? "All" : type === "PRODUCT" ? "📦 Products" : "⚙️ Services"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              showInactive ? "text-white bg-[#EF4444]/20 border border-[#EF4444]/30" : "text-white/30 hover:text-white/60"
            }`}
            style={{ background: showInactive ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)" }}>
            {showInactive ? "✓ Showing Inactive" : "Hide Inactive"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={14} className="text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-2xl animate-pulse" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", height: "200px" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl p-16 text-center border" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
          <MdOutlineCategory size={48} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm font-bold text-white/30">
            {search ? `No categories match "${search}"` : "No categories found"}
          </p>
          {!search && (
            <button onClick={() => setModal("create")} className="mt-4 text-xs font-black text-[#FF8C00] hover:underline">
              + Create your first category
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={(c) => setModal(c)}
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;