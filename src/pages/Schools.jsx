// src/pages/Schools.jsx
import { useState, useEffect } from "react";
import ApiService from "../services/apiService";
import {
  FiPlus, FiSearch, FiX, FiAlertCircle, FiRefreshCw,
  FiEdit2, FiTrash2, FiCheck, FiGlobe, FiPhone,
  FiMail, FiMapPin, FiToggleLeft, FiToggleRight,
} from "react-icons/fi";
import { MdOutlineSchool } from "react-icons/md";

/* ─── Helper function to safely extract schools array ───────── */
const extractSchoolsArray = (data) => {
  // If data is an array
  if (Array.isArray(data)) return data;
  
  // If data has a data property that's an array
  if (data?.data && Array.isArray(data.data)) return data.data;
  
  // If data has a schools property that's an array
  if (data?.schools && Array.isArray(data.schools)) return data.schools;
  
  // If data.data is an object with schools array
  if (data?.data?.schools && Array.isArray(data.data.schools)) return data.data.schools;
  
  // If data.data is an empty object, return empty array
  if (data?.data && typeof data.data === 'object' && Object.keys(data.data).length === 0) {
    return [];
  }
  
  // If data.data is an object, try to extract any array property
  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    for (const key in data.data) {
      if (Array.isArray(data.data[key])) {
        return data.data[key];
      }
    }
  }
  
  // If data itself is an object with numeric keys (array-like)
  if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
    const values = Object.values(data);
    if (values.length > 0 && Array.isArray(values[0])) {
      return values[0];
    }
  }
  
  // Default: return empty array
  return [];
};

/* ─── Form Modal (Create / Edit) ─────────────────────────────── */
const SchoolModal = ({ existing, onClose, onDone }) => {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    schoolName:         existing?.school_name         || "",
    schoolCode:         existing?.school_code         || "",
    schoolAddress:      existing?.school_address      || "",
    schoolPhoneNumber:  existing?.school_phone_number || "",
    schoolEmail:        existing?.school_email        || "",
    schoolWebsite:      existing?.school_website      || "",
    schoolLogoUrl:      existing?.school_logo_url     || "",
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); setError(""); };

  const validate = () => {
    const e = {};
    if (!form.schoolName.trim())        e.schoolName        = "School name is required";
    if (!form.schoolCode.trim())        e.schoolCode        = "School code is required";
    if (!form.schoolAddress.trim())     e.schoolAddress     = "Address is required";
    if (!form.schoolPhoneNumber.trim()) e.schoolPhoneNumber = "Phone number is required";
    if (!form.schoolEmail.trim())       e.schoolEmail       = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.schoolEmail)) e.schoolEmail = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      if (isEdit) await ApiService.updateSchool(existing.id || existing._id, form);
      else        await ApiService.createSchool(form);
      onDone();
    } catch (err) { setError(err.message || "Failed to save school."); }
    finally { setLoading(false); }
  };

  const inputCls = (field) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm text-white bg-white/5 outline-none transition-all placeholder-white/20 ${
      errors[field] ? "border-red-500/50" : "border-white/8 focus:border-[#FF8C00]/50"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-xl rounded-3xl flex flex-col max-h-[92vh]"
        style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>

        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
          <div>
            <h3 className="text-lg font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
              {isEdit ? "Edit School" : "Add New School"}
            </h3>
            <p className="text-xs text-white/30 mt-0.5">{isEdit ? "Update school details" : "Register a new school on the platform"}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition">
            <FiX size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl px-4 py-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <FiAlertCircle size={13} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">School Name *</label>
              <input className={inputCls("schoolName")} placeholder="e.g. Federal University of Technology"
                value={form.schoolName} onChange={e => set("schoolName", e.target.value)} />
              {errors.schoolName && <p className="text-xs text-red-400 mt-1">{errors.schoolName}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">School Code *</label>
              <input className={inputCls("schoolCode")} placeholder="e.g. FUTO"
                value={form.schoolCode} onChange={e => set("schoolCode", e.target.value.toUpperCase())} />
              {errors.schoolCode && <p className="text-xs text-red-400 mt-1">{errors.schoolCode}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Phone Number *</label>
              <input className={inputCls("schoolPhoneNumber")} placeholder="+234..."
                value={form.schoolPhoneNumber} onChange={e => set("schoolPhoneNumber", e.target.value)} />
              {errors.schoolPhoneNumber && <p className="text-xs text-red-400 mt-1">{errors.schoolPhoneNumber}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Email Address *</label>
              <input type="email" className={inputCls("schoolEmail")} placeholder="info@school.edu.ng"
                value={form.schoolEmail} onChange={e => set("schoolEmail", e.target.value)} />
              {errors.schoolEmail && <p className="text-xs text-red-400 mt-1">{errors.schoolEmail}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Address *</label>
              <input className={inputCls("schoolAddress")} placeholder="Full school address"
                value={form.schoolAddress} onChange={e => set("schoolAddress", e.target.value)} />
              {errors.schoolAddress && <p className="text-xs text-red-400 mt-1">{errors.schoolAddress}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Website <span className="text-white/20 font-normal normal-case">(optional)</span></label>
              <input className={inputCls("schoolWebsite")} placeholder="https://school.edu.ng"
                value={form.schoolWebsite} onChange={e => set("schoolWebsite", e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Logo URL <span className="text-white/20 font-normal normal-case">(optional)</span></label>
              <input className={inputCls("schoolLogoUrl")} placeholder="https://..."
                value={form.schoolLogoUrl} onChange={e => set("schoolLogoUrl", e.target.value)} />
            </div>
          </div>
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-white/5 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 bg-white/5 hover:bg-white/8 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)", boxShadow: "0 4px 16px rgba(180,34,37,0.3)" }}>
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <FiCheck size={15} />}
            {loading ? "Saving..." : isEdit ? "Update School" : "Add School"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Delete Confirm Modal ────────────────────────────────────── */
const DeleteModal = ({ school, onClose, onDone }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleDelete = async () => {
    setLoading(true);
    try { await ApiService.deleteSchool(school.id || school._id); onDone(); }
    catch (err) { setError(err.message || "Failed to delete. Make sure no users are linked to this school."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <FiTrash2 size={20} className="text-red-400" />
        </div>
        <h3 className="text-lg font-black text-white text-center mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
          Permanently Delete?
        </h3>
        <p className="text-sm text-white/40 text-center mb-2">
          You are about to permanently delete <strong className="text-white/70">{school.school_name}</strong>.
        </p>
        <p className="text-xs text-amber-400/70 text-center mb-5 bg-amber-500/5 rounded-xl px-3 py-2 border border-amber-500/15">
          ⚠️ This cannot be undone. Will fail if users are linked to this school.
        </p>
        {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 bg-white/5 hover:bg-white/8 transition">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── School Card ─────────────────────────────────────────────── */
const SchoolCard = ({ school, onEdit, onDelete, onToggleStatus }) => {
  const [toggling, setToggling] = useState(false);
  const isActive = school.is_active !== false;

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggleStatus(school); }
    catch (err) { console.error("Toggle error:", err); }
    finally { setToggling(false); }
  };

  return (
    <div className="rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all duration-200"
      style={{ background: "#0d0d14", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}>
          {school.school_logo_url
            ? <img src={school.school_logo_url} alt={school.school_name} className="w-full h-full object-cover" />
            : <span className="text-white text-sm font-black">
                {school.school_code?.slice(0, 2) || school.school_name?.slice(0, 2) || "SC"}
              </span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-white/90 leading-tight">{school.school_name}</h3>
              <span className="text-[10px] font-black text-[#FF8C00] bg-[#FF8C00]/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                {school.school_code}
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
              isActive ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
            }`}>
              {isActive ? "● Active" : "● Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {school.school_address && (
          <p className="flex items-start gap-2 text-xs text-white/35">
            <FiMapPin size={11} className="text-white/25 shrink-0 mt-0.5" /> {school.school_address}
          </p>
        )}
        {school.school_email && (
          <p className="flex items-center gap-2 text-xs text-white/35">
            <FiMail size={11} className="text-white/25 shrink-0" /> {school.school_email}
          </p>
        )}
        {school.school_phone_number && (
          <p className="flex items-center gap-2 text-xs text-white/35">
            <FiPhone size={11} className="text-white/25 shrink-0" /> {school.school_phone_number}
          </p>
        )}
        {school.school_website && (
          <a href={school.school_website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-[#FF8C00]/60 hover:text-[#FF8C00] transition-colors">
            <FiGlobe size={11} className="shrink-0" /> {school.school_website}
          </a>
        )}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        <button onClick={() => onEdit(school)}
          className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-[#FF8C00] transition-colors px-3 py-2 rounded-xl hover:bg-[#FF8C00]/5">
          <FiEdit2 size={12} /> Edit
        </button>
        <button onClick={handleToggle} disabled={toggling}
          className={`flex items-center gap-1.5 text-xs font-bold transition-colors px-3 py-2 rounded-xl disabled:opacity-50 ${
            isActive
              ? "text-white/40 hover:text-amber-400 hover:bg-amber-400/5"
              : "text-white/40 hover:text-emerald-400 hover:bg-emerald-400/5"
          }`}>
          {toggling
            ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            : isActive ? <FiToggleLeft size={13} /> : <FiToggleRight size={13} />}
          {isActive ? "Deactivate" : "Reactivate"}
        </button>
        <button onClick={() => onDelete(school)}
          className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-red-400 transition-colors px-3 py-2 rounded-xl hover:bg-red-500/5 ml-auto">
          <FiTrash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
};

/* ─── Main Schools Page ───────────────────────────────────────── */
const Schools = () => {
  const [schools, setSchools]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [search, setSearch]           = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [editSchool, setEditSchool]   = useState(null);
  const [deleteSchool, setDeleteSchool] = useState(null);
  const [filter, setFilter]           = useState("all");

  const fetchSchools = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await ApiService.getAllSchools();
      console.log("Raw API response:", data);
      const schoolsArray = extractSchoolsArray(data);
      console.log("Extracted schools:", schoolsArray);
      setSchools(schoolsArray);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load schools.");
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchools(); }, []);

  const handleToggleStatus = async (school) => {
    const isActive = school.is_active !== false;
    const id = school.id || school._id;
    try {
      if (isActive) {
        await ApiService.deactivateSchool(id);
      } else {
        await ApiService.reactivateSchool(id);
      }
      // Wait a moment before refreshing
      setTimeout(() => {
        fetchSchools();
      }, 500);
    } catch (err) {
      console.error("Toggle status error:", err);
      setError(err.message || "Failed to update school status");
      // Refresh anyway to sync with backend
      fetchSchools();
    }
  };

  // Safe filtering - ensures schools is always an array
  const safeSchools = Array.isArray(schools) ? schools : [];
  
  const filtered = safeSchools.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.school_name || "").toLowerCase().includes(q) ||
      (s.school_code || "").toLowerCase().includes(q) ||
      (s.school_address || "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ? true :
      filter === "active" ? s.is_active !== false :
      s.is_active === false;
    return matchSearch && matchFilter;
  });

  const activeCount = safeSchools.filter(s => s.is_active !== false).length;
  const inactiveCount = safeSchools.filter(s => s.is_active === false).length;

  return (
    <div className="space-y-5 max-w-5xl mx-auto px-4 sm:px-6">

      {/* Modals */}
      {showModal && (
        <SchoolModal existing={null} onClose={() => setShowModal(false)}
          onDone={() => { setShowModal(false); fetchSchools(); }} />
      )}
      {editSchool && (
        <SchoolModal existing={editSchool} onClose={() => setEditSchool(null)}
          onDone={() => { setEditSchool(null); fetchSchools(); }} />
      )}
      {deleteSchool && (
        <DeleteModal school={deleteSchool} onClose={() => setDeleteSchool(null)}
          onDone={() => { setDeleteSchool(null); fetchSchools(); }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
            School Management
          </h2>
          <p className="text-xs text-white/30 mt-0.5">
            {safeSchools.length} school{safeSchools.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSchools} disabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-white transition px-3 py-2 rounded-xl bg-white/5 hover:bg-white/8">
            <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 text-xs font-black text-white px-4 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)", boxShadow: "0 4px 16px rgba(180,34,37,0.3)" }}>
            <FiPlus size={14} /> Add School
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Schools", value: safeSchools.length, color: "#FF8C00" },
          { label: "Active", value: activeCount, color: "#10B981" },
          { label: "Inactive", value: inactiveCount, color: "#EF4444" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 border border-white/5"
            style={{ background: "#0d0d14" }}>
            <p className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif", color }}>
              {value}
            </p>
            <p className="text-xs text-white/30 mt-0.5 font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 focus-within:border-[#FF8C00]/40 transition-all">
          <FiSearch size={15} className="text-white/30 shrink-0" />
          <input type="text" placeholder="Search by name, code or location..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20" />
          {search && (
            <button onClick={() => setSearch("")} className="text-white/30 hover:text-white transition">
              <FiX size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 p-1 rounded-2xl shrink-0"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {["all", "active", "inactive"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === f ? "text-white" : "text-white/30 hover:text-white/60"
              }`}
              style={filter === f ? { background: "linear-gradient(135deg,#B42225,#FF8C00)" } : {}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#FF8C00]/20 border-t-[#FF8C00] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-4"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <FiAlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <MdOutlineSchool size={28} className="text-white/20" />
          </div>
          <p className="text-white/40 font-bold text-sm">
            {search ? "No schools match your search" : `No ${filter !== "all" ? filter : ""} schools found`}
          </p>
          <p className="text-white/20 text-xs mt-1">
            {search ? "Try a different keyword" : "Click 'Add School' to register the first school"}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((school) => (
            <SchoolCard
              key={school.id || school._id || school.school_code}
              school={school}
              onEdit={setEditSchool}
              onDelete={setDeleteSchool}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Schools;