/* ============================================================
   RockTech — Hidden Admin Panel (route: #/admin)
   NOT linked anywhere in the customer UI — access by typing
   #/admin in the address bar. Requires admin login.
   Demo login: admin@rocktech.store / admin123
   ============================================================ */
'use strict';

(() => {
  const { $, money, toast, esc } = UI;
  const SESSION_KEY = 'novahub_admin';
  const ADMIN_EMAIL = 'admin@rocktech.store';
  const ADMIN_PASSWORD = 'admin123';

  const Admin = { tab: 'overview', productBeingEdited: null, viewingOrder: null };

  const isAdminLoggedIn = () => sessionStorage.getItem(SESSION_KEY) === '1';

  const stat = (icon, label, value, sub) =>
    '<div class="a-stat"><span class="a-stat-ico">' + icon + '</span><div><strong>' + value + '</strong><small>' + label + '</small>' + (sub ? '<em>' + sub + '</em>' : '') + '</div></div>';

  function adminView() {
    if (!isAdminLoggedIn()) return adminLogin();
    return adminDashboard();
  }

  /* ---------------- Login ---------------- */
  function adminLogin() {
    return '<section class="admin-login">' +
      '<div class="admin-login-card">' +
        '<div class="admin-lock">🔐</div>' +
        '<h1>RockTech Admin</h1>' +
        '<p class="muted">Restricted area — staff only.</p>' +
        '<form data-action="admin-login" novalidate>' +
          '<label>Admin email<input id="adEmail" type="email" value="" placeholder="admin@rocktech.store" required></label>' +
          '<label>Password<input id="adPw" type="password" placeholder="••••••••" required></label>' +
          '<button class="btn btn-primary btn-block" type="submit">Sign in to admin</button>' +
        '</form>' +
        '<p class="muted small">Demo credentials:<br><code>admin@rocktech.store</code> · <code>admin123</code></p>' +
        '<a class="link-btn" data-action="go" data-href="#/">← Back to storefront</a>' +
      '</div>' +
    '</section>';
  }

  /* ---------------- Dashboard ---------------- */
  function adminDashboard() {
    const orders = Store.state.orders;
    const revenue = orders.reduce((s, o) => s + o.totals.total, 0);
    const lowStock = DB.PRODUCTS.filter(p => p.stock < 10);
    const users = Store.state.users;
    const spend = id => orders.filter(o => o.user === id).reduce((s, o) => s + o.totals.total, 0);

    const tabs = [
      ['overview', '📊', 'Overview'],
      ['orders', '📦', 'Orders'],
      ['products', '🛍️', 'Products'],
      ['customers', '👥', 'Customers'],
      ['coupons', '🏷️', 'Coupons'],
    ];

    const body = {
      overview: () => adminOverview(orders, revenue, lowStock, users, spend),
      orders: () => adminOrders(orders),
      products: () => adminProducts(),
      customers: () => adminCustomers(users, orders, spend),
      coupons: () => adminCoupons(),
    }[Admin.tab]();

    return '<section class="admin">' +
      '<div class="admin-top">' +
        '<div class="admin-brand"><span class="brand-mark">' +
          '<svg viewBox="0 0 32 32" width="26" height="26"><path d="M16 2 4 8v8c0 7.4 5 12.9 12 14 7-1.1 12-6.6 12-14V8L16 2z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M11 16l3.5 3.5L21 12.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>' +
        '</span><div><h1>Admin Panel</h1><small class="muted">hidden · staff only</small></div></div>' +
        '<div class="admin-actions">' +
          '<button class="btn btn-ghost btn-sm" data-action="go" data-href="#/">View store</button>' +
          '<button class="btn btn-danger btn-sm" data-action="admin-logout">Sign out</button>' +
        '</div>' +
      '</div>' +
      '<div class="admin-body">' +
        '<aside class="a-nav">' +
          tabs.map((t, i) => '<button class="a-tab ' + (t[0] === Admin.tab ? 'on' : '') + '" data-action="admin-tab" data-tab="' + t[0] + '"><span>' + t[1] + '</span>' + t[2] + '</button>').join('') +
        '</aside>' +
        '<div class="a-panel">' + body + '</div>' +
      '</div>' +
    '</section>';
  }

  function adminOverview(orders, revenue, lowStock, users, spend) {
    const recent = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
    return '<div class="a-stats">' +
      stat('💰', 'Total revenue', money(revenue), orders.length + ' orders') +
      stat('📦', 'Orders', orders.length, 'across all customers') +
      stat('🛍️', 'Products', DB.PRODUCTS.length, 'in catalog') +
      stat('🚨', 'Low stock items', lowStock.length, 'below 10 units') +
      '</div>' +
      '<div class="a-grid2">' +
        '<div class="a-card"><div class="a-card-head"><h3>Recent orders</h3><button class="btn btn-ghost btn-sm" data-action="admin-tab" data-tab="orders">View all</button></div>' +
          (recent.length ? '<div class="a-order-list">' + recent.map(o =>
            '<div class="a-order-row"><strong>' + o.id + '</strong><span>' + esc((o.shipping || {}).fullName || '—') + '</span>' +
            '<span class="a-status st-' + (o.status || 'Confirmed').toLowerCase() + '">' + (o.status || 'Confirmed') + '</span><strong>' + money(o.totals.total) + '</strong></div>'
          ).join('') + '</div>' : '<p class="muted">No orders yet.</p>') +
        '</div>' +
        '<div class="a-card"><div class="a-card-head"><h3>⚠️ Stock alerts</h3><button class="btn btn-ghost btn-sm" data-action="admin-tab" data-tab="products">Manage</button></div>' +
          (lowStock.length ? '<div class="a-low-list">' + lowStock.map(p =>
            '<div class="a-low-row"><img src="' + DB.image(p, 80, 60) + '" alt=""><span class="ellipsis">' + esc(p.name) + '</span>' +
            '<span class="a-status st-low">' + p.stock + ' left</span></div>'
          ).join('') + '</div>' : '<p class="muted">All products well stocked. ✅</p>') +
        '</div>' +
      '</div>' +
      '<div class="a-card"><div class="a-card-head"><h3>Customers</h3><button class="btn btn-ghost btn-sm" data-action="admin-tab" data-tab="customers">View all</button></div>' +
        '<div class="a-user-list">' + users.slice(0, 5).map(u =>
          '<div class="a-user-row"><span class="a-user-avatar" style="background:' + (u.avatarColor || '#00b8d9') + '">' + esc((u.name || '?')[0].toUpperCase()) + '</span>' +
          '<div><strong>' + esc(u.name) + '</strong><small class="muted">' + esc(u.email || u.phone || '') + '</small></div>' +
          '<strong>' + money(spend(u.id)) + '</strong></div>').join('') +
        (users.length === 0 ? '<p class="muted">No registered customers yet.</p>' : '') +
      '</div>';
  }

  function adminOrders(orders) {
    const byUser = o => {
      const u = Store.state.users.find(x => x.id === o.user);
      return u ? u.name : 'Guest';
    };
    return '<div class="a-card"><div class="a-card-head"><h3>All orders (' + orders.length + ')</h3></div>' +
      (orders.length ? '<div class="a-table-wrap"><table class="a-table">' +
        '<thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>' +
        orders.map(o => {
          const pm = (o.payment || {}).method;
          const payTag = pm === 'bkash' ? '<span class="pb-bkash">bKash</span>' : pm === 'nagad' ? '<span class="pb-nagad">Nagad</span>' : '<span>COD</span>';
          const statuses = ['Confirmed', 'Processing', 'Shipped', 'Delivered'];
          return '<tr>' +
            '<td><strong>' + o.id + '</strong></td>' +
            '<td>' + esc(byUser(o)) + '</td>' +
            '<td class="muted">' + new Date(o.date).toLocaleDateString('en-GB') + '</td>' +
            '<td>' + o.items.length + '</td>' +
            '<td>' + payTag + '</td>' +
            '<td><strong>' + money(o.totals.total) + '</strong></td>' +
            '<td><select class="a-status-select st-' + o.status.toLowerCase() + '" data-action="admin-status" data-id="' + o.id + '">' +
              statuses.map(s => '<option ' + (o.status === s ? 'selected' : '') + '>' + s + '</option>').join('') +
            '</select></td>' +
            '<td><button class="btn btn-ghost btn-sm" data-action="admin-order-view" data-id="' + o.id + '">View</button></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>' : '<p class="muted">No orders placed yet.</p>') +
      '</div>';
  }

  function adminProducts() {
    return '<div class="a-card"><div class="a-card-head"><h3>Products (' + DB.PRODUCTS.length + ')</h3>' +
      '<button class="btn btn-primary btn-sm" data-action="admin-product-new">+ Add product</button></div>' +
      '<div class="a-table-wrap"><table class="a-table">' +
        '<thead><tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Badge</th><th>Rating</th><th></th></tr></thead><tbody>' +
        DB.PRODUCTS.map(p =>
          '<tr>' +
            '<td><img class="a-prod-thumb" src="' + DB.image(p, 80, 60) + '" alt=""></td>' +
            '<td><strong>' + esc(p.name) + '</strong><br><small class="muted">' + esc(p.brand) + ' · ' + p.id.toUpperCase() + '</small></td>' +
            '<td class="muted">' + esc(p.category) + ' / ' + esc(p.sub) + '</td>' +
            '<td><strong>' + money(p.price) + '</strong>' + (p.oldPrice ? '<br><s class="muted">' + money(p.oldPrice) + '</s>' : '') + '</td>' +
            '<td><div class="a-stock"><button class="icon-btn sm" data-action="admin-stock" data-id="' + p.id + '" data-delta="-1" aria-label="−">−</button>' +
              '<span class="' + (p.stock < 10 ? 'st-low' : '') + '">' + p.stock + '</span>' +
              '<button class="icon-btn sm" data-action="admin-stock" data-id="' + p.id + '" data-delta="1" aria-label="+">+</button></div></td>' +
            '<td>' + (p.badge ? '<span class="card-badge b-' + (p.badge === 'TOP DEAL' ? 'deal' : 'new') + '">' + p.badge + '</span>' : '—') + '</td>' +
            '<td>' + p.rating.toFixed(1) + '★</td>' +
            '<td class="a-row-actions">' +
              '<button class="btn btn-ghost btn-sm" data-action="admin-product-edit" data-id="' + p.id + '">Edit</button>' +
              '<button class="btn btn-danger btn-sm" data-action="admin-product-delete" data-id="' + p.id + '">Delete</button>' +
            '</td>' +
          '</tr>').join('') +
        '</tbody></table></div>' +
      '</div>';
  }

  function adminCustomers(users, orders, spend) {
    const byId = u => orders.filter(o => o.user === u.id);
    return '<div class="a-card"><div class="a-card-head"><h3>Customers (' + users.length + ')</h3></div>' +
      (users.length ? '<div class="a-table-wrap"><table class="a-table">' +
        '<thead><tr><th>Customer</th><th>Email / Phone</th><th>Joined</th><th>Orders</th><th>Total spent</th></tr></thead><tbody>' +
        users.map(u => {
          const o = byId(u);
          return '<tr>' +
            '<td><div class="a-user-row"><span class="a-user-avatar" style="background:' + (u.avatarColor || '#00b8d9') + '">' + esc((u.name || '?')[0].toUpperCase()) + '</span><strong>' + esc(u.name) + '</strong></div></td>' +
            '<td class="muted">' + esc(u.email || '—') + '<br>' + esc(u.phone || '') + '</td>' +
            '<td class="muted">' + (u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—') + '</td>' +
            '<td>' + o.length + '</td>' +
            '<td><strong>' + money(spend(u.id)) + '</strong></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table></div>' : '<p class="muted">No registered customers yet.</p>') +
      '</div>';
  }

  function adminCoupons() {
    return '<div class="a-card"><div class="a-card-head"><h3>Active coupons</h3></div>' +
      '<div class="a-coupon-grid">' +
        Object.entries(DB.COUPONS).map(([code, c]) =>
          '<div class="a-coupon"><code>' + code + '</code><div><strong>' + c.desc + '</strong>' +
          '<small class="muted">' + (c.min ? 'Minimum order ' + money(c.min) + ' · ' : '') + (c.type === 'percent' ? c.value + '% off' : money(c.value) + ' off') + '</small></div></div>'
        ).join('') +
      '</div>' +
      '<p class="muted small">To change coupon rules, edit <code>DB.COUPONS</code> in <code>js/data.js</code>.</p>' +
      '</div>';
  }

  /* ---------------- Product form modal ---------------- */
  function productFormModal(id) {
    const p = id ? DB.byId(id) : null;
    Admin.productBeingEdited = id || null;
    const cats = DB.CATEGORIES.map(c =>
      '<option value="' + c.key + '" ' + (p && p.category === c.key ? 'selected' : '') + '>' + esc(c.name) + '</option>').join('');
    const subs = p ? DB.CATEGORIES.find(c => c.key === p.category).subs : DB.CATEGORIES[0].subs;
    const subOpts = subs.map(s => '<option ' + (p && p.sub === s ? 'selected' : '') + '>' + esc(s) + '</option>').join('');

    UI.openModal(
      '<div class="form-modal wide">' +
        '<button class="icon-btn modal-x" data-action="close-modal" aria-label="Close">✕</button>' +
        '<h2>' + (p ? 'Edit product' : 'Add product') + '</h2>' +
        '<form data-action="admin-product-save" novalidate>' +
          '<label>Product name<input id="apName" value="' + esc(p ? p.name : '') + '" required></label>' +
          '<div class="co-grid3">' +
            '<label>Brand<input id="apBrand" value="' + esc(p ? p.brand : 'NovaTech') + '" required></label>' +
            '<label>Category<select id="apCat" data-action="admin-cat-change">' + cats + '</select></label>' +
            '<label>Sub-category<select id="apSub">' + subOpts + '</select></label>' +
          '</div>' +
          '<div class="co-grid4">' +
            '<label>Price (৳)<input id="apPrice" type="number" min="0" step="1" value="' + (p ? p.price : '') + '" required></label>' +
            '<label>Old price (৳)<input id="apOld" type="number" min="0" step="1" value="' + (p && p.oldPrice ? p.oldPrice : '') + '"></label>' +
            '<label>Stock<input id="apStock" type="number" min="0" value="' + (p ? p.stock : 10) + '" required></label>' +
            '<label>Rating<input id="apRating" type="number" min="0" max="5" step="0.1" value="' + (p ? p.rating : 4.5) + '" required></label>' +
          '</div>' +
          '<div class="co-grid3">' +
            '<label>Badge<select id="apBadge">' +
              '<option value="">None</option>' +
              '<option value="TOP DEAL" ' + (p && p.badge === 'TOP DEAL' ? 'selected' : '') + '>TOP DEAL</option>' +
              '<option value="NEW" ' + (p && p.badge === 'NEW' ? 'selected' : '') + '>NEW</option>' +
            '</select></label>' +
            '<label>Emoji (product art)<input id="apGlyph" maxlength="4" value="' + esc(p ? p.glyph : '📦') + '"></label>' +
            '<label>Gradient color 1<input id="apGrad1" type="color" value="' + (p ? p.grad[0] : '#0ea5e9') + '"></label>' +
          '</div>' +
          '<label>Gradient color 2<input id="apGrad2" type="color" value="' + (p ? p.grad[1] : '#2563eb') + '"></label>' +
          '<label class="f-check"><input type="checkbox" id="apFeatured" ' + (p && p.featured ? 'checked' : '') + '><span class="f-box"></span>Show in featured picks</label>' +
          '<label class="f-check"><input type="checkbox" id="apNew" ' + (p && p.isNew ? 'checked' : '') + '><span class="f-box"></span>Mark as New Arrival</label>' +
          '<div class="a-specs-head"><h4>Specifications</h4><button type="button" class="btn btn-ghost btn-sm" data-action="admin-spec-add">+ Add spec</button></div>' +
          '<div class="a-specs" id="apSpecs">' +
            (Object.entries(p ? p.specs : {}).map(([k, v]) =>
              '<div class="a-spec-row"><input class="a-spec-k" placeholder="Key (e.g. Power)" value="' + esc(k) + '"><input class="a-spec-v" placeholder="Value" value="' + esc(v) + '">' +
              '<button type="button" class="icon-btn sm" data-action="admin-spec-del" aria-label="Remove">✕</button></div>').join('') ||
            '<div class="a-spec-row"><input class="a-spec-k" placeholder="Key (e.g. Power)"><input class="a-spec-v" placeholder="Value"></div>') +
          '</div>' +
          '<div class="co-actions">' +
            '<button type="button" class="btn btn-ghost" data-action="close-modal">Cancel</button>' +
            '<button class="btn btn-primary" type="submit">' + (p ? 'Save changes' : 'Add product') + '</button>' +
          '</div>' +
        '</form>' +
      '</div>', 'form wide');
  }

  /* ---------------- Order detail modal ---------------- */
  function orderDetailModal(id) {
    const o = Store.state.orders.find(x => x.id === id);
    if (!o) return;
    const user = Store.state.users.find(u => u.id === o.user);
    const pm = (o.payment || {}).method;
    const payLabel = pm === 'bkash' || pm === 'nagad'
      ? (pm === 'nagad' ? '🟠 Nagad' : '🔴 bKash') + ' · ' + esc(o.payment.number) + ' · TrxID ' + esc(o.payment.trx)
      : '💵 Cash on delivery';
    UI.openModal(
      '<div class="form-modal wide">' +
        '<button class="icon-btn modal-x" data-action="close-modal" aria-label="Close">✕</button>' +
        '<h2>Order ' + o.id + '</h2>' +
        '<p class="muted">' + new Date(o.date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) + ' · by ' + esc(user ? user.name : 'Guest') + '</p>' +
        '<div class="o-item-list">' +
          o.items.map(i => '<div class="co-item"><img src="' + DB.image(i, 100, 75) + '" alt="">' +
            '<div class="co-item-info"><strong>' + esc(i.name) + '</strong><span class="muted">Qty ' + i.qty + ' × ' + money(i.price) + '</span></div>' +
            '<strong>' + money(i.price * i.qty) + '</strong></div>').join('') +
        '</div>' +
        '<div class="co-grid2">' +
          '<div><h4>Shipping</h4><p class="muted">' + esc(o.shipping.fullName) + '<br>' + esc(o.shipping.line1) + '<br>' +
            esc(o.shipping.city) + ', ' + esc(o.shipping.zip) + '<br>' + esc(o.shipping.country) + '<br>📞 ' + esc(o.shipping.phone) + '</p></div>' +
          '<div><h4>Payment</h4><p class="muted">' + payLabel + '</p>' +
            '<h4>Summary</h4><p class="muted">Subtotal ' + money(o.totals.sub) +
            (o.totals.discount ? '<br>Discount −' + money(o.totals.discount) : '') +
            '<br>Shipping ' + (o.totals.shipping ? money(o.totals.shipping) : 'FREE') +
            '<br><strong>Total ' + money(o.totals.total) + '</strong></p></div>' +
        '</div>' +
      '</div>', 'form wide');
  }

  /* ---------------- Actions ---------------- */
  const Actions = {
    'admin-login'(e) {
      e.preventDefault();
      const email = $('#adEmail').value.trim().toLowerCase();
      const pw = $('#adPw').value;
      if (email === ADMIN_EMAIL && pw === ADMIN_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, '1');
        toast('🔐 Admin access granted', 'success');
        location.hash = '#/admin';
        navigate();
      } else {
        toast('Invalid admin credentials', 'error');
      }
    },
    'admin-logout'() {
      sessionStorage.removeItem(SESSION_KEY);
      toast('Signed out of admin');
      location.hash = '#/';
      navigate();
    },
    'admin-tab'(el) {
      Admin.tab = el.dataset.tab;
      document.querySelectorAll('.a-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === Admin.tab));
      renderAdminPanel();
    },
    'admin-status'(el) {
      const o = Store.state.orders.find(x => x.id === el.dataset.id);
      if (!o) return;
      o.status = el.value;
      o.timeline.push({ label: el.value, done: true, time: new Date().toISOString() });
      if (el.value === 'Shipped') o.tracking = 'ARRIVING ' + new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
      if (el.value === 'Delivered') o.tracking = 'DELIVERED ' + new Date().toISOString().slice(0, 10);
      Store.save('novahub_orders', Store.state.orders);
      toast('✓ Order ' + o.id + ' → ' + el.value, 'success');
    },
    'admin-order-view'(el) { orderDetailModal(el.dataset.id); },

    'admin-product-new'() { productFormModal(null); },
    'admin-product-edit'(el) { productFormModal(el.dataset.id); },
    'admin-cat-change'(el) {
      const cat = DB.CATEGORIES.find(c => c.key === el.value);
      $('#apSub').innerHTML = cat.subs.map(s => '<option>' + esc(s) + '</option>').join('');
    },
    'admin-spec-add'() {
      $('#apSpecs').insertAdjacentHTML('beforeend',
        '<div class="a-spec-row"><input class="a-spec-k" placeholder="Key (e.g. Power)"><input class="a-spec-v" placeholder="Value">' +
        '<button type="button" class="icon-btn sm" data-action="admin-spec-del" aria-label="Remove">✕</button></div>');
    },
    'admin-spec-del'(el) {
      const row = el.closest('.a-spec-row');
      const wrap = row.parentElement;
      row.remove();
      if (!wrap.querySelector('.a-spec-row')) {
        wrap.insertAdjacentHTML('beforeend', '<div class="a-spec-row"><input class="a-spec-k" placeholder="Key (e.g. Power)"><input class="a-spec-v" placeholder="Value"></div>');
      }
    },
    'admin-product-save'(e) {
      e.preventDefault();
      const name = $('#apName').value.trim();
      if (!name) return toast('Product name is required', 'error');
      const cat = $('#apCat').value;
      const specs = {};
      document.querySelectorAll('.a-spec-row').forEach(row => {
        const k = row.querySelector('.a-spec-k').value.trim();
        const v = row.querySelector('.a-spec-v').value.trim();
        if (k) specs[k] = v;
      });
      const data = {
        name, brand: $('#apBrand').value.trim() || 'NovaTech', category: cat, sub: $('#apSub').value,
        price: Math.max(0, +$('#apPrice').value || 0), oldPrice: $('#apOld').value ? Math.max(0, +$('#apOld').value) : null,
        stock: Math.max(0, +$('#apStock').value || 0), rating: Math.min(5, Math.max(0, +$('#apRating').value || 4.5)),
        badge: $('#apBadge').value || null, glyph: $('#apGlyph').value || '📦',
        grad: [$('#apGrad1').value, $('#apGrad2').value],
        featured: $('#apFeatured').checked, isNew: $('#apNew').checked,
        specs, reviews: 0, reviewList: [],
      };
      if (Admin.productBeingEdited) {
        const p = DB.byId(Admin.productBeingEdited);
        Object.assign(p, data, { oldPrice: data.oldPrice });
        toast('✓ Product updated');
      } else {
        const nextId = 'p' + String(DB.PRODUCTS.length + 1).padStart(3, '0');
        DB.PRODUCTS.push({ id: nextId, ...data });
        toast('✓ Product ' + nextId.toUpperCase() + ' created');
      }
      DB._imgCache && DB._imgCache.clear();
      UI.closeModal();
      navigate();
    },
    'admin-product-delete'(el) {
      const p = DB.byId(el.dataset.id);
      if (!confirm('Delete "' + p.name + '" from the catalog?')) return;
      DB.PRODUCTS.splice(DB.PRODUCTS.indexOf(p), 1);
      toast('🗑️ Product deleted');
      navigate();
    },
    'admin-stock'(el) {
      const p = DB.byId(el.dataset.id);
      if (!p) return;
      p.stock = Math.max(0, p.stock + (+el.dataset.delta));
      navigate();
    },
  };

  /* re-render the current admin panel body */
  function renderAdminPanel() {
    const panel = document.querySelector('.a-panel');
    if (!panel) return;
    const body = {
      overview: () => adminOverview(Store.state.orders, Store.state.orders.reduce((s, o) => s + o.totals.total, 0), DB.PRODUCTS.filter(p => p.stock < 10), Store.state.users, id => Store.state.orders.filter(o => o.user === id).reduce((s, o) => s + o.totals.total, 0)),
      orders: () => adminOrders(Store.state.orders),
      products: () => adminProducts(),
      customers: () => adminCustomers(Store.state.users, Store.state.orders, id => Store.state.orders.filter(o => o.user === id).reduce((s, o) => s + o.totals.total, 0)),
      coupons: () => adminCoupons(),
    }[Admin.tab]();
    panel.innerHTML = body;
  }

  function navigate() {
    if (location.hash.startsWith('#/admin')) {
      document.getElementById('app').innerHTML = adminView();
      window.scrollTo({ top: 0 });
    }
  }

  Object.assign(App.Actions, Actions);
  window.adminView = adminView;
})();
