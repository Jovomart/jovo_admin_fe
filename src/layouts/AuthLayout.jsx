// src/layouts/AuthLayout.jsx
import { Outlet } from "react-router-dom";

const AuthLayout = () => (
  <div style={{ width: "100vw", minHeight: "100vh", margin: 0, padding: 0, background: "#0a0a0f" }}>
    <Outlet />
  </div>
);

export default AuthLayout;