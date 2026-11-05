// src/components/PageLoader.jsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import logo from "../assets/images/logo.png";

const PageLoader = () => {
  const location            = useLocation();
  const [show, setShow]     = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setShow(true); setFading(false);
    const t1 = setTimeout(() => setFading(true), 800);
    const t2 = setTimeout(() => { setShow(false); setFading(false); }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [location.pathname]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-cream"
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.4s ease", pointerEvents: fading ? "none" : "all" }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle,rgba(220,203,246,0.55),transparent 70%)" }} />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="flex items-center justify-center rounded-[20px] bg-white/70 ring-1 ring-ink/[.06] px-5 py-3">
          <img src={logo} alt="JOVO" style={{ width: "150px", height: "44px", objectFit: "cover", animation: "admin-pulse 1s ease-in-out infinite" }} />
        </div>
        <p className="font-display text-[11px] font-semibold tracking-[0.34em] uppercase text-ink/45">Admin Panel</p>
        <div className="w-36 h-[3px] bg-ink/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-ink" style={{ animation: "admin-bar 1s ease-out forwards" }} />
        </div>
        <div className="flex gap-1.5">
          {["d1", "d2", "d3"].map((a, i) => (
            <div key={a} className="w-1.5 h-1.5 rounded-full"
              style={{ background: i === 1 ? "#C6ACEF" : "#0E0E10", animation: `${a} 1s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
