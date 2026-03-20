// src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="w-10 h-10 border-2 border-[#B42225]/30 border-t-[#B42225] rounded-full animate-spin" />
      </div>
    );
  }

  return admin ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;