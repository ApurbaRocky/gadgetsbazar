/* ============================================================
   RockTech — UI helpers: toasts, modal, drawer, rendering utils
   ============================================================ */
'use strict';

const UI = (() => {

  const $ = (sel, root = document) => root.querySelector(sel);

  function money(n) {
    return '৳' + Math.round(n).toLocaleString('en-US');
  }

  function stars(rating, size = 14) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.4 && rating - full < 0.9;
    const empty = 5 - full - (half ? 1 : 0);
    const path = '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
    let s = '';
    for (let i = 0; i < full; i++) s += '<span class="star fill">' + path + '</span>';
    if (half) s += '<span class="star half">' + path + '</span>';
    for (let i = 0; i < empty; i++) s += '<span class="star dim">' + path + '</span>';
    return '<span class="stars">' + s + '</span>';
  }

  /* ---------- Toast ---------- */
  const toastRoot = () => $('#toastRoot');
  function toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    const icons = { info: 'ℹ️', success: '✅', error: '⚠️' };
    el.innerHTML = '<span class="toast-icon">' + (icons[type] || 'ℹ️') + '</span><span>' + msg + '</span>';
    toastRoot().appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3200);
  }

  /* ---------- Modal ---------- */
  function openModal(html, cls = '') {
    const root = $('#modalRoot');
    root.innerHTML = '<div class="modal-backdrop" data-action="close-modal"><div class="modal ' + cls + '" data-stop="1">' + html + '</div></div>';
    document.body.classList.add('modal-open');
    return root.firstElementChild;
  }
  function closeModal() {
    $('#modalRoot').innerHTML = '';
    document.body.classList.remove('modal-open');
  }

  /* ---------- Cart drawer ---------- */
  function validCartItems() {
    return Store.state.cart.filter(i => DB.byId(i.id));
  }

  function renderCartDrawer() {
    const body = $('#drawerBody');
    const foot = $('#drawerFoot');
    const label = $('#cartCountLabel');
    const items = validCartItems();
    const n = Store.cartCount();

    if (items.length !== Store.state.cart.length) {
      Store.state.cart = items;
      Store.persistCart();
      Store.renderCartBadge();
    }

    label.textContent = n ? '(' + n + ')' : '';

    if (!n) {
      body.innerHTML = '<div class="cart-empty"><div class="cart-empty-ico">🛒</div><h3>Your cart is empty</h3><p>Discover great gadgets and add your favorites.</p><button class="btn btn-primary" data-action="close-cart-and-shop">Start shopping</button></div>';
      foot.hidden = true;
      $('#cartProgress').hidden = true;
      return;
    }
    foot.hidden = false;
    $('#cartProgress').hidden = false;

    const sub = Store.cartSubtotal();
    const remaining = DB.FREE_SHIP_THRESHOLD - sub;
    const pct = Math.min(100, (sub / DB.FREE_SHIP_THRESHOLD) * 100);
    $('#cartProgress').innerHTML =
      '<div class="cp-text">' + (remaining > 0
        ? 'You\'re <strong>' + money(remaining) + '</strong> away from <strong>FREE shipping</strong>'
        : '<strong>🎉 Free shipping unlocked!</strong>') +
      '</div><div class="cp-bar"><div class="cp-fill" style="width:' + pct + '%"></div></div>';

    body.innerHTML = items.map(item => {
      const p = DB.byId(item.id);
      return '<div class="cart-item">' +
        '<img class="cart-thumb" src="' + DB.image(p, 200, 150) + '" alt="' + p.name + '">' +
        '<div class="cart-item-info">' +
          '<h4>' + p.name + '</h4>' +
          '<span class="cart-item-price">' + money(p.price) + '</span>' +
          '<div class="qty-stepper" data-product="' + p.id + '">' +
            '<button data-action="cart-dec" data-id="' + p.id + '" aria-label="Decrease">−</button>' +
            '<span>' + item.qty + '</span>' +
            '<button data-action="cart-inc" data-id="' + p.id + '" aria-label="Increase">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="cart-item-side">' +
          '<button class="icon-btn sm" data-action="cart-remove" data-id="' + p.id + '" aria-label="Remove">' +
            '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.7 12a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
          '</button>' +
          '<strong class="cart-line-total">' + money(p.price * item.qty) + '</strong>' +
        '</div>' +
      '</div>';
    }).join('');

    renderCartTotals();
  }

  function renderCartTotals() {
    const t = Store.totals();
    const row = (k, v, extra = '') => '<div class="t-row ' + extra + '"><span>' + k + '</span><span>' + v + '</span></div>';
    let html = row('Subtotal', money(t.sub));
    if (t.discount > 0) html += row('Discount <em>(' + Store.state.promo + ')</em>', '−' + money(t.discount), 't-discount');
    html += row('Shipping', t.shipping === 0 ? '<span class="free-tag">FREE</span>' : money(t.shipping));
    html += row('Tax (8%)', money(t.tax));
    html += '<div class="t-row t-total"><span>Total</span><span>' + money(t.total) + '</span></div>';
    $('#cartTotals').innerHTML = html;
  }

  /* ---------- Misc renderers ---------- */
  function productCard(p, opts = {}) {
    const wish = Store.inWishlist(p.id);
    const badge = p.badge ? '<span class="card-badge b-' + (p.badge === 'TOP DEAL' ? 'deal' : 'new') + '">' + p.badge + '</span>' : '';
    return '<article class="product-card" data-href="#/product/' + p.id + '" data-action="go" tabindex="0" role="link" aria-label="' + p.name + '">' +
      '<div class="card-media">' +
        '<img src="' + DB.image(p, 600, 450) + '" alt="' + p.name + '" loading="lazy">' +
        badge +
        '<button class="icon-btn wish-btn ' + (wish ? 'active' : '') + '" data-action="wish-toggle" data-id="' + p.id + '" aria-label="Wishlist">' +
          (wish ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 21s-7.5-4.7-10-9.2C.4 8.7 2.2 5 5.8 5c2 0 3.5 1.1 4.2 2.5h4c.7-1.4 2.2-2.5 4.2-2.5 3.6 0 5.4 3.7 3.8 6.8-2.5 4.5-10 9.2-10 9.2z"/></svg>'
          : '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 21s-7.5-4.7-10-9.2C.4 8.7 2.2 5 5.8 5c2 0 3.5 1.1 4.2 2.5h4c.7-1.4 2.2-2.5 4.2-2.5 3.6 0 5.4 3.7 3.8 6.8-2.5 4.5-10 9.2-10 9.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>') +
        '</button>' +
        (p.stock === 0 ? '<span class="stock-ribbon">Out of stock</span>' : (p.stock < 10 ? '<span class="stock-ribbon low">Only ' + p.stock + ' left</span>' : '')) +
      '</div>' +
      '<div class="card-body">' +
        '<span class="card-brand">' + p.brand + '</span>' +
        '<h3 class="card-title">' + p.name + '</h3>' +
        '<div class="card-rating">' + stars(p.rating) + '<span>' + p.rating.toFixed(1) + ' (' + p.reviews + ')</span></div>' +
        '<div class="card-price-row">' +
          '<div class="card-price"><span class="now">' + money(p.price) + '</span>' + (p.oldPrice ? '<span class="was">' + money(p.oldPrice) + '</span>' : '') + '</div>' +
          '<button class="btn btn-primary btn-icon add-btn" data-action="add-cart" data-id="' + p.id + '" aria-label="Add to cart" title="Add to cart">' +
            '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 4h2l2.5 12h11l2-8H6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="20" r="1.4" fill="currentColor"/><circle cx="17.5" cy="20" r="1.4" fill="currentColor"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function skeletonCards(n = 8) {
    let out = '';
    for (let i = 0; i < n; i++) out += '<div class="product-card skeleton"><div class="card-media"></div><div class="card-body"><div class="sk-line w40"></div><div class="sk-line w90"></div><div class="sk-line w60"></div></div></div>';
    return out;
  }

  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  /* ---------- Event delegation ----------
     Click  -> buttons, links, cards (skip checkable inputs & selects)
     Change -> checkboxes, radios, selects
     Submit -> forms with data-action
     Key    -> Enter/Space on role="link" cards */
  function delegate() {
    document.addEventListener('click', e => {
      const t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('input[type=checkbox], input[type=radio], select')) return;
      const el = t.closest('[data-action]');
      if (!el) return;
      if (el.tagName === 'FORM') return;
      const act = el.dataset.action;
      if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault();
      App.Actions[act] && App.Actions[act](el, e);
    });

    document.addEventListener('change', e => {
      const el = e.target;
      const act = el && el.dataset ? el.dataset.action : null;
      if (!act) return;
      App.Actions[act] && App.Actions[act](el, e);
    });

    document.addEventListener('submit', e => {
      const el = e.target;
      const act = el && el.dataset ? el.dataset.action : null;
      if (!act) return;
      e.preventDefault();
      App.Actions[act] && App.Actions[act](e, el);
    });

    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target;
      if (!el || !el.dataset || !el.dataset.action) return;
      if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.getAttribute('role') === 'link') {
        e.preventDefault();
        App.Actions[el.dataset.action] && App.Actions[el.dataset.action](el, e);
      }
    });
  }

  return { $, money, stars, toast, openModal, closeModal, renderCartDrawer, renderCartTotals, productCard, skeletonCards, esc, delegate };
})();
