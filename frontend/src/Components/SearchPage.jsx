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
                        <div className="no-results-icon" style={{fontSize: "1.2rem", fontWeight: 900, marginBottom: "1rem"}}>NO RESULTS</div>
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
                                                ADD TO CART
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