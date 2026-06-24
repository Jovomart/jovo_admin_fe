// src/pages/admin/AdminOrderManagement.jsx

import { useState, useEffect, useCallback } from "react";
import ApiService from "../services/apiService";
import {
  FiPackage,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiEye,
  FiClock,
  FiMapPin,
  FiUser,
  FiShoppingBag,
  FiDollarSign,
  FiTruck,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiClock as FiTime,
  FiCalendar,
  FiMail,
  FiPhone,
  FiHome,
  FiBox,
  FiCreditCard,
  FiPercent,
  FiInfo,
} from "react-icons/fi";
import { MdLocalShipping, MdStorefront } from "react-icons/md";

/* ─────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
───────────────────────────────────────────────────────────── */

const ORDER_STATUS = {
  pending: { label: "Pending", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", icon: FiClock },
  confirmed: { label: "Confirmed", color: "#3B82F6", bg: "rgba(59,130,246,0.1)", icon: FiLoader },
  processing: { label: "Processing", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)", icon: FiLoader },
  shipped: { label: "Shipped", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)", icon: FiTruck },
  delivered: { label: "Delivered", color: "#10B981", bg: "rgba(16,185,129,0.1)", icon: FiCheckCircle },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: FiXCircle },
  refunded: { label: "Refunded", color: "#6B7280", bg: "rgba(107,114,128,0.1)", icon: FiXCircle },
};

const PAYMENT_STATUS = {
  pending: { label: "Pending", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  paid: { label: "Paid", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  failed: { label: "Failed", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  refunded: { label: "Refunded", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

const ORDER_ITEM_STATUS = {
  pending: { label: "Pending", color: "#F59E0B" },
  processing: { label: "Processing", color: "#3B82F6" },
  shipped_to_station: { label: "Shipped to Station", color: "#8B5CF6" },
  at_station: { label: "At Pickup Station", color: "#F59E0B" },
  delivered: { label: "Delivered", color: "#10B981" },
  cancelled: { label: "Cancelled", color: "#EF4444" },
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "₦0";
  return `₦${amount.toLocaleString()}`;
};

const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

/* ─────────────────────────────────────────────────────────────
   STATS CARD COMPONENT
───────────────────────────────────────────────────────────── */
const StatsCard = ({ title, value, icon: Icon, color, onClick, active }) => (
  <div
    onClick={onClick}
    className={`rounded-xl p-3 border transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
      active ? "ring-2 ring-offset-2 ring-offset-[#0d0d14]" : ""
    }`}
    style={{
      background: active ? `${color}10` : "#0d0d14",
      border: active ? `1px solid ${color}50` : "1px solid rgba(255,255,255,0.05)",
      boxShadow: active ? `0 2px 8px ${color}20` : "none",
    }}
  >
    <div className="flex items-center justify-between mb-1.5">
      <Icon size={16} style={{ color }} />
      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/30">
        {title}
      </span>
    </div>
    <p className="text-xl sm:text-2xl font-black" style={{ color }}>
      {value}
    </p>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   ORDER CARD COMPONENT (for list view)
───────────────────────────────────────────────────────────── */
const OrderCard = ({ order, onClick }) => {
  const orderStatus = ORDER_STATUS[order.order_status] || ORDER_STATUS.pending;
  const paymentStatus = PAYMENT_STATUS[order.payment_status] || PAYMENT_STATUS.pending;
  const StatusIcon = orderStatus.icon;

  // Calculate total items across all seller orders
  const totalItems = order.seller_orders?.reduce((sum, sellerOrder) => 
    sum + (sellerOrder.items?.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0) || 0), 0) || 0;

  return (
    <div
      onClick={() => onClick(order)}
      className="group rounded-xl transition-all duration-300 active:scale-[0.99] overflow-hidden cursor-pointer"
      style={{
        background: "#0d0d14",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: orderStatus.bg }}
            >
              <StatusIcon size={12} style={{ color: orderStatus.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-mono font-bold text-white/80">
                  #{order.order_number || order.id?.slice(-8)}
                </span>
                <span
                  className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: paymentStatus.bg, color: paymentStatus.color }}
                >
                  {paymentStatus.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[8px] sm:text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: orderStatus.bg, color: orderStatus.color }}
                >
                  {orderStatus.label}
                </span>
                <span className="text-[9px] sm:text-[10px] text-white/30 flex items-center gap-0.5">
                  <FiTime size={8} />
                  {getRelativeTime(order.order_date || order.created_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0 ml-2">
            <p className="text-sm sm:text-base font-black text-white">
              {formatCurrency(order.total_amount)}
            </p>
            <p className="text-[8px] sm:text-[9px] text-white/30">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <FiMapPin size={10} className="text-white/30 shrink-0" />
            <span className="text-[10px] sm:text-xs text-white/60 truncate">
              {order.delivery_address || "No address provided"}
            </span>
          </div>
        </div>

        {/* Seller Summary */}
        {order.seller_orders && order.seller_orders.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {order.seller_orders.slice(0, 2).map((sellerOrder, idx) => (
              <span
                key={idx}
                className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 truncate max-w-25"
              >
                {sellerOrder.seller?.business_name || `Seller ${idx + 1}`}
              </span>
            ))}
            {order.seller_orders.length > 2 && (
              <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">
                +{order.seller_orders.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* View Details Button */}
        <div className="mt-3 flex justify-end">
          <button className="text-[10px] sm:text-xs font-medium text-white/40 hover:text-white/70 transition flex items-center gap-1">
            <FiEye size={10} />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   ORDER DETAIL MODAL
───────────────────────────────────────────────────────────── */
const OrderDetailModal = ({ order, onClose, onConfirmStation, onConfirmDeliver, actionLoading }) => {
  const [activeSellerTab, setActiveSellerTab] = useState(0);

  if (!order) return null;

  const orderStatus = ORDER_STATUS[order.order_status] || ORDER_STATUS.pending;
  const paymentStatus = PAYMENT_STATUS[order.payment_status] || PAYMENT_STATUS.pending;

  const handleConfirmStation = async (itemId, sellerName) => {
    if (window.confirm(`Confirm that items from "${sellerName}" have arrived at the pickup station?`)) {
      await onConfirmStation(itemId);
    }
  };

  const handleConfirmDeliver = async (itemId, sellerName) => {
    if (window.confirm(`Mark item from "${sellerName}" as delivered? This will release seller earnings.`)) {
      await onConfirmDeliver(itemId);
    }
  };

  const sellerOrders = order.seller_orders || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-4xl rounded-t-2xl sm:rounded-2xl border flex flex-col animate-slide-up sm:animate-none"
        style={{
          background: "#0d0d14",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b shrink-0 sticky top-0 bg-[#0d0d14] z-10"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: orderStatus.bg }}>
              <FiPackage size={16} style={{ color: orderStatus.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-black text-white truncate" style={{ fontFamily: "'Playfair Display',serif" }}>
                Order #{order.order_number || order.id?.slice(-12)}
              </h3>
              <p className="text-[10px] sm:text-xs text-white/30 truncate">
                {formatDate(order.order_date || order.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition shrink-0"
          >
            <FiXCircle size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-2">
                Order Status
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: orderStatus.color }} />
                <span className="text-sm font-medium text-white">{orderStatus.label}</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-2">
                Payment Status
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: paymentStatus.color }} />
                <span className="text-sm font-medium text-white">{paymentStatus.label}</span>
              </div>
              <p className="text-xs text-white/40 mt-1">
                Method: {order.payment_method || "N/A"}
              </p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-3">
              Delivery Address
            </p>
            <div className="flex items-start gap-2">
              <FiMapPin size={12} className="text-white/40 mt-0.5" />
              <span className="text-xs sm:text-sm text-white/60 flex-1">
                {order.delivery_address || "No address provided"}
              </span>
            </div>
          </div>

          {/* Order Notes */}
          {order.order_notes && (
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-2">
                Order Notes
              </p>
              <p className="text-xs text-white/60">{order.order_notes}</p>
            </div>
          )}

          {/* Seller Tabs */}
          {sellerOrders.length > 0 && (
            <div>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/30 mb-3">
                Sellers & Items ({sellerOrders.length})
              </p>
              
              {/* Tab Bar */}
              <div className="flex gap-1 border-b border-white/10 mb-3 overflow-x-auto pb-px">
                {sellerOrders.map((sellerOrder, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSellerTab(idx)}
                    className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all whitespace-nowrap ${
                      activeSellerTab === idx
                        ? "text-white border-b-2 border-[#FF8C00]"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {sellerOrder.seller?.business_name || `Seller ${idx + 1}`}
                  </button>
                ))}
              </div>

              {/* Active Seller Content */}
              {sellerOrders[activeSellerTab] && (
                <div className="space-y-4">
                  {/* Suborder Summary */}
                  <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-white/60">Subtotal</span>
                      <span className="text-sm font-bold text-white">
                        {formatCurrency(sellerOrders[activeSellerTab].subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/60">Platform Fee</span>
                      <span className="text-sm font-bold text-white">
                        {formatCurrency(sellerOrders[activeSellerTab].platform_fee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                      <span className="text-xs text-white/60">Seller Credit</span>
                      <span className="text-sm font-bold text-[#10B981]">
                        {formatCurrency(sellerOrders[activeSellerTab].seller_credit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-white/60">Order Status</span>
                      <span className="text-xs font-medium text-white">
                        {ORDER_STATUS[sellerOrders[activeSellerTab].order_status]?.label || sellerOrders[activeSellerTab].order_status}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                      Items
                    </p>
                    {sellerOrders[activeSellerTab].items?.map((item, idx) => {
                      const itemStatus = ORDER_ITEM_STATUS[item.item_status] || ORDER_ITEM_STATUS.pending;
                      
                      return (
                        <div
                          key={idx}
                          className="bg-white/5 rounded-xl p-3"
                          style={{ borderLeft: `3px solid ${itemStatus.color}` }}
                        >
                          <div className="flex gap-3">
                            {/* Product Image */}
                            {item.product_image && (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-16 h-16 rounded-lg object-cover shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium text-white truncate">
                                    {item.product_name}
                                  </p>
                                  <p className="text-[10px] text-white/40">
                                    Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                                  </p>
                                </div>
                                <div className="text-right ml-2">
                                  <p className="text-sm font-bold text-white">
                                    {formatCurrency(item.total_price)}
                                  </p>
                                  <span
                                    className="text-[8px] sm:text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                                    style={{ background: `${itemStatus.color}20`, color: itemStatus.color }}
                                  >
                                    {itemStatus.label}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Platform Fee */}
                              {item.platform_fee > 0 && (
                                <p className="text-[9px] text-white/40 mt-1">
                                  Platform Fee: {formatCurrency(item.platform_fee)}
                                </p>
                              )}

                              {/* Action Buttons */}
                              {item.item_status === "pending" && (
                                <div className="mt-2 flex gap-2">
                                  <button
                                    onClick={() => handleConfirmStation(item.id, sellerOrders[activeSellerTab].seller?.business_name)}
                                    disabled={actionLoading === item.id}
                                    className="flex items-center justify-center gap-1.5 py-1 px-3 rounded-lg text-[10px] sm:text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-40"
                                    style={{
                                      background: "rgba(139,92,246,0.1)",
                                      border: "1px solid rgba(139,92,246,0.3)",
                                      color: "#8B5CF6",
                                    }}
                                  >
                                    {actionLoading === item.id ? (
                                      <FiLoader size={10} className="animate-spin" />
                                    ) : (
                                      <FiCheckCircle size={10} />
                                    )}
                                    Confirm Arrival
                                  </button>
                                  <button
                                    onClick={() => handleConfirmDeliver(item.id, sellerOrders[activeSellerTab].seller?.business_name)}
                                    disabled={actionLoading === item.id}
                                    className="flex items-center justify-center gap-1.5 py-1 px-3 rounded-lg text-[10px] sm:text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-40"
                                    style={{
                                      background: "rgba(16,185,129,0.1)",
                                      border: "1px solid rgba(16,185,129,0.3)",
                                      color: "#10B981",
                                    }}
                                  >
                                    {actionLoading === item.id ? (
                                      <FiLoader size={10} className="animate-spin" />
                                    ) : (
                                      <FiTruck size={10} />
                                    )}
                                    Mark Delivered
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex gap-2 sm:gap-3 px-4 py-3 sm:px-6 sm:py-4 border-t shrink-0 sticky bottom-0 bg-[#0d0d14]"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex-1">
            <p className="text-[9px] text-white/30">Total Amount</p>
            <p className="text-lg sm:text-xl font-black text-white">
              {formatCurrency(order.total_amount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   FILTER BAR COMPONENT
───────────────────────────────────────────────────────────── */
const FilterBar = ({ filters, onFilterChange, onClear, schools, sellers, loading }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="p-3 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white transition"
        >
          <FiFilter size={12} />
          Filters
          {Object.values(filters).some(v => v && v !== "all") && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C00]" />
          )}
        </button>
        {Object.values(filters).some(v => v && v !== "all") && (
          <button onClick={onClear} className="text-[10px] text-white/40 hover:text-white/60 transition">
            Clear all
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="p-3 pt-0 border-t border-white/5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select
              value={filters.order_status}
              onChange={(e) => onFilterChange("order_status", e.target.value)}
              className="rounded-lg border border-white/8 bg-[#1a1a24] px-2 py-1.5 text-xs text-white outline-none focus:border-[#FF8C00]/50"
            >
              <option value="all">All Order Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.payment_status}
              onChange={(e) => onFilterChange("payment_status", e.target.value)}
              className="rounded-lg border border-white/8 bg-[#1a1a24] px-2 py-1.5 text-xs text-white outline-none focus:border-[#FF8C00]/50"
            >
              <option value="all">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={filters.seller_id}
              onChange={(e) => onFilterChange("seller_id", e.target.value)}
              className="rounded-lg border border-white/8 bg-[#1a1a24] px-2 py-1.5 text-xs text-white outline-none focus:border-[#FF8C00]/50"
              disabled={loading.sellers}
            >
              <option value="all">All Sellers</option>
              {sellers?.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.business_name || seller.full_name}
                </option>
              ))}
            </select>

            <select
              value={filters.school_id}
              onChange={(e) => onFilterChange("school_id", e.target.value)}
              className="rounded-lg border border-white/8 bg-[#1a1a24] px-2 py-1.5 text-xs text-white outline-none focus:border-[#FF8C00]/50"
              disabled={loading.schools}
            >
              <option value="all">All Schools</option>
              {schools?.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.school_name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => onFilterChange("start_date", e.target.value)}
              className="rounded-lg border border-white/8 bg-[#1a1a24] px-2 py-1.5 text-xs text-white outline-none focus:border-[#FF8C00]/50"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => onFilterChange("end_date", e.target.value)}
              className="rounded-lg border border-white/8 bg-[#1a1a24] px-2 py-1.5 text-xs text-white outline-none focus:border-[#FF8C00]/50"
              placeholder="End Date"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
const AdminOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const itemsPerPage = 10;

  // Filters
  const [filters, setFilters] = useState({
    order_status: "all",
    payment_status: "all",
    seller_id: "all",
    school_id: "all",
    start_date: "",
    end_date: "",
  });

  // Filter options data
  const [sellers, setSellers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState({ sellers: false, schools: false });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("per_page", itemsPerPage);
      
      if (filters.order_status && filters.order_status !== "all") {
        params.append("order_status", filters.order_status);
      }
      if (filters.payment_status && filters.payment_status !== "all") {
        params.append("payment_status", filters.payment_status);
      }
      if (filters.seller_id && filters.seller_id !== "all") {
        params.append("seller_id", filters.seller_id);
      }
      if (filters.school_id && filters.school_id !== "all") {
        params.append("school_id", filters.school_id);
      }
      if (filters.start_date) {
        params.append("start_date", filters.start_date);
      }
      if (filters.end_date) {
        params.append("end_date", filters.end_date);
      }

      const response = await ApiService.makeRequest(`/admin/orders?${params.toString()}`, {
        method: "GET",
      });
      
      // Handle API response structure: { status, status_code, message, data: { orders, total, page, per_page, pages } }
      let ordersData = [];
      let total = 0;
      let pages = 1;

      if (response?.data?.orders && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
        total = response.data.total || response.data.orders.length;
        pages = response.data.pages || Math.ceil(total / itemsPerPage);
      } else if (Array.isArray(response)) {
        ordersData = response;
        total = response.length;
        pages = Math.ceil(total / itemsPerPage);
      } else if (response?.orders && Array.isArray(response.orders)) {
        ordersData = response.orders;
        total = response.total || response.orders.length;
        pages = response.pages || Math.ceil(total / itemsPerPage);
      } else if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data;
        total = response.total || response.data.length;
        pages = response.total_pages || Math.ceil(total / itemsPerPage);
      }

      setOrders(ordersData);
      setTotalOrders(total);
      setTotalPages(pages);
    } catch (err) {
      console.error("fetchOrders error:", err);
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Fetch filter options (sellers and schools)
  const fetchFilterOptions = useCallback(async () => {
    setLoadingOptions({ sellers: true, schools: true });
    try {
      // Fetch sellers for filter
      const sellersResponse = await ApiService.makeRequest("/admin/seller/approved", {
        method: "GET",
      }).catch(() => ({ data: [] }));
      const sellersData = sellersResponse?.data || sellersResponse || [];
      setSellers(Array.isArray(sellersData) ? sellersData : []);

      // Fetch schools for filter
      const schoolsResponse = await ApiService.makeRequest("/admin/school/get-all-schools", {
        method: "GET",
      }).catch(() => ({ data: [] }));
      const schoolsData = schoolsResponse?.data || schoolsResponse || [];
      setSchools(Array.isArray(schoolsData) ? schoolsData : []);
    } catch (err) {
      console.error("fetchFilterOptions error:", err);
    } finally {
      setLoadingOptions({ sellers: false, schools: false });
    }
  }, []);

  // Fetch order details
  const fetchOrderDetail = useCallback(async (orderId) => {
    try {
      const response = await ApiService.makeRequest(`/admin/orders/${orderId}`, {
        method: "GET",
      });
      return response?.data || response;
    } catch (err) {
      console.error("fetchOrderDetail error:", err);
      showToast(err.message || "Failed to load order details", "error");
      return null;
    }
  }, []);

  // Handle confirm arrival at station
  const handleConfirmStation = async (itemId) => {
    setActionLoading(itemId);
    try {
      await ApiService.makeRequest(`/admin/orders/items/${itemId}/station`, {
        method: "PATCH",
      });
      showToast("Item confirmed as arrived at pickup station");
      
      // Refresh the current order if open
      if (selectedOrder) {
        const updatedOrder = await fetchOrderDetail(selectedOrder.id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      }
      fetchOrders(); // Refresh list
    } catch (err) {
      console.error("handleConfirmStation error:", err);
      showToast(err.message || "Failed to confirm arrival", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle mark as delivered
  const handleConfirmDeliver = async (itemId) => {
    setActionLoading(itemId);
    try {
      await ApiService.makeRequest(`/admin/orders/items/${itemId}/deliver`, {
        method: "PATCH",
      });
      showToast("Item marked as delivered! Seller earnings have been released.");
      
      // Refresh the current order if open
      if (selectedOrder) {
        const updatedOrder = await fetchOrderDetail(selectedOrder.id);
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
        }
      }
      fetchOrders(); // Refresh list
    } catch (err) {
      console.error("handleConfirmDeliver error:", err);
      showToast(err.message || "Failed to mark as delivered", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle click on order card
  const handleOrderClick = async (order) => {
    const detailedOrder = await fetchOrderDetail(order.id);
    if (detailedOrder) {
      setSelectedOrder(detailedOrder);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      order_status: "all",
      payment_status: "all",
      seller_id: "all",
      school_id: "all",
      start_date: "",
      end_date: "",
    });
    setCurrentPage(1);
  };

  // Initial load
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Calculate stats
  const stats = {
    total: totalOrders,
    pending: orders.filter(o => o.order_status === "pending").length,
    confirmed: orders.filter(o => o.order_status === "confirmed").length,
    delivered: orders.filter(o => o.order_status === "delivered").length,
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-4 pb-6 sm:pb-8">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 left-3 right-3 sm:left-auto sm:right-4 z-50 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold animate-slide-in sm:max-w-sm"
          style={{
            background: toast.type === "error" ? "rgba(239,68,68,0.95)" : 
                       toast.type === "info" ? "rgba(59,130,246,0.95)" : "rgba(16,185,129,0.95)",
            border: `1px solid ${toast.type === "error" ? "#EF4444" : 
                                   toast.type === "info" ? "#3B82F6" : "#10B981"}`,
            color: "white",
            backdropFilter: "blur(12px)",
            zIndex: 9999,
          }}
        >
          {toast.type === "error" ? <FiAlertCircle size={14} /> : 
           toast.type === "info" ? <FiAlertCircle size={14} /> : <FiCheckCircle size={14} />}
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="text-white/70 hover:text-white">
            <FiXCircle size={14} />
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onConfirmStation={handleConfirmStation}
          onConfirmDeliver={handleConfirmDeliver}
          actionLoading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display',serif" }}>
            <FiPackage size={22} className="text-[#FF8C00]" />
            Order Management
          </h1>
          <p className="text-xs sm:text-sm text-white/30 mt-0.5">
            Manage and track all customer orders
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-all active:scale-95 disabled:opacity-40 w-full xs:w-auto"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <StatsCard
          title="Total Orders"
          value={stats.total}
          icon={FiShoppingBag}
          color="#6B7280"
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={FiClock}
          color="#F59E0B"
        />
        <StatsCard
          title="Confirmed"
          value={stats.confirmed}
          icon={FiCheckCircle}
          color="#3B82F6"
        />
        <StatsCard
          title="Delivered"
          value={stats.delivered}
          icon={FiCheckCircle}
          color="#10B981"
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={clearFilters}
        schools={schools}
        sellers={sellers}
        loading={loadingOptions}
      />

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <FiAlertCircle size={12} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl animate-pulse" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)", height: "160px" }} />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={handleOrderClick}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 sm:gap-2 pt-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <FiChevronLeft size={12} className="text-white/60" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        currentPage === pageNum
                          ? "text-white"
                          : "text-white/40 hover:text-white/60"
                      }`}
                      style={{
                        background: currentPage === pageNum ? "linear-gradient(135deg,#B42225,#FF8C00)" : "rgba(255,255,255,0.05)",
                        border: currentPage === pageNum ? "none" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <FiChevronRight size={12} className="text-white/60" />
              </button>
            </div>
          )}

          {/* Results count */}
          <p className="text-center text-[10px] text-white/30">
            Showing {orders.length} of {totalOrders} orders
          </p>
        </>
      ) : (
        <div className="rounded-2xl p-8 sm:p-12 text-center border" style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.05)" }}>
          <FiPackage size={32} className="text-white/10 mx-auto mb-2" />
          <p className="text-sm font-bold text-white/30">
            {Object.values(filters).some(v => v && v !== "all") ? "No orders match your filters" : "No orders found"}
          </p>
          {Object.values(filters).some(v => v && v !== "all") && (
            <button onClick={clearFilters} className="mt-3 text-xs font-black text-[#FF8C00] hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrderManagement;