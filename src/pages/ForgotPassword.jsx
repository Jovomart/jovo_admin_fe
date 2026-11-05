// src/pages/ForgotPassword.jsx
import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react";
import { FiMail, FiArrowLeft, FiLock, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/images/logo.png";

const inputCls = (err) =>
  `flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
    err
      ? "border-brand/40 bg-brand/5"
      : "border-ink/10 bg-sand focus-within:border-[#0E0E10]/50 focus-within:bg-sand focus-within:shadow-[0_0_0_3px_rgba(255,140,0,0.08)]"
  }`;

/* ── Step 1: Email ── */
const StepEmail = ({ onNext }) => {
  const { forgotPassword } = useContext(AuthContext);
  const [email, setEmail]   = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address"); return; }
    setLoading(true); setError("");
    try { await forgotPassword(email.trim()); onNext(email.trim()); }
    catch (err) { setError(err.message || "Failed to send code."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
        style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.2)" }}>
        <FiMail size={24} className="text-[#0E0E10]" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-ink mb-1" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>Forgot Password?</h2>
        <p className="text-sm text-ink/30">Enter your admin email to receive a reset code.</p>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={14} className="text-brand shrink-0" />
          <p className="text-brand text-sm">{error}</p>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[2px] text-ink/30 mb-2">Email Address</label>
          <div className={inputCls(!!error)}>
            <FiMail size={15} className="text-ink/25 shrink-0" />
            <input type="email" placeholder="admin@jovomart.com" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="flex-1 text-sm text-ink outline-none bg-transparent placeholder-white/20" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm text-ink transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#0E0E10,#0E0E10)", boxShadow: "0 6px 28px rgba(180,34,37,0.3)" }}>
          {loading ? <><div className="w-4 h-4 border-2 border-ink/10 border-t-white rounded-full animate-spin" /> Sending...</> : "Send Reset Code"}
        </button>
      </form>
    </div>
  );
};

/* ── Step 2: Code ── */
const StepCode = ({ email, onNext, onBack }) => {
  const { forgotPassword } = useContext(AuthContext);
  const [code, setCode]     = useState(["","","","","",""]);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const refs = useRef([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const onChange = (i, v) => {
    if (!/^\d*$/.test(v)) return;
    const n = [...code]; n[i] = v; setCode(n); setError("");
    if (v && i < 5) refs.current[i+1]?.focus();
  };
  const onKeyDown = (i, e) => { if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i-1]?.focus(); };
  const onPaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (p.length === 6) { setCode(p.split("")); refs.current[5]?.focus(); }
  };

  const submit = (e) => {
    e.preventDefault();
    const full = code.join("");
    if (full.length !== 6) { setError("Enter the complete 6-digit code."); return; }
    if (timeLeft <= 0)      { setError("Code expired. Request a new one."); return; }
    onNext(full);
  };

  const resend = async () => {
    setResending(true);
    try { await forgotPassword(email); setTimeLeft(600); setCode(["","","","","",""]); refs.current[0]?.focus(); }
    catch (err) { setError(err.message || "Failed to resend."); }
    finally { setResending(false); }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-ink/30 hover:text-ink/60 text-sm transition-colors">
        <FiArrowLeft size={14} /> Back
      </button>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.2)" }}>
        <FiMail size={24} className="text-[#0E0E10]" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-ink mb-1" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>Check Your Email</h2>
        <p className="text-sm text-ink/30">We sent a 6-digit code to <strong className="text-ink/60">{email}</strong></p>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={14} className="text-brand shrink-0" />
          <p className="text-brand text-sm">{error}</p>
        </div>
      )}
      <form onSubmit={submit} noValidate>
        <div className="flex gap-2 justify-between mb-5" onPaste={onPaste}>
          {code.map((d, i) => (
            <input key={i} ref={el => refs.current[i] = el}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => onChange(i, e.target.value)}
              onKeyDown={e => onKeyDown(i, e)}
              disabled={loading}
              className={`w-12 h-14 text-center text-xl font-semibold rounded-2xl border-2 outline-none transition-all bg-transparent ${
                d ? "border-[#0E0E10]/60 text-[#0E0E10]" : "border-ink/10 text-ink focus:border-[#0E0E10]/40"
              }`} />
          ))}
        </div>
        <div className="text-center mb-5">
          {timeLeft > 0
            ? <p className="text-xs text-ink/25">Expires in <span className={`font-semibold ${timeLeft <= 60 ? "text-brand" : "text-[#0E0E10]"}`}>{fmt(timeLeft)}</span></p>
            : <p className="text-xs text-brand font-semibold">Code expired.</p>}
        </div>
        <button type="submit" disabled={loading || code.join("").length !== 6 || timeLeft <= 0}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm text-ink transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#0E0E10,#0E0E10)", boxShadow: "0 6px 28px rgba(180,34,37,0.3)" }}>
          {loading ? <><div className="w-4 h-4 border-2 border-ink/10 border-t-white rounded-full animate-spin" /> Verifying...</> : "Verify Code"}
        </button>
      </form>
      <div className="flex items-center justify-center gap-2">
        <p className="text-xs text-ink/25">Didn't receive it?</p>
        <button onClick={resend} disabled={resending || timeLeft > 540}
          className="flex items-center gap-1 text-xs font-semibold text-[#0E0E10]/60 hover:text-[#0E0E10] disabled:opacity-30 transition-colors">
          <FiRefreshCw size={11} className={resending ? "animate-spin" : ""} />
          {resending ? "Sending..." : "Resend code"}
        </button>
      </div>
    </div>
  );
};

/* ── Step 3: New password ── */
const StepNewPassword = ({ email, code, onBack, onSuccess }) => {
  const { resetPassword } = useContext(AuthContext);
  const [form, setForm]     = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.newPassword)                              e.newPassword     = "Password is required";
    else if (form.newPassword.length < 8)               e.newPassword     = "Minimum 8 characters";
    if (!form.confirmPassword)                          e.confirmPassword = "Please confirm password";
    else if (form.newPassword !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setErrors({});
    try { await resetPassword(email, code, form.newPassword, form.confirmPassword); onSuccess(); }
    catch (err) { setErrors({ general: err.message || "Failed to reset password." }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-ink/30 hover:text-ink/60 text-sm transition-colors">
        <FiArrowLeft size={14} /> Back
      </button>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.2)" }}>
        <FiLock size={24} className="text-[#0E0E10]" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-ink mb-1" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>New Password</h2>
        <p className="text-sm text-ink/30">Create a strong new password for <strong className="text-ink/60">{email}</strong></p>
      </div>
      {errors.general && (
        <div className="flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={14} className="text-brand shrink-0" />
          <p className="text-brand text-sm">{errors.general}</p>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4" noValidate>
        {[
          { key: "newPassword",     label: "New Password",     placeholder: "Min. 8 characters" },
          { key: "confirmPassword", label: "Confirm Password", placeholder: "Repeat your password" },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-[10px] font-semibold uppercase tracking-[2px] text-ink/30 mb-2">{label}</label>
            <div className={inputCls(errors[key])}>
              <FiLock size={15} className="text-ink/25 shrink-0" />
              <input type={showPw ? "text" : "password"} placeholder={placeholder}
                value={form[key]}
                onChange={(e) => { setForm(p => ({ ...p, [key]: e.target.value })); setErrors(p => ({ ...p, [key]: "" })); }}
                className="flex-1 text-sm text-ink outline-none bg-transparent placeholder-white/20" />
              {key === "newPassword" && (
                <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1} className="text-ink/25 hover:text-ink/60 transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              )}
            </div>
            {errors[key] && <p className="text-xs text-brand mt-1.5 ml-1">{errors[key]}</p>}
          </div>
        ))}
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm text-ink transition-all hover:opacity-90 disabled:opacity-50 mt-2"
          style={{ background: "linear-gradient(135deg,#0E0E10,#0E0E10)", boxShadow: "0 6px 28px rgba(180,34,37,0.3)" }}>
          {loading ? <><div className="w-4 h-4 border-2 border-ink/10 border-t-white rounded-full animate-spin" /> Updating...</> : "Update Password"}
        </button>
      </form>
    </div>
  );
};

/* ── Main ── */
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode]   = useState("");
  const steps = ["Email", "Verify Code", "New Password"];

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "#FBEFE3" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img src={logo} alt="JOVO" style={{ width: "57px", height: "57px", objectFit: "cover", filter: "drop-shadow(0 0 16px rgba(255,140,0,0.3))" }} />
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8" style={{ background: "#0d0d14", border: "1px solid rgba(14,14,16,0.006)", boxShadow: "0 24px 60px rgba(14,14,16,0.10)" }}>
          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((_, i) => {
              const s = i + 1;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    step > s ? "text-ink" : step === s ? "text-ink" : "text-ink/20"
                  }`} style={step >= s ? { background: "linear-gradient(135deg,#0E0E10,#0E0E10)" } : { background: "rgba(14,14,16,0.005)" }}>
                    {step > s ? <Check size={12} /> : s}
                  </div>
                  {i < 2 && <div className="w-6 h-px rounded-full" style={{ background: step > s ? "linear-gradient(90deg,#0E0E10,#0E0E10)" : "rgba(14,14,16,0.008)" }} />}
                </div>
              );
            })}
          </div>

          {step === 1 && <StepEmail onNext={(e) => { setEmail(e); setStep(2); }} />}
          {step === 2 && <StepCode email={email} onNext={(c) => { setCode(c); setStep(3); }} onBack={() => setStep(1)} />}
          {step === 3 && <StepNewPassword email={email} code={code} onBack={() => setStep(2)}
            onSuccess={() => navigate("/login", { state: { message: "Password updated! Please sign in." } })} />}
        </div>

        <p className="text-center text-xs text-ink/15 mt-6">JOVO Admin Panel - Restricted Access</p>
      </div>
    </div>
  );
};

export default ForgotPassword;