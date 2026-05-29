// src/pages/CampusGuideManagement.jsx

import { useState, useEffect, useCallback, useRef } from "react";
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
  FiMapPin,
  FiClock,
  FiBookmark,
  FiToggleLeft,
  FiToggleRight,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiStar,
  FiUpload,
  FiImage,
} from "react-icons/fi";
import { MdLocationOn } from "react-icons/md";

/* ─────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
───────────────────────────────────────────────────────────── */

// Hardcoded categories
const CATEGORIES = [
  { value: "Academic", label: "Academic", color: "#2563EB" },
  { value: "Admin", label: "Admin", color: "#7C3AED" },
  { value: "Health", label: "Health", color: "#DC2626" },
  { value: "Food", label: "Food & Eateries", color: "#D97706" },
  { value: "Worship", label: "Worship", color: "#059669" },
  { value: "Sports", label: "Sports", color: "#0891B2" },
  { value: "Services", label: "Services", color: "#9333EA" },
  { value: "Hostel", label: "Hostels", color: "#B45309" },
];

const getCategoryColor = (category) => {
  const found = CATEGORIES.find((c) => c.value === category);
  return found?.color || "#B42225";
};

const getCategoryIcon = (category) => {
  const icons = {
    Academic: "🏫",
    Admin: "👔",
    Health: "🏥",
    Food: "🍔",
    Worship: "🕌",
    Sports: "⚽",
    Services: "🛠️",
    Hostel: "🏠",
  };
  return icons[category] || "📍";
};

const EMPTY_FORM = {
  category: "",
  name: "",
  location: "",
  walk_time: "",
  opening_hours: "",
  about: "",
  facilities: [],
  directions: "",
  landmarks: "",
  image: "",  // Changed from image_url to image
  pro_tip: "",
  google_maps_link: "",
  is_active: true,
  must_know_location: false,
  school_id: "",
};

const inputCls = (err) =>
  `w-full rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white outline-none transition-all ${
    err
      ? "border-red-500/40 bg-red-500/5 placeholder-white/20"
      : "border-white/8 bg-[#1a1a24] placeholder-white/20 focus:border-[#FF8C00]/50 focus:bg-[#1f1f2a]"
  }`;

// Style for select dropdown options to ensure text is visible
const selectStyle = {
  backgroundColor: "#1a1a24",
  color: "white",
};

const normalizeBooleanFlag = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

// Normalize facilities - ensure it's always an array of strings
const normalizeFacilities = (facilities) => {
  if (!facilities) return [];
  if (Array.isArray(facilities)) {
    return facilities
      .filter((item) => item != null && item !== "")
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object") {
          const keys = Object.keys(item);
          return keys.length > 0 ? keys[0] : String(item);
        }
        return String(item);
      });
  }
  if (typeof facilities === "object" && facilities !== null) {
    return Object.keys(facilities).filter(
      (key) =>
        facilities[key] === true ||
        facilities[key] === "true" ||
        facilities[key] === 1,
    );
  }
  return [];
};

const formatFacilityName = (name) => {
  if (!name) return "";
  const str = String(name);
  return str
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Extract schools array from API response
const extractSchoolsArray = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  
  const data = response?.data ?? response;
  
  if (data?.all_schools?.schools && Array.isArray(data.all_schools.schools)) {
    return data.all_schools.schools;
  }
  if (data?.schools && Array.isArray(data.schools)) {
    return data.schools;
  }
  if (response?.schools && Array.isArray(response.schools)) {
    return response.schools;
  }
  
  return [];
};

/* ─────────────────────────────────────────────────────────────
   IMAGE UPLOAD COMPONENT
───────────────────────────────────────────────────────────── */
const ImageUploader = ({ currentImageUrl, onImageUploaded, label }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || "");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file (JPEG, PNG, WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit. Please choose a smaller image.");
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload using campus_guide_image type
      const result = await ApiService.uploadFiles([file], "campus_guide_image");
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const uploadedUrl = result.primary_url || result.urls?.[0];
      if (uploadedUrl) {
        setPreviewUrl(uploadedUrl);
        onImageUploaded(uploadedUrl);
        console.log("Image uploaded successfully:", uploadedUrl);
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      let errorMessage = error.message || "Failed to upload image. Please try again.";
      
      if (errorMessage.includes("401") || errorMessage.includes("authentication") || errorMessage.includes("token")) {
        errorMessage = "Your session has expired. Please refresh the page and log in again.";
      }
      
      setError(errorMessage);
      setPreviewUrl(currentImageUrl || "");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    onImageUploaded("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
        {label || "Location Image"}
      </label>
      
      {error && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-red-500/10 border border-red-500/20">
          <FiAlertCircle size={12} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}
      
      {uploading && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span className="flex items-center gap-2">
              <FiLoader size={14} className="animate-spin" />
              Uploading image...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%`, background: "linear-gradient(90deg, #B42225, #FF8C00)" }}
            />
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        {/* Image Preview */}
        {previewUrl ? (
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
            <img 
              src={previewUrl} 
              alt="Location preview" 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
            >
              <FiX size={10} />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <FiImage size={24} className="text-white/20" />
          </div>
        )}
        
        {/* Upload Button */}
        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
          uploading ? "border-white/10 bg-white/5 opacity-50" : "border-white/15 bg-white/5 hover:border-[#FF8C00]/50 hover:bg-[#FF8C00]/5"
        }`}>
          <FiUpload size={16} className="text-white/40" />
          <span className="text-sm font-medium text-white/60">
            {uploading ? "Uploading..." : previewUrl ? "Change Image" : "Click to Upload Image"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      </div>
      
      <p className="text-[10px] text-white/25">
        JPEG, PNG, WebP up to 5MB. Recommended size: 1200x800px.
      </p>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   FACILITIES TAG INPUT
───────────────────────────────────────────────────────────── */
const FacilitiesInput = ({ value, onChange, error }) => {
  const [input, setInput] = useState("");
  const facilitiesArray = normalizeFacilities(value);

  const addFacility = () => {
    if (input.trim() && !facilitiesArray.includes(input.trim())) {
      onChange([...facilitiesArray, input.trim()]);
      setInput("");
    }
  };

  const removeFacility = (facility) => {
    onChange(facilitiesArray.filter((f) => f !== facility));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addFacility();
    }
  };

  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
        Facilities & Amenities
      </label>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Parking, WiFi, 24/7 Security"
          className={`flex-1 ${inputCls(error)}`}
        />
        <button
          type="button"
          onClick={addFacility}
          className="px-4 rounded-xl text-white font-bold transition-all hover:opacity-80 hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}
        >
          <FiPlus size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {facilitiesArray.map((facility, idx) => (
          <span
            key={idx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <FiCheck size={10} className="text-[#10B981]" />
            {formatFacilityName(facility)}
            <button
              type="button"
              onClick={() => removeFacility(facility)}
              className="ml-1 text-white/30 hover:text-red-400 transition"
            >
              <FiX size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   FORM MODAL
───────────────────────────────────────────────────────────── */
const FormModal = ({ initial, onClose, onSave, saving, schools }) => {
  const isEdit = !!initial?.id;

  const getSchoolName = (schoolId) => {
    const school = schools.find((s) => s.id === schoolId || s._id === schoolId);
    return school?.school_name || schoolId || "—";
  };

  const [form, setForm] = useState(() => {
    if (!initial) return { ...EMPTY_FORM };
    return {
      category: initial.category || "",
      name: initial.name || "",
      location: initial.location || "",
      walk_time: initial.walk_time || initial.walkTime || "",
      opening_hours: initial.opening_hours || initial.openingHours || "",
      about: initial.about || initial.description || "",
      facilities: normalizeFacilities(initial.facilities),
      directions: initial.directions || "",
      landmarks: initial.landmarks || "",
      image: initial.image || initial.image_url || initial.imageUrl || "",  // Support both
      pro_tip: initial.pro_tip || initial.proTip || initial.tips || "",
      google_maps_link: initial.google_maps_link || initial.googleMapsLink || "",
      is_active: initial.is_active !== undefined ? initial.is_active : true,
      must_know_location:
        initial.must_know_location !== undefined
          ? initial.must_know_location
          : false,
      school_id: initial.school_id || initial.schoolId || "",
    };
  });

  const [errors, setErrors] = useState({});

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const handleImageUploaded = (url) => {
    setField("image", url);
  };

  const validate = () => {
    const e = {};
    if (!form.category) e.category = "Required";
    if (!form.name?.trim()) e.name = "Required";
    if (!form.location?.trim()) e.location = "Required";
    if (!form.walk_time?.trim()) e.walk_time = "Required";
    if (!form.about?.trim()) e.about = "Required";
    if (form.about?.trim().length < 20) e.about = "At least 20 characters";
    if (!form.school_id) e.school_id = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form, initial?.id || null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl sm:rounded-3xl border flex flex-col"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div>
            <h3
              className="text-lg sm:text-xl font-black text-white"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              {isEdit ? "Edit Location" : "Add New Location"}
            </h3>
            <p className="text-xs text-white/30 mt-0.5">
              {isEdit
                ? "Update campus guide information"
                : "Create a new campus guide entry"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Image Upload Section */}
          <ImageUploader
            currentImageUrl={form.image}
            onImageUploaded={handleImageUploaded}
            label="Location Image"
          />

          {/* Basic Info Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                className={inputCls(errors.category)}
                style={selectStyle}
              >
                <option value="" style={selectStyle}>-- Select Category --</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} style={selectStyle}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-red-400 mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                Location Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g., ICT Centre, Senate Building"
                className={inputCls(errors.name)}
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                Zone / Area *
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="e.g., Main Campus, New Site"
                className={inputCls(errors.location)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                Walk Time *
              </label>
              <input
                type="text"
                value={form.walk_time}
                onChange={(e) => setField("walk_time", e.target.value)}
                placeholder="e.g., 5 mins, 10-15 mins"
                className={inputCls(errors.walk_time)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                Opening Hours
              </label>
              <input
                type="text"
                value={form.opening_hours}
                onChange={(e) => setField("opening_hours", e.target.value)}
                placeholder="e.g., Mon-Fri: 8am-5pm"
                className={inputCls()}
              />
            </div>

            {/* School Field */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                School {!isEdit && "*"}
              </label>
              {isEdit ? (
                <div 
                  className="w-full rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white/70 bg-[#1a1a24] border-white/8"
                >
                  {getSchoolName(form.school_id)}
                </div>
              ) : (
                <select
                  value={form.school_id}
                  onChange={(e) => setField("school_id", e.target.value)}
                  className={inputCls(errors.school_id)}
                  style={selectStyle}
                >
                  <option value="" style={selectStyle}>-- Select School --</option>
                  {schools.map((school) => (
                    <option key={school.id || school._id} value={school.id || school._id} style={selectStyle}>
                      {school.school_name}
                    </option>
                  ))}
                </select>
              )}
              {errors.school_id && (
                <p className="text-xs text-red-400 mt-1">{errors.school_id}</p>
              )}
            </div>
          </div>

          {/* About Section */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              About / Description *
            </label>
            <textarea
              value={form.about}
              onChange={(e) => setField("about", e.target.value)}
              rows={4}
              placeholder="Describe the location, what it offers, and why students should visit..."
              className={`${inputCls(errors.about)} resize-none`}
            />
            <p className="text-right text-[10px] text-white/20 mt-1">
              {form.about.length} characters (min 20)
            </p>
          </div>

          {/* Directions & Landmarks */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                Directions
              </label>
              <textarea
                value={form.directions}
                onChange={(e) => setField("directions", e.target.value)}
                rows={3}
                placeholder="Step-by-step directions from main gate..."
                className="w-full rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white outline-none resize-none placeholder-white/20 border-white/8 bg-[#1a1a24] focus:border-[#FF8C00]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                Landmarks
              </label>
              <textarea
                value={form.landmarks}
                onChange={(e) => setField("landmarks", e.target.value)}
                rows={3}
                placeholder="Nearby landmarks for easy identification..."
                className="w-full rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white outline-none resize-none placeholder-white/20 border-white/8 bg-[#1a1a24] focus:border-[#FF8C00]/50 transition-all"
              />
            </div>
          </div>

          {/* Facilities */}
          <FacilitiesInput
            value={form.facilities}
            onChange={(val) => setField("facilities", val)}
          />

          {/* Additional Links */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              Google Maps Link (Optional)
            </label>
            <input
              type="text"
              value={form.google_maps_link}
              onChange={(e) => setField("google_maps_link", e.target.value)}
              placeholder="https://maps.google.com/..."
              className={inputCls()}
            />
          </div>

          {/* Pro Tip */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              Pro Tip
            </label>
            <textarea
              value={form.pro_tip}
              onChange={(e) => setField("pro_tip", e.target.value)}
              rows={2}
              placeholder="Insider tip for students visiting this location..."
              className="w-full rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white outline-none resize-none placeholder-white/20 border-white/8 bg-[#1a1a24] focus:border-[#FF8C00]/50 transition-all"
            />
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setField("is_active", !form.is_active)}
              className="flex items-center justify-between px-4 py-3 rounded-xl sm:rounded-2xl border transition-all hover:scale-[1.02] active:scale-98"
              style={{
                background: form.is_active
                  ? "rgba(16,185,129,0.08)"
                  : "rgba(255,255,255,0.04)",
                border: form.is_active
                  ? "1px solid rgba(16,185,129,0.3)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="text-sm font-bold"
                style={{
                  color: form.is_active ? "#10B981" : "rgba(255,255,255,0.4)",
                }}
              >
                {form.is_active ? "✓ Active" : "✗ Inactive"}
              </span>
              {form.is_active ? (
                <FiToggleRight size={22} className="text-[#10B981]" />
              ) : (
                <FiToggleLeft size={22} className="text-white/20" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setField("must_know_location", !form.must_know_location)
              }
              className="flex items-center justify-between px-4 py-3 rounded-xl sm:rounded-2xl border transition-all hover:scale-[1.02] active:scale-98"
              style={{
                background: form.must_know_location
                  ? "rgba(255,140,0,0.08)"
                  : "rgba(255,255,255,0.04)",
                border: form.must_know_location
                  ? "1px solid rgba(255,140,0,0.3)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="text-sm font-bold flex items-center gap-2"
                style={{
                  color: form.must_know_location
                    ? "#FF8C00"
                    : "rgba(255,255,255,0.4)",
                }}
              >
                <FiBookmark size={14} />
                Must-Know Location
              </span>
              {form.must_know_location ? (
                <FiToggleRight size={22} className="text-[#FF8C00]" />
              ) : (
                <FiToggleLeft size={22} className="text-white/20" />
              )}
            </button>
          </div>
        </div>

        <div
          className="flex gap-3 px-4 sm:px-6 py-4 border-t shrink-0"
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
              "Update Location"
            ) : (
              "Create Location"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   LOCATION CARD
───────────────────────────────────────────────────────────── */
const LocationCard = ({
  loc,
  onEdit,
  onDelete,
  onToggle,
  onToggleMustKnow,
  actionId,
}) => {
  const busy = actionId === loc.id;
  const active = normalizeBooleanFlag(loc.is_active);
  const mustKnow = normalizeBooleanFlag(loc.must_know_location);
  const categoryColor = getCategoryColor(loc.category);
  const categoryIcon = getCategoryIcon(loc.category);

  const getSafeFacilities = () => {
    const facilitiesData = loc.facilities;
    if (!facilitiesData) return [];
    if (Array.isArray(facilitiesData)) {
      return facilitiesData
        .filter((item) => item != null)
        .map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object")
            return Object.keys(item)[0] || String(item);
          return String(item);
        });
    }
    if (typeof facilitiesData === "object") {
      return Object.keys(facilitiesData).filter(
        (key) =>
          facilitiesData[key] === true ||
          facilitiesData[key] === "true" ||
          facilitiesData[key] === 1,
      );
    }
    return [];
  };

  const facilities = getSafeFacilities();

  return (
    <div
      className="group relative rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
      style={{
        background: "#0d0d14",
        border: `1px solid ${
          active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"
        }`,
        opacity: active ? 1 : 0.7,
      }}
    >
      <div className="h-1 w-full" style={{ background: categoryColor }} />

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
            style={{
              background: `${categoryColor}15`,
              border: `1px solid ${categoryColor}25`,
            }}
          >
            <span className="text-lg">{categoryIcon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-black text-white leading-tight line-clamp-1 group-hover:text-[#FF8C00] transition-colors"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              {loc.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: `${categoryColor}15`,
                  color: categoryColor,
                }}
              >
                {loc.category}
              </span>
              <span className="text-[9px] text-white/30 flex items-center gap-0.5">
                <FiMapPin size={8} /> {loc.location}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {mustKnow && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-black bg-orange-500/15 text-orange-400 border border-orange-500/20">
              <FiStar size={8} /> MUST-KNOW
            </span>
          )}
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-black"
            style={{
              color: active ? "#10B981" : "rgba(255,255,255,0.4)",
              background: active
                ? "rgba(16,185,129,0.1)"
                : "rgba(255,255,255,0.05)",
              border: active
                ? "1px solid rgba(16,185,129,0.2)"
                : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {active ? "✓ ACTIVE" : "✗ INACTIVE"}
          </span>
          {loc.walk_time && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-black bg-white/5 text-white/30 border border-white/5">
              <FiClock size={8} /> {loc.walk_time}
            </span>
          )}
        </div>

        <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2 mb-3">
          {loc.about || "No description available"}
        </p>

        {facilities.length > 0 && (
          <div className="mb-3">
            <p className="text-[8px] font-bold uppercase tracking-wider text-white/20 mb-1.5">
              🏷️ Amenities
            </p>
            <div className="flex flex-wrap gap-1">
              {facilities.slice(0, 3).map((facility, idx) => {
                const formattedName = String(facility)
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");

                return (
                  <span
                    key={idx}
                    className="text-[8px] px-1.5 py-0.5 rounded-md"
                    style={{
                      background: `${categoryColor}10`,
                      color: categoryColor,
                    }}
                  >
                    {formattedName}
                  </span>
                );
              })}
              {facilities.length > 3 && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/30">
                  +{facilities.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/5">
          <button
            onClick={() => onToggleMustKnow(loc)}
            disabled={busy}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
            style={{
              background: mustKnow
                ? "rgba(255,140,0,0.12)"
                : "rgba(255,255,255,0.04)",
              border: mustKnow
                ? "1px solid rgba(255,140,0,0.3)"
                : "1px solid rgba(255,255,255,0.06)",
              color: mustKnow ? "#FF8C00" : "rgba(255,255,255,0.5)",
            }}
            title={mustKnow ? "Remove from featured" : "Mark as featured"}
          >
            {busy ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiBookmark size={11} />
            )}
            <span className="text-[8px]">Feature</span>
          </button>

          <button
            onClick={() => onToggle(loc)}
            disabled={busy}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
            style={{
              background: active
                ? "rgba(239,68,68,0.1)"
                : "rgba(16,185,129,0.08)",
              border: active
                ? "1px solid rgba(239,68,68,0.2)"
                : "1px solid rgba(16,185,129,0.2)",
              color: active ? "#EF4444" : "#10B981",
            }}
            title={active ? "Deactivate" : "Activate"}
          >
            {busy ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : active ? (
              <FiX size={11} />
            ) : (
              <FiCheck size={11} />
            )}
            <span className="text-[8px]">{active ? "Disable" : "Enable"}</span>
          </button>

          <button
            onClick={() => onEdit(loc)}
            disabled={busy}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold transition-all hover:bg-white/10 disabled:opacity-40"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.6)",
            }}
            title="Edit location"
          >
            <FiEdit2 size={11} />
            <span className="text-[8px]">Edit</span>
          </button>

          <button
            onClick={() => onDelete(loc)}
            disabled={busy}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[9px] font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "#EF4444",
            }}
            title="Delete location"
          >
            {busy ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiTrash2 size={11} />
            )}
            <span className="text-[8px]">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   DELETE CONFIRM MODAL
───────────────────────────────────────────────────────────── */
const DeleteConfirm = ({ locationName, onConfirm, onCancel, loading }) => (
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
        Delete "{locationName}"?
      </h3>
      <p className="text-sm text-white/40 mb-6">
        This will permanently delete this location and all associated reviews.
        This action cannot be undone.
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
   MAIN PAGE
───────────────────────────────────────────────────────────── */
const CampusGuideManagement = () => {
  const [locations, setLocations] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch schools
  const fetchSchools = useCallback(async () => {
    try {
      const response = await ApiService.getAllSchools();
      const schoolsArray = extractSchoolsArray(response);
      setSchools(schoolsArray);
    } catch (err) {
      console.error("Failed to fetch schools:", err);
      setSchools([]);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", itemsPerPage);
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category", categoryFilter);
      if (statusFilter === "active") params.append("is_active", "true");
      if (statusFilter === "inactive") params.append("is_active", "false");

      const queryString = params.toString();
      const endpoint = `/admin/campus-guide/all${queryString ? `?${queryString}` : ""}`;

      const response = await ApiService.makeRequest(endpoint, { method: "GET" });

      let items = [];
      let total = 0;
      let totalPagesVal = 1;

      const data = response?.data || response;

      if (data?.guides && Array.isArray(data.guides)) {
        items = data.guides;
        total = data.total || items.length;
        totalPagesVal = data.total_pages || Math.ceil(total / itemsPerPage);
      } else if (Array.isArray(data)) {
        items = data;
        total = data.length;
      } else if (data?.all_locations && Array.isArray(data.all_locations)) {
        items = data.all_locations;
        total = data.total || items.length;
      }

      setLocations(items);
      setTotalItems(total);
      setTotalPages(Math.max(1, totalPagesVal));
    } catch (err) {
      console.error("fetchLocations error:", err);
      setError(err.message || "Failed to load campus guide locations.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, categoryFilter, statusFilter, itemsPerPage]);

  useEffect(() => {
    fetchSchools();
    fetchLocations();
  }, [fetchSchools, fetchLocations]);

  const handleSave = async (formData, editId) => {
    setSaving(true);
    try {
      // Convert facilities array to array of objects for backend
      const facilitiesArray = formData.facilities || [];
      const facilitiesAsObjects = facilitiesArray.map(facility => ({
        [facility.toLowerCase().replace(/\s+/g, "_")]: true
      }));
      
      const payload = {
        category: formData.category,
        name: formData.name,
        location: formData.location,
        walk_time: formData.walk_time,
        opening_hours: formData.opening_hours || "",
        about: formData.about,
        facilities: facilitiesAsObjects,
        directions: formData.directions || "",
        landmarks: formData.landmarks || "",
        image: formData.image,  // Changed from image_url to image
        pro_tip: formData.pro_tip || "",
        google_maps_link: formData.google_maps_link || "",
        is_active: formData.is_active,
        must_know_location: formData.must_know_location,
      };

      // Only include school_id when creating (not when editing)
      if (!editId) {
        payload.school_id = formData.school_id;
      }

      if (editId) {
        await ApiService.makeRequest(`/admin/campus-guide/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast("Location updated successfully!");
      } else {
        await ApiService.makeRequest("/admin/campus-guide/create", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("Location created successfully!");
      }
      setModal(null);
      await fetchLocations();
    } catch (err) {
      console.error("handleSave error:", err);
      showToast(err.message || "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };
    
  const handleToggle = async (loc) => {
    setActionId(loc.id);
    try {
      await ApiService.makeRequest(`/admin/campus-guide/${loc.id}/toggle-status`, {
        method: "PATCH",
      });
      showToast(`"${loc.name}" ${!loc.is_active ? "activated" : "deactivated"}.`);
      await fetchLocations();
    } catch (err) {
      showToast(err.message || "Failed to update status.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleToggleMustKnow = async (loc) => {
    setActionId(loc.id);
    try {
      await ApiService.makeRequest(`/admin/campus-guide/${loc.id}/toggle-must-know`, {
        method: "PATCH",
      });
      showToast(`"${loc.name}" ${!loc.must_know_location ? "marked as" : "removed from"} Must-Know.`);
      await fetchLocations();
    } catch (err) {
      showToast(err.message || "Failed to update Must-Know status.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionId(confirmDelete.id);
    const name = confirmDelete.name;
    setConfirmDelete(null);

    try {
      await ApiService.makeRequest(`/admin/campus-guide/${confirmDelete.id}`, {
        method: "DELETE",
      });
      showToast(`"${name}" permanently deleted.`);
      await fetchLocations();
    } catch (err) {
      showToast(err.message || "Failed to delete location.", "error");
    } finally {
      setActionId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const activeCount = locations.filter((l) => normalizeBooleanFlag(l.is_active)).length;
  const mustKnowCount = locations.filter((l) => normalizeBooleanFlag(l.must_know_location)).length;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-4">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold animate-slide-in"
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
        <FormModal
          initial={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
          schools={schools}
        />
      )}
      {confirmDelete && (
        <DeleteConfirm
          locationName={confirmDelete.name}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={actionId === confirmDelete.id}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
            Campus Guide
          </h1>
          <p className="text-sm text-white/30 mt-0.5">
            Manage campus locations, facilities, and guides
            {locations.length > 0 && ` • ${activeCount} active, ${mustKnowCount} must-know`}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => fetchLocations()}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white/50 hover:text-white transition-all disabled:opacity-40 flex-1 sm:flex-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
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
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total", value: totalItems, color: "#0EA5E9", icon: <MdLocationOn size={16} /> },
          { label: "Active", value: activeCount, color: "#10B981", icon: <FiCheck size={14} /> },
          { label: "Inactive", value: locations.length - activeCount, color: "#EF4444", icon: <FiX size={14} /> },
          { label: "Must-Know", value: mustKnowCount, color: "#FF8C00", icon: <FiStar size={14} /> },
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
              {loading ? <FiLoader className="animate-spin inline" /> : value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 rounded-xl sm:rounded-2xl border border-white/8 bg-white/5 px-3 sm:px-4 py-2.5 sm:py-3 focus-within:border-[#FF8C00]/40 transition-all">
          <FiSearch size={14} className="text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, location..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="flex-1 text-xs sm:text-sm text-white outline-none bg-transparent placeholder-white/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-white/30 hover:text-white transition">
              <FiX size={14} />
            </button>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-xl sm:rounded-2xl border border-white/8 bg-[#1a1a24] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white outline-none focus:border-[#FF8C00]/50 transition-all"
          style={selectStyle}
        >
          <option value="" style={selectStyle}>All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value} style={selectStyle}>
              {cat.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-xl sm:rounded-2xl border border-white/8 bg-[#1a1a24] px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white outline-none focus:border-[#FF8C00]/50 transition-all"
          style={selectStyle}
        >
          <option value="all" style={selectStyle}>All Status</option>
          <option value="active" style={selectStyle}>Active Only</option>
          <option value="inactive" style={selectStyle}>Inactive Only</option>
        </select>

        {(search || categoryFilter || statusFilter !== "all") && (
          <button
            onClick={clearFilters}
            className="px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white/50 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl sm:rounded-2xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-xs sm:text-sm">{error}</p>
        </div>
      )}

      {/* Locations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl sm:rounded-2xl animate-pulse" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", height: "280px" }} />
          ))}
        </div>
      ) : locations.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {locations.map((loc) => (
              <LocationCard
                key={loc.id}
                loc={loc}
                onEdit={(l) => setModal(l)}
                onDelete={(l) => setConfirmDelete(l)}
                onToggle={handleToggle}
                onToggleMustKnow={handleToggleMustKnow}
                actionId={actionId}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:scale-105"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <FiChevronLeft size={14} className="text-white/60" />
              </button>
              <span className="text-xs sm:text-sm text-white/60 px-3 sm:px-4">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:scale-105"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <FiChevronRight size={14} className="text-white/60" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl p-12 sm:p-16 text-center border" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
          <MdLocationOn size={48} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm sm:text-base font-bold text-white/30">
            {search || categoryFilter || statusFilter !== "all" ? "No locations match your filters" : "No campus guide locations yet"}
          </p>
          {!search && !categoryFilter && statusFilter === "all" && (
            <button onClick={() => setModal("create")} className="mt-4 text-xs sm:text-sm font-black text-[#FF8C00] hover:underline">
              + Add your first location
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CampusGuideManagement;