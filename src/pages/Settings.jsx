// src/pages/Settings.jsx
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react";
import {
  FiUser,
  FiMail,
  FiLock,
  FiLogOut,
  FiAlertCircle,
  FiCheck,
  FiShield,
  FiEdit2,
  FiSave,
  FiX,
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import ApiService from "../services/apiService";
import logo from "../assets/images/logo.png";

const inputCls = (err) =>
  `flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
    err
      ? "border-red-500/40 bg-red-500/5"
      : "border-white/8 bg-white/4 focus-within:border-[#FF8C00]/50 focus-within:bg-white/6 focus-within:shadow-[0_0_0_3px_rgba(255,140,0,0.08)]"
  }`;

const ProfileEditModal = ({ profile, onClose, onSave, loading }) => {
  const [form, setForm] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    username: profile?.username || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    country: profile?.country || "",
    state: profile?.state || "",
    city: profile?.city || "",
    address: profile?.address || "",
  });
  const [errors, setErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: "" });
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (!form.last_name.trim()) e.last_name = "Last name is required";
    if (!form.username.trim()) e.username = "Username is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaveLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-lg rounded-3xl border overflow-hidden"
        style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "90vh", overflowY: "auto" }}>
        
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h3 className="text-lg font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
            Edit Profile
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <FiAlertCircle size={14} className="text-red-400" />
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">First Name *</label>
              <input type="text" value={form.first_name} onChange={(e) => handleChange("first_name", e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none transition-all" />
              {errors.first_name && <p className="text-xs text-red-400 mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Last Name *</label>
              <input type="text" value={form.last_name} onChange={(e) => handleChange("last_name", e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none transition-all" />
              {errors.last_name && <p className="text-xs text-red-400 mt-1">{errors.last_name}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Username *</label>
            <div className="flex items-center gap-2 rounded-xl border px-4 py-2.5 border-white/10 bg-white/5 focus-within:border-[#FF8C00]/50 transition-all">
              <span className="text-white/40 text-sm font-bold">@</span>
              <input type="text" value={form.username} onChange={(e) => handleChange("username", e.target.value.replace(/\s/g, ""))}
                className="flex-1 text-sm text-white outline-none bg-transparent" />
            </div>
            {errors.username && <p className="text-xs text-red-400 mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)}
              className="w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none transition-all" />
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Phone (Optional)</label>
            <input type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none transition-all" />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Country</label>
            <input type="text" value={form.country} onChange={(e) => handleChange("country", e.target.value)}
              className="w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">State</label>
              <input type="text" value={form.state} onChange={(e) => handleChange("state", e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">City</label>
              <input type="text" value={form.city} onChange={(e) => handleChange("city", e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-1.5">Address</label>
            <textarea value={form.address} onChange={(e) => handleChange("address", e.target.value)} rows={2}
              className="w-full rounded-xl border px-4 py-2.5 text-sm text-white bg-white/5 border-white/10 focus:border-[#FF8C00]/50 outline-none transition-all resize-none" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white/40 bg-white/5 hover:bg-white/10 transition">
              Cancel
            </button>
            <button type="submit" disabled={saveLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}>
              {saveLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={14} />}
              {saveLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Settings = () => {
  const { admin, setAdmin, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch fresh profile data from API
  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await ApiService.getAdminProfile();
      const userData = response?.data || response;
      setProfile(userData);
      // Update AuthContext with fresh data
      if (setAdmin) {
        setAdmin(userData);
        localStorage.setItem("admin_user", JSON.stringify(userData));
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const displayName = profile?.full_name ||
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
    profile?.username ||
    admin?.username ||
    "Admin";
  
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isSuperAdmin = admin?.email === "voltsourceinnovations@gmail.com";
  const roleLabel = isSuperAdmin ? "Super Administrator" : "Administrator";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpdateProfile = async (formData) => {
    try {
      const response = await ApiService.updateAdminProfile(formData);
      const updatedUser = response?.data || response;
      setProfile(updatedUser);
      if (setAdmin) {
        setAdmin(updatedUser);
        localStorage.setItem("admin_user", JSON.stringify(updatedUser));
      }
      showToast("Profile updated successfully!");
      fetchProfile(); // Refresh to be safe
    } catch (err) {
      throw new Error(err.message || "Failed to update profile");
    }
  };

  // ── Password reset state ──
  const [pwForm, setPwForm] = useState({
    email: admin?.email || "",
    code: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwStep, setPwStep] = useState(1);
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSendCode = async () => {
    if (!pwForm.email.trim()) {
      setPwErrors({ email: "Email is required" });
      return;
    }
    setPwLoading(true);
    setPwErrors({});
    try {
      await ApiService.sendForgotPasswordCode(pwForm.email);
      setPwStep(2);
      showToast("Reset code sent to your email!");
    } catch (err) {
      setPwErrors({ email: err.message });
    } finally {
      setPwLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (pwStep === 2) {
      const e = {};
      if (!pwForm.code.trim()) e.code = "Code is required";
      if (!pwForm.currentPassword)
        e.currentPassword = "Current password is required";
      if (Object.keys(e).length) {
        setPwErrors(e);
        return;
      }
      setPwStep(3);
      setPwErrors({});
    } else if (pwStep === 3) {
      const e = {};
      if (!pwForm.newPassword) e.newPassword = "Password is required";
      else if (pwForm.newPassword.length < 8)
        e.newPassword = "Minimum 8 characters";
      if (!pwForm.confirmPassword)
        e.confirmPassword = "Please confirm password";
      else if (pwForm.newPassword !== pwForm.confirmPassword)
        e.confirmPassword = "Passwords do not match";
      if (Object.keys(e).length) {
        setPwErrors(e);
        return;
      }
      setPwLoading(true);
      setPwErrors({});
      try {
        await ApiService.resetPasswordWithCode(
          pwForm.email,
          pwForm.code,
          pwForm.newPassword,
          pwForm.confirmPassword,
          pwForm.currentPassword,
        );
        setPwStep(1);
        setPwForm((p) => ({
          ...p,
          code: "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        showToast("Password updated successfully!");
      } catch (err) {
        setPwErrors({ general: err.message });
      } finally {
        setPwLoading(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: <FiUser size={14} /> },
    { key: "security", label: "Security", icon: <FiShield size={14} /> },
  ];

  const currentProfile = profile || admin;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-100 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold animate-pulse"
          style={{
            background:
              toast.type === "error"
                ? "rgba(239,68,68,0.15)"
                : "rgba(16,185,129,0.15)",
            border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
            color: toast.type === "error" ? "#EF4444" : "#10B981",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {toast.type === "error" ? (
            <FiAlertCircle size={15} />
          ) : (
            <FiCheck size={15} />
          )}
          {toast.msg}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <ProfileEditModal
          profile={currentProfile}
          onClose={() => setShowEditModal(false)}
          onSave={handleUpdateProfile}
          loading={profileLoading}
        />
      )}

      <div>
        <h1
          className="text-2xl font-black text-white"
          style={{ fontFamily: "'Playfair Display',serif" }}
        >
          Settings
        </h1>
        <p className="text-sm text-white/30 mt-0.5">
          Manage your admin account and security settings
        </p>
      </div>

      {/* Profile banner with Edit button */}
      <div
        className="rounded-3xl p-5 flex items-center gap-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#0f0a00,#1a0f00,#2a1500)",
          border: "1px solid rgba(255,140,0,0.1)",
        }}
      >
        <div
          className="absolute -right-10 -top-10 w-40 h-40 rounded-full pointer-events-none opacity-10"
          style={{ background: "radial-gradient(circle,#FF8C00,transparent)" }}
        />
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0 relative z-10"
          style={{
            background: "linear-gradient(135deg,#B42225,#FF8C00)",
            boxShadow: "0 6px 20px rgba(180,34,37,0.4)",
          }}
        >
          {initials}
        </div>
        <div className="relative z-10 flex-1">
          <p
            className="text-base font-black text-white"
            style={{ fontFamily: "'Playfair Display',serif" }}
          >
            {displayName}
          </p>
          <p className="text-xs text-white/40">{currentProfile?.email || admin?.email}</p>
          <span
            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block"
            style={{
              background: "rgba(255,140,0,0.15)",
              border: "1px solid rgba(255,140,0,0.25)",
              color: "#FF8C00",
            }}
          >
            🔐 {roleLabel}
          </span>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="relative z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
          style={{ background: "rgba(255,140,0,0.15)", border: "1px solid rgba(255,140,0,0.25)", color: "#FF8C00" }}
        >
          <FiEdit2 size={12} /> Edit Profile
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === key
                ? "text-white"
                : "text-white/30 hover:text-white/60"
            }`}
            style={
              activeTab === key
                ? {
                    background:
                      "linear-gradient(135deg,rgba(180,34,37,0.4),rgba(255,140,0,0.2))",
                    border: "1px solid rgba(180,34,37,0.3)",
                  }
                : {}
            }
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === "profile" && (
        <div
          className="rounded-3xl p-6 space-y-1"
          style={{
            background: "#0d0d14",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-base font-black text-white"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              Account Information
            </h3>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1 text-xs font-bold text-[#FF8C00] hover:underline"
            >
              <FiEdit2 size={11} /> Edit
            </button>
          </div>
          
          {profileLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {[
                { label: "Full Name", value: displayName },
                { label: "Email", value: currentProfile?.email || admin?.email || "—" },
                { label: "Username", value: currentProfile?.username ? `@${currentProfile.username}` : "—" },
                { label: "Role", value: roleLabel },
                { label: "Phone", value: currentProfile?.phone || "—" },
                { label: "Country", value: currentProfile?.country || "—" },
                { label: "State", value: currentProfile?.state || "—" },
                { label: "City", value: currentProfile?.city || "—" },
                { label: "Address", value: currentProfile?.address || "—" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <span className="text-xs text-white/30 font-semibold">
                    {label}
                  </span>
                  <span className="text-sm font-bold text-white/70">{value}</span>
                </div>
              ))}
            </>
          )}
          
          {/* Info message about invitations */}
          {isSuperAdmin && (
            <div
              className="pt-3 flex items-start gap-3 rounded-xl p-3 mt-2"
              style={{
                background: "rgba(255,140,0,0.05)",
                border: "1px solid rgba(255,140,0,0.1)",
              }}
            >
              <FiUser size={14} className="text-[#FF8C00] shrink-0 mt-0.5" />
              <p className="text-[11px] text-white/25 leading-relaxed">
                You can invite new admins from the <strong className="text-[#FF8C00]/70">Admin Invitations</strong> page in the sidebar.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── SECURITY TAB (unchanged) ── */}
      {activeTab === "security" && (
        <div
          className="rounded-3xl p-6 space-y-5"
          style={{
            background: "#0d0d14",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <h3
              className="text-base font-black text-white"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              Change Password
            </h3>
            <p className="text-xs text-white/30 mt-1">
              A reset code will be sent to your admin email address.
            </p>
          </div>

          {pwErrors.general && (
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-3"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <FiAlertCircle size={14} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{pwErrors.general}</p>
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${pwStep >= s ? "text-white" : "bg-white/5 text-white/25"}`}
                  style={
                    pwStep >= s
                      ? {
                          background: "linear-gradient(135deg,#B42225,#FF8C00)",
                        }
                      : {}
                  }
                >
                  {pwStep > s ? <Check size={10} /> : s}
                </div>
                <span
                  className={`text-[10px] font-bold ${pwStep === s ? "text-white/60" : "text-white/20"}`}
                >
                  {s === 1 ? "Send Code" : s === 2 ? "Verify" : "New Password"}
                </span>
                {s < 3 && <div className="w-8 h-px bg-white/10" />}
              </div>
            ))}
          </div>

          {/* Step 1 */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-2">
              Email Address
            </label>
            <div className="flex gap-2">
              <div className={`flex-1 ${inputCls(pwErrors.email)}`}>
                <FiMail size={14} className="text-white/25 shrink-0" />
                <input
                  type="email"
                  value={pwForm.email}
                  onChange={(e) =>
                    setPwForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="Your admin email"
                  className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20"
                />
              </div>
              <button
                onClick={handleSendCode}
                disabled={pwLoading}
                className="px-4 rounded-2xl text-xs font-black text-white transition-all hover:opacity-90 disabled:opacity-50 shrink-0"
                style={{
                  background: "linear-gradient(135deg,#B42225,#FF8C00)",
                }}
              >
                {pwLoading && pwStep === 1 ? "Sending..." : "Send Code"}
              </button>
            </div>
            {pwErrors.email && (
              <p className="text-xs text-red-400 mt-1">{pwErrors.email}</p>
            )}
          </div>

          {/* Step 2 */}
          {pwStep === 2 && (
            <>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-2">
                  Verification Code
                </label>
                <div className={inputCls(pwErrors.code)}>
                  <FiShield size={14} className="text-white/25 shrink-0" />
                  <input
                    type="text"
                    value={pwForm.code}
                    onChange={(e) =>
                      setPwForm((p) => ({ ...p, code: e.target.value }))
                    }
                    placeholder="6-digit code from email"
                    className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20"
                  />
                </div>
                {pwErrors.code && (
                  <p className="text-xs text-red-400 mt-1">{pwErrors.code}</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-2">
                  Current Password
                </label>
                <div className={inputCls(pwErrors.currentPassword)}>
                  <FiLock size={14} className="text-white/25 shrink-0" />
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) =>
                      setPwForm((p) => ({
                        ...p,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Your current password"
                    className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20"
                  />
                </div>
                {pwErrors.currentPassword && (
                  <p className="text-xs text-red-400 mt-1">
                    {pwErrors.currentPassword}
                  </p>
                )}
              </div>
              <button
                onClick={handleResetPassword}
                disabled={pwLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,#B42225,#FF8C00)",
                  boxShadow: "0 6px 24px rgba(180,34,37,0.3)",
                }}
              >
                Next
              </button>
            </>
          )}

          {/* Step 3 */}
          {pwStep === 3 && (
            <>
              {[
                {
                  key: "newPassword",
                  label: "New Password",
                  placeholder: "Min. 8 characters",
                },
                {
                  key: "confirmPassword",
                  label: "Confirm Password",
                  placeholder: "Repeat new password",
                },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-2">
                    {label}
                  </label>
                  <div className={inputCls(pwErrors[key])}>
                    <FiLock size={14} className="text-white/25 shrink-0" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={pwForm[key]}
                      onChange={(e) =>
                        setPwForm((p) => ({ ...p, [key]: e.target.value }))
                      }
                      placeholder={placeholder}
                      className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20"
                    />
                    {key === "newPassword" && (
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="text-white/25 hover:text-white/60 transition-colors"
                      >
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                  {pwErrors[key] && (
                    <p className="text-xs text-red-400 mt-1">{pwErrors[key]}</p>
                  )}
                </div>
              ))}
              <button
                onClick={handleResetPassword}
                disabled={pwLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,#B42225,#FF8C00)",
                  boxShadow: "0 6px 24px rgba(180,34,37,0.3)",
                }}
              >
                {pwLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* Danger zone */}
      <div
        className="rounded-3xl p-6"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(239,68,68,0.1)",
        }}
      >
        <h3 className="text-sm font-black text-red-400/70 mb-1">Danger Zone</h3>
        <p className="text-xs text-white/25 mb-4">
          Sign out of the admin panel on this device.
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
          }}
        >
          <FiLogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Settings;