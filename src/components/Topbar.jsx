// src/components/Topbar.jsx
import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiMenu, FiBell } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import ApiService from "../services/apiService";

const pageTitles = {
  "/dashboard": { title: "Dashboard", sub: "Overview of your platform" },
  "/sellers": { title: "Seller Management", sub: "Manage seller applications & approved sellers" },
  "/schools": { title: "School Management", sub: "Manage registered schools on the platform" },
  "/delivery": { title: "Delivery Options", sub: "Manage delivery settings & pricing" },
  "/settings": { title: "Settings", sub: "Admin account settings" },
  "/admin-invitations": { title: "Admin Invitations", sub: "Invite new administrators" },
  "/revenue": { title: "Revenue Insights", sub: "Platform earnings overview" },
  "/orders": { title: "Order Management", sub: "Manage customer orders" },
  "/withdrawals": { title: "Withdrawal Management", sub: "Manage seller withdrawals" },
  "/categories": { title: "Categories", sub: "Manage product categories" },
  "/campaigns": { title: "Campaigns", sub: "Manage flash sales & campaigns" },
  "/reporting": { title: "Report System", sub: "Manage reports" },
  "/campus-guide": { title: "Campus Guide", sub: "Manage campus guide content" },
  "/pickup-stations": { title: "Pickup Stations", sub: "Manage pickup stations" },
  "/admin-products": { title: "Admin Products", sub: "Manage all products" },
  "/activity-logs": { title: "Activity Logs", sub: "View admin activity logs" },
};

const Topbar = ({ onMenuClick }) => {
  const { admin, setAdmin } = useContext(AuthContext);
  const location = useLocation();
  const [profileImage, setProfileImage] = useState(null);
  const [displayName, setDisplayName] = useState("Admin");
  const [initials, setInitials] = useState("AD");
  const [roleLabel, setRoleLabel] = useState("Administrator");
  
  const page = pageTitles[location.pathname] || { title: "Admin", sub: "" };
  
  // Function to update profile data
  const updateProfileData = (userData) => {
    const name = userData?.full_name || 
                 userData?.username || 
                 userData?.first_name || 
                 "Admin";
    setDisplayName(name);
    
    const initialLetters = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    setInitials(initialLetters);
    
    setProfileImage(userData?.profile_image || null);
    
    const isSuperAdmin = userData?.email === "voltsourceinnovations@gmail.com";
    setRoleLabel(isSuperAdmin ? "Super Admin" : "Administrator");
  };

  // Fetch fresh profile data
  const fetchProfile = async () => {
    try {
      const response = await ApiService.getAdminProfile();
      const userData = response?.data || response;
      
      // Update local state
      updateProfileData(userData);
      
      // Update AuthContext
      if (setAdmin) {
        setAdmin(userData);
      }
      
      // Update localStorage
      localStorage.setItem("admin_user", JSON.stringify(userData));
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, []);

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.detail?.user) {
        updateProfileData(event.detail.user);
      }
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Also check for changes in admin context
  useEffect(() => {
    if (admin) {
      updateProfileData(admin);
    }
  }, [admin]);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/5"
      style={{
        background: "rgba(10,10,15,0.95)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition"
        >
          <FiMenu size={18} />
        </button>
        <div>
          <h1
            className="text-base font-black text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {page.title}
          </h1>
          <p className="text-xs text-white/30 hidden sm:block">{page.sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition">
          <FiBell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B42225]" />
        </button>

        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden"
            style={{
              background: profileImage ? "transparent" : "linear-gradient(135deg,#B42225,#FF8C00)",
            }}
          >
            {profileImage ? (
              <img 
                src={profileImage} 
                alt={displayName} 
                className="w-full h-full object-cover"
                onError={() => {
                  // If image fails to load, fallback to initials
                  setProfileImage(null);
                }}
              />
            ) : (
              initials
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-white/80 leading-tight truncate max-w-32">
              {displayName}
            </p>
            <p className="text-[10px] text-white/30">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;