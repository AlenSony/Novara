
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../assets/Toast.jsx';
import { addToCart } from '../utils/cartUtils.js';

function CardComponent({ _id, name, company, price, description, ram, storage, image, stock, inStock }) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const handleCardClick = () => {
        // Navigate to item page with phone details as params
        navigate('/item', {
            state: {
                item: {
                    _id,
                    name,
                    company,
                    price,
                    image,
                    description,
                    ram,
                    storage,
                    stock,
                    inStock
                }
            }
        });
    };

    const isOutOfStock = inStock === false || (stock !== undefined && Number(stock) <= 0);

    const handleAddToCart = async (e) => {
        e.stopPropagation(); // Prevent triggering card click

        if (isAddingToCart || isOutOfStock) return;

        setIsAddingToCart(true);

        try {
            // Check if user is logged in
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('Please log in to add items to cart', 'error');
                navigate('/login');
                return;
            }

            // Prepare item data
            const itemData = {
                _id, // Use the _id parameter directly
                name,
                company,
                price,
                description,
                ram,
                storage,
                image
            };

            // Use the utility function to add to cart (now handles backend integration)
            const result = await addToCart(itemData);
            showToast(result.message, result.success ? 'success' : 'error');
        } catch (error) {
            console.error('Error adding to cart:', error);
            showToast('Failed to add item to cart. Please try again.', 'error');
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleBuyNow = async (e) => {
        //e.stopPropagation(); // Prevent triggering card click

        if (isOutOfStock) return;

        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please log in to continue', 'error');
            navigate('/login');
            return;
        }

        try {
            // First add to cart
            await handleAddToCart(e);
            // Then navigate to cart/checkout
            navigate('/cart');
        } catch (error) {
            console.error('Error processing purchase:', error);
            showToast('Failed to process purchase. Please try again.', 'error');
        }
    };

    return (
        <>
            <div className="brutalist-card" onClick={handleCardClick}>
                <div className="brutalist-card__media">
                    <img src={image} alt={name} />
                    {isOutOfStock && <div className="out_of_stock_overlay">Out of Stock</div>}
                </div>
                <div className="brutalist-card__header">
                    <h2>{name}</h2>
                    <p>{company}</p>
                </div>
                <div className="brutalist-card__message">
                    <p className="brutalist-card__price">₹{price}</p>
                    <p>{description || 'No description available'}</p>
                </div>
                <div className="brutalist-card__actions">
                    {!isOutOfStock ? (
                        <>
                            <div className="brutalist-card__action">
                                <button
                                    className="brutalist-card__button"
                                    onClick={handleAddToCart}
                                    data-product-id={_id}
                                    disabled={isAddingToCart}
                                >
                                    <svg className="cart" fill="white" viewBox="0 0 576 512" height="1em" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"></path>
                                    </svg>
                                    {isAddingToCart ? 'ADDING...' : 'ADD TO CART'}
                                </button>
                            </div>
                            <div className="brutalist-card__action">
                                <button
                                    className="brutalist-card__button brutalist-card__button--read"
                                    onClick={handleBuyNow}
                                    disabled={isOutOfStock}
                                >
                                    Buy Now
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="out_of_stock_message">Unavailable</div>
                    )}
                </div>
            </div>
        </>
    );
}

export default CardComponent;