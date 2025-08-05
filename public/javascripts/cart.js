// Cart functionality
let cart = [];

// Initialize cart from localStorage
function initializeCart() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
      // Ensure cart is an array
      if (!Array.isArray(cart)) {
        cart = [];
      }
    } catch (e) {
      console.error('Error parsing cart from localStorage:', e);
      cart = [];
    }
  } else {
    cart = [];
  }
}

// Update cart count display
function updateCartCount() {
  const countElement = document.getElementById('cart-number-count');
  if (countElement) {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    countElement.textContent = totalItems;
  }
}

// Add item to cart
function addToCart(item_id) {
  if (typeof item_id === 'undefined' || isNaN(Number(item_id))) {
    console.error('Invalid item_id:', item_id);
    return;
  }

  // Find if item already exists in cart
  const existingItem = cart.find(item => item.item_id == item_id);
  
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 0) + 1;
  } else {
    cart.push({ item_id: item_id, quantity: 1 });
  }

  // Save to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update cart count
  updateCartCount();
  
  // Show success toast
  showToast('Item added to cart!', 'success');
  
  // Sync with backend
  syncCartWithBackend();
}

// Remove item from cart
function removeFromCart(item_id) {
  if (typeof item_id === 'undefined' || isNaN(Number(item_id))) {
    console.error('Invalid item_id:', item_id);
    return;
  }

  // Find item in cart
  const itemIndex = cart.findIndex(item => item.item_id == item_id);
  
  if (itemIndex !== -1) {
    if (cart[itemIndex].quantity > 1) {
      cart[itemIndex].quantity--;
    } else {
      cart.splice(itemIndex, 1);
    }
  }

  // Save to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update cart count
  updateCartCount();
  
  // Show success toast
  showToast('Item removed from cart!', 'success');
  
  // Sync with backend
  syncCartWithBackend();
}

// Sync cart with backend
function syncCartWithBackend() {
  fetch('/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart: cart })
  }).catch(error => {
    console.error('Error syncing cart:', error);
  });
}

// Clear cart completely
function clearCart() {
  cart = [];
  localStorage.removeItem('cart');
  updateCartCount();
  syncCartWithBackend();
}

// Force reset cart - called when user wants to start completely fresh
function resetCart() {
  cart = [];
  localStorage.removeItem('cart');
  updateCartCount();
  
  // Force server reset
  fetch('/reset-cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }).catch(error => {
    console.error('Error resetting cart:', error);
  });
}

// Show toast message
function showToast(message, type = 'info') {
  // Create toast element if it doesn't exist
  let toast = document.getElementById('cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
      color: ${type === 'success' ? '#155724' : '#721c24'};
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 10000;
      font-size: 14px;
      display: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.display = 'block';
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }, 2000);
}

// Open cart page
function openMyCart() {
  syncCartWithBackend();
  window.location.href = "/cart";
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Get server cart count from the page
  const countElement = document.getElementById('cart-number-count');
  const serverCartCount = countElement ? parseInt(countElement.textContent) || 0 : 0;
  
  // Initialize local cart
  initializeCart();
  
  // If server cart is empty, clear local cart completely
  if (serverCartCount === 0) {
    cart = [];
    localStorage.removeItem('cart');
    console.log('Server cart is empty - cleared local cart');
  } else {
    // If server has items, sync them to local storage
    if (cart.length === 0) {
      // Server has items but local cart is empty - this shouldn't happen
      // but we'll sync from server
      console.log('Server has items but local cart is empty - syncing from server');
    }
  }
  
  // Update cart count display
  updateCartCount();
  
  // Sync with server if we have items
  if (cart.length > 0) {
    syncCartWithBackend();
  }
});
