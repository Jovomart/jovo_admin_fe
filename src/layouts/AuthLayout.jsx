// src/layouts/AuthLayout.jsx
import { Outlet } from "react-router-dom";

const AuthLayout = () => (
  <div className="min-h-screen w-full bg-cream">
    <Outlet />
  </div>
);

export default AuthLayout;
