// src/pages/AdminInvitations.jsx
import { useState, useEffect, useContext } from "react";
import ApiService from "../services/apiService";
import { AuthContext } from "../context/AuthContext";
import {
  FiPlus, FiX, FiCheck, FiAlertCircle, FiRefreshCw,
  FiMail, FiSend, FiTrash2, FiUserPlus, FiCalendar, FiClock,
} from "react-icons/fi";
import { MdOutlineMailOutline } from "react-icons/md";

const InviteModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    email: "",
    adminType: "SUPER_ADMIN",
    schoolId: "",
  });
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch schools when modal opens and admin type is ADMIN
  useEffect(() => {
    if (form.adminType === "ADMIN") {
      const fetchSchools = async () => {
        setLoadingSchools(true);
        try {
          const response = await ApiService.getAllPublicSchools();
          let schoolsArray = [];
          if (Array.isArray(response)) {
            schoolsArray = response;
          } else if (response?.data && Array.isArray(response.data)) {
            schoolsArray = response.data;
          } else if (response?.schools && Array.isArray(response.schools)) {
            schoolsArray = response.schools;
          }
          setSchools(schoolsArray);
        } catch (err) {
          console.error("Failed to fetch schools:", err);
        } finally {
          setLoadingSchools(false);
        }
      };
      fetchSchools();
    }
  }, [form.adminType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      setError("Valid email is required");
      return;
    }
    if (form.adminType === "ADMIN" && !form.schoolId) {
      setError("Please select a school for this admin");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await ApiService.inviteAdmin({
        email: form.email,
        adminType: form.adminType,
        schoolId: form.adminType === "ADMIN" ? form.schoolId : null,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl border overflow-hidden"
        style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h3 className="text-lg font-bold text-white">Invite New Admin</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
            <FiX size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <FiAlertCircle size={14} className="text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-white/40 mb-2">Email Address</label>
            <div className="flex items-center gap-3 rounded-xl border px-4 py-3 border-white/10 bg-white/5 focus-within:border-[#FF8C00]/50 transition-colors">
              <FiMail size={16} className="text-white/30" />
              <input type="email" placeholder="admin@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-2">Admin Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm({ ...form, adminType: "ADMIN", schoolId: "" })}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.adminType === "ADMIN"
                    ? "border-[#FF8C00] bg-[#FF8C00]/10 text-white"
                    : "border-white/10 bg-white/5 text-white/40 hover:text-white/60"
                }`}>
                Normal Admin
              </button>
              <button type="button" onClick={() => setForm({ ...form, adminType: "SUPER_ADMIN", schoolId: "" })}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.adminType === "SUPER_ADMIN"
                    ? "border-[#FF8C00] bg-[#FF8C00]/10 text-white"
                    : "border-white/10 bg-white/5 text-white/40 hover:text-white/60"
                }`}>
                Super Admin
              </button>
            </div>
          </div>

          {/* School dropdown - only show for Normal Admin */}
          {form.adminType === "ADMIN" && (
            <div>
              <label className="block text-xs font-medium text-white/40 mb-2">Assign School</label>
              <select
                value={form.schoolId}
                onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                className="w-full rounded-xl border px-4 py-3 text-sm text-white outline-none bg-white/5 border-white/10 focus:border-[#FF8C00]/50"
                disabled={loadingSchools}
              >
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school.id || school._id} value={school.id || school._id}>
                    {school.school_name || school.name}
                  </option>
                ))}
              </select>
              {loadingSchools && (
                <p className="text-xs text-white/30 mt-1">Loading schools...</p>
              )}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}>
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSend size={14} />}
            {loading ? "Sending..." : "Send Invitation"}
          </button>
        </form>
      </div>
    </div>
  );
};

const InvitationCard = ({ invitation, onResend, onRevoke }) => {
  const statusConfig = {
    PENDING: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)", label: "Pending" },
    ACCEPTED: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)", label: "Accepted" },
    REJECTED: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)", label: "Rejected" },
    EXPIRED: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)", label: "Expired" },
  };
  const status = statusConfig[invitation.status] || statusConfig.PENDING;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="bg-[#0d0d14] rounded-xl border border-white/5 overflow-hidden hover:border-white/10 transition-all">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#FF8C00]/10 flex items-center justify-center shrink-0">
              <FiUserPlus size={16} className="text-[#FF8C00]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate max-w-45ax-w-[200px] md:max-w-45 lg:max-w-55">
                {invitation.email}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                {invitation.admin_type || invitation.role || "ADMIN"}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
            style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}` }}>
            {status.label}
          </span>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-white/40">
            <FiCalendar size={12} />
            <span>Invited: {formatDate(invitation.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40">
            <FiClock size={12} />
            <span>Expires: {formatDate(invitation.expires_at)}</span>
          </div>
        </div>
      </div>
      
      {invitation.status === "PENDING" && (
        <div className="p-4 pt-0 flex gap-2">
          <button onClick={() => onResend(invitation)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
            <FiSend size={12} /> Resend
          </button>
          <button onClick={() => onRevoke(invitation)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            <FiTrash2 size={12} /> Revoke
          </button>
        </div>
      )}
    </div>
  );
};

const AdminInvitations = () => {
  const { admin } = useContext(AuthContext);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchInvitations = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ApiService.getInvitations();
      let invitationsArray = [];
      if (Array.isArray(response)) {
        invitationsArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        invitationsArray = response.data;
      } else if (response?.invitations && Array.isArray(response.invitations)) {
        invitationsArray = response.invitations;
      } else if (response?.data?.invitations && Array.isArray(response.data.invitations)) {
        invitationsArray = response.data.invitations;
      }
      setInvitations(invitationsArray);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchInvitations();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResend = async (invitation) => {
    try {
      await ApiService.resendInvitation(invitation.id);
      showToast("Invitation resent successfully!");
      fetchInvitations();
    } catch (err) {
      showToast(err.message || "Failed to resend", "error");
    }
  };

  const handleRevoke = async (invitation) => {
    if (!window.confirm(`Revoke invitation for ${invitation.email}?`)) return;
    try {
      await ApiService.revokeInvitation(invitation.id);
      showToast("Invitation revoked");
      fetchInvitations();
    } catch (err) {
      showToast(err.message || "Failed to revoke", "error");
    }
  };

  // Super Admin check - hardcoded with your email
  const isSuperAdmin = admin?.email === "voltsourceinnovations@gmail.com";

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle size={28} className="text-red-400" />
          </div>
          <p className="text-white font-medium">Access Restricted</p>
          <p className="text-white/40 text-sm mt-1">Only Super Admins can manage invitations</p>
        </div>
      </div>
    );
  }

  const invitationsList = Array.isArray(invitations) ? invitations : [];
  const stats = {
    total: invitationsList.length,
    pending: invitationsList.filter(i => i?.status === "PENDING").length,
    accepted: invitationsList.filter(i => i?.status === "ACCEPTED").length,
    rejected: invitationsList.filter(i => i?.status === "REJECTED").length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: "#0d0d14", border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`, color: toast.type === "error" ? "#EF4444" : "#10B981" }}>
          {toast.type === "error" ? <FiAlertCircle size={14} /> : <FiCheck size={14} />}
          {toast.msg}
        </div>
      )}

      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} onSuccess={() => {
          showToast("Invitation sent successfully!");
          fetchInvitations();
        }} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Invitations</h1>
          <p className="text-sm text-white/40 mt-1">Invite and manage administrator accounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchInvitations} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)" }}>
            <FiPlus size={14} />
            Invite Admin
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-[#0d0d14] rounded-xl p-4 border border-white/5">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-white/40 mt-1">Total</p>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-4 border border-white/5">
          <p className="text-2xl font-bold" style={{ color: "#F59E0B" }}>{stats.pending}</p>
          <p className="text-xs text-white/40 mt-1">Pending</p>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-4 border border-white/5">
          <p className="text-2xl font-bold" style={{ color: "#10B981" }}>{stats.accepted}</p>
          <p className="text-xs text-white/40 mt-1">Accepted</p>
        </div>
        <div className="bg-[#0d0d14] rounded-xl p-4 border border-white/5">
          <p className="text-2xl font-bold" style={{ color: "#EF4444" }}>{stats.rejected}</p>
          <p className="text-xs text-white/40 mt-1">Rejected</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Invitations List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#0d0d14] rounded-xl border border-white/5 h-36 animate-pulse" />
          ))}
        </div>
      ) : invitationsList.length === 0 ? (
        <div className="bg-[#0d0d14] rounded-xl border border-white/5 p-12 text-center">
          <MdOutlineMailOutline size={48} className="text-white/10 mx-auto mb-3" />
          <p className="text-white font-medium">No invitations sent yet</p>
          <p className="text-white/40 text-sm mt-1">Click "Invite Admin" to send your first invitation</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invitationsList.map((inv) => (
            <InvitationCard
              key={inv.id}
              invitation={inv}
              onResend={handleResend}
              onRevoke={handleRevoke}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminInvitations;