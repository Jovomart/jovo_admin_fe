// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout    from "../layouts/AdminLayout";
import AuthLayout     from "../layouts/AuthLayout";
import ProtectedRoute from "../routes/ProtectedRoute";
import Login          from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import Dashboard      from "../pages/Dashboard";
import Sellers        from "../pages/Sellers";
import Delivery       from "../pages/Delivery";
import Settings       from "../pages/Settings";

const AppRoutes = () => (
  <Routes>
    <Route element={<AuthLayout />}>
      <Route path="/login"           element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Route>
    <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/sellers"   element={<Sellers />} />
      <Route path="/delivery"  element={<Delivery />} />
      <Route path="/settings"  element={<Settings />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRoutes;