/* ============================================================
   RockTech — State & persistence (localStorage)
   ============================================================ */
'use strict';

const Store = (() => {
  const KEY_CART = 'novahub_cart';
  const KEY_USERS = 'novahub_users';
  const KEY_SESSION = 'novahub_session';
  const KEY_THEME = 'novahub_theme';
  const KEY_WISH = 'novahub_wishlist';
  const KEY_ORDERS = 'novahub_orders';

  const state = {
    cart: [],
    users: [],
    session: null,
    wishlist: [],
    orders: [],
    promo: null,
    theme: 'dark',
    cartOpen: false,
    otpPending: null,
    route: '',
  };

  const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

  function init() {
    state.cart = load(KEY_CART, []);
    state.users = load(KEY_USERS, []);
    state.session = load(KEY_SESSION, null);
    state.wishlist = load(KEY_WISH, []);
    state.orders = load(KEY_ORDERS, []);
    const savedTheme = localStorage.getItem(KEY_THEME);
    if (savedTheme) state.theme = savedTheme;
    document.documentElement.dataset.theme = state.theme;
  }

  /* ---------- Cart ---------- */
  function cartCount() { return state.cart.reduce((n, i) => n + i.qty, 0); }
  function cartSubtotal() {
    return state.cart.reduce((s, i) => {
      const p = DB.byId(i.id);
      return p ? s + p.price * i.qty : s;
    }, 0);
  }
  function addToCart(id, qty = 1) {
    const item = state.cart.find(i => i.id === id);
    if (item) item.qty += qty; else state.cart.push({ id, qty });
    persistCart();
    renderCartBadge();
    onCartChange && onCartChange();
  }
  function setQty(id, qty) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;
    if (qty <= 0) state.cart = state.cart.filter(i => i.id !== id);
    else item.qty = Math.min(qty, 99);
    persistCart();
    renderCartBadge();
    onCartChange && onCartChange();
  }
  function clearCart() { state.cart = []; state.promo = null; persistCart(); renderCartBadge(); onCartChange && onCartChange(); }
  function persistCart() { save(KEY_CART, state.cart); }

  /* ---------- Promo ---------- */
  function promoDiscount() {
    const c = DB.COUPONS[state.promo];
    if (!c) return 0;
    const sub = cartSubtotal();
    if (c.min && sub < c.min) return 0;
    return c.type === 'percent' ? (sub * c.value) / 100 : c.value;
  }

  function shippingCost() {
    if (cartSubtotal() === 0) return 0;
    return cartSubtotal() >= DB.FREE_SHIP_THRESHOLD ? 0 : DB.SHIPPING_FLAT;
  }

  function totals() {
    const sub = cartSubtotal();
    const discount = promoDiscount();
    const shipping = shippingCost();
    const taxable = sub - discount;
    const tax = taxable * DB.TAX_RATE;
    return { sub, discount, shipping, tax, total: Math.max(0, taxable + tax + shipping) };
  }

  /* ---------- Wishlist ---------- */
  function inWishlist(id) { return state.wishlist.includes(id); }
  function toggleWishlist(id) {
    state.wishlist = inWishlist(id) ? state.wishlist.filter(x => x !== id) : [...state.wishlist, id];
    save(KEY_WISH, state.wishlist);
  }

  /* ---------- Auth ---------- */
  function currentUser() {
    if (!state.session) return null;
    return state.users.find(u => u.id === state.session) || null;
  }
  function isAuthed() { return !!currentUser(); }
  function hashPw(pw) {
    let h = 5381;
    const salted = 'novahub::' + pw;
    for (let i = 0; i < salted.length; i++) h = ((h << 5) + h + salted.charCodeAt(i)) | 0;
    return 'h' + (h >>> 0).toString(36);
  }
  function register({ name, email, phone, password, provider }) {
    const user = { id: 'u' + Date.now().toString(36), name, email, phone, password: password ? hashPw(password) : null, provider, createdAt: new Date().toISOString(), addresses: [], cards: [], avatarColor: '#00b8d9' };
    state.users.push(user);
    save(KEY_USERS, state.users);
    state.session = user.id;
    save(KEY_SESSION, state.session);
    return user;
  }
  function loginByIdentifier(identifier, password) {
    const user = state.users.find(u => (u.email || '').toLowerCase() === identifier.toLowerCase() || (u.phone || '') === identifier);
    if (!user) return { error: 'No account found with that email or phone.' };
    if (!user.password) return { error: 'This account was created with ' + (user.provider || 'social login') + '. Please use that method.' };
    if (user.password !== hashPw(password)) return { error: 'Incorrect password. Please try again.' };
    state.session = user.id; save(KEY_SESSION, state.session);
    return { user };
  }
  function socialLogin(provider, name) {
    let user = state.users.find(u => u.provider === provider && u.email && u.email.startsWith(provider));
    if (!user) user = register({ name: name || 'Demo ' + provider, email: provider + '@demo.rocktech', provider, password: null });
    state.session = user.id; save(KEY_SESSION, state.session);
    return user;
  }
  function logout() { state.session = null; save(KEY_SESSION, null); }

  function updateUser(patch) {
    const u = currentUser(); if (!u) return;
    Object.assign(u, patch);
    save(KEY_USERS, state.users);
  }

  /* ---------- Orders ---------- */
  function placeOrder(payload) {
    const user = currentUser();
    const id = 'NH-' + Date.now().toString(36).toUpperCase().slice(-6);
    state.cart = state.cart.filter(i => DB.byId(i.id));
    const order = {
      id, date: new Date().toISOString(),
      items: state.cart.map(i => {
        const p = DB.byId(i.id);
        return { ...i, price: p.price, name: p.name, glyph: p.glyph, grad: p.grad, img: p.img };
      }),
      shipping: payload.shipping, payment: payload.payment,
      totals: totals(), promo: state.promo, user: user ? user.id : null,
      status: 'Confirmed', tracking: 'ARRIVING ' + new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10),
      timeline: [{ label: 'Order placed', done: true, time: new Date().toISOString() }],
    };
    state.orders.unshift(order);
    save(KEY_ORDERS, state.orders);
    state.cart.forEach(i => { const p = DB.byId(i.id); if (p) p.stock = Math.max(0, p.stock - i.qty); });
    clearCart();
    return order;
  }

  /* ---------- Events ---------- */
  let onCartChange = null;
  function subscribeCart(fn) { onCartChange = fn; }

  function renderCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const n = cartCount();
    badge.hidden = n === 0;
    badge.textContent = n > 99 ? '99+' : n;
  }

  return {
    state, init, load, save,
    cartCount, cartSubtotal, addToCart, setQty, clearCart,
    promoDiscount, shippingCost, totals,
    inWishlist, toggleWishlist,
    currentUser, isAuthed, register, loginByIdentifier, socialLogin, logout, updateUser,
    placeOrder,
    subscribeCart, renderCartBadge,
  };
})();
