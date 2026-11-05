// src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-10 h-10 border-2 border-ink/15 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  return admin ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
