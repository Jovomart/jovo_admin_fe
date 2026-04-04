// src/pages/Login.jsx
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { FiMail, FiLock, FiAlertCircle } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/images/logo.png";

const Login = () => {
  const { login }   = useContext(AuthContext);
  const navigate    = useNavigate();
  const [form, setForm]             = useState({ email: "", password: "" });
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);
  const [showPw, setShowPw]         = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim())                     e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = "Enter a valid email";
    if (!form.password)                          e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true); setErrors({});
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.message.toLowerCase();
      if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("incorrect"))
        setErrors({ general: "Invalid email or password." });
      else if (msg.includes("not found") || msg.includes("no admin"))
        setErrors({ general: "No admin account found with this email." });
      else
        setErrors({ general: err.message || "Login failed. Please try again." });
    } finally { setLoading(false); }
  };

  const inputCls = (field) =>
    `flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
      errors[field]
        ? "border-red-500/50 bg-red-500/5"
        : "border-white/8 bg-white/4 focus-within:border-[#FF8C00]/50 focus-within:bg-white/6 focus-within:shadow-[0_0_0_3px_rgba(255,140,0,0.08)]"
    }`;

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a0f" }}>
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-16"
        style={{ background: "linear-gradient(135deg,#080810 0%,#0d0d1a 40%,#100a0a 70%,#1a0505 100%)" }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        <div className="absolute -top-32 -right-32 w-125 h-125 rounded-full opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle,#B42225,transparent 65%)" }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle,#FF8C00,transparent 65%)" }} />

        <div className="relative z-10 text-center max-w-sm">
          <img src={logo} alt="JOVO" style={{ width: "197px", height: "57px", objectFit: "cover", margin: "0 auto 12px", filter: "drop-shadow(0 0 20px rgba(255,140,0,0.35))" }} />
          <h1 className="text-4xl font-black mb-4 text-white leading-tight" style={{ fontFamily: "'Playfair Display',serif" }}>
            <span style={{ background: "linear-gradient(90deg,#FF8C00,#FFB347)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Admin Panel
            </span>
          </h1>
          <p className="text-white/30 text-sm leading-relaxed mb-10">
            Manage sellers, delivery options, and platform settings from one powerful dashboard.
          </p>
          <div className="space-y-3 text-left">
            {[
              { icon: "⚙️", text: "Approve & manage seller applications" },
              { icon: "⚙️", text: "Configure delivery options & pricing" },
              { icon: "⚙️", text: "Monitor platform performance" },
              { icon: "⚙️", text: "Secure role-based access control" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-lg shrink-0">{icon}</span>
                <span className="text-white/50 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 md:px-12 lg:px-16">
        <div className="w-full max-w-105">
          {/* Mobile logo */}
          <div className="flex items-center justify-center mb-10 lg:hidden">
            <img src={logo} alt="JOVO" style={{ width: "177px", height: "57px", objectFit: "cover", filter: "drop-shadow(0 0 16px rgba(255,140,0,0.3))" }} />
          </div>

          <div className="mb-8">
            <p className="text-[10px] font-bold tracking-[3px] uppercase text-white/25 mb-2">Administrator Access</p>
            <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Playfair Display',serif" }}>Sign In</h2>
            <p className="text-sm text-white/30 mt-1">Access the JOVO admin dashboard</p>
          </div>

          {errors.general && (
            <div className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-6"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <FiAlertCircle size={15} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-2">Email Address</label>
              <div className={inputCls("email")}>
                <FiMail size={15} className={errors.email ? "text-red-400 shrink-0" : "text-white/25 shrink-0"} />
                <input type="email" placeholder="admin@jovomart.com" value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors((p) => ({ ...p, email: "" })); }}
                  className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20" />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-white/30">Password</label>
                <button type="button" onClick={() => navigate("/forgot-password")}
                  className="text-[10px] font-bold text-[#FF8C00]/70 hover:text-[#FF8C00] transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className={inputCls("password")}>
                <FiLock size={15} className={errors.password ? "text-red-400 shrink-0" : "text-white/25 shrink-0"} />
                <input type={showPw ? "text" : "password"} placeholder="Enter your password" value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors((p) => ({ ...p, password: "" })); }}
                  className="flex-1 text-sm text-white outline-none bg-transparent placeholder-white/20" />
                <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                  className="text-white/25 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.005] active:scale-[0.995] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: "linear-gradient(135deg,#B42225,#FF8C00)", boxShadow: "0 6px 28px rgba(180,34,37,0.35)" }}>
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                : "Sign In to Dashboard"}
            </button>
          </form>

          <p className="text-center text-xs text-white/15 mt-8">
            JOVO Admin Panel — Restricted Access Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;