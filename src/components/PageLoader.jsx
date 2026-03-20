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
    <>
      <style>{`
        @keyframes admin-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.06);opacity:0.85} }
        @keyframes admin-bar { 0%{width:0%} 40%{width:60%} 70%{width:80%} 100%{width:100%} }
        @keyframes d1 { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes d2 { 0%,100%{transform:scale(0)} 20%,60%{transform:scale(1)} }
        @keyframes d3 { 0%,20%,100%{transform:scale(0)} 60%{transform:scale(1)} }
      `}</style>
      <div className="fixed inset-0 z-99999 flex flex-col items-center justify-center"
        style={{ background: "#0a0a0f", opacity: fading ? 0 : 1, transition: "opacity 0.4s ease", pointerEvents: fading ? "none" : "all" }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(180,34,37,0.15),transparent 70%)" }} />
        <div className="relative z-10 flex flex-col items-center gap-5">
          <img src={logo} alt="JOVO" style={{ width: "197px", height: "57px", objectFit: "cover", animation: "admin-pulse 1s ease-in-out infinite", filter: "drop-shadow(0 0 20px rgba(255,140,0,0.4))" }} />
          <p className="text-white/20 text-[12px] font-bold tracking-[4px] uppercase">Admin Panel</p>
          <div className="w-36 h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#B42225,#FF8C00)", animation: "admin-bar 1s ease-out forwards" }} />
          </div>
          <div className="flex gap-1.5">
            {[{a:"d1"},{a:"d2"},{a:"d3"}].map(({a},i)=>(
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i===1?"#FF8C00":"#B42225", animation:`${a} 1s ease-in-out infinite` }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PageLoader;