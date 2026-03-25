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

  getAccessToken()  { return localStorage.getItem("admin_access_token"); }
  getRefreshToken() { return localStorage.getItem("admin_refresh_token"); }

  storeTokens(accessToken, refreshToken = null) {
    if (accessToken)  localStorage.setItem("admin_access_token", accessToken);
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
    } catch { return true; }
  }

  extractErrorMessage(data, statusCode) {
    if (data?.detail && typeof data.detail === "string") return data.detail;
    if (data?.detail?.message) return data.detail.message;
    if (Array.isArray(data?.detail))
      return data.detail.map((e) => (e.loc ? `${e.loc.join(".")}: ${e.msg}` : e.msg)).join(", ");
    if (data?.message) return data.message;
    if (data?.error)   return data.error;
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
      try { data = JSON.parse(text); } catch { data = { message: text }; }

      if (!response.ok) {
        console.error(`Admin API Error [${response.status}] ${endpoint}:`, data);
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
  async createAdmin({ firstName, lastName, email, username, password, gender }) {
    return this.makeRequest("/admin/auth/create-admin", {
      method: "POST",
      body: JSON.stringify({ first_name: firstName, last_name: lastName, email, username, password, gender }),
    });
  }

  // POST /admin/auth/login
  async login({ email, password }) {
    const response = await this.makeRequest("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const tokens = response.data || response;
    if (tokens.access_token) this.storeTokens(tokens.access_token, tokens.refresh_token);
    return response;
  }

  // POST /admin/auth/send-forgotten-password-code?email=
  async sendForgotPasswordCode(email) {
    return this.makeRequest(
      `/admin/auth/send-forgotten-password-code?email=${encodeURIComponent(email)}`,
      { method: "POST" }
    );
  }

  // POST /admin/auth/reset-password-with-code
  async resetPasswordWithCode(email, code, newPassword, confirmPassword) {
    return this.makeRequest(
      `/admin/auth/reset-password-with-code?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&new_password=${encodeURIComponent(newPassword)}&confirm_password=${encodeURIComponent(confirmPassword)}`,
      { method: "POST" }
    );
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
    return this.makeRequest(`/admin/seller/application/${appliedSellerId}`, { method: "GET" });
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

  // ── DELIVERY ──────────────────────────────────────────────────────────────

  // GET /admin/delivery/options
  async getDeliveryOptions() {
    return this.makeRequest("/admin/delivery/options", { method: "GET" });
  }

  // POST /admin/delivery/options
  async createDeliveryOption(data) {
    return this.makeRequest("/admin/delivery/options", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // GET /admin/delivery/options/{id}
  async getDeliveryOption(deliveryId) {
    return this.makeRequest(`/admin/delivery/options/${deliveryId}`, { method: "GET" });
  }

  // PUT /admin/delivery/options/{id}
  async updateDeliveryOption(deliveryId, data) {
    return this.makeRequest(`/admin/delivery/options/${deliveryId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // DELETE /admin/delivery/options/{id}
  async deleteDeliveryOption(deliveryId) {
    return this.makeRequest(`/admin/delivery/options/${deliveryId}`, { method: "DELETE" });
  }

  // GET /admin/delivery/options/available?cart_total=&total_weight=
  async getAvailableDeliveryOptions(cartTotal, totalWeight) {
    return this.makeRequest(
      `/admin/delivery/options/available?cart_total=${cartTotal}&total_weight=${totalWeight}`,
      { method: "GET" }
    );
  }

  // ── SCHOOLS ───────────────────────────────────────────────────────────────

  // POST /admin/school/create-school
  async createSchool({ schoolName, schoolCode, schoolAddress, schoolPhoneNumber, schoolEmail, schoolWebsite, schoolLogoUrl }) {
    return this.makeRequest("/admin/school/create-school", {
      method: "POST",
      body: JSON.stringify({
        school_name:         schoolName,
        school_code:         schoolCode,
        school_address:      schoolAddress,
        school_phone_number: schoolPhoneNumber,
        school_email:        schoolEmail,
        school_website:      schoolWebsite,
        school_logo_url:     schoolLogoUrl || "",
      }),
    });
  }

  // GET /admin/school/get-all-schools
  async getAllSchools() {
    return this.makeRequest("/admin/school/get-all-schools", { method: "GET" });
  }

  // GET /admin/school/get-school-by-id/{school_id}
  async getSchoolById(schoolId) {
    return this.makeRequest(`/admin/school/get-school-by-id/${schoolId}`, { method: "GET" });
  }

  // PUT /admin/school/update-school/{school_id}
  async updateSchool(schoolId, { schoolName, schoolCode, schoolAddress, schoolPhoneNumber, schoolEmail, schoolWebsite, schoolLogoUrl }) {
    return this.makeRequest(`/admin/school/update-school/${schoolId}`, {
      method: "PUT",
      body: JSON.stringify({
        school_name:         schoolName,
        school_code:         schoolCode,
        school_address:      schoolAddress,
        school_phone_number: schoolPhoneNumber,
        school_email:        schoolEmail,
        school_website:      schoolWebsite,
        school_logo_url:     schoolLogoUrl || "",
      }),
    });
  }

  // PATCH /admin/school/deactivate-school/{school_id}
  async deactivateSchool(schoolId) {
    return this.makeRequest(`/admin/school/deactivate-school/${schoolId}`, { method: "PATCH" });
  }

  // PATCH /admin/school/reactivate-school/{school_id}
  async reactivateSchool(schoolId) {
    return this.makeRequest(`/admin/school/reactivate-school/${schoolId}`, { method: "PATCH" });
  }

  // DELETE /admin/school/delete-school/{school_id}
  async deleteSchool(schoolId) {
    return this.makeRequest(`/admin/school/delete-school/${schoolId}`, { method: "DELETE" });
  }

  async logout() { this.clearTokens(); }
}

export default new ApiService();