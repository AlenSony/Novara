import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../assets/Toast.jsx';
import "../Stylings/SearchPage.css";
import { addToCart } from '../utils/cartUtils.js';

function SearchPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const searchQuery = location.state?.query || '';
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch products based on search query
        const fetchProducts = async () => {
            try {
                setLoading(true);
                // Get token if available, but don't redirect if missing
                const token = localStorage.getItem('token');
                
                const headers = {
                    'Content-Type': 'application/json'
                };
                
                // Only add Authorization header if token exists
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                
                const res = await fetch(`http://localhost:5000/api/product/search?query=${searchQuery}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: headers
                });
                
                if (!res.ok) {
                    if (res.status === 401) {
                        console.error('Authentication required. Please log in first.');
                        return;
                    }
                    throw new Error('Failed to fetch products');
                }
                
                const products = await res.json();
                console.log('Fetched products:', products);
                
                // Filter results client-side as well if search query exists
                let filteredResults = products || [];
                if (searchQuery && Array.isArray(filteredResults)) {
                    const query = searchQuery.toLowerCase();
                    filteredResults = filteredResults.filter(product => 
                        product.name?.toLowerCase().includes(query) || 
                        product.description?.toLowerCase().includes(query) ||
                        product.company?.toLowerCase().includes(query)
                    );
                }
                
                setSearchResults(filteredResults);
            } catch (error) {
                console.error('Error fetching search results:', error);
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [searchQuery, navigate]);

    const handleAddToCart = async (product) => {
        try {
            // Use the API-based addToCart function
            const result = await addToCart(product);
            showToast(result.message, result.success ? 'success' : 'error');
        } catch (error) {
            console.error('Error adding to cart:', error);
            showToast('Failed to add item to cart', 'error');
        }
    };

    const handlePhoneClick = (phone) => {
        navigate('/item', { state: { item: { ...phone, price: phone.expected_price, image: phone.image_url } } });
    };

    return (
        <div className="search-page">
            <div className="search-bg-glow"></div>
            <div className="search-content-wrapper">
                <div className="search-header-section">
                    <h1 className="search-title">
                        Results for <span className="query-highlight">"{searchQuery}"</span>
                    </h1>
                    {!loading && searchResults.length > 0 && (
                        <div className="results-badge">
                            {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
                        </div>
                    )}
                </div>
                
                {loading ? (
                    <div className="loading-container">
                        <div className="modern-spinner">
                            <div></div><div></div><div></div><div></div>
                        </div>
                        <p>Scanning our catalog...</p>
                    </div>
                ) : searchResults.length === 0 ? (
                    <div className="no-results-card">
                        <div className="no-results-icon">🔍</div>
                        <h2>No matches found</h2>
                        <p>We couldn't find anything matching "{searchQuery}". Try checking your spelling or using more general terms.</p>
                        <button className="back-home-btn" onClick={() => navigate('/main')}>
                            Return to Store
                        </button>
                    </div>
                ) : (
                    <div className="search-results-grid">
                        {searchResults.map((phone, index) => (
                            <div 
                                key={phone._id} 
                                className="phone-card-modern"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div 
                                    className="image-wrapper" 
                                    onClick={() => handlePhoneClick(phone)}
                                >
                                    {phone.image_url ? (
                                        <img src={phone.image_url} alt={phone.name} />
                                    ) : (
                                        <div className="placeholder-img">No Image</div>
                                    )}
                                    {phone.inStock === false && (
                                        <div className="stock-tag out">Out of Stock</div>
                                    )}
                                    <div className="card-overlay">
                                        <span>View Details</span>
                                    </div>
                                </div>
                                <div className="card-details">
                                    <div className="brand-label">{phone.company}</div>
                                    <h3 className="product-name" onClick={() => handlePhoneClick(phone)}>{phone.name}</h3>
                                    <div className="price-tag">₹{phone.expected_price ? phone.expected_price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</div>
                                    <p className="product-excerpt">{phone.description}</p>
                                    
                                    <div className="card-actions">
                                        {phone.inStock !== false ? (
                                            <button
                                                className="cartBtn"
                                                onClick={() => handleAddToCart(phone)}
                                            >
                                                <svg className="cart" fill="white" viewBox="0 0 576 512" height="1em" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"></path>
                                                </svg>
                                                <span>ADD TO CART</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512" className="product">
                                                    <path d="M211.8 0c7.8 0 14.3 5.7 16.7 13.2C240.8 51.9 277.1 80 320 80s79.2-28.1 91.5-66.8C413.9 5.7 420.4 0 428.2 0h12.6c22.5 0 44.2 7.9 61.5 22.3L628.5 127.4c6.6 5.5 10.7 13.5 11.4 22.1s-2.1 17.1-7.8 23.6l-56 64c-11.4 13.1-31.2 14.6-44.6 3.5L480 197.7V448c0 35.3-28.7 64-64 64H224c-35.3 0-64-28.7-64-64V197.7l-51.5 42.9c-13.3 11.1-33.1 9.6-44.6-3.5l-56-64c-5.7-6.5-8.5-15-7.8-23.6s4.8-16.6 11.4-22.1L137.7 22.3C155 7.9 176.7 0 199.2 0h12.6z"></path>
                                                </svg>
                                            </button>
                                        ) : (
                                            <div className="stock-message">Currently Unavailable</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchPage;