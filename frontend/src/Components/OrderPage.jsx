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
  pending: { label: "PENDING PAYMENT", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  paid: { label: "PAID", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  shipped: { label: "SHIPPED", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  delivered: { label: "DELIVERED", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  cancelled: { label: "CANCELLED", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

function statusCfg(raw) {
  return STATUS[String(raw).toLowerCase()] ?? { label: String(raw).toUpperCase(), color: "#888", bg: "rgba(0,0,0,0.06)" };
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
              DATE: {formatDate(order.orderDate || order.order_date)}
            </span>
            <span className="order-meta__item">
              QTY: {totalQty} item{totalQty !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="order-card__header-right">
          {/* Status pill */}
          <span className="status-pill" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}40` }}>
            {cfg.label}
          </span>


        </div>
      </div>

      {/* ── Static body ── */}
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
                className={`pay-now-btn${paying ? " pay-now-btn--loading" : ""}`}
                onClick={handlePay}
                disabled={paying}
              >
                {paying ? "PROCESSING…" : "PAY NOW"}
              </button>
            )}

            {!isPending && (
              <span
                className="paid-badge"
                style={{ color: cfg.color, background: cfg.bg }}
              >
                {cfg.label}
              </span>
            )}
          </div>
        </div>
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
            CONTINUE SHOPPING
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
            <div className="orders-empty__icon">NO ORDERS</div>
            <h2 className="orders-empty__title">No orders yet</h2>
            <p className="orders-empty__sub">Looks like you haven't placed any orders. Start shopping!</p>
            <Link to="/main" className="pay-now-btn" style={{ textDecoration: "none" }}>
              Browse Products
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty__icon">NO RESULTS</div>
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
