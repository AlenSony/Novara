import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/Navbar.css';
import { getCart } from '../utils/cartUtils.js';

export default function NavBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [cartItems, setCartItems] = useState(0);
  const [cartButtonAnimation, setCartButtonAnimation] = useState(false);
  const navigate = useNavigate();

  // Initialize cart from utility layer on component mount
  useEffect(() => {
    try {
      const cart = getCart();
      if (cart) setCartItems(cart.length);
    } catch (error) {
      console.error('Error loading cart items:', error);
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/search', { state: { query: searchQuery } });
      setShowSearchInput(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="navbar-fixed-wrapper">
      <Link to="/main" className="navbar-logo-text">
        <h2>NOVARA</h2>
      </Link>

      <div className="btn-container">
        {/* BUTTON 1: HOME PORTAL */}
        <button className="btn" onClick={() => navigate('/main')} title="Home">
          HOME
        </button>

        {/* BUTTON 2: SEARCH TRACKING TOGGLE */}
        <button className="btn" onClick={() => setShowSearchInput(!showSearchInput)} title="Search">
          SEARCH
        </button>

        {/* BUTTON 3: USER PROFILE */}
        <Link to="/profile" className="btn-link-wrapper" title="Profile">
          <button className="btn">
            ACCOUNT
          </button>
        </Link>

        {/* BUTTON 4: CART WITH ACTIVE OVERLAY BADGES */}
        <button
          className={`btn cart-button-dock ${cartButtonAnimation ? 'add-animation' : ''}`}
          onClick={() => navigate('/cart')}
          title="Shopping Cart"
        >
          CART
          {cartItems > 0 && <span className="navbar-badge-counter">{cartItems}</span>}
        </button>
      </div>

      {/* Absolute floating input row triggered via the search action icon toggle */}
      {showSearchInput && (
        <form onSubmit={handleSearchSubmit} className="navbar-floating-search-form">
          <input
            type="text"
            className="navbar-inline-input"
            placeholder="Search products..."
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => setTimeout(() => setShowSearchInput(false), 300)}
          />
        </form>
      )}
    </nav>
  );
}