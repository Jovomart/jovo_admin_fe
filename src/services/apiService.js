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

    const config = {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    };

    if (!isPublic) {
      const token = this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          `✅ Adding token to ${endpoint}, token length: ${token.length}`,
        );
      } else {
        console.error(`❌ No token found for ${endpoint}`);
        throw new Error("No authentication token found. Please log in again.");
      }
    }

    console.log(`🌐 Making request to: ${url}`);
    console.log(`📋 Headers:`, config.headers);

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

      if (!response.ok) {
        console.error(
          `Admin API Error [${response.status}] ${endpoint}:`,
          data,
        );

        if (response.status === 401) {
          const serverMessage = this.extractErrorMessage(data, 401);
          throw new Error(
            serverMessage && serverMessage !== "Request failed with status 401"
              ? serverMessage
              : "Access denied. You may not have permission for this action, or your session has expired. Try logging out and back in.",
          );
        }

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

  // ── AUTH ──────────────────────────────────────────────────────────────────

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

  // ── ADMIN PROFILE ──────────────────────────────────────────────────────────

  async getAdminProfile() {
    return this.makeRequest("/admin/auth/profile", { method: "GET" });
  }

  async updateAdminProfile(profileData) {
    return this.makeRequest("/admin/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  // ── ACTIVITY LOGS ──────────────────────────────────────────────────────────

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

  // ── SELLERS ───────────────────────────────────────────────────────────────

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

  // ── ADMIN INVITATIONS ──────────────────────────────────────────────────────

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

  // ── DELIVERY OPTIONS ──────────────────────────────────────────────────────

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

  // ── CATEGORY MANAGEMENT ───────────────────────────────────────────────────

  async createCategory(data) {
    const payload = {
      name: data.name,
      description: data.description || "",
      category_type: data.category_type,
      attribute_schema: data.attribute_schema || [],
    };
    if (data.slug) payload.slug = data.slug;
    if (data.category_image_url)
      payload.category_image_url = data.category_image_url;
    if (data.category_icon_url)
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
    const payload = {
      name: data.name,
      description: data.description || "",
      attribute_schema: data.attribute_schema || [],
    };
    if (data.category_image_url !== undefined)
      payload.category_image_url = data.category_image_url;
    if (data.category_icon_url !== undefined)
      payload.category_icon_url = data.category_icon_url;
    if (data.category_metadata !== undefined)
      payload.category_metadata = data.category_metadata;

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

  // ── SUBCATEGORY MANAGEMENT ────────────────────────────────────────────────

  async createSubcategory(data) {
    const payload = {
      name: data.name,
      category_id: data.category_id,
      description: data.description || "",
      additional_attribute_schema: data.additional_attribute_schema || [],
    };
    if (data.slug) payload.slug = data.slug;
    if (data.category_image_url)
      payload.category_image_url = data.category_image_url;
    if (data.category_icon_url)
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
    const payload = {
      name: data.name,
      description: data.description || "",
      additional_attribute_schema: data.additional_attribute_schema || [],
    };
    if (data.category_image_url !== undefined)
      payload.category_image_url = data.category_image_url;
    if (data.category_icon_url !== undefined)
      payload.category_icon_url = data.category_icon_url;
    if (data.category_metadata !== undefined)
      payload.category_metadata = data.category_metadata;

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

  // ── SCHOOLS ───────────────────────────────────────────────────────────────

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

  // ── CAMPUS GUIDE MANAGEMENT ───────────────────────────────────────────────

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

  // ── PICKUP STATIONS ───────────────────────────────────────────────────────

  /**
   * Create a new pickup station for a specific school.
   * POST /admin/pickup-station/create/{school_id}
   */
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

  /**
   * Update an existing pickup station.
   * PUT /admin/pickup-station/update/{station_id}
   */
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

  /**
   * Permanently delete a pickup station.
   * DELETE /admin/pickup-station/delete/{station_id}
   */
  async deletePickupStation(stationId) {
    return this.makeRequest(`/admin/pickup-station/delete/${stationId}`, {
      method: "DELETE",
    });
  }

  /**
   * Get all pickup stations for a school with optional filters.
   * GET /admin/pickup-station/get-all/{school_id}
   */
  async getAllPickupStations(schoolId, params = {}) {
    const qs = new URLSearchParams();
    // Only append is_active if explicitly set (not null/undefined)
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

  /**
   * Get a single pickup station by its ID.
   * GET /admin/pickup-station/get/{station_id}
   */
  async getPickupStationById(stationId) {
    return this.makeRequest(`/admin/pickup-station/get/${stationId}`, {
      method: "GET",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────

  async logout() {
    this.clearTokens();
  }
}

export default new ApiService();
