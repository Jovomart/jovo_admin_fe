// src/pages/Login.jsx
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { FiMail, FiLock, FiAlertCircle, FiArrowRight } from "react-icons/fi";
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
    `flex items-center gap-3 rounded-full px-4 py-3.5 transition-all duration-200 ${
      errors[field]
        ? "bg-white ring-1 ring-brand/30"
        : "bg-white ring-1 ring-ink/[.06] focus-within:ring-ink/20"
    }`;

  return (
    <div className="min-h-screen flex bg-cream">
      {/* Left panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center overflow-hidden p-14">
        <div className="absolute inset-0 bg-gradient-to-br from-lilac via-sky/70 to-cream" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-peach/60 blur-3xl" />

        <div className="relative z-10 max-w-sm">
          <div className="mb-8 inline-flex items-center rounded-[18px] bg-white/80 p-3 ring-1 ring-ink/[.05]">
            <img src={logo} alt="JOVO" style={{ width: "132px", height: "38px", objectFit: "cover" }} />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink/45">JOVO Admin</p>
          <h1 className="mt-3 font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
            Run the whole campus marketplace from one place.
          </h1>
          <p className="mt-4 text-[13px] leading-relaxed text-ink/55">
            Manage sellers, delivery options and platform settings without the clutter.
          </p>

          <div className="mt-8 space-y-2.5">
            {[
              { icon: "🏪", text: "Approve & manage seller applications" },
              { icon: "🚚", text: "Configure delivery options & pricing" },
              { icon: "📊", text: "Monitor platform performance" },
              { icon: "🔐", text: "Secure role-based access control" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-2xl bg-white/65 px-4 py-3 ring-1 ring-ink/[.04]">
                <span className="text-base shrink-0">{icon}</span>
                <span className="text-[12.5px] text-ink/60">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex w-full items-center justify-center px-5 py-12 sm:px-10 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 flex justify-center lg:hidden">
            <div className="inline-flex items-center rounded-[16px] bg-white p-3 ring-1 ring-ink/[.06]">
              <img src={logo} alt="JOVO" style={{ width: "120px", height: "36px", objectFit: "cover" }} />
            </div>
          </div>

          <div className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink/40">Administrator access</p>
            <h2 className="mt-2 font-display text-[30px] font-semibold tracking-[-0.03em] text-ink">Sign in</h2>
            <p className="mt-1.5 text-[13px] text-ink/50">Access the JOVO admin dashboard</p>
          </div>

          {errors.general && (
            <div className="mb-5 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-brand/25">
              <FiAlertCircle size={15} className="shrink-0 text-brand" />
              <p className="text-[12.5px] text-brand">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="admin-label mb-2 block" htmlFor="admin-email">Email address</label>
              <div className={inputCls("email")}>
                <FiMail size={15} className={errors.email ? "shrink-0 text-brand" : "shrink-0 text-ink/30"} />
                <input id="admin-email" type="email" placeholder="admin@jovomart.com" value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors((p) => ({ ...p, email: "" })); }}
                  className="flex-1 bg-transparent text-[13.5px] text-ink placeholder-ink/30" />
              </div>
              {errors.email && <p className="ml-1 mt-1.5 text-[11.5px] text-brand">{errors.email}</p>}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="admin-label" htmlFor="admin-password">Password</label>
                <button type="button" onClick={() => navigate("/forgot-password")}
                  className="text-[11px] font-semibold text-ink/45 transition-colors hover:text-ink">
                  Forgot password?
                </button>
              </div>
              <div className={inputCls("password")}>
                <FiLock size={15} className={errors.password ? "shrink-0 text-brand" : "shrink-0 text-ink/30"} />
                <input id="admin-password" type={showPw ? "text" : "password"} placeholder="Enter your password" value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors((p) => ({ ...p, password: "" })); }}
                  className="flex-1 bg-transparent text-[13.5px] text-ink placeholder-ink/30" />
                <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="text-ink/30 transition-colors hover:text-ink/70">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="ml-1 mt-1.5 text-[11.5px] text-brand">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[13px] font-semibold text-cream transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
              {loading
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-cream/30 border-t-cream" /> Signing in...</>
                : <>Sign in to dashboard <FiArrowRight size={15} /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-ink/30">
            JOVO Admin Panel - Restricted Access Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
