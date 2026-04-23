'use strict';

/* ─────────────────────────────────────────────
   SUPABASE CONFIG
   ↓ Replace these two values with yours from supabase.com
   ───────────────────────────────────────────── */
var SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
var SUPABASE_KEY = 'YOUR_ANON_KEY';

/* ─────────────────────────────────────────────
   STATE
   ───────────────────────────────────────────── */

var cart = JSON.parse(localStorage.getItem('velourCart') || '[]');
var wishlist = JSON.parse(localStorage.getItem('velourWishlist') || '[]');
var notifTimer;

function saveCart() { localStorage.setItem('velourCart', JSON.stringify(cart)); }
function saveWishlist() { localStorage.setItem('velourWishlist', JSON.stringify(wishlist)); }


/* ─────────────────────────────────────────────
   CART PANEL — OPEN / CLOSE
   ───────────────────────────────────────────── */

function toggleCart() {
  var panel = document.getElementById('cartPanel');
  if (!panel) return;
  var isOpen = panel.classList.toggle('active');
  if (isOpen) {
    setTimeout(function () {
      document.addEventListener('click', closeCartOutside);
    }, 50);
  } else {
    document.removeEventListener('click', closeCartOutside);
  }
}

function closeCartOutside(e) {
  var panel = document.getElementById('cartPanel');
  if (panel && !panel.contains(e.target) && !e.target.closest('.cta')) {
    panel.classList.remove('active');
    document.removeEventListener('click', closeCartOutside);
  }
}


/* ─────────────────────────────────────────────
   CART — ADD / REMOVE / QUANTITY
   ───────────────────────────────────────────── */

function addToCart(name, price, category) {
  var existing = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].name === name) { existing = cart[i]; break; }
  }
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ name: name, price: price, category: category || 'general', qty: 1 });
  }
  saveCart();
  renderCart();
  showNotif('"' + name + '" added to cart ✓');
  animateCartButton();

  var allAddBtns = document.querySelectorAll('.add-btn');
  allAddBtns.forEach(function (btn) {
    if (btn.getAttribute('data-name') === name ||
      btn.closest('.product-card') &&
      (btn.closest('.product-card').querySelector('.product-name-txt') || {}).textContent === name) {
      var orig = btn.textContent;
      btn.textContent = 'Added ✓';
      btn.style.background = '#4caf50';
      setTimeout(function () { btn.textContent = orig; btn.style.background = ''; }, 1400);
    }
  });
}

function removeFromCart(name) {
  cart = cart.filter(function (i) { return i.name !== name; });
  saveCart();
  renderCart();
  showNotif('Item removed');
}

function changeQty(name, delta) {
  var item = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].name === name) { item = cart[i]; break; }
  }
  if (!item) return;
  item.qty = (item.qty || 1) + delta;
  if (item.qty <= 0) { removeFromCart(name); return; }
  saveCart();
  renderCart();
}

function clearCart() {
  if (cart.length === 0) { showNotif('Cart is already empty'); return; }
  if (!confirm('Clear all items from your cart?')) return;
  cart = [];
  saveCart();
  renderCart();
  showNotif('Cart cleared');
}


/* ─────────────────────────────────────────────
   CART — RENDER
   ───────────────────────────────────────────── */

function renderCart() {
  var itemsEl = document.getElementById('cartItems');
  var totalEl = document.getElementById('total');
  var countEl = document.getElementById('count');
  if (!itemsEl) return;

  var totalQty = cart.reduce(function (a, b) { return a + (b.qty || 1); }, 0);
  if (countEl) countEl.textContent = totalQty;

  if (cart.length === 0) {
    itemsEl.innerHTML =
      '<div style="text-align:center;padding:40px 0;">' +
      '<div style="font-size:2.5rem;margin-bottom:12px;">🛒</div>' +
      '<p class="cart-empty">Your cart is empty.</p>' +
      '<p style="font-size:12px;color:#bbb;margin-top:8px;">Add a fragrance to get started.</p>' +
      '</div>';
    if (totalEl) totalEl.textContent = '0 EGP';
    var oldClear = document.getElementById('clearCartBtn');
    if (oldClear) oldClear.remove();
    return;
  }

  var html = '';
  cart.forEach(function (item) {
    var safe = item.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    html +=
      '<div class="cart-item">' +
      '<div style="flex:1;min-width:0;">' +
      '<div class="cart-item-name">' + item.name + '</div>' +
      '<div class="cart-item-price">' + (item.price * (item.qty || 1)).toLocaleString() + ' EGP</div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">' +
      '<button class="qty-btn" onclick="changeQty(\'' + safe + '\',-1)">−</button>' +
      '<span style="font-size:14px;font-weight:500;min-width:20px;text-align:center;">' + (item.qty || 1) + '</span>' +
      '<button class="qty-btn" onclick="changeQty(\'' + safe + '\',1)">+</button>' +
      '</div>' +
      '</div>' +
      '<button class="cart-item-remove" onclick="removeFromCart(\'' + safe + '\')">✕</button>' +
      '</div>';
  });
  itemsEl.innerHTML = html;

  var sum = cart.reduce(function (a, b) { return a + b.price * (b.qty || 1); }, 0);
  if (totalEl) totalEl.textContent = sum.toLocaleString() + ' EGP';

  if (!document.getElementById('clearCartBtn')) {
    var clearBtn = document.createElement('button');
    clearBtn.id = 'clearCartBtn';
    clearBtn.textContent = 'Clear Cart';
    clearBtn.style.cssText =
      'width:100%;margin-top:10px;padding:10px;background:transparent;' +
      'border:1.5px solid #ddd;border-radius:20px;font-size:13px;color:#888;' +
      'cursor:pointer;font-family:Inter,sans-serif;transition:0.3s;';
    clearBtn.onmouseenter = function () { this.style.borderColor = '#e00'; this.style.color = '#e00'; };
    clearBtn.onmouseleave = function () { this.style.borderColor = '#ddd'; this.style.color = '#888'; };
    clearBtn.onclick = clearCart;
    var panel = document.getElementById('cartPanel');
    if (panel) panel.appendChild(clearBtn);
  }
}


/* ─────────────────────────────────────────────
   SUPABASE — SAVE ORDER
   ───────────────────────────────────────────── */

async function saveOrderToSupabase(orderData) {
  try {
    var response = await fetch(SUPABASE_URL + '/rest/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      var err = await response.text();
      console.error('Supabase error:', err);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Failed to save order:', e);
    return false;
  }
}


/* ─────────────────────────────────────────────
   CHECKOUT MODAL
   ───────────────────────────────────────────── */

function checkout() {
  if (cart.length === 0) { showNotif('Your cart is empty!'); return; }

  var cartPanel = document.getElementById('cartPanel');
  if (cartPanel) cartPanel.classList.remove('active');

  var modal = document.getElementById('checkoutModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'checkoutModal';
    document.body.appendChild(modal);
  }

  var total = cart.reduce(function (a, b) { return a + b.price * (b.qty || 1); }, 0);

  var itemsHTML = cart.map(function (item) {
    return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0ece6;font-size:13px;">' +
      '<span style="color:#2a2518;">' + item.name + ' <span style="color:#b0a898;">×' + (item.qty || 1) + '</span></span>' +
      '<span style="color:#8a7440;font-weight:500;">' + (item.price * (item.qty || 1)).toLocaleString() + ' EGP</span>' +
      '</div>';
  }).join('');

  modal.innerHTML =
    '<div class="checkout-overlay" onclick="closeCheckout(event)">' +
    '<div class="checkout-box" onclick="event.stopPropagation()">' +
    '<button onclick="closeCheckout()" class="checkout-close-btn">✕</button>' +
    '<div style="text-align:center;margin-bottom:24px;">' +
    '<p style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8a7440;margin-bottom:6px;">Checkout</p>' +
    '<h3 style="font-family:\'Playfair Display\',serif;font-size:26px;color:#2a2518;">Complete Your Order</h3>' +
    '</div>' +
    '<div class="checkout-summary">' +
    '<p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b0a898;margin-bottom:10px;">Order Summary</p>' +
    itemsHTML +
    '<div style="display:flex;justify-content:space-between;padding:14px 0 0;margin-top:6px;font-weight:600;font-size:16px;color:#2a2518;">' +
    '<span>Total</span>' +
    '<span style="color:#8a7440;">' + total.toLocaleString() + ' EGP</span>' +
    '</div>' +
    '</div>' +
    '<form id="checkoutForm" onsubmit="submitCheckout(event)" autocomplete="on">' +
    '<p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b0a898;margin-bottom:14px;">Your Details</p>' +
    '<div class="checkout-field">' +
    '<label for="coName">Full Name *</label>' +
    '<input type="text" id="coName" placeholder="e.g. Ahmed Mohamed" required autocomplete="name" />' +
    '</div>' +
    '<div class="checkout-field">' +
    '<label for="coPhone">Phone Number *</label>' +
    '<input type="tel" id="coPhone" placeholder="e.g. 01012345678" required autocomplete="tel" />' +
    '</div>' +
    '<div class="checkout-field">' +
    '<label for="coAddress">Address *</label>' +
    '<input type="text" id="coAddress" placeholder="Street, building, floor, apartment" required autocomplete="street-address" />' +
    '</div>' +
    '<div class="checkout-row">' +
    '<div class="checkout-field" style="flex:1;">' +
    '<label for="coCity">City *</label>' +
    '<input type="text" id="coCity" placeholder="e.g. Cairo" required autocomplete="address-level2" />' +
    '</div>' +
    '<div class="checkout-field" style="flex:1;">' +
    '<label for="coZip">Zip Code</label>' +
    '<input type="text" id="coZip" placeholder="Optional" autocomplete="postal-code" />' +
    '</div>' +
    '</div>' +
    '<div class="checkout-field">' +
    '<label for="coNotes">Order Notes</label>' +
    '<textarea id="coNotes" placeholder="Any special instructions…" rows="3"></textarea>' +
    '</div>' +
    '<button type="submit" class="checkout-submit-btn">Place Order — ' + total.toLocaleString() + ' EGP →</button>' +
    '</form>' +
    '</div>' +
    '</div>';

  if (!document.getElementById('checkoutStyles')) {
    var s = document.createElement('style');
    s.id = 'checkoutStyles';
    s.textContent =
      '.checkout-overlay{position:fixed;inset:0;z-index:5000;display:flex;align-items:center;' +
      'justify-content:center;background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);' +
      'animation:coFadeIn 0.3s ease;}' +
      '.checkout-box{background:#faf8f4;border-radius:24px;padding:36px 32px;max-width:520px;width:92%;' +
      'max-height:90vh;overflow-y:auto;position:relative;' +
      'box-shadow:0 24px 80px rgba(0,0,0,0.18);animation:coSlideUp 0.4s ease;}' +
      '.checkout-close-btn{position:absolute;top:16px;right:16px;background:none;border:none;' +
      'font-size:20px;cursor:pointer;color:#b0a898;transition:0.2s;z-index:10;}' +
      '.checkout-close-btn:hover{color:#333;}' +
      '.checkout-summary{background:rgba(255,255,255,0.7);border:1px solid rgba(138,116,64,0.08);' +
      'border-radius:16px;padding:18px 20px;margin-bottom:28px;}' +
      '.checkout-field{margin-bottom:16px;}' +
      '.checkout-field label{display:block;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;' +
      'color:#8a8070;margin-bottom:6px;font-family:Inter,sans-serif;}' +
      '.checkout-field input,.checkout-field textarea{width:100%;padding:12px 16px;border:1.5px solid rgba(138,116,64,0.15);' +
      'border-radius:12px;font-size:14px;font-family:Inter,sans-serif;background:#fff;color:#2a2518;' +
      'transition:border-color 0.3s,box-shadow 0.3s;outline:none;resize:vertical;}' +
      '.checkout-field input:focus,.checkout-field textarea:focus{border-color:#8a7440;' +
      'box-shadow:0 0 0 3px rgba(138,116,64,0.1);}' +
      '.checkout-field input::placeholder,.checkout-field textarea::placeholder{color:#ccc;}' +
      '.checkout-row{display:flex;gap:14px;}' +
      '.checkout-submit-btn{width:100%;padding:16px;background:#3d3528;color:#e8dcc8;border:none;' +
      'border-radius:25px;font-size:15px;font-weight:500;cursor:pointer;font-family:Inter,sans-serif;' +
      'transition:0.3s;margin-top:8px;letter-spacing:0.3px;}' +
      '.checkout-submit-btn:hover{background:#524a38;transform:scale(1.02);}' +
      '.checkout-submit-btn:disabled{background:#aaa;cursor:not-allowed;transform:none;}' +
      '@keyframes coFadeIn{from{opacity:0;}to{opacity:1;}}' +
      '@keyframes coSlideUp{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}';
    document.head.appendChild(s);
  }

  document.body.style.overflow = 'hidden';
}


function closeCheckout(e) {
  if (e && e.target && !e.target.classList.contains('checkout-overlay')) return;
  var modal = document.getElementById('checkoutModal');
  if (modal) modal.innerHTML = '';
  document.body.style.overflow = '';
}
window.closeCheckout = closeCheckout;


async function submitCheckout(e) {
  e.preventDefault();

  var name = document.getElementById('coName').value.trim();
  var phone = document.getElementById('coPhone').value.trim();
  var address = document.getElementById('coAddress').value.trim();
  var city = document.getElementById('coCity').value.trim();
  var zip = document.getElementById('coZip').value.trim();
  var notes = document.getElementById('coNotes').value.trim();

  if (!name || !phone || !address || !city) {
    showNotif('Please fill in all required fields');
    return;
  }

  var phoneRe = /^[0-9+\-\s()]{8,}$/;
  if (!phoneRe.test(phone)) {
    showNotif('Please enter a valid phone number');
    document.getElementById('coPhone').focus();
    return;
  }

  /* disable button while saving */
  var submitBtn = document.querySelector('.checkout-submit-btn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Placing order…'; }

  var total = cart.reduce(function (a, b) { return a + b.price * (b.qty || 1); }, 0);
  var orderId = 'ARX-' + Date.now().toString(36).toUpperCase();

  /* ── Save to Supabase ── */
  var saved = await saveOrderToSupabase({
    order_id: orderId,
    customer_name: name,
    phone: phone,
    address: address,
    city: city,
    zip: zip,
    notes: notes,
    items: JSON.stringify(cart.map(function (i) { return { name: i.name, qty: i.qty || 1, price: i.price }; })),
    total: total
  });

  /* also keep a local backup */
  var orders = JSON.parse(localStorage.getItem('aromixOrders') || '[]');
  orders.push({ id: orderId, customer: { name, phone, address, city, zip, notes }, items: cart, total });
  localStorage.setItem('aromixOrders', JSON.stringify(orders));

  if (!saved) {
    /* still show success to customer — order is saved locally */
    console.warn('Supabase save failed — order stored locally only.');
  }

  /* show success screen */
  var modal = document.getElementById('checkoutModal');
  modal.innerHTML =
    '<div class="checkout-overlay">' +
    '<div class="checkout-box" style="text-align:center;padding:50px 36px;">' +
    '<div style="font-size:56px;margin-bottom:16px;animation:coSlideUp 0.5s ease;">🎉</div>' +
    '<h3 style="font-family:\'Playfair Display\',serif;font-size:28px;color:#2a2518;margin-bottom:10px;">Order Confirmed!</h3>' +
    '<p style="color:#8a8070;font-size:14px;line-height:1.7;margin-bottom:8px;">Thank you, <strong style="color:#2a2518;">' + name + '</strong>!</p>' +
    '<p style="color:#8a8070;font-size:14px;line-height:1.7;margin-bottom:24px;">Your order <strong style="color:#8a7440;">' + orderId + '</strong> has been placed. We\'ll contact you at <strong style="color:#2a2518;">' + phone + '</strong> to confirm delivery.</p>' +
    '<div style="background:rgba(138,116,64,0.06);border-radius:12px;padding:16px 20px;margin-bottom:28px;text-align:left;">' +
    '<p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b0a898;margin-bottom:8px;">Delivery To</p>' +
    '<p style="font-size:14px;color:#2a2518;line-height:1.6;">' + address + ', ' + city + (zip ? ' ' + zip : '') + '</p>' +
    (notes ? '<p style="font-size:12px;color:#8a8070;margin-top:6px;font-style:italic;">Note: ' + notes + '</p>' : '') +
    '</div>' +
    '<button onclick="closeCheckout();document.getElementById(\'checkoutModal\').innerHTML=\'\';" ' +
    'style="padding:14px 36px;background:#3d3528;color:#e8dcc8;border:none;border-radius:25px;' +
    'font-size:14px;font-weight:500;cursor:pointer;font-family:Inter,sans-serif;transition:0.3s;"' +
    ' onmouseover="this.style.background=\'#524a38\'" onmouseout="this.style.background=\'#3d3528\'">Continue Shopping →</button>' +
    '</div>' +
    '</div>';

  cart = [];
  saveCart();
  renderCart();
  confettiPop();
}
window.submitCheckout = submitCheckout;


/* ─────────────────────────────────────────────
   WISHLIST
   ───────────────────────────────────────────── */

function isWishlisted(name) {
  return wishlist.some(function (i) { return i.name === name; });
}

function toggleWishlist(name, price, category, btn) {
  var idx = -1;
  for (var i = 0; i < wishlist.length; i++) {
    if (wishlist[i].name === name) { idx = i; break; }
  }
  if (idx > -1) {
    wishlist.splice(idx, 1);
    if (btn) { btn.innerHTML = '♡'; btn.style.color = '#888'; }
    showNotif('Removed from wishlist');
  } else {
    wishlist.push({ name: name, price: price, category: category });
    if (btn) { btn.innerHTML = '♥'; btn.style.color = '#e05'; }
    showNotif('"' + name + '" added to wishlist ♥');
  }
  saveWishlist();
}

function injectWishlistButtons() {
  document.querySelectorAll('.product-card').forEach(function (card) {
    if (card.querySelector('.wish-btn')) return;
    var nameEl = card.querySelector('.product-name-txt');
    var priceEl = card.querySelector('.price');
    if (!nameEl || !priceEl) return;

    var name = nameEl.textContent.trim();
    var price = parseInt(priceEl.textContent.replace(/[^0-9]/g, '')) || 0;
    var category = card.dataset.category || 'general';

    var wish = document.createElement('button');
    wish.className = 'wish-btn';
    wish.title = 'Wishlist';
    wish.innerHTML = isWishlisted(name) ? '♥' : '♡';
    wish.style.cssText =
      'position:absolute;top:12px;right:12px;' +
      'background:rgba(255,255,255,0.92);border:none;border-radius:50%;' +
      'width:34px;height:34px;font-size:16px;cursor:pointer;transition:0.3s;' +
      'display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 2px 10px rgba(0,0,0,0.1);z-index:10;' +
      'color:' + (isWishlisted(name) ? '#e05' : '#888') + ';';

    wish.onclick = function (e) {
      e.stopPropagation();
      toggleWishlist(name, price, category, wish);
    };
    card.appendChild(wish);
  });
}


/* ─────────────────────────────────────────────
   NOTIFICATION TOAST
   ───────────────────────────────────────────── */

function showNotif(msg) {
  var n = document.getElementById('notif');
  if (!n) return;
  n.textContent = msg;
  n.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(function () { n.classList.remove('show'); }, 2800);
}


/* ─────────────────────────────────────────────
   CART BUTTON PULSE
   ───────────────────────────────────────────── */

function animateCartButton() {
  var btn = document.querySelector('.cta');
  if (!btn) return;
  btn.style.transform = 'scale(1.18)';
  btn.style.transition = 'transform 0.15s ease';
  setTimeout(function () { btn.style.transform = 'scale(1)'; }, 220);
}


/* ─────────────────────────────────────────────
   CONFETTI
   ───────────────────────────────────────────── */

function confettiPop() {
  var canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var colors = ['#c9a96e', '#e8d5b7', '#111', '#b0506a', '#90d8a0', '#7aa8c8'];
  var pieces = [];
  for (var i = 0; i < 90; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -10,
      w: Math.random() * 8 + 4,
      h: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: Math.random() * 3 + 2,
      vx: (Math.random() - 0.5) * 2,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 6
    });
  }

  var frame;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var alive = false;
    pieces.forEach(function (p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      p.x += p.vx; p.y += p.vy; p.rot += p.vrot; p.vy += 0.05;
      if (p.y < canvas.height) alive = true;
    });
    if (alive) { frame = requestAnimationFrame(draw); }
    else { cancelAnimationFrame(frame); canvas.remove(); }
  }
  draw();
  setTimeout(function () { cancelAnimationFrame(frame); if (canvas.parentNode) canvas.remove(); }, 4000);
}


/* ─────────────────────────────────────────────
   NEWSLETTER
   ───────────────────────────────────────────── */

function subscribe(inputId) {
  var input = document.getElementById(inputId || 'nlEmail');
  if (!input) return;
  var val = input.value.trim();
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!val || !emailRe.test(val)) {
    input.style.outline = '2px solid #e00';
    input.placeholder = 'Please enter a valid email';
    setTimeout(function () {
      input.style.outline = '';
      input.placeholder = 'Your email address';
    }, 2000);
    return;
  }

  var saved = JSON.parse(localStorage.getItem('velourSubscribers') || '[]');
  if (saved.indexOf(val) > -1) {
    showNotif("You're already subscribed! 🎉");
    input.value = '';
    return;
  }
  saved.push(val);
  localStorage.setItem('velourSubscribers', JSON.stringify(saved));

  input.value = '';
  input.placeholder = '✦ Welcome to the Inner Circle!';
  input.disabled = true;
  input.style.outline = '2px solid #4caf50';
  var btn = input.nextElementSibling;
  if (btn) { btn.textContent = '✓ Done'; btn.disabled = true; btn.style.background = '#4caf50'; }
  showNotif('Subscribed! Welcome 🎉');
}


/* ─────────────────────────────────────────────
   PRODUCT FILTER
   ───────────────────────────────────────────── */

function filterProducts(category) {
  document.querySelectorAll('.filter-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.filter === category);
  });

  document.querySelectorAll('.product-card[data-category]').forEach(function (card) {
    var match = category === 'all' || card.dataset.category === category;
    if (match) {
      card.style.display = '';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    } else {
      card.style.opacity = '0';
      setTimeout(function () { card.style.display = 'none'; }, 260);
    }
  });
}


/* ─────────────────────────────────────────────
   TESTIMONIALS
   ───────────────────────────────────────────── */

var testimonials = [
  { q: "\u201CVELOUR\u2019s Midnight Oud is the only fragrance I\u2019ve worn for three years. It\u2019s not a perfume \u2014 it\u2019s a second skin.\u201D", a: '\u2014 Isabelle M., Paris' },
  { q: '\u201CRose Velvet is poetry in a bottle. I\u2019ve never received so many compliments from a single fragrance in my life.\u201D', a: '\u2014 Camille T., London' },
  { q: '\u201CThe Atelier experience at VELOUR changed how I think about scent. Pure artistry, beginning to end.\u201D', a: '\u2014 Marcus R., New York' }
];
var tActive = 0;
var tInterval = null;

function switchT(i) {
  tActive = i;
  var q = document.getElementById('tQuote');
  var a = document.getElementById('tAuthor');
  if (!q || !a) return;

  q.style.opacity = '0';
  q.style.transform = 'translateY(10px)';
  a.style.opacity = '0';

  setTimeout(function () {
    q.textContent = testimonials[i].q;
    a.textContent = testimonials[i].a;
    q.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    a.style.transition = 'opacity 0.5s ease';
    q.style.opacity = '1';
    q.style.transform = 'translateY(0)';
    a.style.opacity = '1';
  }, 300);

  document.querySelectorAll('.t-dot').forEach(function (d, idx) {
    d.classList.toggle('active', idx === i);
  });

  clearInterval(tInterval);
  tInterval = setInterval(function () { switchT((tActive + 1) % testimonials.length); }, 5000);
}

function startTestimonialRotation() {
  if (!document.getElementById('tQuote')) return;
  tInterval = setInterval(function () { switchT((tActive + 1) % testimonials.length); }, 5000);
}


/* ─────────────────────────────────────────────
   SCENT QUIZ
   ───────────────────────────────────────────── */

var moodMap = {
  energetic: { title: '✨ Bergamot Libre', text: 'Your energy calls for bright citrus and cedar. Bergamot Libre was made for moments of momentum — sharp, radiant, alive.', name: 'Bergamot Libre', price: 1050 },
  calm: { title: '🍃 Thé Vert', text: 'Japanese green tea and violet leaf will ground you. Thé Vert is your meditative companion through quiet mornings.', name: 'Thé Vert', price: 1100 },
  mysterious: { title: '🌙 Nuit Violette', text: 'Violet, incense and dark musk match your depth. Nuit Violette is as enigmatic as you are — impossible to ignore.', name: 'Nuit Violette', price: 1250 },
  romantic: { title: "🌹 Bois d'Or", text: "Warm amber and palo santo wrap you like a memory. Bois d'Or is pure golden intimacy — sensual, enveloping, unforgettable.", name: "Bois d'Or", price: 1380 }
};

function selectMood(el, mood) {
  document.querySelectorAll('.quiz-card').forEach(function (c) { c.classList.remove('selected'); });
  el.classList.add('selected');

  var data = moodMap[mood];
  var result = document.getElementById('quizResult');
  var title = document.getElementById('quizResultTitle');
  var text = document.getElementById('quizResultText');
  if (!result || !title || !text) return;

  title.textContent = data.title;
  text.textContent = data.text;
  result.style.display = 'block';

  var qBtn = document.getElementById('quizAddBtn');
  if (!qBtn) {
    qBtn = document.createElement('button');
    qBtn.id = 'quizAddBtn';
    qBtn.style.cssText =
      'margin-top:16px;padding:10px 24px;background:white;color:#111;' +
      'border:none;border-radius:20px;font-size:13px;cursor:pointer;' +
      'font-family:Inter,sans-serif;transition:0.3s;';
    qBtn.onmouseenter = function () { this.style.background = '#eee'; };
    qBtn.onmouseleave = function () { this.style.background = 'white'; };
    result.appendChild(qBtn);
  }
  qBtn.textContent = 'Add ' + data.name + ' to Cart →';
  qBtn.onclick = function () { addToCart(data.name, data.price, 'unisex'); };

  setTimeout(function () {
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 120);
}


/* ─────────────────────────────────────────────
   SCROLL ANIMATIONS
   ───────────────────────────────────────────── */

function initScrollAnimations() {
  if (!document.getElementById('velourAnimStyles')) {
    var s = document.createElement('style');
    s.id = 'velourAnimStyles';
    s.textContent =
      '.anim-hidden{opacity:0;transform:translateY(28px);transition:opacity 0.6s ease,transform 0.6s ease;}' +
      '.anim-visible{opacity:1!important;transform:translateY(0)!important;}' +
      '.qty-btn{width:28px;height:28px;border-radius:50%;border:1.5px solid #ddd;background:transparent;' +
      'font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;' +
      'transition:0.2s;font-family:Inter,sans-serif;}' +
      '.qty-btn:hover{background:#f0f0f0;}';
    document.head.appendChild(s);
  }

  var targets = document.querySelectorAll(
    '.card, .section > h3, .page-hero-left, .section-banner, .banner-stat'
  );

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('anim-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('anim-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  targets.forEach(function (el) {
    var rect = el.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.95) {
      el.classList.add('anim-hidden');
    } else {
      el.classList.add('anim-visible');
    }
    observer.observe(el);
  });
}


/* ─────────────────────────────────────────────
   STICKY NAV SHADOW
   ───────────────────────────────────────────── */

function initNavScroll() {
  var nav = document.querySelector('nav');
  if (!nav) return;
  window.addEventListener('scroll', function () {
    if (window.scrollY > 60) {
      nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
      nav.style.background = 'rgba(255,255,255,0.96)';
    } else {
      nav.style.boxShadow = 'none';
      nav.style.background = 'rgba(255,255,255,0.75)';
    }
  });
}


/* ─────────────────────────────────────────────
   MOBILE MENU
   ───────────────────────────────────────────── */

function initMobileMenu() {
  var nav = document.querySelector('nav');
  if (!nav) return;

  var hamburger = document.createElement('button');
  hamburger.id = 'hamburger';
  hamburger.setAttribute('aria-label', 'Toggle menu');
  hamburger.innerHTML = '<span></span><span></span><span></span>';
  hamburger.style.cssText =
    'display:none;flex-direction:column;gap:5px;background:none;border:none;' +
    'cursor:pointer;padding:4px;z-index:1100;';
  hamburger.querySelectorAll('span').forEach(function (s) {
    s.style.cssText =
      'display:block;width:22px;height:2px;background:#222;' +
      'border-radius:2px;transition:0.3s;pointer-events:none;';
  });
  nav.appendChild(hamburger);

  var drawer = document.createElement('div');
  drawer.id = 'mobileDrawer';
  drawer.style.cssText =
    'position:fixed;top:0;left:-110%;width:75%;max-width:300px;height:100%;' +
    'background:white;z-index:1050;padding:80px 30px 30px;' +
    'transition:left 0.4s cubic-bezier(0.25,0.46,0.45,0.94);' +
    'box-shadow:4px 0 30px rgba(0,0,0,0.12);';

  var navLinks = nav.querySelector('.nav-links');

  var brandDiv = document.createElement('div');
  brandDiv.style.cssText = "margin-bottom:28px;";
  brandDiv.innerHTML =
    '<div style="font-family:\'Playfair Display\',serif;font-size:18px;letter-spacing:3px;margin-bottom:20px;color:#2a2518;">AROMIX</div>' +
    '<a href="index.html" style="display:block;padding:14px 0;font-size:15px;color:#222;text-decoration:none;border-bottom:1px solid #f0f0f0;font-family:Inter,sans-serif;">Home</a>' +
    '<a href="women.html" style="display:block;padding:14px 0;font-size:15px;color:#222;text-decoration:none;border-bottom:1px solid #f0f0f0;font-family:Inter,sans-serif;">Women</a>' +
    '<a href="men.html" style="display:block;padding:14px 0;font-size:15px;color:#222;text-decoration:none;border-bottom:1px solid #f0f0f0;font-family:Inter,sans-serif;">Men</a>' +
    '<a href="unisex.html" style="display:block;padding:14px 0;font-size:15px;color:#222;text-decoration:none;border-bottom:1px solid #f0f0f0;font-family:Inter,sans-serif;">Unisex</a>';

  var closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText =
    'position:absolute;top:20px;right:20px;background:none;border:none;' +
    'font-size:20px;cursor:pointer;color:#888;';
  closeBtn.onclick = closeMobileMenu;

  drawer.appendChild(closeBtn);
  drawer.appendChild(brandDiv);

  var overlay = document.createElement('div');
  overlay.id = 'menuOverlay';
  overlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:1040;display:none;';
  overlay.onclick = closeMobileMenu;

  document.body.appendChild(drawer);
  document.body.appendChild(overlay);

  hamburger.onclick = function () {
    drawer.style.left = '0';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    var spans = hamburger.querySelectorAll('span');
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  };

  function closeMobileMenu() {
    drawer.style.left = '-110%';
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    var spans = hamburger.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity = '1';
    spans[2].style.transform = '';
  }
  window.closeMobileMenu = closeMobileMenu;

  function checkViewport() {
    var mobile = window.innerWidth <= 900;
    hamburger.style.display = mobile ? 'flex' : 'none';
    if (navLinks) navLinks.style.display = mobile ? 'none' : 'flex';
    if (!mobile) closeMobileMenu();
  }
  checkViewport();
  window.addEventListener('resize', checkViewport);
}


/* ─────────────────────────────────────────────
   SCROLL TO SECTION
   ───────────────────────────────────────────── */

function scrollToSection(id) {
  var el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.closeMobileMenu) window.closeMobileMenu();
  }
}


/* ─────────────────────────────────────────────
   SMOOTH ANCHOR SCROLL
   ───────────────────────────────────────────── */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (window.closeMobileMenu) window.closeMobileMenu();
      }
    });
  });
}


/* ─────────────────────────────────────────────
   QUICK VIEW MODAL
   ───────────────────────────────────────────── */

function openQuickView(data) {
  /* ── inject styles once ── */
  if (!document.getElementById('qvStyles')) {
    var s = document.createElement('style');
    s.id = 'qvStyles';
    s.textContent =
      '#quickViewModal{position:fixed;inset:0;z-index:4000;display:none;align-items:center;' +
      'justify-content:center;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);padding:16px;}' +
      '.qv-box{background:#fff;border-radius:20px;max-width:860px;width:100%;' +
      'display:grid;grid-template-columns:1fr 1fr;overflow:hidden;position:relative;' +
      'box-shadow:0 32px 100px rgba(0,0,0,0.22);animation:qvSlide 0.35s ease;max-height:92vh;}' +
      '@keyframes qvSlide{from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:translateY(0);}}' +
      '.qv-img-col{position:relative;background:#f5ede0;display:flex;align-items:center;' +
      'justify-content:center;overflow:hidden;min-height:420px;}' +
      '.qv-img-col img{width:100%;height:100%;object-fit:cover;object-position:center 30%;}' +
      '.qv-arrow{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.85);' +
      'border:none;border-radius:50%;width:38px;height:38px;font-size:16px;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 2px 12px rgba(0,0,0,0.12);transition:0.2s;z-index:5;color:#333;}' +
      '.qv-arrow:hover{background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.18);}' +
      '.qv-arrow.prev{left:12px;}.qv-arrow.next{right:12px;}' +
      '.qv-info-col{padding:36px 32px;overflow-y:auto;display:flex;flex-direction:column;gap:0;}' +
      '.qv-close{position:absolute;top:14px;right:14px;background:rgba(0,0,0,0.08);border:none;' +
      'border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;color:#555;' +
      'display:flex;align-items:center;justify-content:center;transition:0.2s;z-index:10;}' +
      '.qv-close:hover{background:rgba(0,0,0,0.18);color:#000;}' +
      '.qv-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#b0a898;margin-bottom:8px;}' +
      '.qv-name{font-family:"Playfair Display",serif;font-size:22px;line-height:1.3;color:#2a2518;margin-bottom:8px;}' +
      '.qv-price{font-size:26px;font-weight:700;color:#8a7440;margin-bottom:12px;}' +
      '.qv-divider{border:none;border-top:1px solid #f0ece6;margin:14px 0;}' +
      '.qv-qty-row{display:flex;align-items:center;gap:12px;margin-bottom:14px;}' +
      '.qv-qty-box{display:flex;align-items:center;border:1.5px solid #ddd;border-radius:8px;overflow:hidden;}' +
      '.qv-qty-btn{width:36px;height:40px;background:none;border:none;font-size:18px;' +
      'cursor:pointer;color:#333;transition:0.2s;font-family:Inter,sans-serif;}' +
      '.qv-qty-btn:hover{background:#f5f5f5;}' +
      '.qv-qty-val{width:40px;text-align:center;font-size:15px;font-weight:500;color:#2a2518;' +
      'border-left:1.5px solid #ddd;border-right:1.5px solid #ddd;height:40px;' +
      'display:flex;align-items:center;justify-content:center;}' +
      '.qv-add-row{display:flex;gap:10px;margin-bottom:10px;}' +
      '.qv-add-btn{flex:1;padding:13px;background:#bbb;color:#fff;border:none;' +
      'border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;' +
      'font-family:Inter,sans-serif;transition:0.3s;letter-spacing:0.3px;}' +
      '.qv-add-btn:hover{background:#999;}' +
      '.qv-add-btn.ready{background:#3d3528;}.qv-add-btn.ready:hover{background:#524a38;}' +
      '.qv-wish-btn{width:46px;height:46px;flex-shrink:0;background:none;' +
      'border:1.5px solid #ddd;border-radius:8px;font-size:20px;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;transition:0.2s;}' +
      '.qv-wish-btn:hover{border-color:#e05;color:#e05;}' +
      '.qv-ask{font-size:14px;font-weight:600;color:#2a2518;margin-bottom:14px;cursor:pointer;}' +
      '.qv-meta{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;}' +
      '.qv-meta span{font-size:13px;color:#8a7440;}' +
      '@media(max-width:680px){.qv-box{grid-template-columns:1fr;max-height:95vh;}' +
      '.qv-img-col{min-height:260px;max-height:280px;}' +
      '.qv-info-col{padding:22px 20px;}}';
    document.head.appendChild(s);
  }

  /* ── build or reuse modal shell ── */
  var modal = document.getElementById('quickViewModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quickViewModal';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeQuickView();
    });
  }

  var qty = 1;

  /* ── description ── */
  var fullDesc = data.desc || 'A signature Aromix fragrance.';

  /* ── category / stock labels ── */
  var catLabel = (data.category && data.category !== 'general') ? data.category : '';
  var stockLine = '<span>In stock</span>';
  var catLine = catLabel ? '<span>' + catLabel.charAt(0).toUpperCase() + catLabel.slice(1) + '</span>' : '';
  var descLine = data.label ? '<span>' + data.label + '</span>' : '';

  modal.innerHTML =
    '<div class="qv-box">' +
    /* LEFT col */
    '<div class="qv-img-col">' +
    (data.imgSrc ? '<img id="qvImg" src="' + data.imgSrc + '" alt="' + data.name + '">' : '') +
    '<button class="qv-arrow prev" id="qvPrev" aria-label="Previous image">‹</button>' +
    '<button class="qv-arrow next" id="qvNext" aria-label="Next image">›</button>' +
    '</div>' +
    /* RIGHT col */
    '<div class="qv-info-col">' +
    '<p class="qv-label" id="qvLabel">' + (data.label || 'Eau de Parfum') + '</p>' +
    '<h3 class="qv-name" id="qvName">' + (data.name || '') + '</h3>' +
    '<p class="qv-price" id="qvPrice">' + (data.priceRaw || '') + '</p>' +
    '<p id="qvDesc" style="font-size:13px;color:#666;line-height:1.7;margin-bottom:14px;">' + fullDesc + '</p>' +
    '<hr class="qv-divider">' +
    '<div class="qv-qty-row">' +
    '<div class="qv-qty-box">' +
    '<button class="qv-qty-btn" id="qvMinus">−</button>' +
    '<div class="qv-qty-val" id="qvQtyVal">1</div>' +
    '<button class="qv-qty-btn" id="qvPlus">+</button>' +
    '</div>' +
    '</div>' +
    '<div class="qv-add-row">' +
    '<button class="qv-add-btn ready" id="qvAddBtn">ADD TO CART</button>' +
    '<button class="qv-wish-btn" id="qvWishBtn" aria-label="Wishlist">♡</button>' +
    '</div>' +
    '<hr class="qv-divider">' +
    '<p class="qv-ask">Ask a Question</p>' +
    '<div class="qv-meta">' +
    stockLine + catLine + descLine +
    '</div>' +
    '</div>' +
    /* close btn */
    '<button class="qv-close" id="qvClose" onclick="closeQuickView()" aria-label="Close">✕</button>' +
    '</div>';

  /* ── wire up qty ── */
  document.getElementById('qvMinus').onclick = function () {
    if (qty > 1) { qty--; document.getElementById('qvQtyVal').textContent = qty; }
  };
  document.getElementById('qvPlus').onclick = function () {
    qty++;
    document.getElementById('qvQtyVal').textContent = qty;
  };



  /* ── Add to Cart ── */
  var addBtn = document.getElementById('qvAddBtn');
  addBtn.onclick = function () {
    for (var i = 0; i < qty; i++) addToCart(data.name, data.price, data.category);
    addBtn.textContent = 'ADDED ✓';
    addBtn.style.background = '#4caf50';
    setTimeout(function () { addBtn.textContent = 'ADD TO CART'; addBtn.style.background = ''; addBtn.classList.add('ready'); }, 1600);
  };

  /* ── Wishlist ── */
  var wishBtn = document.getElementById('qvWishBtn');
  wishBtn.innerHTML = isWishlisted(data.name) ? '♥' : '♡';
  wishBtn.style.color = isWishlisted(data.name) ? '#e05' : '#888';
  wishBtn.onclick = function () { toggleWishlist(data.name, data.price, data.category, wishBtn); };



  /* ── arrows (stub — single image for now) ── */
  document.getElementById('qvPrev').onclick = function () { showNotif('No previous image'); };
  document.getElementById('qvNext').onclick = function () { showNotif('No next image'); };

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  var modal = document.getElementById('quickViewModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}
window.closeQuickView = closeQuickView;

function initQuickView() {
  document.querySelectorAll('.product-card').forEach(function (card) {
    var visual = card.querySelector('.product-visual');
    if (!visual || card.querySelector('.quick-view-btn')) return;

    var name = (card.querySelector('.product-name-txt') || {}).textContent || '';
    var label = (card.querySelector('.product-label') || {}).textContent || '';
    var desc = (card.querySelector('.product-desc') || {}).textContent || '';
    var priceEl = card.querySelector('.price');
    var priceRaw = priceEl ? priceEl.textContent.trim() : '';
    var price = parseInt(priceRaw.replace(/[^0-9]/g, '')) || 0;
    var category = card.dataset.category || 'general';
    var imgEl = card.querySelector('.product-img');
    var imgSrc = imgEl ? imgEl.getAttribute('src') : '';

    name = name.trim(); label = label.trim(); desc = desc.trim();

    var qvBtn = document.createElement('button');
    qvBtn.className = 'quick-view-btn';
    qvBtn.textContent = 'Quick View';
    qvBtn.style.cssText =
      'position:absolute;bottom:10px;left:50%;transform:translateX(-50%) translateY(10px);' +
      'background:rgba(0,0,0,0.78);color:white;border:none;padding:7px 18px;border-radius:20px;' +
      'font-size:11px;letter-spacing:0.5px;cursor:pointer;opacity:0;transition:0.3s;' +
      'white-space:nowrap;font-family:Inter,sans-serif;z-index:5;';

    visual.style.position = 'relative';
    visual.appendChild(qvBtn);

    visual.addEventListener('mouseenter', function () {
      qvBtn.style.opacity = '1';
      qvBtn.style.transform = 'translateX(-50%) translateY(0)';
    });
    visual.addEventListener('mouseleave', function () {
      qvBtn.style.opacity = '0';
      qvBtn.style.transform = 'translateX(-50%) translateY(10px)';
    });
    qvBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      openQuickView({ name: name, label: label, desc: desc, price: price, category: category, priceRaw: priceRaw, imgSrc: imgSrc });
    });
  });
}


/* ─────────────────────────────────────────────
   BACK TO TOP
   ───────────────────────────────────────────── */

function initBackToTop() {
  var btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.innerHTML = '↑';
  btn.setAttribute('aria-label', 'Back to top');
  btn.style.cssText =
    'position:fixed;bottom:80px;right:24px;width:42px;height:42px;border-radius:50%;' +
    'background:black;color:white;border:none;font-size:18px;cursor:pointer;' +
    'opacity:0;pointer-events:none;transition:opacity 0.3s;z-index:500;' +
    'box-shadow:0 4px 16px rgba(0,0,0,0.2);font-family:Inter,sans-serif;';
  btn.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
  document.body.appendChild(btn);

  window.addEventListener('scroll', function () {
    var show = window.scrollY > 400;
    btn.style.opacity = show ? '1' : '0';
    btn.style.pointerEvents = show ? 'auto' : 'none';
  });
}


/* ─────────────────────────────────────────────
   SEARCH
   ───────────────────────────────────────────── */

function initSearch() {
  var navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;display:flex;align-items:center;';

  var input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search fragrances…';
  input.id = 'searchInput';
  input.style.cssText =
    'width:0;opacity:0;border:none;outline:none;padding:8px 0;font-size:13px;' +
    'font-family:Inter,sans-serif;background:transparent;' +
    'transition:width 0.4s ease,opacity 0.3s;' +
    'border-bottom:1px solid transparent;color:#222;';

  var searchBtn = document.createElement('button');
  searchBtn.innerHTML = '🔍';
  searchBtn.setAttribute('aria-label', 'Search');
  searchBtn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:16px;padding:4px;';

  var expanded = false;
  searchBtn.onclick = function () {
    if (expanded && input.value.trim()) {
      doSearch(input.value.trim());
    } else if (expanded) {
      input.style.width = '0'; input.style.opacity = '0';
      input.style.borderBottomColor = 'transparent';
      input.value = ''; clearSearchHighlight(); expanded = false;
    } else {
      input.style.width = '160px'; input.style.opacity = '1';
      input.style.borderBottomColor = '#ccc';
      input.focus(); expanded = true;
    }
  };

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && input.value.trim()) doSearch(input.value.trim());
    if (e.key === 'Escape') {
      input.value = ''; input.style.width = '0'; input.style.opacity = '0';
      clearSearchHighlight(); expanded = false;
    }
  });

  wrap.appendChild(input);
  wrap.appendChild(searchBtn);
  navRight.insertBefore(wrap, navRight.firstChild);
}

function doSearch(query) {
  clearSearchHighlight();
  var q = query.toLowerCase();
  var found = 0;
  document.querySelectorAll('.product-card').forEach(function (card) {
    if (card.textContent.toLowerCase().indexOf(q) > -1) {
      card.style.outline = '2.5px solid #c9a96e';
      card.style.outlineOffset = '4px';
      card.style.opacity = '1';
      if (found === 0) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      found++;
    } else {
      card.style.opacity = '0.3';
    }
  });
  if (found === 0) showNotif('No fragrances matching "' + query + '"');
  else showNotif('Found ' + found + ' result' + (found > 1 ? 's' : '') + ' for "' + query + '"');
}

function clearSearchHighlight() {
  document.querySelectorAll('.product-card').forEach(function (card) {
    card.style.outline = '';
    card.style.outlineOffset = '';
    card.style.opacity = '1';
  });
}


/* ─────────────────────────────────────────────
   ACTIVE NAV LINK
   ───────────────────────────────────────────── */

function markActiveNav() {
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}


/* ─────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {

  renderCart();
  markActiveNav();
  initNavScroll();
  initMobileMenu();
  initSmoothScroll();
  initBackToTop();
  initSearch();

  document.body.addEventListener('click', function (e) {
    var btn = e.target.closest('.add-btn');
    if (!btn) return;
    e.stopPropagation();
    var name = btn.getAttribute('data-name');
    var price = parseInt(btn.getAttribute('data-price')) || 0;
    if (name) addToCart(name, price, 'general');
  });

  if (document.querySelector('.product-card')) {
    injectWishlistButtons();
    initQuickView();
  }

  initScrollAnimations();

  if (document.getElementById('tQuote')) {
    startTestimonialRotation();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var panel = document.getElementById('cartPanel');
      if (panel) panel.classList.remove('active');
      closeQuickView();
      if (window.closeMobileMenu) window.closeMobileMenu();
    }
  });

});