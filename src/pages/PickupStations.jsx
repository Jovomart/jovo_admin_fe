// src/pages/PickupStations.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import ApiService from "../services/apiService";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiRefreshCw,
  FiSearch,
  FiMapPin,
  FiNavigation,
  FiPower,
  FiChevronDown,
  FiGlobe,
  FiPackage,
  FiLoader,
} from "react-icons/fi";

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════ */

/**
 * Safely parse stations from various possible API response shapes.
 */
const parseStations = (raw) => {
  console.log("📍 [parseStations] Raw input:", raw);
  
  if (!raw) {
    console.log("📍 [parseStations] No raw data");
    return [];
  }
  
  let stationsArray = [];
  
  // Your response structure: { status, status_code, message, data: { pickup_stations: [...] } }
  const dataObj = raw.data || raw;
  
  console.log("📍 Data object:", dataObj);
  console.log("📍 Data object keys:", dataObj ? Object.keys(dataObj) : "null");
  
  // Check for pickup_stations (this is your actual structure)
  if (dataObj?.pickup_stations && Array.isArray(dataObj.pickup_stations)) {
    stationsArray = dataObj.pickup_stations;
    console.log("📍 Found stations in data.pickup_stations");
  }
  // Also check for other common names for safety
  else if (dataObj?.stations && Array.isArray(dataObj.stations)) {
    stationsArray = dataObj.stations;
    console.log("📍 Found stations in data.stations");
  }
  else if (dataObj?.items && Array.isArray(dataObj.items)) {
    stationsArray = dataObj.items;
    console.log("📍 Found stations in data.items");
  }
  else if (dataObj?.results && Array.isArray(dataObj.results)) {
    stationsArray = dataObj.results;
    console.log("📍 Found stations in data.results");
  }
  else if (Array.isArray(dataObj)) {
    stationsArray = dataObj;
    console.log("📍 Data object is an array directly");
  }
  
  // If still empty, try to find any array property
  if (stationsArray.length === 0 && dataObj && typeof dataObj === 'object') {
    for (const key in dataObj) {
      if (Array.isArray(dataObj[key])) {
        stationsArray = dataObj[key];
        console.log(`📍 Found stations in data.${key}`);
        break;
      }
    }
  }
  
  // If the object itself might be a single station
  if (stationsArray.length === 0 && dataObj && typeof dataObj === 'object') {
    if (dataObj.id || dataObj.station_name) {
      stationsArray = [dataObj];
      console.log("📍 Data object is a single station");
    }
  }
  
  // Normalize each station
  const normalized = stationsArray.map((station) => ({
    ...station,
    id: station.id || station._id || station.station_id,
    station_name: station.station_name || station.name,
    station_address: station.station_address || station.address,
    latitude: station.latitude !== undefined ? station.latitude : station.lat,
    longitude: station.longitude !== undefined ? station.longitude : station.lng,
    is_active: station.is_active !== undefined ? station.is_active : station.isActive,
    school_id: station.school_id || station.schoolId,
  }));
  
  console.log(`📍 [parseStations] Parsed ${normalized.length} stations:`, normalized);
  return normalized;
};

/**
 * Safely parse schools from various API shapes and normalize IDs.
 */
const parseSchools = (raw) => {
  console.log("🏫 [parseSchools] Raw input:", raw);
  
  if (!raw) return [];
  
  let schoolsArray = [];
  
  // Try every possible shape
  if (Array.isArray(raw?.data?.schools)) schoolsArray = raw.data.schools;
  else if (Array.isArray(raw?.data?.data)) schoolsArray = raw.data.data;
  else if (Array.isArray(raw?.data)) schoolsArray = raw.data;
  else if (Array.isArray(raw?.schools)) schoolsArray = raw.schools;
  else if (Array.isArray(raw?.results)) schoolsArray = raw.results;
  else if (Array.isArray(raw?.items)) schoolsArray = raw.items;
  else if (Array.isArray(raw)) schoolsArray = raw;
  
  // Check for all_schools.schools structure
  if (schoolsArray.length === 0 && raw?.data?.all_schools?.schools) {
    schoolsArray = raw.data.all_schools.schools;
  }
  if (schoolsArray.length === 0 && raw?.all_schools?.schools) {
    schoolsArray = raw.all_schools.schools;
  }
  
  // Normalize each school
  const normalized = schoolsArray.map((school) => ({
    ...school,
    id: school.id || school._id || school.school_id || school.schoolId,
    school_name: school.school_name || school.schoolName || school.name,
    school_code: school.school_code || school.code,
  })).filter(school => school.id);
  
  console.log("🏫 [parseSchools] Normalized:", normalized);
  return normalized;
};

const EMPTY_FORM = {
  station_name: "",
  station_address: "",
  latitude: "",
  longitude: "",
  is_active: true,
};

const inputCls = (hasErr) =>
  `w-full rounded-2xl border px-4 py-3 text-sm text-white bg-transparent outline-none transition-all placeholder-white/20 ${
    hasErr
      ? "border-red-500/40 bg-red-500/5"
      : "border-white/8 bg-white/4 focus:border-[#FF8C00]/50 focus:bg-white/6"
  }`;

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
      <span style={{ maxWidth: 320 }}>{toast.msg}</span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCHOOL SELECTOR
═══════════════════════════════════════════════════════════════ */
const SchoolSelector = ({ schools, selectedId, onChange, loading }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = schools.find((s) => s.id === selectedId);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative min-w-55">
      <button
        onClick={() => !loading && setOpen((p) => !p)}
        disabled={loading}
        className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <FiGlobe size={13} className="text-[#FF8C00] shrink-0" />
        <span className="flex-1 text-left truncate">
          {loading
            ? "Loading schools…"
            : selected
            ? selected.school_name || selected.name
            : "Select a school"}
        </span>
        <FiChevronDown
          size={13}
          className={`text-white/30 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-50"
          style={{
            background: "#0d0d14",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {schools.length === 0 ? (
            <div className="px-4 py-3 text-xs text-white/30">No schools found</div>
          ) : (
            schools.map((s) => {
              const isActive = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    onChange(s.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors"
                  style={{
                    background: isActive ? "rgba(255,140,0,0.08)" : "transparent",
                    color: isActive ? "#FF8C00" : "rgba(255,255,255,0.7)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      background: isActive ? "#FF8C00" : "rgba(255,255,255,0.15)",
                    }}
                  />
                  <span className="truncate font-semibold">
                    {s.school_name || s.name}
                  </span>
                  {s.school_code && (
                    <span className="ml-auto text-[10px] text-white/25 font-mono shrink-0">
                      {s.school_code}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FORM MODAL
═══════════════════════════════════════════════════════════════ */
const FormModal = ({ initial, schools, onClose, onSave, saving }) => {
  const isEdit = !!initial?.id;

  const [form, setForm] = useState(() =>
    isEdit
      ? {
          station_name: initial.station_name || "",
          station_address: initial.station_address || "",
          latitude: initial.latitude !== undefined ? String(initial.latitude) : "",
          longitude: initial.longitude !== undefined ? String(initial.longitude) : "",
          is_active: initial.is_active !== false,
        }
      : { ...EMPTY_FORM }
  );

  const [selectedSchoolId, setSelectedSchoolId] = useState(
    isEdit ? (initial.school_id || null) : (schools[0]?.id || null)
  );

  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.station_name.trim()) e.station_name = "Station name is required";
    if (!form.station_address.trim()) e.station_address = "Address is required";
    if (form.latitude === "" || isNaN(Number(form.latitude)))
      e.latitude = "Valid latitude required (−90 to 90)";
    else if (Number(form.latitude) < -90 || Number(form.latitude) > 90)
      e.latitude = "Latitude must be between −90 and 90";
    if (form.longitude === "" || isNaN(Number(form.longitude)))
      e.longitude = "Valid longitude required (−180 to 180)";
    else if (Number(form.longitude) < -180 || Number(form.longitude) > 180)
      e.longitude = "Longitude must be between −180 and 180";
    if (!isEdit && !selectedSchoolId) e.school = "Please select a school";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(
      {
        station_name: form.station_name.trim(),
        station_address: form.station_address.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        is_active: form.is_active,
      },
      isEdit ? initial.id : null,
      isEdit ? null : selectedSchoolId
    );
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-3xl flex flex-col"
        style={{
          background: "#0c0c13",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(255,140,0,0.1)",
                border: "1px solid rgba(255,140,0,0.2)",
              }}
            >
              <FiMapPin size={16} className="text-[#FF8C00]" />
            </div>
            <div>
              <h3
                className="text-sm font-black text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {isEdit ? "Edit Pickup Station" : "New Pickup Station"}
              </h3>
              <p className="text-[11px] text-white/30 mt-0.5">
                {isEdit ? "Update station details" : "Register a campus hub"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <FiX size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* School selector — only for create */}
          {!isEdit && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
                School *
              </label>
              <div
                className="rounded-2xl border"
                style={{
                  border: errors.school
                    ? "1px solid rgba(239,68,68,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <SchoolSelector
                  schools={schools}
                  selectedId={selectedSchoolId}
                  onChange={(id) => {
                    setSelectedSchoolId(id);
                    setErrors((p) => ({ ...p, school: "" }));
                  }}
                  loading={false}
                />
              </div>
              {errors.school && (
                <p className="text-xs text-red-400 mt-1">{errors.school}</p>
              )}
            </div>
          )}

          {/* Station Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              Station Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Main Gate Hub, Faculty of Science Block"
              value={form.station_name}
              onChange={(e) => set("station_name", e.target.value)}
              className={inputCls(errors.station_name)}
            />
            {errors.station_name && (
              <p className="text-xs text-red-400 mt-1">{errors.station_name}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">
              Station Address *
            </label>
            <textarea
              placeholder="Full address or landmark description…"
              value={form.station_address}
              onChange={(e) => set("station_address", e.target.value)}
              rows={2}
              className={`${inputCls(errors.station_address)} resize-none`}
            />
            {errors.station_address && (
              <p className="text-xs text-red-400 mt-1">{errors.station_address}</p>
            )}
          </div>

          {/* Coordinates */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-[10px] font-black uppercase tracking-[2px] text-white/30">
                GPS Coordinates *
              </label>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[#FF8C00]/70 hover:text-[#FF8C00] transition-colors flex items-center gap-1"
              >
                <FiNavigation size={9} /> Find on Google Maps
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (e.g. 6.5244)"
                  value={form.latitude}
                  onChange={(e) => set("latitude", e.target.value)}
                  className={inputCls(errors.latitude)}
                />
                {errors.latitude && (
                  <p className="text-xs text-red-400 mt-1">{errors.latitude}</p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (e.g. 3.3792)"
                  value={form.longitude}
                  onChange={(e) => set("longitude", e.target.value)}
                  className={inputCls(errors.longitude)}
                />
                {errors.longitude && (
                  <p className="text-xs text-red-400 mt-1">{errors.longitude}</p>
                )}
              </div>
            </div>
            {form.latitude && form.longitude && !errors.latitude && !errors.longitude && (
              <a
                href={`https://maps.google.com/?q=${form.latitude},${form.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-[11px] text-[#FF8C00]/60 hover:text-[#FF8C00] transition-colors"
              >
                <FiMapPin size={10} />
                Preview location on map
              </a>
            )}
          </div>

          {/* Active toggle */}
          <button
            type="button"
            onClick={() => set("is_active", !form.is_active)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all"
            style={{
              background: form.is_active
                ? "rgba(16,185,129,0.07)"
                : "rgba(255,255,255,0.03)",
              border: form.is_active
                ? "1px solid rgba(16,185,129,0.2)"
                : "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div>
              <p
                className="text-sm font-bold"
                style={{ color: form.is_active ? "#10B981" : "rgba(255,255,255,0.35)" }}
              >
                {form.is_active ? "Station Active" : "Station Inactive"}
              </p>
              <p className="text-[11px] text-white/25 mt-0.5">
                {form.is_active
                  ? "Visible and operational for deliveries"
                  : "Hidden from customers"}
              </p>
            </div>
            <div
              className="relative w-11 h-6 rounded-full transition-all shrink-0"
              style={{
                background: form.is_active
                  ? "rgba(16,185,129,0.3)"
                  : "rgba(255,255,255,0.08)",
                border: form.is_active
                  ? "1px solid rgba(16,185,129,0.4)"
                  : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                style={{
                  background: form.is_active ? "#10B981" : "rgba(255,255,255,0.2)",
                  left: form.is_active ? "calc(100% - 1.35rem)" : "0.1rem",
                  boxShadow: form.is_active ? "0 0 8px rgba(16,185,129,0.5)" : "none",
                }}
              />
            </div>
          </button>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4 border-t shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white/40 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3.5 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #B42225, #FF8C00)",
              boxShadow: "0 6px 24px rgba(180,34,37,0.3)",
            }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create Station"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DELETE CONFIRM MODAL
═══════════════════════════════════════════════════════════════ */
const DeleteConfirm = ({ station, onConfirm, onCancel, loading }) => (
  <div
    className="fixed inset-0 z-100 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
    onClick={(e) => e.target === e.currentTarget && onCancel()}
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
        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <FiTrash2 size={22} className="text-red-400" />
      </div>
      <h3
        className="text-base font-black text-white mb-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Delete Station?
      </h3>
      <p className="text-sm text-white/40 leading-relaxed mb-1">
        You are about to permanently delete
      </p>
      <p className="text-sm font-bold text-white mb-5">
        "{station?.station_name}"
      </p>
      <p className="text-xs text-white/25 mb-6">
        This action is irreversible and cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-black text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, #7f1d1d, #ef4444)",
            boxShadow: "0 6px 20px rgba(239,68,68,0.25)",
          }}
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

/* ═══════════════════════════════════════════════════════════════
   STATION CARD
═══════════════════════════════════════════════════════════════ */
const StationCard = ({ station, onEdit, onDelete, onToggle, actionId }) => {
  const busy = actionId === station.id;
  const active = station.is_active !== false;
  const hasCoords =
    station.latitude !== undefined &&
    station.latitude !== null &&
    station.longitude !== undefined &&
    station.longitude !== null;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col transition-all"
      style={{
        background: "#0d0d14",
        border: `1px solid ${active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)"}`,
        opacity: active ? 1 : 0.65,
      }}
    >
      {/* Top row */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: active ? "rgba(255,140,0,0.1)" : "rgba(255,255,255,0.04)",
            border: active
              ? "1px solid rgba(255,140,0,0.2)"
              : "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <FiMapPin
            size={17}
            style={{ color: active ? "#FF8C00" : "rgba(255,255,255,0.2)" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white truncate leading-tight">
            {station.station_name}
          </p>
          <p className="text-xs text-white/35 mt-0.5 leading-relaxed line-clamp-2">
            {station.station_address}
          </p>
        </div>
        <span
          className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0"
          style={{
            color: active ? "#10B981" : "rgba(255,255,255,0.25)",
            background: active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
            border: active
              ? "1px solid rgba(16,185,129,0.2)"
              : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Coordinates */}
      {hasCoords ? (
        <a
          href={`https://maps.google.com/?q=${station.latitude},${station.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 transition-all hover:opacity-80 group"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <FiNavigation size={12} className="text-[#FF8C00]/60 group-hover:text-[#FF8C00] transition-colors shrink-0" />
          <span className="text-[11px] font-mono text-white/30 group-hover:text-white/50 transition-colors truncate">
            {Number(station.latitude).toFixed(6)}, {Number(station.longitude).toFixed(6)}
          </span>
          <span className="ml-auto text-[10px] text-[#FF8C00]/40 group-hover:text-[#FF8C00] transition-colors shrink-0">
            View ↗
          </span>
        </a>
      ) : (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          <FiNavigation size={12} className="text-white/15 shrink-0" />
          <span className="text-[11px] text-white/20">No coordinates set</span>
        </div>
      )}

      {/* Station ID chip */}
      {station.id && (
        <div className="mb-4">
          <span
            className="text-[10px] font-mono text-white/20 px-2 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            ID: {String(station.id).slice(0, 16)}{String(station.id).length > 16 ? "…" : ""}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto pt-1">
        {/* Toggle */}
        <button
          onClick={() => onToggle(station)}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
          style={{
            background: active ? "rgba(239,68,68,0.09)" : "rgba(16,185,129,0.09)",
            border: active
              ? "1px solid rgba(239,68,68,0.2)"
              : "1px solid rgba(16,185,129,0.2)",
            color: active ? "#EF4444" : "#10B981",
          }}
        >
          {busy ? (
            <FiLoader size={13} className="animate-spin" />
          ) : (
            <FiPower size={13} />
          )}
          {active ? "Deactivate" : "Activate"}
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(station)}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all disabled:opacity-40"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <FiEdit2 size={13} /> Edit
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(station)}
          disabled={busy}
          className="flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
          style={{
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.15)",
            color: "#EF4444",
          }}
        >
          {busy && actionId === station.id ? (
            <FiLoader size={13} className="animate-spin" />
          ) : (
            <FiTrash2 size={13} />
          )}
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SKELETON CARD
═══════════════════════════════════════════════════════════════ */
const SkeletonCard = () => (
  <div
    className="rounded-2xl p-5 animate-pulse"
    style={{
      background: "#0d0d14",
      border: "1px solid rgba(255,255,255,0.05)",
      height: 240,
    }}
  >
    <div className="flex gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 rounded-lg w-3/4" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="h-2.5 rounded-lg w-1/2" style={{ background: "rgba(255,255,255,0.03)" }} />
      </div>
    </div>
    <div className="h-9 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.03)" }} />
    <div className="h-5 rounded-lg w-2/5 mb-4" style={{ background: "rgba(255,255,255,0.03)" }} />
    <div className="flex gap-2">
      <div className="h-9 rounded-xl flex-1" style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="h-9 rounded-xl flex-1" style={{ background: "rgba(255,255,255,0.04)" }} />
      <div className="w-9 h-9 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }} />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   FILTER PILL
═══════════════════════════════════════════════════════════════ */
const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
    style={{
      background: active ? "rgba(255,140,0,0.12)" : "rgba(255,255,255,0.04)",
      border: active ? "1px solid rgba(255,140,0,0.3)" : "1px solid rgba(255,255,255,0.07)",
      color: active ? "#FF8C00" : "rgba(255,255,255,0.35)",
    }}
  >
    {label}
  </button>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const PickupStations = () => {
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);

  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsError, setStationsError] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  // Load schools
  useEffect(() => {
    (async () => {
      setSchoolsLoading(true);
      try {
        const res = await ApiService.getAllSchools();
        console.log("🏫 getAllSchools response:", res);
        const list = parseSchools(res);
        setSchools(list);
        if (list.length > 0) {
          setSelectedSchoolId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load schools:", err);
        showToast(err.message || "Failed to load schools", "error");
      } finally {
        setSchoolsLoading(false);
      }
    })();
  }, [showToast]);

  // Load stations
  const fetchStations = useCallback(async (showLoader = true) => {
    if (!selectedSchoolId) {
      console.log("No school selected, skipping station fetch");
      return;
    }
    if (showLoader) setStationsLoading(true);
    setStationsError("");
    try {
      let params = {};
      if (activeFilter === "active") params.is_active = true;
      else if (activeFilter === "inactive") params.is_active = false;
      
      console.log(`Fetching stations for school: ${selectedSchoolId}, filter: ${activeFilter}`);
      const result = await ApiService.getAllPickupStations(selectedSchoolId, params);
      console.log("getAllPickupStations result:", result);
      
      const list = parseStations(result);
      console.log(`Parsed ${list.length} stations`);
      setStations(list);
      
      if (list.length === 0 && result) {
        console.log("No stations found, but response had data:", result);
      }
    } catch (err) {
      console.error("fetchStations error:", err);
      setStationsError(err.message || "Failed to load pickup stations.");
      showToast(err.message || "Failed to load pickup stations", "error");
    } finally {
      if (showLoader) setStationsLoading(false);
    }
  }, [selectedSchoolId, activeFilter, showToast]);

  useEffect(() => {
    if (selectedSchoolId) {
      fetchStations();
    }
  }, [fetchStations, selectedSchoolId]);

  const handleSave = async (payload, stationId, schoolId) => {
    setSaving(true);
    try {
      console.log("Saving station:", { payload, stationId, schoolId });
      
      if (stationId) {
        await ApiService.updatePickupStation(stationId, payload);
        showToast("Pickup station updated successfully!");
      } else {
        const result = await ApiService.createPickupStation(schoolId, payload);
        console.log("Create station result:", result);
        showToast("Pickup station created successfully!");
      }
      setModal(null);
      setTimeout(() => {
        fetchStations(true);
      }, 500);
    } catch (err) {
      console.error("handleSave error:", err);
      showToast(err.message || "Failed to save station.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (station) => {
    if (actionId === station.id) return;
    setActionId(station.id);
    const nextActive = !station.is_active;
    try {
      await ApiService.updatePickupStation(station.id, {
        station_name: station.station_name,
        station_address: station.station_address,
        latitude: station.latitude,
        longitude: station.longitude,
        is_active: nextActive,
      });
      showToast(`"${station.station_name}" ${nextActive ? "activated" : "deactivated"} successfully.`);
      await fetchStations(false);
    } catch (err) {
      console.error("handleToggle error:", err);
      showToast(err.message || "Failed to update station status.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const station = confirmDelete;
    setConfirmDelete(null);
    setActionId(station.id);
    try {
      await ApiService.deletePickupStation(station.id);
      showToast(`"${station.station_name}" deleted successfully.`);
      await fetchStations(false);
    } catch (err) {
      console.error("handleDelete error:", err);
      showToast(err.message || "Failed to delete station.", "error");
    } finally {
      setActionId(null);
    }
  };

  const filtered = stations.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.station_name?.toLowerCase().includes(q) ||
      s.station_address?.toLowerCase().includes(q)
    );
  });

  const totalCount = stations.length;
  const activeCount = stations.filter((s) => s.is_active !== false).length;
  const inactiveCount = totalCount - activeCount;
  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);

  return (
    <div className="space-y-6 max-w-6xl">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <Toast toast={toast} />

      {modal && (
        <FormModal
          initial={modal === "create" ? null : modal}
          schools={schools}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
      {confirmDelete && (
        <DeleteConfirm
          station={confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={actionId === confirmDelete.id}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0 sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Pickup Stations
          </h1>
          <p className="text-sm text-white/30 mt-0.5">
            Manage campus logistics hubs and drop-off points
            {selectedSchool && (
              <>
                {" "}
                <span className="text-white/15 mx-1">•</span>
                <span className="text-[#FF8C00]/60">
                  {selectedSchool.school_name || selectedSchool.name}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SchoolSelector
            schools={schools}
            selectedId={selectedSchoolId}
            onChange={(id) => setSelectedSchoolId(id)}
            loading={schoolsLoading}
          />

          <button
            onClick={() => fetchStations(true)}
            disabled={stationsLoading || !selectedSchoolId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all disabled:opacity-40"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <FiRefreshCw size={13} className={stationsLoading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={() => setModal("create")}
            disabled={schools.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #B42225, #FF8C00)",
              boxShadow: "0 4px 16px rgba(180,34,37,0.3)",
            }}
          >
            <FiPlus size={14} /> New Station
          </button>
        </div>
      </div>

      {/* No schools message */}
      {!schoolsLoading && schools.length === 0 && (
        <div
          className="rounded-3xl p-12 text-center border"
          style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <FiGlobe size={36} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm font-bold text-white/30">No schools found</p>
          <p className="text-xs text-white/20 mt-1">
            Create a school first before adding pickup stations.
          </p>
        </div>
      )}

      {schools.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Total Stations", value: totalCount, color: "#0EA5E9" },
              { label: "Active", value: activeCount, color: "#10B981" },
              { label: "Inactive", value: inactiveCount, color: "#EF4444" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-2xl p-4"
                style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <p className="text-2xl font-black mb-1" style={{ color }}>
                  {stationsLoading ? (
                    <span className="inline-block h-7 w-8 rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
                  ) : (
                    value
                  )}
                </p>
                <p className="text-xs text-white/30 font-semibold">{label}</p>
              </div>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div
              className="flex items-center gap-3 flex-1 rounded-2xl border px-4 py-3 transition-all focus-within:border-[#FF8C00]/40"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <FiSearch size={15} className="text-white/25 shrink-0" />
              <input
                type="text"
                placeholder="Search by name or address…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder-white/20"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-white/25 hover:text-white transition-colors">
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "inactive", label: "Inactive" },
              ].map(({ key, label }) => (
                <FilterPill
                  key={key}
                  label={label}
                  active={activeFilter === key}
                  onClick={() => setActiveFilter(key)}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {stationsError && (
            <div
              className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}
            >
              <FiAlertCircle size={14} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{stationsError}</p>
              <button
                onClick={() => fetchStations(true)}
                className="ml-auto text-xs font-bold text-red-400/70 hover:text-red-400 transition-colors underline shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Stations Grid */}
          {stationsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((station) => (
                  <StationCard
                    key={station.id}
                    station={station}
                    onEdit={(s) => setModal(s)}
                    onDelete={(s) => setConfirmDelete(s)}
                    onToggle={handleToggle}
                    actionId={actionId}
                  />
                ))}
              </div>
            </>
          ) : (
            <div
              className="rounded-3xl p-16 text-center border"
              style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              {search ? (
                <>
                  <FiSearch size={36} className="text-white/10 mx-auto mb-3" />
                  <p className="text-sm font-bold text-white/30">No stations match "{search}"</p>
                  <button
                    onClick={() => setSearch("")}
                    className="mt-3 text-xs font-bold text-[#FF8C00]/60 hover:text-[#FF8C00] transition-colors"
                  >
                    Clear search
                  </button>
                </>
              ) : activeFilter !== "all" ? (
                <>
                  <FiPackage size={36} className="text-white/10 mx-auto mb-3" />
                  <p className="text-sm font-bold text-white/30">No {activeFilter} stations</p>
                  <button
                    onClick={() => setActiveFilter("all")}
                    className="mt-3 text-xs font-bold text-[#FF8C00]/60 hover:text-[#FF8C00] transition-colors"
                  >
                    Show all
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(255,140,0,0.07)", border: "1px solid rgba(255,140,0,0.12)" }}
                  >
                    <FiMapPin size={28} className="text-[#FF8C00]/30" />
                  </div>
                  <p className="text-sm font-bold text-white/30 mb-1">No pickup stations yet</p>
                  <p className="text-xs text-white/20 mb-5">
                    Add your first campus logistics hub for {selectedSchool?.school_name || "this school"}
                  </p>
                  <button
                    onClick={() => setModal("create")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg, #B42225, #FF8C00)",
                      boxShadow: "0 4px 16px rgba(180,34,37,0.25)",
                    }}
                  >
                    <FiPlus size={13} /> Create First Station
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PickupStations;