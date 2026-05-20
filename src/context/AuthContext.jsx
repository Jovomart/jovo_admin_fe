// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import ApiService from "../services/apiService";

export const AuthContext = createContext();

export const useAdminAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Initialize auth
  useEffect(() => {
    const storedUser = localStorage.getItem("admin_user");
    const accessToken = localStorage.getItem("admin_access_token");
    
    if (storedUser && accessToken && !ApiService.isTokenExpired(accessToken)) {
      const userData = JSON.parse(storedUser);
      setAdmin(userData);
      setIsSuperAdmin(userData.role === "SUPER_ADMIN" || userData.email === "voltsourceinnovations@gmail.com");
    } else {
      // Token expired or missing, clear everything
      ApiService.clearTokens();
      localStorage.removeItem("admin_user");
      setAdmin(null);
      setIsSuperAdmin(false);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await ApiService.login({ email, password });
      const userData = response?.data?.user || response?.user || response?.data || response;
      
      if (userData && typeof userData === "object" && userData.email) {
        const adminData = {
          id: userData.id || userData.admin_id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          full_name: userData.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          role: userData.role || userData.admin_type || "ADMIN",
          is_active: userData.is_active,
          created_at: userData.created_at,
        };
        localStorage.setItem("admin_user", JSON.stringify(adminData));
        setAdmin(adminData);
        setIsSuperAdmin(adminData.role === "SUPER_ADMIN" || adminData.email === "voltsourceinnovations@gmail.com");
        return adminData;
      }
      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    return ApiService.sendForgotPasswordCode(email);
  };

  const resetPassword = async (email, code, newPassword, confirmPassword) => {
    return ApiService.resetPasswordWithCode(email, code, newPassword, confirmPassword);
  };

  const logout = () => {
    ApiService.clearTokens();
    localStorage.removeItem("admin_user");
    setAdmin(null);
    setIsSuperAdmin(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ 
      admin, 
      setAdmin, 
      loading, 
      login, 
      logout, 
      forgotPassword, 
      resetPassword,
      isSuperAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};