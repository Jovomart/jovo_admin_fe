// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "../routes/ProtectedRoute";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import Dashboard from "../pages/Dashboard";
import Sellers from "../pages/Sellers";
import Schools from "../pages/Schools";
import Delivery from "../pages/Delivery";
import Settings from "../pages/Settings";
import AdminInvitations from "../pages/AdminInvitations"; 
import AcceptInvitation from "../pages/AcceptInvitation"; 
import ActivityLogs from "../pages/ActivityLogs";
import Categories from "../pages/Categories";

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Route>

    {/* Public invitation routes (no auth required) */}
    <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

    {/* Protected admin routes */}
    <Route
      element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/sellers" element={<Sellers />} />
      <Route path="/schools" element={<Schools />} />
      <Route path="/delivery" element={<Delivery />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/admin-invitations" element={<AdminInvitations />} />{" "}
      <Route path="/activity-logs" element={<ActivityLogs />} />
      <Route path="/categories" element={<Categories />} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRoutes;
