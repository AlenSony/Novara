import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/Navbar.css';
import { getCart } from '../utils/cartUtils.js';

export default function NavBar() {
  const containerRef = useRef(null);
  const btnRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [outlineProps, setOutlineProps] = useState({ x: 0, width: 0 });
  const containerRef = useRef(null);
  const btnRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [outlineProps, setOutlineProps] = useState({ x: 0, width: 0 });
  const containerRef = useRef(null);
  const btnRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [outlineProps, setOutlineProps] = useState({ x: 0, width: 0 });
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
    <div className="navbar-fixed-wrapper">
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

      <div className="btn-container" ref={containerRef}>
          {/* SVG outline tracking */}
          <svg className="outline"><rect className="rect" /></svg>
        {/* BUTTON 1: HOME PORTAL */}
        <button ref={el => btnRefs.current[0] = el} className="btn" onClick={() => { setActiveIndex(0); navigate('/main'); }} title="Home">
          <svg className="icon" stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path d="M946.5 505L560.1 118.8l-25.9-25.9a31.5 31.5 0 0 0-44.4 0L77.5 505a63.9 63.9 0 0 0-18.8 46c.4 35.2 29.7 63.3 64.9 63.3h42.5V940h691.8V614.3h43.4c17.1 0 33.2-6.7 45.3-18.8a63.6 63.6 0 0 0 18.7-45.3c0-17-6.7-33.1-18.8-45.2zM568 868H456V664h112v204zm217.9-325.7V868H632V640c0-22.1-17.9-40-40-40H432c-22.1 0-40 17.9-40 40v228H238.1V542.3h-96l370-369.7 23.1 23.1L882 542.3h-96.1z"></path>
          </svg>
        </button>

        {/* BUTTON 2: SEARCH TRACKING TOGGLE */}
        <button ref={el => btnRefs.current[1] = el} className="btn" onClick={() => { setActiveIndex(1); setShowSearchInput(!showSearchInput); }} title="Search">
          <svg className="icon" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </button>

        {/* BUTTON 3: USER PROFILE */}
        <Link to="/profile" className="button-link-wrapper" title="Profile">
          <button ref={el => btnRefs.current[2] = el} className="btn">
            <svg className="icon" stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.5a5.5 5.5 0 0 1 3.096 10.047 9.005 9.005 0 0 1 5.9 8.181.75.75 0 1 1-1.499.044 7.5 7.5 0 0 0-14.993 0 .75.75 0 0 1-1.5-.045 9.005 9.005 0 0 1 5.9-8.18A5.5 5.5 0 0 1 12 2.5ZM8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"></path>
            </svg>
          </button>
        </Link>

        {/* BUTTON 4: CART WITH ACTIVE OVERLAY BADGES */}
        <button
          ref={el => btnRefs.current[3] = el}
          className={`btn cart-button-dock ${cartButtonAnimation ? 'add-animation' : ''}`}
          onClick={() => { setActiveIndex(3); navigate('/cart'); }}
          title="Shopping Cart"
        >
          <svg className="icon" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          {cartItems > 0 && <span className="navbar-badge-counter">{cartItems}</span>}
        </button>
      </div>
    </div>
  );
}