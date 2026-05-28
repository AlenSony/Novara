import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../assets/navbar.jsx";
import { useToast } from "../assets/Toast.jsx";
import "../Stylings/OrderPage.css";

const BASE = "http://localhost:5000";
const api = (path, opts = {}) =>
  fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });

/* ── Status pill config ──────────────────────────────────────────────────── */
const STATUS = {
  pending: { label: "Pending Payment", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "⏳" },
  paid: { label: "Paid", color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: "✅" },
  shipped: { label: "Shipped", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: "🚚" },
  delivered: { label: "Delivered", color: "#6366f1", bg: "rgba(99,102,241,0.1)", icon: "📦" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "✕" },
};

function statusCfg(raw) {
  return STATUS[String(raw).toLowerCase()] ?? { label: raw, color: "#888", bg: "rgba(0,0,0,0.06)", icon: "•" };
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/* ── Single order card ───────────────────────────────────────────────────── */
function OrderCard({ order, onPay }) {
  const [paying, setPaying] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const cfg = statusCfg(order.paymentStatus || order.payment_status);
  const isPending = (order.paymentStatus || order.payment_status) === "pending";
  const totalQty = (order.devices || []).reduce((s, d) => s + (d.quantity || 1), 0);

  const handlePay = async () => {
    setPaying(true);
    await onPay(order.orderId || order._id);
    setPaying(false);
  };

  return (
    <article className="order-card">
      {/* ── Card header ── */}
      <div className="order-card__header">
        <div className="order-card__header-left">
          <div className="order-id-badge">
            <span className="order-id-badge__label">Order</span>
            <span className="order-id-badge__value">
              #{String(order.orderId || order._id).slice(-8).toUpperCase()}
            </span>
          </div>
          <div className="order-meta">
            <span className="order-meta__item">
              📅 {formatDate(order.orderDate || order.order_date)}
            </span>
            <span className="order-meta__item">
              🛒 {totalQty} item{totalQty !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="order-card__header-right">
          {/* Status pill */}
          <span
            className="status-pill"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}40` }}
          >
            {cfg.icon} {cfg.label}
          </span>

          {/* Expand toggle */}
          <button
            className="order-toggle-btn"
            onClick={() => setExpanded(v => !v)}
            aria-label="Toggle order details"
          >
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* ── Expandable body ── */}
      {expanded && (
        <div className="order-card__body">
          {/* Items list */}
          <div className="order-items">
            {(order.devices || []).map((device, idx) => (
              <div key={device.id || idx} className="order-item">
                <div className="order-item__img-wrap">
                  <img
                    src={device.imageUrl || "/fallback-product.png"}
                    alt={device.name}
                    onError={e => { e.target.onerror = null; e.target.src = "/fallback-product.png"; }}
                  />
                </div>
                <div className="order-item__info">
                  <p className="order-item__name">{device.name}</p>
                  <p className="order-item__sub">{device.company} · {device.category}</p>
                </div>
                <div className="order-item__right">
                  <span className="order-item__qty">×{device.quantity}</span>
                  <span className="order-item__price">
                    ₹{Number(device.expectedPrice || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer: total + pay button */}
          <div className="order-card__footer">
            <div className="order-total">
              <span className="order-total__label">Order Total</span>
              <span className="order-total__value">
                ₹{Number(order.totalPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {isPending && (
              <button
                className={`ord-pay-btn${paying ? " ord-pay-btn--loading" : ""}`}
                onClick={handlePay}
                disabled={paying}
              >
                <span className="ord-btn-text">
                  {paying ? "Processing…" : "Pay Now"}
                </span>
                <div className="ord-icon-container">
                  {paying ? (
                    <span className="pay-now-btn__spinner" style={{ marginLeft: "4px" }} />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="ord-icon ord-card-icon">
                        <path d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18C2,19.11 2.89,20 4,20H20C21.11,20 22,19.11 22,18V6C22,4.89 21.11,4 20,4Z" fill="currentColor"></path>
                      </svg>
                      <svg viewBox="0 0 24 24" className="ord-icon ord-payment-icon">
                        <path d="M2,17H22V21H2V17M6.25,7H9V6H6V3H18V6H15V7H17.75L19,17H5L6.25,7M9,10H15V8H9V10M9,13H15V11H9V13Z" fill="currentColor"></path>
                      </svg>
                      <svg viewBox="0 0 24 24" className="ord-icon ord-dollar-icon">
                        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor"></path>
                      </svg>
                      <svg viewBox="0 0 24 24" className="ord-icon ord-wallet-icon ord-default-icon">
                        <path d="M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18M12,16H22V8H12M16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z" fill="currentColor"></path>
                      </svg>
                      <svg viewBox="0 0 24 24" className="ord-icon ord-check-icon">
                        <path d="M9,16.17L4.83,12L3.41,13.41L9,19L21,7L19.59,5.59L9,16.17Z" fill="currentColor"></path>
                      </svg>
                    </>
                  )}
                </div>
              </button>
            )}

            {!isPending && (
              <span
                className="paid-badge"
                style={{ color: cfg.color, background: cfg.bg }}
              >
                {cfg.icon} {cfg.label}
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main OrderPage
   ═══════════════════════════════════════════════════════════════════════════ */
function OrderPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");   // all | pending | paid

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await api("/api/order/my-orders");
        if (res.status === 401) { navigate("/login"); return; }
        if (!res.ok) throw new Error("Failed to fetch orders");
        setOrders(await res.json());
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [navigate]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async (orderId) => {
    try {
      const res = await loadRazorpay();
      if (!res) throw new Error("Razorpay SDK failed to load. Are you online?");

      // 1. Create Razorpay order
      const orderRes = await api(`/api/order/${orderId}/razorpay`, { method: "POST" });
      if (!orderRes.ok) {
        const d = await orderRes.json().catch(() => ({}));
        throw new Error(d.message || "Failed to initiate payment");
      }
      const data = await orderRes.json();
      console.log("KEY RECEIVED:", data.keyId);

      const options = {
        key: data.keyId,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Novara",
        description: "Order Payment",
        order_id: data.razorpayOrder.id,
        handler: async function (response) {
          // 2. Verify payment on success
          try {
            const verifyRes = await api("/api/order/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                order_id: orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) {
              const dec = await verifyRes.json();
              throw new Error(dec.message || "Payment verification failed");
            }

            showToast("Payment confirmed! 🎉", "success");
            setOrders(prev =>
              prev.map(o =>
                (o.orderId || o._id) === orderId
                  ? { ...o, paymentStatus: "paid", payment_status: "paid" }
                  : o
              )
            );
          } catch (err) {
            showToast(err.message, "error");
          }
        },
        theme: {
          color: "#1F75FE",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const filtered = orders.filter(o => {
    if (filter === "all") return true;
    const st = (o.paymentStatus || o.payment_status || "").toLowerCase();
    return st === filter;
  });

  const pendingCount = orders.filter(
    o => (o.paymentStatus || o.payment_status) === "pending"
  ).length;

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="orders-page">
        <NavBar />
        <div className="orders-loading">
          <div className="orders-loading__spinner" />
          <p>Loading your orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <NavBar />

      <div className="orders-layout">
        {/* ── Page header ── */}
        <div className="orders-page-header">
          <div>
            <h1 className="orders-page-title">My Orders</h1>
            <p className="orders-page-sub">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
              {pendingCount > 0 && (
                <span className="orders-pending-badge">{pendingCount} pending payment</span>
              )}
            </p>
          </div>
          <Link to="/main" className="orders-shop-btn">
            🛍 Continue Shopping
          </Link>
        </div>

        {/* ── Filter tabs ── */}
        {orders.length > 0 && (
          <div className="orders-filter-bar">
            {["all", "pending", "paid", "shipped", "delivered"].map(f => (
              <button
                key={f}
                className={`orders-filter-chip${filter === f ? " orders-filter-chip--active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "all" && <span className="chip-count">{orders.length}</span>}
                {f !== "all" && (
                  <span className="chip-count">
                    {orders.filter(o =>
                      (o.paymentStatus || o.payment_status || "").toLowerCase() === f
                    ).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {orders.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty__icon">🛒</div>
            <h2 className="orders-empty__title">No orders yet</h2>
            <p className="orders-empty__sub">Looks like you haven't placed any orders. Start shopping!</p>
            <Link to="/main" className="pay-now-btn" style={{ textDecoration: "none" }}>
              Browse Products
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty__icon">🔍</div>
            <h2 className="orders-empty__title">No {filter} orders</h2>
            <p className="orders-empty__sub">You have no orders with this status.</p>
            <button className="pay-now-btn" onClick={() => setFilter("all")}>
              Show All Orders
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {filtered.map(order => (
              <OrderCard
                key={order.orderId || order._id}
                order={order}
                onPay={handlePay}
              />
            ))}
          </div>
        )}

        {/* ── Back link ── */}
        {orders.length > 0 && (
          <div className="orders-back-row">
            <Link to="/profile" className="orders-back-link">← Back to Profile</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderPage;
