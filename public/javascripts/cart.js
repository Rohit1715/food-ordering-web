

// Use backend session as the single source of truth for cart
let cart = [];

// On homepage, fetch cart count from backend session (if available)
function updateCartCountFromBackend() {
  fetch('/cart', { method: 'GET' })
    .then(res => res.text())
    .then(html => {
      // Parse the returned HTML to get the cart count
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const countSpan = doc.getElementById('cart-number-count');
      if (countSpan && document.getElementById('cart-number-count')) {
        document.getElementById('cart-number-count').innerHTML = countSpan.innerHTML;
      }
      // Also update cart in-memory and localStorage from backend session
      const cartTable = doc.getElementById('mycart');
      if (cartTable) {
        // Parse cart items from table rows (if needed)
        // But better: fetch cart JSON from a new endpoint if possible
      }
    });
}

if (document.getElementById("cart-number-count")) {
  updateCartCountFromBackend();
}








function addToCart(item_id) {
  // Validate item_id is a valid number
  if (typeof item_id === 'undefined' || isNaN(Number(item_id))) {
    return;
  }
  // Always fetch latest cart from backend session before adding
  fetch('/cart', { method: 'GET' })
    .then(res => res.text())
    .then(html => {
      // Parse cart items from backend-rendered HTML
      // (Assume cart items are not available as JSON, so fallback to local cart)
      // If you add a /cart/json endpoint, you can fetch the real cart here
      // For now, just add the item as a new cart
      let newCart = [];
      // If cart is empty, start fresh
      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        newCart = [{ item_id: item_id, quantity: 1 }];
      } else {
        // Copy cart and add/increment item
        newCart = cart.slice();
        let found = newCart.find(item => item.item_id === item_id);
        if (found) {
          found.quantity++;
        } else {
          newCart.push({ item_id: item_id, quantity: 1 });
        }
      }
      cart = newCart;
      localStorage.setItem('cart', JSON.stringify(cart));
      fetch('/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart })
      }).then(() => {
        updateCartCountFromBackend();
      });
    });
}







function removeFromCart(item_id) {
  // Validate item_id is a valid number
  if (typeof item_id === 'undefined' || isNaN(Number(item_id))) {
    return;
  }
  // Always fetch latest cart from backend session before removing
  fetch('/cart', { method: 'GET' })
    .then(res => res.text())
    .then(html => {
      // Parse cart items from backend-rendered HTML
      // (Assume cart items are not available as JSON, so fallback to local cart)
      let newCart = cart.slice();
      let found = newCart.find(item => item.item_id === item_id);
      if (found) {
        found.quantity--;
        if (found.quantity <= 0) {
          newCart = newCart.filter(item => item.item_id !== item_id);
        }
      }
      cart = newCart;
      if (cart.length === 0) {
        localStorage.removeItem('cart');
        fetch('/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart: [] })
        }).then(() => {
          updateCartCountFromBackend();
        });
      } else {
        localStorage.setItem('cart', JSON.stringify(cart));
        fetch('/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart })
        }).then(() => {
          updateCartCountFromBackend();
        });
      }
    });
}




function openMyCart() {
  // Always fetch latest cart from backend session before opening cart page
  fetch('/cart', { method: 'GET' })
    .then(res => res.text())
    .then(html => {
      // Optionally update cart from backend if you parse it
      // For now, just always sync localStorage and backend before redirect
      fetch('/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart })
      }).then(() => {
        window.location.href = "/cart";
      }).catch(() => {
        window.location.href = "/cart";
      });
    });
}
