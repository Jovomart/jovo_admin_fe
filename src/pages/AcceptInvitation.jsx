// src/pages/AcceptInvitation.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiService from "../services/apiService";
import { Eye, EyeOff } from "lucide-react";
import { FiCheck, FiAlertCircle, FiUser, FiLock, FiX } from "react-icons/fi";
import logo from "../assets/images/logo.png";

const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState("loading");
  const [invitation, setInvitation] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    console.log("Token from URL:", token);
    
    const verifyToken = async () => {
      if (!token || token === "admin-invitations") {
        setErrorMessage("Invalid invitation link. The token is missing or incorrect.");
        setStep("error");
        return;
      }
      
      try {
        const response = await ApiService.viewInvitation(token);
        console.log("Invitation details:", response);
        setInvitation(response.data || response);
        setStep("form");
      } catch (err) {
        console.error("Verify error:", err);
        setErrorMessage(err.message || "This invitation is invalid or has expired.");
        setStep("error");
      }
    };
    
    verifyToken();
  }, [token]);

  const handleAccept = async (e) => {
    e.preventDefault();
    const eObj = {};
    if (!form.firstName.trim()) eObj.firstName = "First name is required";
    if (!form.lastName.trim()) eObj.lastName = "Last name is required";
    if (!form.username.trim()) eObj.username = "Username is required";
    if (!form.password) eObj.password = "Password is required";
    else if (form.password.length < 8) eObj.password = "Minimum 8 characters";
    if (form.password !== form.confirmPassword) eObj.confirmPassword = "Passwords do not match";
    
    if (Object.keys(eObj).length) {
      setErrors(eObj);
      return;
    }
    
    setAcceptLoading(true);
    setErrors({});
    try {
      const result = await ApiService.acceptInvitation(token, {
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        password: form.password,
      });
      console.log("Accept result:", result);
      setStep("success");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error("Accept error:", err);
      setErrors({ general: err.message || "Failed to create account" });
      setAcceptLoading(false);
    }
  };

  const handleDecline = async (e) => {
    e.preventDefault();
    setDeclineLoading(true);
    setErrorMessage("");
    
    if (!token || token === "admin-invitations") {
      setErrorMessage("Invalid token. Cannot decline invitation.");
      setDeclineLoading(false);
      return;
    }
    
    try {
      console.log("Declining invitation with token:", token);
      const result = await ApiService.rejectInvitation(token, "User declined the invitation");
      console.log("Decline result:", result);
      setStep("declined");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error("Decline error details:", err);
      setErrorMessage(err.message || "Failed to decline invitation. Please try again or contact support.");
      setDeclineLoading(false);
    }
  };

  const inputCls = (field) =>
    `flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
      errors[field]
        ? "border-red-500/50 bg-red-500/5"
        : "border-white/8 bg-white/4 focus-within:border-[#FF8C00]/50"
    }`;

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="w-10 h-10 border-2 border-[#B42225]/30 border-t-[#B42225] rounded-full animate-spin" />
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0a0a0f" }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <FiAlertCircle size={36} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Invalid Invitation</h2>
          <p className="text-white/40 text-sm mb-6">{errorMessage || "This invitation link is invalid, expired, or has already been used."}</p>
          <button onClick={() => navigate("/login")}
            className="px-6 py-3 rounded-2xl font-bold text-white bg-[#B42225] hover:bg-[#9e1e20] transition">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (step === "declined") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0a0a0f" }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
            <FiX size={36} className="text-orange-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Invitation Declined</h2>
          <p className="text-white/40 text-sm mb-6">
            You have declined this invitation. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0a0a0f" }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <FiCheck size={36} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Account Created!</h2>
          <p className="text-white/40 text-sm mb-6">
            Your admin account has been created. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "#0a0a0f" }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <img src={logo} alt="JOVO" style={{ width: "57px", height: "57px", filter: "drop-shadow(0 0 16px rgba(255,140,0,0.3))" }} />
        </div>

        <div className="rounded-3xl p-8" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>
              Complete Your Account
            </h2>
            <p className="text-sm text-white/30 mt-1">
              You've been invited as an {invitation?.admin_type || "Admin"}
            </p>
            <p className="text-xs text-white/20 mt-2">{invitation?.email}</p>
          </div>

          {errors.general && (
            <div className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <FiAlertCircle size={14} className="text-red-400" />
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <FiAlertCircle size={14} className="text-red-400" />
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleAccept} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className={inputCls("firstName")}>
                  <FiUser size={14} className="text-white/25" />
                  <input type="text" placeholder="First Name" value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="flex-1 text-sm text-white outline-none bg-transparent" />
                </div>
                {errors.firstName && <p className="text-xs text-red-400 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <div className={inputCls("lastName")}>
                  <FiUser size={14} className="text-white/25" />
                  <input type="text" placeholder="Last Name" value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="flex-1 text-sm text-white outline-none bg-transparent" />
                </div>
                {errors.lastName && <p className="text-xs text-red-400 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <div className={inputCls("username")}>
                <span className="text-white/25 text-sm font-bold">@</span>
                <input type="text" placeholder="Username" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s/g, "") })}
                  className="flex-1 text-sm text-white outline-none bg-transparent" />
              </div>
              {errors.username && <p className="text-xs text-red-400 mt-1">{errors.username}</p>}
            </div>

            <div>
              <div className={inputCls("password")}>
                <FiLock size={14} className="text-white/25" />
                <input type={showPw ? "text" : "password"} placeholder="Password (min. 8 characters)" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="flex-1 text-sm text-white outline-none bg-transparent" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-white/25 hover:text-white/60">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
            </div>

            <div>
              <div className={inputCls("confirmPassword")}>
                <FiLock size={14} className="text-white/25" />
                <input type={showPw ? "text" : "password"} placeholder="Confirm Password" value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="flex-1 text-sm text-white outline-none bg-transparent" />
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={handleDecline} 
                disabled={acceptLoading || declineLoading}
                className="flex-1 py-3 rounded-2xl text-sm font-bold transition-colors disabled:opacity-50"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
                {declineLoading ? (
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mx-auto" />
                ) : (
                  "Decline"
                )}
              </button>
              <button 
                type="submit" 
                disabled={acceptLoading || declineLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)", boxShadow: "0 6px 28px rgba(180,34,37,0.3)" }}>
                {acceptLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiCheck size={14} />
                )}
                {acceptLoading ? "Creating..." : "Accept & Create Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;