// src/services/apiService.js

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://dev-api-jovomart.onrender.com/api/v1";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
  }

  getAccessToken() {
    return localStorage.getItem("admin_access_token");
  }

  getRefreshToken() {
    return localStorage.getItem("admin_refresh_token");
  }

  storeTokens(accessToken, refreshToken = null) {
    if (accessToken) localStorage.setItem("admin_access_token", accessToken);
    if (refreshToken) localStorage.setItem("admin_refresh_token", refreshToken);
  }

  clearTokens() {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
  }

  isTokenExpired(token) {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }

  extractErrorMessage(data, statusCode) {
    if (data?.detail && typeof data.detail === "string") return data.detail;
    if (data?.detail?.message) return data.detail.message;
    if (Array.isArray(data?.detail))
      return data.detail
        .map((e) => (e.loc ? `${e.loc.join(".")}: ${e.msg}` : e.msg))
        .join(", ");
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    console.error("Unrecognised error shape:", data);
    return `Request failed with status ${statusCode}`;
  }

  isRealUrl(url) {
    return (
      url &&
      typeof url === "string" &&
      url.startsWith("https://") &&
      !url.includes("yourstore.com") &&
      !url.includes("api.yourstore.com")
    );
  }

  async makeRequest(endpoint, options = {}) {
    if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;
    const url = `${this.baseURL}${endpoint}`;

    const publicPrefixes = [
      "/admin/auth/login",
      "/admin/auth/send-forgotten-password-code",
      "/admin/auth/reset-password-with-code",
      "/admin/invitation/view-invitation",
      "/admin/invitation/accept-invitation",
      "/admin/invitation/reject-invitation",
    ];
    const isPublic = publicPrefixes.some((ep) => endpoint.startsWith(ep));

    const isFormData = options.body instanceof FormData;

    const config = {
      headers: { ...options.headers },
      ...options,
    };

    if (!isFormData) {
      config.headers["Content-Type"] = "application/json";
    }

    console.log(`🔐 Making request to: ${endpoint}`);
    console.log(`📋 Is public: ${isPublic}`);
    console.log(`📋 Is FormData: ${isFormData}`);

    if (!isPublic) {
      const token = this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`✅ Token added (length: ${token.length})`);
      } else {
        console.error(`❌ No token found for ${endpoint}`);
      }
    }

    console.log(`🌐 Request URL: ${url}`);
    console.log(`📋 Headers:`, {
      ...config.headers,
      Authorization: config.headers.Authorization ? "Bearer [HIDDEN]" : "none",
    });

    try {
      const response = await fetch(url, config);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      console.log(`📡 Response for ${endpoint}: status ${response.status}`);

      if (response.status === 401) {
        const errorMsg =
          data?.detail?.message || data?.detail || data?.message || "";

        const isAuthEndpoint = endpoint.includes("/auth/");
        const hasNoToken = !this.getAccessToken();
        const isNotAuthenticated = errorMsg
          .toLowerCase()
          .includes("not authenticated");

        if (isAuthEndpoint || hasNoToken || isNotAuthenticated) {
          console.error("Authentication failed. Clearing tokens...");
          this.clearTokens();
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.includes("/login")
          ) {
            window.location.href = "/login";
          }
        } else {
          console.warn(
            `⚠️ 401 on ${endpoint} but token is valid — likely a backend permission bug. Not logging out.`,
          );
        }

        throw new Error(
          errorMsg || "You don't have permission to access this resource.",
        );
      }

      if (!response.ok) {
        console.error(
          `Admin API Error [${response.status}] ${endpoint}:`,
          data,
        );
        throw new Error(this.extractErrorMessage(data, response.status));
      }

      return data;
    } catch (error) {
      console.error(`🔥 Request failed for ${endpoint}:`, error);
      if (error.name === "TypeError" && error.message.includes("fetch"))
        throw new Error("Network error: Unable to connect to server.");
      throw error;
    }
  }

  // ─── AUTH ──────────────────────────────────────────────────────────────────

  async createAdmin({
    firstName,
    lastName,
    email,
    username,
    password,
    gender,
  }) {
    return this.makeRequest("/admin/auth/create-admin", {
      method: "POST",
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        username,
        password,
        gender,
      }),
    });
  }

  async login({ email, password }) {
    const response = await this.makeRequest("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    const tokens = response.data || response;
    const accessToken = tokens.access_token;

    console.log("🔐 Login response:", response);
    console.log("🔐 Access token found:", !!accessToken);

    if (accessToken) {
      this.storeTokens(accessToken, null);
      console.log("✅ Access token stored successfully");
      if (tokens.user) {
        localStorage.setItem("admin_user", JSON.stringify(tokens.user));
      }
    } else {
      console.error("❌ No access token in login response:", response);
    }

    return response;
  }

  async sendForgotPasswordCode(email) {
    return this.makeRequest(
      `/admin/auth/send-forgotten-password-code?email=${encodeURIComponent(email)}`,
      { method: "POST" },
    );
  }

  async resetPasswordWithCode(email, code, newPassword, confirmPassword) {
    return this.makeRequest(
      `/admin/auth/reset-password-with-code?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&new_password=${encodeURIComponent(newPassword)}&confirm_password=${encodeURIComponent(confirmPassword)}`,
      { method: "POST" },
    );
  }

  // ─── ADMIN PROFILE ──────────────────────────────────────────────────────────

  async getAdminProfile() {
    return this.makeRequest("/admin/auth/profile", { method: "GET" });
  }

  async updateAdminProfile(profileData) {
    return this.makeRequest("/admin/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  // ─── ACTIVITY LOGS ──────────────────────────────────────────────────────────

  async getActivityLogs({
    page = 1,
    pageSize = 20,
    action = null,
    adminId = null,
    days = 7,
  } = {}) {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("page_size", pageSize);
    params.append("days", days);
    if (action) params.append("action", action);
    if (adminId) params.append("admin_id", adminId);
    return this.makeRequest(`/admin/activity-logs?${params.toString()}`, {
      method: "GET",
    });
  }

  // ─── SELLERS ───────────────────────────────────────────────────────────────

  async getPendingSellers() {
    return this.makeRequest("/admin/seller/pending", { method: "GET" });
  }

  async getApprovedSellers() {
    return this.makeRequest("/admin/seller/approved", { method: "GET" });
  }

  async getSellerApplication(appliedSellerId) {
    return this.makeRequest(`/admin/seller/application/${appliedSellerId}`, {
      method: "GET",
    });
  }

  async approveRejectSeller({ appliedSellerId, status, rejectionReason }) {
    return this.makeRequest("/admin/seller/approve-reject", {
      method: "POST",
      body: JSON.stringify({
        applied_seller_id: appliedSellerId,
        status,
        rejection_reason: rejectionReason || "",
      }),
    });
  }

  // ─── ADMIN INVITATIONS ──────────────────────────────────────────────────────

  async inviteAdmin({ email, adminType, schoolId = null }) {
    const body = {
      email: email.trim().toLowerCase(),
      admin_type: adminType,
    };
    if (schoolId) body.school_id = schoolId;
    return this.makeRequest("/admin/invitation/invite-admin", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getInvitations() {
    console.log("📋 Fetching invitations...");
    const result = await this.makeRequest("/admin/invitation/invitations", {
      method: "GET",
    });
    console.log("📋 Invitations result:", result);
    return result;
  }

  async viewInvitation(token) {
    return this.makeRequest(`/admin/invitation/view-invitation/${token}`, {
      method: "GET",
    });
  }

  async acceptInvitation(token, { firstName, lastName, username, password }) {
    return this.makeRequest(`/admin/invitation/accept-invitation/${token}`, {
      method: "POST",
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        username,
        password,
      }),
    });
  }

  async rejectInvitation(token, rejectionReason = "") {
    return this.makeRequest(`/admin/invitation/reject-invitation/${token}`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
  }

  async resendInvitation(invitationId) {
    return this.makeRequest(
      `/admin/invitation/resend-invitation/${invitationId}`,
      { method: "POST" },
    );
  }

  async revokeInvitation(invitationId) {
    return this.makeRequest(
      `/admin/invitation/revoke-invitation/${invitationId}`,
      { method: "DELETE" },
    );
  }

  // ─── DELIVERY OPTIONS ──────────────────────────────────────────────────────

  async createDeliveryOption(deliveryData) {
    return this.makeRequest("/admin/delivery/create-options", {
      method: "POST",
      body: JSON.stringify({
        delivery_type: deliveryData.delivery_type,
        delivery_cost: deliveryData.delivery_cost,
        delivery_areas: deliveryData.delivery_areas,
        estimated_days_min: deliveryData.estimated_days_min,
        estimated_days_max: deliveryData.estimated_days_max,
        delivery_description: deliveryData.delivery_description,
        carrier_name: deliveryData.carrier_name,
        is_free_delivery: deliveryData.is_free_delivery,
        minimum_order_amount: deliveryData.minimum_order_amount,
        weight_limit_kg: deliveryData.weight_limit_kg,
        max_order_value: deliveryData.max_order_value,
        is_available: deliveryData.is_available,
        priority: deliveryData.priority,
      }),
    });
  }

  async getAllDeliveryOptions() {
    return this.makeRequest("/admin/delivery/options", { method: "GET" });
  }

  async getDeliveryOptionById(deliveryId) {
    return this.makeRequest(`/admin/delivery/options/${deliveryId}`, {
      method: "GET",
    });
  }

  async updateDeliveryOption(deliveryId, updateData) {
    return this.makeRequest(`/admin/delivery/options/${deliveryId}`, {
      method: "PUT",
      body: JSON.stringify({
        delivery_cost: updateData.delivery_cost,
        delivery_areas: updateData.delivery_areas,
        estimated_days_min: updateData.estimated_days_min,
        estimated_days_max: updateData.estimated_days_max,
        delivery_description: updateData.delivery_description,
        carrier_name: updateData.carrier_name,
        is_free_delivery: updateData.is_free_delivery,
        minimum_order_amount: updateData.minimum_order_amount,
        weight_limit_kg: updateData.weight_limit_kg,
        max_order_value: updateData.max_order_value,
        is_available: updateData.is_available,
        priority: updateData.priority,
      }),
    });
  }

  async getAvailableDeliveryOptions(cartTotal, totalWeight) {
    return this.makeRequest(
      `/admin/delivery/options/available?cart_total=${cartTotal}&total_weight=${totalWeight}`,
      { method: "GET" },
    );
  }

  async deactivateDeliveryOption(deliveryId) {
    return this.makeRequest(
      `/admin/delivery/options/${deliveryId}/deactivate`,
      { method: "POST" },
    );
  }

  async reactivateDeliveryOption(deliveryId) {
    return this.makeRequest(
      `/admin/delivery/options/${deliveryId}/reactivate`,
      { method: "POST" },
    );
  }

  async permanentlyDeleteDeliveryOption(deliveryId) {
    return this.makeRequest(
      `/admin/delivery/options/${deliveryId}/permanently-delete`,
      { method: "DELETE" },
    );
  }

  // ─── CATEGORY MANAGEMENT ───────────────────────────────────────────────────

  async createCategory(data) {
    const payload = {
      name: data.name,
      description: data.description || "",
      category_type: data.category_type,
      attribute_schema: data.attribute_schema || [],
    };
    if (data.slug && data.slug.trim()) payload.slug = data.slug.trim();
    if (this.isRealUrl(data.category_image_url))
      payload.category_image_url = data.category_image_url;
    if (this.isRealUrl(data.category_icon_url))
      payload.category_icon_url = data.category_icon_url;
    if (data.category_metadata)
      payload.category_metadata = data.category_metadata;

    return this.makeRequest("/admin/category/create-category", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getAdminCategories(
    categoryType = null,
    includeInactive = false,
    includeSubcategories = false,
  ) {
    const params = new URLSearchParams();
    if (categoryType) params.append("category_type", categoryType);
    params.append("include_inactive", includeInactive);
    params.append("include_subcategories", includeSubcategories);
    return this.makeRequest(
      `/admin/category/get-all-categories?${params.toString()}`,
      { method: "GET" },
    );
  }

  async getAdminCategory(categoryId) {
    return this.makeRequest(`/admin/category/get-category/${categoryId}`, {
      method: "GET",
    });
  }

  async updateCategory(categoryId, data) {
    const payload = {};

    if (data.name && data.name.trim()) {
      payload.name = data.name.trim();
    }

    payload.description = data.description || "";

    if (data.slug && data.slug.trim()) {
      payload.slug = data.slug.trim();
    }

    if (
      Array.isArray(data.attribute_schema) &&
      data.attribute_schema.length > 0
    ) {
      payload.attribute_schema = data.attribute_schema.map((attr) => ({
        key: String(attr.key || ""),
        label: String(attr.label || ""),
        type: String(attr.type || "text"),
        required: Boolean(attr.required),
        options: ["select", "multiselect"].includes(attr.type)
          ? (attr.options || []).filter(Boolean)
          : [],
      }));
    }

    if (this.isRealUrl(data.category_image_url)) {
      payload.category_image_url = data.category_image_url;
    }
    if (this.isRealUrl(data.category_icon_url)) {
      payload.category_icon_url = data.category_icon_url;
    }

    if (
      data.category_metadata !== undefined &&
      data.category_metadata !== null
    ) {
      payload.category_metadata = data.category_metadata;
    }

    console.log(
      "📦 Update category payload (final):",
      JSON.stringify(payload, null, 2),
    );

    return this.makeRequest(`/admin/category/update-category/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deactivateCategory(categoryId) {
    return this.makeRequest(
      `/admin/category/deactivate-category/${categoryId}`,
      { method: "PATCH" },
    );
  }

  async reactivateCategory(categoryId) {
    return this.makeRequest(
      `/admin/category/reactivate-category/${categoryId}`,
      { method: "PATCH" },
    );
  }

  async deleteCategory(categoryId) {
    return this.makeRequest(`/admin/category/delete-category/${categoryId}`, {
      method: "DELETE",
    });
  }

  // ─── SUBCATEGORY MANAGEMENT ────────────────────────────────────────────────

  async createSubcategory(data) {
    const payload = {
      name: data.name,
      category_id: data.category_id,
      description: data.description || "",
      additional_attribute_schema: data.additional_attribute_schema || [],
    };
    if (data.slug && data.slug.trim()) payload.slug = data.slug.trim();
    if (this.isRealUrl(data.category_image_url))
      payload.category_image_url = data.category_image_url;
    if (this.isRealUrl(data.category_icon_url))
      payload.category_icon_url = data.category_icon_url;
    if (data.category_metadata)
      payload.category_metadata = data.category_metadata;

    return this.makeRequest("/admin/category/subcategory/create-subcategory", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getAdminSubcategories(
    categoryId = null,
    includeInactive = false,
    includeEffectiveSchema = false,
  ) {
    const params = new URLSearchParams();
    if (categoryId) params.append("category_id", categoryId);
    params.append("include_inactive", includeInactive);
    params.append("include_effective_schema", includeEffectiveSchema);
    return this.makeRequest(
      `/admin/category/subcategory/get-all-subcategories?${params.toString()}`,
      { method: "GET" },
    );
  }

  async getAdminSubcategory(subcategoryId, includeEffectiveSchema = true) {
    const params = new URLSearchParams();
    params.append("include_effective_schema", includeEffectiveSchema);
    return this.makeRequest(
      `/admin/category/subcategory/get-subcategory/${subcategoryId}?${params.toString()}`,
      { method: "GET" },
    );
  }

  async updateSubcategory(subcategoryId, data) {
    const payload = {};

    if (data.name && data.name.trim()) {
      payload.name = data.name.trim();
    }

    payload.description = data.description || "";

    if (data.slug && data.slug.trim()) {
      payload.slug = data.slug.trim();
    }

    if (
      Array.isArray(data.additional_attribute_schema) &&
      data.additional_attribute_schema.length > 0
    ) {
      payload.additional_attribute_schema =
        data.additional_attribute_schema.map((attr) => ({
          key: String(attr.key || ""),
          label: String(attr.label || ""),
          type: String(attr.type || "text"),
          required: Boolean(attr.required),
          options: ["select", "multiselect"].includes(attr.type)
            ? (attr.options || []).filter(Boolean)
            : [],
        }));
    }

    if (this.isRealUrl(data.category_image_url)) {
      payload.category_image_url = data.category_image_url;
    }
    if (this.isRealUrl(data.category_icon_url)) {
      payload.category_icon_url = data.category_icon_url;
    }
    if (
      data.category_metadata !== undefined &&
      data.category_metadata !== null
    ) {
      payload.category_metadata = data.category_metadata;
    }

    console.log(
      "📦 Update subcategory payload (final):",
      JSON.stringify(payload, null, 2),
    );

    return this.makeRequest(
      `/admin/category/subcategory/update-subcategory/${subcategoryId}`,
      { method: "PUT", body: JSON.stringify(payload) },
    );
  }

  async deactivateSubcategory(subcategoryId) {
    return this.makeRequest(
      `/admin/category/subcategory/deactivate-subcategory/${subcategoryId}`,
      { method: "PATCH" },
    );
  }

  async reactivateSubcategory(subcategoryId) {
    return this.makeRequest(
      `/admin/category/subcategory/reactivate-subcategory/${subcategoryId}`,
      { method: "PATCH" },
    );
  }

  async deleteSubcategory(subcategoryId) {
    return this.makeRequest(
      `/admin/category/subcategory/delete-subcategory/${subcategoryId}`,
      { method: "DELETE" },
    );
  }

  // ─── SCHOOLS ───────────────────────────────────────────────────────────────

  async createSchool({
    schoolName,
    schoolCode,
    schoolAddress,
    schoolPhoneNumber,
    schoolEmail,
    schoolWebsite,
    schoolLogoUrl,
  }) {
    return this.makeRequest("/admin/school/create-school", {
      method: "POST",
      body: JSON.stringify({
        school_name: schoolName,
        school_code: schoolCode,
        school_address: schoolAddress,
        school_phone_number: schoolPhoneNumber,
        school_email: schoolEmail,
        school_website: schoolWebsite,
        school_logo_url: schoolLogoUrl || "",
      }),
    });
  }

  async getAllSchools() {
    return this.makeRequest("/admin/school/get-all-schools", { method: "GET" });
  }

  async getSchoolById(schoolId) {
    return this.makeRequest(`/admin/school/get-school-by-id/${schoolId}`, {
      method: "GET",
    });
  }

  async updateSchool(
    schoolId,
    {
      schoolName,
      schoolCode,
      schoolAddress,
      schoolPhoneNumber,
      schoolEmail,
      schoolWebsite,
      schoolLogoUrl,
    },
  ) {
    return this.makeRequest(`/admin/school/update-school/${schoolId}`, {
      method: "PUT",
      body: JSON.stringify({
        school_name: schoolName,
        school_code: schoolCode,
        school_address: schoolAddress,
        school_phone_number: schoolPhoneNumber,
        school_email: schoolEmail,
        school_website: schoolWebsite,
        school_logo_url: schoolLogoUrl || "",
      }),
    });
  }

  async deactivateSchool(schoolId) {
    return this.makeRequest(`/admin/school/deactivate-school/${schoolId}`, {
      method: "PATCH",
    });
  }

  async reactivateSchool(schoolId) {
    return this.makeRequest(`/admin/school/reactivate-school/${schoolId}`, {
      method: "PATCH",
    });
  }

  async deleteSchool(schoolId) {
    return this.makeRequest(`/admin/school/delete-school/${schoolId}`, {
      method: "DELETE",
    });
  }

  async getAllPublicSchools() {
    return this.makeRequest("/user/schools/public/get-all-schools", {
      method: "GET",
    });
  }

  // ─── CAMPUS GUIDE MANAGEMENT ───────────────────────────────────────────────

  async createCampusGuide(data) {
    return this.makeRequest("/admin/campus-guide/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getAllCampusGuides(params = {}) {
    const qs = new URLSearchParams();
    if (params.school_id) qs.append("school_id", params.school_id);
    if (params.category) qs.append("category", params.category);
    if (params.is_active !== undefined)
      qs.append("is_active", params.is_active);
    if (params.search) qs.append("search", params.search);
    if (params.page) qs.append("page", params.page);
    if (params.limit) qs.append("limit", params.limit);
    const query = qs.toString();
    return this.makeRequest(
      `/admin/campus-guide/all${query ? `?${query}` : ""}`,
      { method: "GET" },
    );
  }

  async getCampusGuideById(guideId) {
    return this.makeRequest(`/admin/campus-guide/${guideId}`, {
      method: "GET",
    });
  }

  async updateCampusGuide(guideId, data) {
    return this.makeRequest(`/admin/campus-guide/${guideId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCampusGuide(guideId) {
    return this.makeRequest(`/admin/campus-guide/${guideId}`, {
      method: "DELETE",
    });
  }

  async toggleCampusGuideStatus(guideId) {
    return this.makeRequest(`/admin/campus-guide/${guideId}/toggle-status`, {
      method: "PATCH",
    });
  }

  async toggleCampusGuideMustKnow(guideId) {
    return this.makeRequest(`/admin/campus-guide/${guideId}/toggle-must-know`, {
      method: "PATCH",
    });
  }

  async getAllCampusReviews(params = {}) {
    const qs = new URLSearchParams();
    if (params.campus_guide_id)
      qs.append("campus_guide_id", params.campus_guide_id);
    if (params.user_id) qs.append("user_id", params.user_id);
    if (params.is_verified !== undefined)
      qs.append("is_verified", params.is_verified);
    if (params.rating) qs.append("rating", params.rating);
    if (params.page) qs.append("page", params.page);
    if (params.limit) qs.append("limit", params.limit);
    const query = qs.toString();
    return this.makeRequest(
      `/admin/campus-guide/reviews/all${query ? `?${query}` : ""}`,
      { method: "GET" },
    );
  }

  async updateCampusReview(reviewId, data) {
    return this.makeRequest(`/admin/campus-guide/reviews/${reviewId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCampusReview(reviewId) {
    return this.makeRequest(`/admin/campus-guide/reviews/${reviewId}`, {
      method: "DELETE",
    });
  }

  async verifyCampusReview(reviewId) {
    return this.makeRequest(`/admin/campus-guide/reviews/${reviewId}/verify`, {
      method: "PATCH",
    });
  }

  async getCampusReviewStatistics() {
    return this.makeRequest("/admin/campus-guide/reviews/statistics", {
      method: "GET",
    });
  }

  // ─── PICKUP STATIONS ───────────────────────────────────────────────────────

  async createPickupStation(schoolId, data) {
    return this.makeRequest(`/admin/pickup-station/create/${schoolId}`, {
      method: "POST",
      body: JSON.stringify({
        station_name: data.station_name,
        station_address: data.station_address,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        is_active: Boolean(data.is_active),
      }),
    });
  }

  async updatePickupStation(stationId, data) {
    return this.makeRequest(`/admin/pickup-station/update/${stationId}`, {
      method: "PUT",
      body: JSON.stringify({
        station_name: data.station_name,
        station_address: data.station_address,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        is_active: Boolean(data.is_active),
      }),
    });
  }

  async deletePickupStation(stationId) {
    return this.makeRequest(`/admin/pickup-station/delete/${stationId}`, {
      method: "DELETE",
    });
  }

  async getAllPickupStations(schoolId, params = {}) {
    const qs = new URLSearchParams();
    if (
      params.is_active !== undefined &&
      params.is_active !== null &&
      params.is_active !== ""
    ) {
      qs.append("is_active", params.is_active);
    }
    if (params.search && params.search.trim()) {
      qs.append("search", params.search.trim());
    }
    if (params.page) qs.append("page", params.page);
    if (params.per_page) qs.append("per_page", params.per_page);
    const query = qs.toString();
    return this.makeRequest(
      `/admin/pickup-station/get-all/${schoolId}${query ? `?${query}` : ""}`,
      { method: "GET" },
    );
  }

  async getPickupStationById(stationId) {
    return this.makeRequest(`/admin/pickup-station/get/${stationId}`, {
      method: "GET",
    });
  }

  // ─── PRODUCT MANAGEMENT ────────────────────────────────────────────────────

  async getPendingProducts({ page = 1, page_size = 20 } = {}) {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("page_size", page_size);
    return this.makeRequest(`/admin/product/pending?${params.toString()}`, {
      method: "GET",
    });
  }

  async getAllProducts({
    status_filter = null,
    page = 1,
    page_size = 20,
  } = {}) {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("page_size", page_size);
    if (status_filter) params.append("status_filter", status_filter);
    return this.makeRequest(`/admin/product?${params.toString()}`, {
      method: "GET",
    });
  }

  async getProductById(productId) {
    return this.makeRequest(`/admin/product/${productId}`, { method: "GET" });
  }

  async approveProduct(productId) {
    return this.makeRequest(`/admin/product/${productId}/approve`, {
      method: "POST",
    });
  }

  async rejectProduct(productId, rejectionReason) {
    return this.makeRequest(`/admin/product/${productId}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
  }

  // ─── REVENUE MANAGEMENT ────────────────────────────────────────────────────

  async getRevenueSummary() {
    return this.makeRequest("/admin/revenue/summary", { method: "GET" });
  }

  async getRevenueRecords(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.skip !== undefined) queryParams.append("skip", params.skip);
    if (params.limit) queryParams.append("limit", params.limit);

    const queryString = queryParams.toString();
    return this.makeRequest(
      `/admin/revenue${queryString ? `?${queryString}` : ""}`,
      { method: "GET" },
    );
  }

  // ─── FILE UPLOADS ──────────────────────────────────────────────────────────

  async uploadFiles(files, uploadType, entityId = null) {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("upload_type", uploadType);

    if (entityId) {
      formData.append("entity_id", entityId);
    }

    console.log(`📤 Uploading ${files.length} file(s) as ${uploadType}`);
    console.log(`🔑 Entity ID: ${entityId || "none"}`);

    const response = await this.makeRequest("/upload/files", {
      method: "POST",
      body: formData,
    });

    return response?.data || response;
  }

  async uploadCategoryImage(file, categoryId) {
    return this.uploadFiles([file], "category_image", categoryId);
  }

  async uploadCategoryIcon(file, categoryId) {
    return this.uploadFiles([file], "category_icon", categoryId);
  }

  async uploadSchoolLogo(file, schoolId) {
    return this.uploadFiles([file], "school_logo", schoolId);
  }

  async uploadCampusGuideImage(file, campusGuideId) {
    return this.uploadFiles([file], "campus_guide_image", campusGuideId);
  }

  async uploadSellerDocuments(files, sellerId = null) {
    return this.uploadFiles(files, "seller_document", sellerId);
  }

  async uploadProviderLogo(file, providerId = null) {
    return this.uploadFiles([file], "provider_logo", providerId);
  }

  async uploadProviderCover(file, providerId = null) {
    return this.uploadFiles([file], "provider_cover", providerId);
  }

  // ─── CAMPAIGN MANAGEMENT ───────────────────────────────────────────────────

  /**
   * Get all flash sale campaigns, optionally filtered by status.
   * @param {string|null} statusFilter - "past" | "current" | "upcoming" | null
   */
  async getFlashSales(statusFilter = null) {
    const params = new URLSearchParams();
    if (statusFilter) params.append("status_filter", statusFilter);
    const qs = params.toString();
    return this.makeRequest(
      `/admin/campaigns/flash-sale${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    );
  }

  /**
   * Schedule (create) a new flash sale.
   * @param {{ title: string, start_time: string, end_time: string }} data
   */
  async createFlashSale({ title, start_time, end_time }) {
    return this.makeRequest("/admin/campaigns/flash-sale", {
      method: "POST",
      body: JSON.stringify({ title, start_time, end_time }),
    });
  }

  /**
   * Update an existing flash sale campaign.
   * @param {string} campaignId
   * @param {{ title?: string, start_time?: string, end_time?: string, is_active?: boolean }} data
   */
  async updateFlashSale(campaignId, data) {
    return this.makeRequest(`/admin/campaigns/flash-sale/${campaignId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Permanently delete a flash sale and its associated applications.
   * @param {string} campaignId
   */
  async deleteFlashSale(campaignId) {
    return this.makeRequest(`/admin/campaigns/flash-sale/${campaignId}`, {
      method: "DELETE",
    });
  }

  /**
   * List all seller product applications for flash sale events.
   */
  async getFlashSaleApplications() {
    return this.makeRequest("/admin/campaigns/flash-sale/applications", {
      method: "GET",
    });
  }

  /**
   * Approve a seller's flash sale application.
   * @param {string} applicationId
   */
  async approveFlashSaleApplication(applicationId) {
    return this.makeRequest(
      `/admin/campaigns/flash-sale/applications/${applicationId}/approve`,
      { method: "POST" },
    );
  }

  /**
   * Reject a seller's flash sale application.
   * @param {string} applicationId
   */
 async rejectFlashSaleApplication(applicationId, rejectionReason = "") {
    return this.makeRequest(
      `/admin/campaigns/flash-sale/applications/${applicationId}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      },
    );
  }

  // Add these methods to your ApiService class in apiService.js

  // ─── WITHDRAWAL MANAGEMENT ──────────────────────────────────────────────────

  async getWithdrawals({ status_filter = null, skip = 0, limit = 20 } = {}) {
    const params = new URLSearchParams();
    params.append("skip", skip);
    params.append("limit", limit);
    if (
      status_filter &&
      ["pending", "completed", "rejected"].includes(status_filter)
    ) {
      params.append("status_filter", status_filter);
    }
    return this.makeRequest(`/admin/withdrawals?${params.toString()}`, {
      method: "GET",
    });
  }

  async reviewWithdrawal(
    withdrawal_id,
    { status, rejection_reason = "", reference = "" },
  ) {
    return this.makeRequest(`/admin/withdrawals/${withdrawal_id}/review`, {
      method: "POST",
      body: JSON.stringify({
        status,
        rejection_reason,
        reference,
      }),
    });
  }

  async approveWithdrawal(withdrawal_id, reference = "") {
    return this.reviewWithdrawal(withdrawal_id, {
      status: "completed",
      rejection_reason: "",
      reference,
    });
  }

  async rejectWithdrawal(withdrawal_id, rejection_reason) {
    return this.reviewWithdrawal(withdrawal_id, {
      status: "rejected",
      rejection_reason,
      reference: "",
    });
  }

  // ─── REPORT MANAGEMENT ────────────────────────────────────────────────────

  /**
   * Get all seller reports with optional status filter
   * @param {string|null} status - "open", "resolved", "dismissed", or null for all
   */
  async getSellerReports(status = null) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    const queryString = params.toString();
    return this.makeRequest(
      `/admin/reports/seller${queryString ? `?${queryString}` : ""}`,
      { method: "GET" },
    );
  }

  /**
   * Resolve a seller report
   * @param {string} reportId - The report ID
   * @param {string} status - "resolved" or "dismissed"
   * @param {string} adminNotes - Optional admin notes
   */
  async resolveSellerReport(reportId, status, adminNotes = "") {
    return this.makeRequest(`/admin/reports/seller/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    });
  }

  /**
   * Get all service provider reports with optional status filter
   * @param {string|null} status - "open", "resolved", "dismissed", or null for all
   */
  async getProviderReports(status = null) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    const queryString = params.toString();
    return this.makeRequest(
      `/admin/reports/provider${queryString ? `?${queryString}` : ""}`,
      { method: "GET" },
    );
  }

  /**
   * Resolve a service provider report
   * @param {string} reportId - The report ID
   * @param {string} status - "resolved" or "dismissed"
   * @param {string} adminNotes - Optional admin notes
   */
  async resolveProviderReport(reportId, status, adminNotes = "") {
    return this.makeRequest(`/admin/reports/provider/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    });
  }

  /**
   * Get all product reports with optional filters
   * @param {string|null} status - "open", "resolved", "dismissed", or null for all
   * @param {string|null} sellerId - Filter by seller ID
   */
  async getProductReports(status = null, sellerId = null) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (sellerId) params.append("seller_id", sellerId);
    const queryString = params.toString();
    return this.makeRequest(
      `/admin/reports/product${queryString ? `?${queryString}` : ""}`,
      { method: "GET" },
    );
  }

  /**
   * Resolve a product report
   * @param {string} reportId - The report ID
   * @param {string} status - "resolved" or "dismissed"
   * @param {string} adminNotes - Optional admin notes
   */
  async resolveProductReport(reportId, status, adminNotes = "") {
    return this.makeRequest(`/admin/reports/product/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    });
  }

  /**
   * Get seller report audit summary (repeat offenders)
   */
  async getSellerReportSummary() {
    return this.makeRequest("/admin/reports/seller-summary", { method: "GET" });
  }

  // Add these methods to your apiService.js file inside the ApiService class

  // ─── ORDER MANAGEMENT ─────────────────────────────────────────────────────────

  /**
   * Get all orders with pagination and filters
   * @param {Object} params - Query parameters
   * @param {string} params.order_status - Filter by order status
   * @param {string} params.payment_status - Filter by payment status (pending, paid, failed)
   * @param {string} params.seller_id - Filter by seller ID
   * @param {string} params.school_id - Filter by buyer's campus (school ID)
   * @param {string} params.start_date - Start date (YYYY-MM-DD)
   * @param {string} params.end_date - End date (YYYY-MM-DD)
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.per_page - Items per page (default: 20, max: 100)
   */
  async getOrders(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.order_status)
      queryParams.append("order_status", params.order_status);
    if (params.payment_status)
      queryParams.append("payment_status", params.payment_status);
    if (params.seller_id) queryParams.append("seller_id", params.seller_id);
    if (params.school_id) queryParams.append("school_id", params.school_id);
    if (params.start_date) queryParams.append("start_date", params.start_date);
    if (params.end_date) queryParams.append("end_date", params.end_date);
    if (params.page) queryParams.append("page", params.page);
    if (params.per_page) queryParams.append("per_page", params.per_page);

    const queryString = queryParams.toString();
    return this.makeRequest(
      `/admin/orders${queryString ? `?${queryString}` : ""}`,
      {
        method: "GET",
      },
    );
  }

  /**
   * Get detailed order information by ID
   * @param {string} orderId - Order ID
   */
  async getOrderDetail(orderId) {
    return this.makeRequest(`/admin/orders/${orderId}`, {
      method: "GET",
    });
  }

  /**
   * Confirm that seller's goods have arrived at the campus pickup station
   * @param {string} itemId - OrderItem ID
   */
  async confirmItemAtStation(itemId) {
    return this.makeRequest(`/admin/orders/items/${itemId}/station`, {
      method: "PATCH",
    });
  }

  /**
   * Mark an item as delivered to the customer
   * This releases the seller's proportional earnings from pending escrow
   * @param {string} itemId - OrderItem ID
   */
  async markItemDelivered(itemId) {
    return this.makeRequest(`/admin/orders/items/${itemId}/deliver`, {
      method: "PATCH",
    });
  }

  // ─── LOGOUT ────────────────────────────────────────────────────────────────

  async logout() {
    this.clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}

export default new ApiService();
