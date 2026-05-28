import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NavBar from '../assets/navbar.jsx';
import { useToast } from '../assets/Toast.jsx';
import '../Stylings/ItemPage.css';
import { addToCart } from '../utils/cartUtils.js';

function ItemPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(true);

  // Get item details from location state
  const { state } = location;

  const item = state?.item || {
    _id: 'default-id',
    name: "Product Name",
    company: "Company",
    price: 0,
    description: "Product description",
    ram: "8GB",
    storage: "128GB",
    image: "/placeholder.jpg"
  };

  // Ensure price is set if expected_price is present
  if (item.price === undefined && item.expected_price !== undefined) {
    item.price = item.expected_price;
  }

  // The "selected" variant starts as the current item itself
  const [selectedVariant, setSelectedVariant] = useState(item);

  // ─── Fetch real variants from the backend ─────────────────────────────────
  useEffect(() => {
    const fetchVariants = async () => {
      if (!item._id || !item.company) {
        setLoadingVariants(false);
        return;
      }

      setLoadingVariants(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(
          `http://localhost:5000/api/product/variants?id=${encodeURIComponent(item._id)}&company=${encodeURIComponent(item.company)}`,
          { method: 'GET', credentials: 'include', headers }
        );

        if (!res.ok) throw new Error('Failed to fetch variants');

        const data = await res.json();

        // Map API fields → component-friendly shape
        const mapped = data.map(p => ({
          _id: p._id,
          name: p.name,
          company: p.company,
          price: Number(p.expected_price),
          description: p.description,
          ram: String(p.ram),
          storage: String(p.storage),
          image: p.image_url || p.image,
          stock: p.stock,
          category: p.category,
        }));

        setVariants(mapped);

        // Keep selectedVariant in sync (use the fully-mapped version of the current item)
        const currentMapped = mapped.find(v => String(v._id) === String(item._id));
        if (currentMapped) setSelectedVariant(currentMapped);

      } catch (err) {
        console.error('Error fetching variants:', err);
        // Fall back to showing just the current item
        setVariants([item]);
      } finally {
        setLoadingVariants(false);
      }
    };

    fetchVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item._id]);

  // ─── Cart / buy handlers ──────────────────────────────────────────────────
  const handleAddToCart = async (e) => {
    if (e) e.stopPropagation();
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Please log in to add items to cart', 'error');
        navigate('/login');
        return;
      }
      const result = await addToCart({ ...selectedVariant });
      showToast(result.message, result.success ? 'success' : 'error');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Failed to add item to cart. Please try again.', 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      await handleAddToCart();
      navigate('/cart');
    } catch (error) {
      console.error('Error processing purchase:', error);
      showToast('Failed to process purchase. Please try again.', 'error');
    }
  };

  const showVariantSelector = variants.length > 1;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="container">
        <NavBar />

        <div className="item-page-container">
          <div className="item-content">

            {/* ── Image ── */}
            <div className="item-image-section">
              <img src={selectedVariant.image} alt={selectedVariant.name} />
            </div>

            {/* ── Details ── */}
            <div className="item-details-section">
              <div className="item-header">
                <h1>{selectedVariant.name}</h1>
                <p className="item-company">{selectedVariant.company}</p>
              </div>

              {/* Price – updates with selected variant */}
              <div className="item-price">
                <h2>₹{Number(selectedVariant.price).toLocaleString('en-IN')}</h2>
              </div>

              <div className="item-description">
                <p>{selectedVariant.description}</p>
              </div>

              {/* ── Variant Selector (only when > 1 real DB variant exists) ── */}
              {showVariantSelector && (
                <div className="item-variants">
                  <h3 className="variants-heading">Choose a Variant</h3>

                  {loadingVariants ? (
                    <p className="variants-loading">Loading variants…</p>
                  ) : (
                    <div className="variant-chips">
                      {variants.map((v) => {
                        const isActive = String(v._id) === String(selectedVariant._id);

                        // Extract the variant label from parentheses in the name:
                        // "iPhone 16 Pro (256GB, Black)" → "256GB, Black"
                        // Falls back to "RAM · Storage" if no parentheses found.
                        const parenMatch = v.name.match(/\(([^)]+)\)/);
                        const variantLabel = parenMatch
                          ? parenMatch[1]
                          : [v.ram, v.storage].filter(Boolean).join(' · ');

                        return (
                          <button
                            key={v._id}
                            className={`variant-chip${isActive ? ' variant-chip--active' : ''}`}
                            onClick={() => setSelectedVariant(v)}
                            title={v.name}
                          >
                            <span className="variant-chip__label">{variantLabel}</span>
                            <span className="variant-chip__price">
                              ₹{Number(v.price).toLocaleString('en-IN')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Specs ── */}
              <div className="item-specs">
                <h3>Specifications</h3>
                <ul>
                  {selectedVariant.ram && (
                    <li><strong>RAM:</strong> {selectedVariant.ram}</li>
                  )}
                  {selectedVariant.storage && (
                    <li><strong>Storage:</strong> {selectedVariant.storage}</li>
                  )}
                  {selectedVariant.category && (
                    <li><strong>Category:</strong> {selectedVariant.category}</li>
                  )}
                  {selectedVariant.stock !== undefined && (
                    <li>
                      <strong>Availability:</strong>{' '}
                      {Number(selectedVariant.stock) > 0
                        ? <span className="in-stock">In Stock</span>
                        : <span className="out-of-stock">Out of Stock</span>
                      }
                    </li>
                  )}
                </ul>
              </div>

              {/* ── Actions ── */}
              {Number(selectedVariant.stock) > 0 && selectedVariant.inStock !== false ? (
                <div className="item-actions">
                  <button
                    className="cartBtn item-cart-btn"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                  >
                    <svg className="cart" fill="white" viewBox="0 0 576 512" height="1em" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"></path>
                    </svg>
                    {isAddingToCart ? 'ADDING...' : 'ADD TO CART'}
                  </button>
                  <button
                    className="action-btn action-btn--buy"
                    onClick={handleBuyNow}
                    disabled={isAddingToCart}
                  >
                    Buy Now
                  </button>
                </div>
              ) : (
                <div className="item-actions-out-of-stock">
                  <p className="out-of-stock-notice">This item is currently out of stock and cannot be purchased.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default ItemPage;