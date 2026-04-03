// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import ApiService from "../services/apiService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    const token  = localStorage.getItem("admin_access_token");
    if (stored && token && !ApiService.isTokenExpired(token)) {
      const userData = JSON.parse(stored);
      setAdmin(userData);
    } else {
      ApiService.clearTokens();
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await ApiService.login({ email, password });
    const userData = response.data?.user || response.user || response.data || response;
    if (userData && typeof userData === "object" && userData.email) {
      // Ensure role is set (backend should provide this)
      localStorage.setItem("admin_user", JSON.stringify(userData));
      setAdmin(userData);
    }
    return userData;
  };

  const forgotPassword = async (email) => {
    return ApiService.sendForgotPasswordCode(email);
  };

  const resetPassword = async (email, code, newPassword, confirmPassword) => {
    return ApiService.resetPasswordWithCode(email, code, newPassword, confirmPassword);
  };

  const logout = () => {
    ApiService.clearTokens();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, setAdmin, loading, login, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};