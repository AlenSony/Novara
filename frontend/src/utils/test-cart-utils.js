// Test script for cart utility functions
import { addToCart, getCart, removeFromCart, updateItemQuantity, calculateTotal, clearCart } from './cartUtils.js';

// Test function
function runCartTests() {
  console.log('Starting cart utility tests...');
  
  // Clear cart before tests
  clearCart();
  console.log('✓ Cart cleared');
  
  // Test 1: Add items to cart
  const item1 = {
    name: 'Test Laptop',
    company: 'Test Company',
    price: '1299.99',
    description: 'A test laptop',
    ram: '16GB',
    storage: '512GB SSD',
    image: 'https://via.placeholder.com/100'
  };
  
  const item2 = {
    name: 'Test Phone',
    company: 'Test Brand',
    price: '699.99',
    description: 'A test phone',
    ram: '8GB',
    storage: '256GB',
    image: 'https://via.placeholder.com/100'
  };
  
  const result1 = addToCart(item1);
  const result2 = addToCart(item2);
  
  console.log('✓ Items added to cart');
  console.log('  - First item result:', result1);
  console.log('  - Second item result:', result2);
  
  // Test 2: Get cart items
  const cart = getCart();
  console.log('✓ Cart retrieved');
  console.log('  - Number of items:', cart.length);
  console.log('  - Cart contents:', cart);
  
  // Test 3: Calculate total
  const total = calculateTotal(cart);
  console.log('✓ Total calculated');
  console.log('  - Total price:', total);
  
  // Test 4: Update quantity
  if (cart.length > 0) {
    const itemId = cart[0].id;
    const updateResult = updateItemQuantity(itemId, 1); // Increase quantity by 1
    console.log('✓ Quantity updated');
    console.log('  - Updated cart:', updateResult.cart);
    console.log('  - New total:', updateResult.total);
    
    // Test 5: Remove item
    const removeResult = removeFromCart(itemId);
    console.log('✓ Item removed');
    console.log('  - Cart after removal:', removeResult.cart);
    console.log('  - Total after removal:', removeResult.total);
  }
  
  // Test 6: Clear cart
  const emptyCart = clearCart();
  console.log('✓ Cart cleared');
  console.log('  - Empty cart:', emptyCart);
  console.log('Tests completed!');
}

// Run tests when script is executed
if (typeof window !== 'undefined') {
  // For browser environment
  document.addEventListener('DOMContentLoaded', runCartTests);
} else {
  // For Node.js environment
  console.log('This script is designed to run in a browser environment.');
  console.log('To test in Node.js, you would need to mock localStorage.');
}

export { runCartTests };