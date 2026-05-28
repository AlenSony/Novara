import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Stylings/CartPage.css';
import { useToast } from '../assets/Toast.jsx';
import { getCart, removeFromCart, updateCartItemQuantity } from '../utils/cartUtils.js';

function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const { showToast } = useToast();
    const navigate = useNavigate();

    // 🛒 Load cart items
    useEffect(() => {
        const loadCartItems = async () => {
            try {
                const result = await getCart();
                const items = Array.isArray(result.cart) ? result.cart : result;

                // normalize IDs
                const normalized = items.map(item => ({
                    ...item,
                    id: item._id || item.itemId || item.productId || item.id,
                    quantity: item.quantity || 1,
                }));

                setCartItems(normalized);

                // calculate total
                const total = normalized.reduce((sum, item) => {
                    const price = item.price || item.productPrice || 0;
                    return sum + price * item.quantity;
                }, 0);
                setTotalPrice(total);
            } catch (error) {
                console.error('Error loading cart items:', error);
                setCartItems([]);
                setTotalPrice(0);
            }
        };
        loadCartItems();
    }, [refreshTrigger]);

    // Refresh cart when window gains focus
    useEffect(() => {
        const handleFocus = () => setRefreshTrigger(prev => prev + 1);
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const handleRemoveItem = async (id) => {
        if (!id) return showToast('Invalid item ID', 'error');

        const result = await removeFromCart(id);
        if (result.success !== false) {
            showToast(result.message || 'Item removed', 'success');
            setRefreshTrigger(prev => prev + 1);
        } else {
            showToast(result.message || 'Failed to remove item', 'error');
        }
    };

    const handleQuantityChange = async (id, change) => {
        const currentItem = cartItems.find(item => item.id === id);
        if (!currentItem) return showToast('Item not found', 'error');

        const newQuantity = Math.max(1, (currentItem.quantity || 1) + change);
        const result = await updateCartItemQuantity(id, newQuantity);

        if (result.success !== false) {
            showToast('Quantity updated', 'success');
            setRefreshTrigger(prev => prev + 1); // force re-fetch for accurate total
        } else {
            showToast(result.message || 'Failed to update quantity', 'error');
        }
    };

    const handleBuyNow = async () => {
        if (cartItems.length === 0) {
            showToast('Your cart is empty!', 'error');
            return;
        }

        const totalWithTax = totalPrice + totalPrice * 0.08 - totalPrice * 0.05;
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('User not logged in.', 'error');
                return;
            }

            const response = await fetch("http://localhost:5000/api/cart/checkout", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: token,
                    items: cartItems.map(item => ({ itemId: item.itemId || item.id || item._id, quantity: item.quantity })),
                    totalPrice: totalWithTax,
                }),
            });
            if (response.status === 200) {
                showToast(`Proceeding to checkout! Total: ₹${totalWithTax.toFixed(2)}`, 'success');
                setCartItems([]);
                setTotalPrice(0);
                navigate('/orders');
            }
            else {
                showToast(`Failed to checkout! Total: ₹${totalWithTax.toFixed(2)}`, 'error');
            }
        }
        catch (err) {
            console.log(err);
            showToast('An error occurred during checkout.', 'error');
        }
    };

    return (
        <div className="cart-page">
            <h1 className="cart-page-title">Your Cart</h1>
            <div className="cart-page-content">

                {cartItems.length === 0 ? (
                    <div className="empty-cart">
                        <div className="empty-cart-icon">
                            📦
                        </div>
                        <h2>Your cart is empty</h2>
                        <p>Looks like you haven't added anything to your cart yet.</p>
                        <Link to="/main" className="cta">
                            <span className="hover-underline-animation"> Shop now </span>
                            <svg
                                id="arrow-horizontal"
                                xmlns="http://www.w3.org/2000/svg"
                                width="30"
                                height="10"
                                viewBox="0 0 46 16"
                            >
                                <path
                                    id="Path_10"
                                    data-name="Path 10"
                                    d="M8,0,6.545,1.455l5.506,5.506H-30V9.039H12.052L6.545,14.545,8,16l8-8Z"
                                    transform="translate(30)"
                                ></path>
                            </svg>
                        </Link>
                    </div>
                ) : (
                    <div className="cart-container">
                        <div className="cart-items">
                            {cartItems.map((item, idx) => (
                                <div key={item._id || item.id || idx} className="cart-item">
                                    <div className="cart-item-image">
                                        <img
                                            src={
                                                item.productImage ||
                                                item.image ||
                                                `http://via.placeholder.com/100x100?text=${encodeURIComponent(item.productName || "Product")}`
                                            }
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "/fallback-product.png";
                                            }}
                                            alt={item.productName || item.model || "Product"}
                                        />
                                    </div>

                                    <div className="cart-item-info">
                                        <h3>{item.productName || item.model}</h3>
                                        <p className="cart-item-description">{item.productDescription || item.brand}</p>
                                        <p className="cart-item-price">
                                            ₹{(item.productPrice ?? item.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </p>

                                        <div className="quantity-control">
                                            <button
                                                className="quantity-btn minus"
                                                onClick={() => handleQuantityChange(item.id, -1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                −
                                            </button>
                                            <span className="quantity">{item.quantity}</span>
                                            <button
                                                className="quantity-btn plus"
                                                onClick={() => handleQuantityChange(item.id, 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        className="remove-item-btn"
                                        onClick={() => handleRemoveItem(item._id)}
                                        aria-label={`Remove ${item.productName || item.model}`}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="cart-summary">
                            <h3>Order Summary</h3>
                            <div className="summary-row">
                                <span>Items ({cartItems.length})</span>
                                <span>₹{totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="summary-row"><span>Shipping</span><span>Free</span></div>
                            <div className="summary-row"><span>Tax</span><span>₹{(totalPrice * 0.08).toFixed(2)}</span></div>
                            <div className="summary-row discount"><span>Discount</span><span>-₹{(totalPrice * 0.05).toFixed(2)}</span></div>
                            <div className="summary-divider"></div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>₹{(totalPrice + totalPrice * 0.08 - totalPrice * 0.05).toFixed(2)}</span>
                            </div>
                            <div className="delivery-info">
                                <span>Estimated delivery:</span>
                                <span>
                                    {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -
                                    {new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <div className="co-btn-wrapper" onClick={handleBuyNow}>
                                <div className="co-left-side">
                                    <div className="co-card">
                                        <div className="co-card-line"></div>
                                        <div className="co-buttons"></div>
                                    </div>
                                    <div className="co-post">
                                        <div className="co-post-line"></div>
                                        <div className="co-screen">
                                            <div className="co-dollar">$</div>
                                        </div>
                                        <div className="co-numbers"></div>
                                        <div className="co-numbers-line2"></div>
                                    </div>
                                </div>
                                <div className="co-right-side">
                                    <div className="co-new">Checkout</div>
                                </div>
                            </div>
                            <Link to="/main" className="continue-shopping-btn small">
                                ← Continue Shopping
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CartPage;
