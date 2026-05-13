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
      if (token && !this.isTokenExpired(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        this.clearTokens();
        throw new Error("Session expired. Please log in again.");
      }
    }

    try {
      const response = await fetch(url, config);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        console.error(
          `Admin API Error [${response.status}] ${endpoint}:`,
          data,
        );
        if (response.status === 401) {
          this.clearTokens();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(this.extractErrorMessage(data, response.status));
      }
      return data;
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch"))
        throw new Error("Network error: Unable to connect to server.");
      throw error;
    }
  }

  // ── AUTH ──────────────────────────────────────────────────────────────────

  // POST /admin/auth/create-admin
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

  // POST /admin/auth/login
  async login({ email, password }) {
    const response = await this.makeRequest("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const tokens = response.data || response;
    if (tokens.access_token)
      this.storeTokens(tokens.access_token, tokens.refresh_token);
    return response;
  }

  // POST /admin/auth/send-forgotten-password-code?email=
  async sendForgotPasswordCode(email) {
    return this.makeRequest(
      `/admin/auth/send-forgotten-password-code?email=${encodeURIComponent(email)}`,
      { method: "POST" },
    );
  }

  // POST /admin/auth/reset-password-with-code
  async resetPasswordWithCode(email, code, newPassword, confirmPassword) {
    return this.makeRequest(
      `/admin/auth/reset-password-with-code?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&new_password=${encodeURIComponent(newPassword)}&confirm_password=${encodeURIComponent(confirmPassword)}`,
      { method: "POST" },
    );
  }

  // ── ADMIN PROFILE ──────────────────────────────────────────────────────────────

  // GET /admin/auth/profile - Get current admin profile
  async getAdminProfile() {
    return this.makeRequest("/admin/auth/profile", { method: "GET" });
  }

  // PUT /admin/auth/profile - Update admin profile
  async updateAdminProfile(profileData) {
    return this.makeRequest("/admin/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  // ── ACTIVITY LOGS ──────────────────────────────────────────────────────────────

  // GET /admin/activity-logs - Get admin activity logs
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

  // GET /admin/seller/pending
  async getPendingSellers() {
    return this.makeRequest("/admin/seller/pending", { method: "GET" });
  }

  // GET /admin/seller/approved
  async getApprovedSellers() {
    return this.makeRequest("/admin/seller/approved", { method: "GET" });
  }

  // GET /admin/seller/application/{id}
  async getSellerApplication(appliedSellerId) {
    return this.makeRequest(`/admin/seller/application/${appliedSellerId}`, {
      method: "GET",
    });
  }

  // POST /admin/seller/approve-reject
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

  // ── ADMIN INVITATIONS ──────────────────────────────────────────────────────────

  // POST /admin/invitation/invite-admin - Create invitation (Super Admin only)
  async inviteAdmin({ email, adminType, schoolId = null }) {
    const body = {
      email: email.trim().toLowerCase(),
      admin_type: adminType, // "ADMIN" or "SUPER_ADMIN"
    };
    if (schoolId) body.school_id = schoolId;

    return this.makeRequest("/admin/invitation/invite-admin", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // GET /admin/invitation/invitations - Get all invitations
  async getInvitations() {
    return this.makeRequest("/admin/invitation/invitations", { method: "GET" });
  }

  // GET /admin/invitation/view-invitation/{token} - View invitation (Public)
  async viewInvitation(token) {
    return this.makeRequest(`/admin/invitation/view-invitation/${token}`, {
      method: "GET",
    });
  }

  // POST /admin/invitation/accept-invitation/{token} - Accept invitation (Public)
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

  // POST /admin/invitation/reject-invitation/{token} - Reject invitation (Public)
  async rejectInvitation(token, rejectionReason = "") {
    return this.makeRequest(`/admin/invitation/reject-invitation/${token}`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
  }

  // POST /admin/invitation/resend-invitation/{invitation_id} - Resend invitation (Super Admin)
  async resendInvitation(invitationId) {
    return this.makeRequest(
      `/admin/invitation/resend-invitation/${invitationId}`,
      {
        method: "POST",
      },
    );
  }

  // DELETE /admin/invitation/revoke-invitation/{invitation_id} - Revoke invitation (Super Admin)
  async revokeInvitation(invitationId) {
    return this.makeRequest(
      `/admin/invitation/revoke-invitation/${invitationId}`,
      {
        method: "DELETE",
      },
    );
  }

  // src/services/apiService.js
  // Add these methods INSIDE the ApiService class, preferably after the schools section or before the logout method

  // ── DELIVERY OPTIONS ──────────────────────────────────────────────────────────────

  // POST /admin/delivery/create-options - Create delivery option
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

  // GET /admin/delivery/options - Get all delivery options
  async getAllDeliveryOptions() {
    return this.makeRequest("/admin/delivery/options", {
      method: "GET",
    });
  }

  // GET /admin/delivery/options/{delivery_id} - Get delivery option by ID
  async getDeliveryOptionById(deliveryId) {
    return this.makeRequest(`/admin/delivery/options/${deliveryId}`, {
      method: "GET",
    });
  }

  // PUT /admin/delivery/options/{delivery_id} - Update delivery option
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

  // GET /admin/delivery/options/available - Get available options for cart
  async getAvailableDeliveryOptions(cartTotal, totalWeight) {
    return this.makeRequest(
      `/admin/delivery/options/available?cart_total=${cartTotal}&total_weight=${totalWeight}`,
      {
        method: "GET",
      },
    );
  }

  // POST /admin/delivery/options/{delivery_id}/deactivate - Deactivate delivery option (soft delete)
  async deactivateDeliveryOption(deliveryId) {
    return this.makeRequest(
      `/admin/delivery/options/${deliveryId}/deactivate`,
      {
        method: "POST",
      },
    );
  }

  // POST /admin/delivery/options/{delivery_id}/reactivate - Reactivate delivery option
  async reactivateDeliveryOption(deliveryId) {
    return this.makeRequest(
      `/admin/delivery/options/${deliveryId}/reactivate`,
      {
        method: "POST",
      },
    );
  }

  // DELETE /admin/delivery/options/{delivery_id}/permanently-delete - Permanently delete delivery option
  async permanentlyDeleteDeliveryOption(deliveryId) {
    return this.makeRequest(
      `/admin/delivery/options/${deliveryId}/permanently-delete`,
      {
        method: "DELETE",
      },
    );
  }

  // ── CATEGORY MANAGEMENT ──────────────────────────────────────────────────────────

  // 1. POST /admin/category/create-category - Create new category
  async createCategory(data) {
    const payload = {
      name: data.name,
      slug: data.slug || undefined,
      description: data.description || "",
      category_type: data.category_type, // "PRODUCT" or "SERVICE"
      attribute_schema: data.attribute_schema || [],
    };
    return this.makeRequest("/admin/category/create-category", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // 2. GET /admin/category/get-all-categories - Get all categories
  async getAdminCategories(categoryType = null, includeInactive = false) {
    const params = new URLSearchParams();
    if (categoryType) params.append("category_type", categoryType);
    params.append("include_inactive", includeInactive);
    return this.makeRequest(
      `/admin/category/get-all-categories?${params.toString()}`,
      { method: "GET" },
    );
  }

  // 3. GET /admin/category/get-category/{id} - Get single category
  async getAdminCategory(categoryId) {
    return this.makeRequest(`/admin/category/get-category/${categoryId}`, {
      method: "GET",
    });
  }

  // 4. PUT /admin/category/update-category/{id} - Update category
  async updateCategory(categoryId, data) {
    const payload = {
      name: data.name,
      description: data.description || "",
      attribute_schema: data.attribute_schema || [],
    };
    return this.makeRequest(`/admin/category/update-category/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  // 5. PATCH /admin/category/deactivate-category/{id} - Deactivate category
  async deactivateCategory(categoryId) {
    return this.makeRequest(
      `/admin/category/deactivate-category/${categoryId}`,
      {
        method: "PATCH",
      },
    );
  }

  // 6. PATCH /admin/category/reactivate-category/{id} - Reactivate category
  async reactivateCategory(categoryId) {
    return this.makeRequest(
      `/admin/category/reactivate-category/${categoryId}`,
      {
        method: "PATCH",
      },
    );
  }

  // 7. DELETE /admin/category/delete-category/{id} - Permanently delete category
  async deleteCategory(categoryId) {
    return this.makeRequest(`/admin/category/delete-category/${categoryId}`, {
      method: "DELETE",
    });
  }

  // ── SCHOOLS ───────────────────────────────────────────────────────────────

  // POST /admin/school/create-school
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

  // GET /admin/school/get-all-schools
  async getAllSchools() {
    return this.makeRequest("/admin/school/get-all-schools", { method: "GET" });
  }

  // GET /admin/school/get-school-by-id/{school_id}
  async getSchoolById(schoolId) {
    return this.makeRequest(`/admin/school/get-school-by-id/${schoolId}`, {
      method: "GET",
    });
  }

  // PUT /admin/school/update-school/{school_id}
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

  // PATCH /admin/school/deactivate-school/{school_id}
  async deactivateSchool(schoolId) {
    return this.makeRequest(`/admin/school/deactivate-school/${schoolId}`, {
      method: "PATCH",
    });
  }

  // PATCH /admin/school/reactivate-school/{school_id}
  async reactivateSchool(schoolId) {
    return this.makeRequest(`/admin/school/reactivate-school/${schoolId}`, {
      method: "PATCH",
    });
  }

  // DELETE /admin/school/delete-school/{school_id}
  async deleteSchool(schoolId) {
    return this.makeRequest(`/admin/school/delete-school/${schoolId}`, {
      method: "DELETE",
    });
  }
  // GET /user/schools/public/get-all-schools
  async getAllPublicSchools() {
    return this.makeRequest("/user/schools/public/get-all-schools", {
      method: "GET",
    });
  }


// ── CAMPUS GUIDE MANAGEMENT (ADMIN) ──────────────────────────────────────────────

// POST /admin/campus-guide/create - Create campus guide
async createCampusGuide(data) {
  return this.makeRequest("/admin/campus-guide/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// GET /admin/campus-guide/all - Get all campus guides
async getAllCampusGuides(params = {}) {
  const qs = new URLSearchParams();
  if (params.school_id) qs.append("school_id", params.school_id);
  if (params.category) qs.append("category", params.category);
  if (params.is_active !== undefined) qs.append("is_active", params.is_active);
  if (params.search) qs.append("search", params.search);
  if (params.page) qs.append("page", params.page);
  if (params.limit) qs.append("limit", params.limit);
  const query = qs.toString();
  return this.makeRequest(`/admin/campus-guide/all${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

// GET /admin/campus-guide/{guide_id} - Get campus guide by ID
async getCampusGuideById(guideId) {
  return this.makeRequest(`/admin/campus-guide/${guideId}`, {
    method: "GET",
  });
}

// PUT /admin/campus-guide/{guide_id} - Update campus guide
async updateCampusGuide(guideId, data) {
  return this.makeRequest(`/admin/campus-guide/${guideId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// DELETE /admin/campus-guide/{guide_id} - Delete campus guide
async deleteCampusGuide(guideId) {
  return this.makeRequest(`/admin/campus-guide/${guideId}`, {
    method: "DELETE",
  });
}

// PATCH /admin/campus-guide/{guide_id}/toggle-status - Toggle active status
async toggleCampusGuideStatus(guideId) {
  return this.makeRequest(`/admin/campus-guide/${guideId}/toggle-status`, {
    method: "PATCH",
  });
}

// PATCH /admin/campus-guide/{guide_id}/toggle-must-know - Toggle must-know status
async toggleCampusGuideMustKnow(guideId) {
  return this.makeRequest(`/admin/campus-guide/${guideId}/toggle-must-know`, {
    method: "PATCH",
  });
}

// GET /admin/campus-guide/reviews/all - Get all reviews
async getAllCampusReviews(params = {}) {
  const qs = new URLSearchParams();
  if (params.campus_guide_id) qs.append("campus_guide_id", params.campus_guide_id);
  if (params.user_id) qs.append("user_id", params.user_id);
  if (params.is_verified !== undefined) qs.append("is_verified", params.is_verified);
  if (params.rating) qs.append("rating", params.rating);
  if (params.page) qs.append("page", params.page);
  if (params.limit) qs.append("limit", params.limit);
  const query = qs.toString();
  return this.makeRequest(`/admin/campus-guide/reviews/all${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

// PUT /admin/campus-guide/reviews/{review_id} - Update review
async updateCampusReview(reviewId, data) {
  return this.makeRequest(`/admin/campus-guide/reviews/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// DELETE /admin/campus-guide/reviews/{review_id} - Delete review
async deleteCampusReview(reviewId) {
  return this.makeRequest(`/admin/campus-guide/reviews/${reviewId}`, {
    method: "DELETE",
  });
}

// PATCH /admin/campus-guide/reviews/{review_id}/verify - Verify review
async verifyCampusReview(reviewId) {
  return this.makeRequest(`/admin/campus-guide/reviews/${reviewId}/verify`, {
    method: "PATCH",
  });
}

// GET /admin/campus-guide/reviews/statistics - Get review statistics
async getCampusReviewStatistics() {
  return this.makeRequest("/admin/campus-guide/reviews/statistics", {
    method: "GET",
  });
}

  async logout() {
    this.clearTokens();
  }
}

export default new ApiService();
