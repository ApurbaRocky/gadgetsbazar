/* ============================================================
   RockTech — Application: router, views, header, search, auth,
   account dashboard & global actions
   ============================================================ */
'use strict';

const App = (() => {
  const { $, money, stars, toast, openModal, closeModal, productCard, esc } = UI;

  const ShopState = {
    cat: '', sub: '', q: '', brands: new Set(), avail: false,
    min: null, max: null, rating: 0, sort: 'featured',
  };

  /* ================= ROUTER ================= */
  function parseRoute() {
    let hash = location.hash.replace(/^#\/?/, '');
    const [pathPart, queryPart] = hash.split('?');
    const segs = pathPart.split('/').filter(Boolean);
    const qs = new URLSearchParams(queryPart || '');
    return { path: '/' + (segs[0] || ''), id: segs[1] || '', qs };
  }

  function navigate() {
    const r = parseRoute();
    const app = $('#app');
    app.innerHTML = '<div class="page-loading"><span class="spinner"></span></div>';
    window.scrollTo({ top: 0 });
    closeMenus();
    let view = null;
    if (r.path === '/' ) view = homeView();
    else if (r.path === '/shop') view = shopView(r.qs);
    else if (r.path === '/product' && DB.byId(r.id)) view = productView(DB.byId(r.id));
    else if (r.path === '/account') view = accountView();
    else if (r.path === '/checkout') view = checkoutView();
    else if (r.path === '/admin' && window.adminView) view = window.adminView();
    else if (r.path === '/order' && r.id) view = orderView(r.id);
    else view = notFoundView();
    requestAnimationFrame(() => { app.innerHTML = view; bindViewScripts(); highlightNav(); });
  }

  function bindViewScripts() {
    bindProductPage();
    bindSearchSuggestions();
    bindReviewForm();
  }

  function closeMenus() {
    $('#mainNav').classList.remove('open');
    $('#menuOverlay').hidden = true;
    $('#megaMenu').classList.remove('open');
    $('#searchDrop').hidden = true;
    document.querySelectorAll('[aria-expanded]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  function highlightNav() {
    const r = parseRoute();
    document.querySelectorAll('.main-nav a').forEach(a => {
      const href = a.dataset.href || '#/';
      a.classList.toggle('active', r.path === href.slice(0, href.indexOf('?') > 0 ? href.indexOf('?') : href.length));
    });
  }

  /* ================= HEADER ================= */
  function initHeader() {
    renderMegaMenu();
    renderThemeIcon();
    Store.subscribeCart(() => { UI.renderCartDrawer(); });
    UI.renderCartDrawer();

    $('#themeBtn').addEventListener('click', toggleTheme);

    $('#searchInput').addEventListener('input', debounce(onSearchInput, 140));
    $('#searchInput').addEventListener('keydown', onSearchKey);
    $('#searchInput').addEventListener('focus', () => { if ($('#searchInput').value) renderSearchDrop(); });
    $('#searchClear').addEventListener('click', () => {
      $('#searchInput').value = ''; $('#searchDrop').hidden = true;
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.search-wrap')) $('#searchDrop').hidden = true;
      if (!e.target.closest('.nav-item')) $('#megaMenu').classList.remove('open');
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeMenus();
        Store.state.cartOpen && toggleCart(false);
        closeModal();
      }
    });

    /* Mobile menu overlay click */
    $('#menuOverlay').addEventListener('click', () => toggleMobileMenu(false));
  }

  function toggleMobileMenu(force) {
    const nav = $('#mainNav');
    const open = force !== undefined ? force : !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    $('#menuOverlay').hidden = !open;
    $('#mainNav .hamburger');
  }

  function toggleTheme() {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
    Store.state.theme = html.dataset.theme;
    localStorage.setItem('novahub_theme', html.dataset.theme);
    renderThemeIcon();
    toast(html.dataset.theme === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on', 'success');
  }

  function renderThemeIcon() {
    const dark = document.documentElement.dataset.theme === 'dark';
    $('#themeBtn').innerHTML = dark
      ? '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12h2.5M19 12h2.5M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function renderMegaMenu() {
    $('#megaMenu').innerHTML = DB.CATEGORIES.map(c =>
      '<div class="mega-col">' +
        '<a class="mega-cat" data-action="go" data-href="#/shop?cat=' + c.key + '">' +
          '<span class="mega-glyph">' + c.glyph + '</span>' + esc(c.name) +
        '</a>' +
        c.subs.map(s =>
          '<a class="mega-sub" data-action="go" data-href="#/shop?cat=' + c.key + '&sub=' + encodeURIComponent(s) + '">' + esc(s) + '</a>'
        ).join('') +
      '</div>'
    ).join('');
  }

  /* ================= SEARCH ================= */
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  function onSearchInput() {
    const q = $('#searchInput').value.trim();
    $('#searchClear').style.display = q ? 'flex' : 'none';
    if (q) renderSearchDrop(); else $('#searchDrop').hidden = true;
  }

  function renderSearchDrop() {
    const q = $('#searchInput').value.trim();
    const drop = $('#searchDrop');
    if (!q) { drop.hidden = true; return; }
    const results = DB.search(q).slice(0, 6);
    const html = results.map(p =>
      '<a class="sug-item" data-action="go" data-href="#/product/' + p.id + '">' +
        '<img src="' + DB.image(p, 100, 75) + '" alt="">' +
        '<div class="sug-info"><strong>' + esc(p.name) + '</strong>' +
          '<span>' + esc(p.brand) + ' · ' + esc(p.sub) + ' · ' + money(p.price) + '</span></div>' +
        '<span class="sug-add">' + (p.stock > 0 ? 'In stock' : 'Sold out') + '</span>' +
      '</a>').join('');
    drop.innerHTML =
      (html || '<div class="sug-empty">No products match “' + esc(q) + '”</div>') +
      '<a class="sug-all" data-action="go" data-href="#/shop?q=' + encodeURIComponent(q) + '">See all results for “' + esc(q) + '” →</a>';
    drop.hidden = false;
  }

  let sugIndex = -1;
  function onSearchKey(e) {
    const items = $('#searchDrop').querySelectorAll('.sug-item, .sug-all');
    if (!items.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sugIndex = e.key === 'ArrowDown' ? (sugIndex + 1) % items.length : (sugIndex - 1 + items.length) % items.length;
      items.forEach((it, i) => it.classList.toggle('kbd', i === sugIndex));
      items[sugIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (sugIndex >= 0) { items[sugIndex].click(); sugIndex = -1; return; }
      const q = $('#searchInput').value.trim();
      if (q) location.hash = '#/shop?q=' + encodeURIComponent(q);
      $('#searchDrop').hidden = true;
    }
  }

  function bindSearchSuggestions() {
    const input = $('#searchInput');
    if (!input) return;
    const r = parseRoute();
    if (r.path !== '/shop') return;
    input.value = ShopState.q;
    $('#searchClear').style.display = ShopState.q ? 'flex' : 'none';
  }

  /* ================= HOME ================= */
  function homeView() {
    const hero =
      '<section class="hero">' +
        '<div class="hero-glow g1"></div><div class="hero-glow g2"></div>' +
        '<div class="hero-content">' +
          '<div class="hero-flash">' +
            '<span class="flash-label">FLASH SALE</span>' +
            '<strong>Up to 35% off select gadgets</strong>' +
            '<p>Limited time deals on chargers, earbuds and routers — only while stock lasts.</p>' +
            '<div class="flash-meta"><span>Ends today</span><a class="link-more" data-action="go" data-href="#/shop?filter=deal">Shop deals →</a></div>' +
          '</div>' +
          '<span class="hero-tag">⚡ New season · Up to 30% off top tech</span>' +
          '<h1>Smart gadgets for a<br><span class="grad-text">connected</span> life.</h1>' +
          '<p>Chargers, audio, peripherals &amp; networking gear — curated, tested and shipped fast with free returns.</p>' +
          '<div class="hero-cta">' +
            '<a class="btn btn-primary btn-lg" data-action="go" data-href="#/shop">Shop all gadgets</a>' +
            '<a class="btn btn-ghost btn-lg" data-action="go" data-href="#/shop?filter=deal">🔥 Top deals</a>' +
          '</div>' +
          '<div class="hero-stats">' +
            '<div><strong>28+</strong><span>Curated products</span></div>' +
            '<div><strong>4.7★</strong><span>Avg. rating</span></div>' +
            '<div><strong>24h</strong><span>Fast dispatch</span></div>' +
            '<div><strong>Free</strong><span>Shipping over ' + money(DB.FREE_SHIP_THRESHOLD) + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="hero-art" aria-hidden="true">' +
          '<div class="ha-card ha-1">' + imgTag(DB.byId('p009'), 300, 225) + '</div>' +
          '<div class="ha-card ha-2">' + imgTag(DB.byId('p025'), 260, 195) + '</div>' +
          '<div class="ha-card ha-3">' + imgTag(DB.byId('p003'), 240, 180) + '</div>' +
        '</div>' +
      '</section>';

    const perks =
      '<section class="perks">' +
        '<div class="perk"><span>🚚</span><div><strong>Free shipping</strong><small>On orders over ' + money(DB.FREE_SHIP_THRESHOLD) + '</small></div></div>' +
        '<div class="perk"><span>↩️</span><div><strong>30-day returns</strong><small>No questions asked</small></div></div>' +
        '<div class="perk"><span>🛡️</span><div><strong>2-year warranty</strong><small>On all electronics</small></div></div>' +
        '<div class="perk"><span>💬</span><div><strong>24/7 support</strong><small>Real humans, fast replies</small></div></div>' +
      '</section>';

    const marquee =
      '<section class="marquee-section" aria-label="Product showcase">' +
        '<div class="marquee" id="productMarquee">' +
          '<div class="marquee-track">' +
            DB.PRODUCTS.map(p => '<span class="marquee-item" data-action="go" data-href="#/product/' + p.id + '">' + esc(p.name) + ' — ' + money(p.price) + '</span>').join('') +
          '</div>' +
        '</div>' +
      '</section>';

    const cats =
      '<section class="section">' +
        '<div class="section-head"><h2>Shop by category</h2><a data-action="go" data-href="#/shop" class="link-more">Browse everything →</a></div>' +
        '<div class="cat-grid">' +
        DB.CATEGORIES.map(c => {
          const count = DB.PRODUCTS.filter(p => p.category === c.key).length;
          return '<a class="cat-card" data-action="go" data-href="#/shop?cat=' + c.key + '" style="background:linear-gradient(135deg,' + c.grad[0] + '22,' + c.grad[1] + '22),var(--surface-2)">' +
            '<span class="cat-emoji">' + c.glyph + '</span>' +
            '<div><h3>' + esc(c.name) + '</h3><p>' + esc(c.tagline) + '</p><small>' + count + ' products →</small></div>' +
          '</a>';
        }).join('') +
        '</div>' +
      '</section>';

    const featured = DB.PRODUCTS.filter(p => p.featured);
    const deals = DB.PRODUCTS.filter(p => p.badge === 'TOP DEAL');
    const fresh = DB.PRODUCTS.filter(p => p.isNew);

    const rows = (list, id) =>
      '<section class="section">' +
        '<div class="section-head"><h2>' + (id === 'featured' ? '✨ Featured picks' : id === 'deals' ? '🔥 Top deals this week' : '🆕 New arrivals') + '</h2><a data-action="go" data-href="#/shop' + (id === 'featured' ? '' : id === 'deals' ? '?filter=deal' : '?filter=new') + '" class="link-more">View all →</a></div>' +
        '<div class="prod-grid" id="' + id + '">' + list.map(productCard).join('') + '</div>' +
      '</section>';

    const banners =
      '<section class="promo-banner">' +
        '<div><span class="promo-tag">GADGET20</span><h2>20% off everything over ' + money(2000) + '</h2><p>Use code <strong>GADGET20</strong> at checkout. Limited time.</p></div>' +
        '<a class="btn btn-light" data-action="go" data-href="#/shop">Grab the deal</a>' +
      '</section>';

    const newsletter =
      '<section class="newsletter">' +
        '<div><h2>Stay ahead of the tech curve</h2><p>Deals, restocks and new drops — once a week, no spam.</p></div>' +
        '<form class="nl-form" data-action="newsletter-submit">' +
          '<input type="email" id="nlEmail" placeholder="you@email.com" required>' +
          '<button class="btn btn-primary" type="submit">Subscribe</button>' +
        '</form>' +
      '</section>';

    return hero + perks + marquee + cats + rows(featured, 'featured') + banners + rows(deals, 'deals') + rows(fresh, 'new') + newsletter;
  }

  function imgTag(p, w, h) {
    return '<img src="' + DB.image(p, w, h) + '" alt="' + esc(p.name) + '">';
  }

  /* ================= SHOP ================= */
  function shopView(qs) {
    const prev = { ...ShopState };
    ShopState.cat = qs.get('cat') || '';
    ShopState.sub = qs.get('sub') || '';
    ShopState.q = qs.get('q') || '';
    if (qs.get('filter') === 'deal') ShopState.q = '';
    const filter = qs.get('filter') || '';

    /* keep sort/brands/etc. from previous navigation where sensible */
    if (qs.get('cat') || qs.get('sub') || qs.get('q')) {
      if (!qs.get('cat') && !qs.get('sub')) { ShopState.brands = new Set(); ShopState.avail = false; ShopState.min = null; ShopState.max = null; ShopState.rating = 0; }
      else { ShopState.brands = prev.brands; ShopState.avail = prev.avail; ShopState.min = prev.min; ShopState.max = prev.max; ShopState.rating = prev.rating; }
    }

    let list = DB.PRODUCTS.filter(p => {
      if (filter === 'deal' && p.badge !== 'TOP DEAL') return false;
      if (filter === 'new' && !p.isNew) return false;
      if (ShopState.cat && p.category !== ShopState.cat) return false;
      if (ShopState.sub && p.sub !== ShopState.sub) return false;
      if (ShopState.brands.size && !ShopState.brands.has(p.brand)) return false;
      if (ShopState.avail && p.stock <= 0) return false;
      if (ShopState.rating && p.rating < ShopState.rating) return false;
      if (ShopState.min != null && p.price < ShopState.min) return false;
      if (ShopState.max != null && p.price > ShopState.max) return false;
      if (ShopState.q && !(p.name + p.brand + p.sub + p.category).toLowerCase().includes(ShopState.q.toLowerCase())) return false;
      return true;
    });

    const sortKey = ShopState.sort;
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'newest': return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || b.reviews - a.reviews;
        default: return (b.badge ? 1 : 0) - (a.badge ? 1 : 0) || b.rating - a.rating || a.price - b.price;
      }
    });

    const activeCat = DB.CATEGORIES.find(c => c.key === ShopState.cat);
    const title = filter === 'deal' ? 'Top Deals' : filter === 'new' ? 'New Arrivals' : ShopState.q ? 'Results for “' + esc(ShopState.q) + '”' : activeCat ? activeCat.name : 'All Gadgets';

    const brandList = [...new Set(DB.PRODUCTS.map(p => p.brand))].sort();
    const checked = b => ShopState.brands.has(b) ? 'checked' : '';

    const filters =
      '<aside class="filters">' +
        '<div class="f-head"><h3>Filters</h3><button class="btn btn-ghost btn-sm" data-action="clear-filters">Reset all</button></div>' +
        '<div class="f-group"><h4>Category</h4>' +
          DB.CATEGORIES.map(c => '<a class="f-cat ' + (ShopState.cat === c.key ? 'on' : '') + '" data-action="go" data-href="#/shop?cat=' + c.key + '"><span>' + c.glyph + '</span>' + esc(c.name) + '</a>').join('') +
        '</div>' +
        '<div class="f-group"><h4>Sub-category</h4>' +
          '<div class="chip-row">' + (activeCat ? activeCat.subs.map(s => '<button class="chip ' + (ShopState.sub === s ? 'on' : '') + '" data-action="set-sub" data-sub="' + esc(s) + '">' + esc(s) + '</button>').join('') : '<small class="muted">Pick a category first</small>') + '</div>' +
        '</div>' +
        '<div class="f-group"><h4>Brand</h4>' +
          brandList.map(b => '<label class="f-check"><input type="checkbox" data-action="toggle-brand" data-brand="' + esc(b) + '" ' + checked(b) + '><span class="f-box"></span>' + esc(b) + '</label>').join('') +
        '</div>' +
        '<div class="f-group"><h4>Price range</h4>' +
          '<div class="price-inputs"><input type="number" id="priceMin" placeholder="Min" value="' + (ShopState.min ?? '') + '">—<input type="number" id="priceMax" placeholder="Max" value="' + (ShopState.max ?? '') + '">' +
          '<button class="btn btn-ghost btn-sm" data-action="apply-price">Apply</button></div>' +
        '</div>' +
        '<div class="f-group"><h4>Rating</h4>' +
          [4, 3, 2].map(r => '<label class="f-check"><input type="radio" name="fRating" data-action="set-rating" data-rating="' + r + '" ' + (ShopState.rating === r ? 'checked' : '') + '><span class="f-box"></span>' + r + '★ &amp; up</label>').join('') +
        '</div>' +
        '<label class="f-check f-avail"><input type="checkbox" data-action="toggle-avail" ' + (ShopState.avail ? 'checked' : '') + '><span class="f-box"></span>In stock only</label>' +
      '</aside>';

    const sortOptions = [
      ['featured', 'Featured'], ['price-asc', 'Price: Low → High'], ['price-desc', 'Price: High → Low'],
      ['rating', 'Top rated'], ['newest', 'Newest'],
    ];

    const toolbar =
      '<div class="shop-toolbar">' +
        '<p class="result-count"><strong>' + list.length + '</strong> product' + (list.length === 1 ? '' : 's') + '</p>' +
        '<label class="sort-label">Sort by<select id="sortSelect" data-action="set-sort">' +
          sortOptions.map(o => '<option value="' + o[0] + '" ' + (ShopState.sort === o[0] ? 'selected' : '') + '>' + o[1] + '</option>').join('') +
        '</select></label>' +
        '<button class="btn btn-ghost btn-sm filter-toggle" data-action="toggle-filters">☰ Filters</button>' +
      '</div>';

    const empty =
      '<div class="empty-state"><span>🔍</span><h3>No products found</h3><p>Try adjusting your filters or search terms.</p><button class="btn btn-primary" data-action="clear-filters">Clear filters</button></div>';

    return '<section class="shop-head">' +
      '<nav class="crumbs">' + crumb('Home', '#/') + crumb(title, '#') + '</nav>' +
      '<h1>' + title + '</h1><p class="muted">' + (activeCat ? activeCat.tagline : 'Every gadget we carry, filtered to your taste.') + '</p>' +
      '</section>' +
      '<div class="shop-layout">' + filters +
      '<div class="shop-main">' + toolbar +
        '<div class="prod-grid" id="shopGrid">' + (list.length ? list.map(productCard).join('') : empty) + '</div>' +
      '</div></div>';
  }

  function crumb(label, href) {
    return href === '#' ? '<span class="crumb-current">' + label + '</span>' : '<a data-action="go" data-href="' + href + '">' + label + '</a>';
  }

  /* ================= PRODUCT ================= */
  function productView(p) {
    const inCart = Store.state.cart.find(i => i.id === p.id);
    const cat = DB.CATEGORIES.find(c => c.key === p.category);
    const revs = DB.reviews(p);
    const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

    const specs = Object.entries(p.specs).map(([k, v]) => '<tr><td>' + esc(k) + '</td><td>' + esc(v) + '</td></tr>').join('');

    const reviews = revs.map(r =>
      '<div class="review">' +
        '<div class="review-avatar">' + esc(r.user[0]) + '</div>' +
        '<div class="review-body">' +
          '<div class="review-top"><strong>' + esc(r.user) + '</strong><span class="muted">' + r.date + '</span></div>' +
          '<div>' + stars(r.rating) + '</div>' +
          '<h5>' + esc(r.title) + '</h5>' +
          '<p>' + esc(r.body) + '</p>' +
        '</div>' +
      '</div>').join('');

    const related = DB.PRODUCTS.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);

    return '<nav class="crumbs">' + crumb('Home', '#/') + crumb(cat.name, '#/shop?cat=' + p.category) + crumb(p.sub, '#/shop?cat=' + p.category + '&sub=' + encodeURIComponent(p.sub)) + crumb(p.name, '#') + '</nav>' +
    '<section class="product-page">' +
      '<div class="pp-media">' +
        '<div class="zoom-stage" id="zoomStage">' +
          '<img id="zoomImg" src="' + DB.image(p, 800, 600) + '" alt="' + esc(p.name) + '" draggable="false">' +
          '<span class="zoom-hint">Hover to zoom</span>' +
        '</div>' +
        '<div class="pp-thumbs">' +
          [DB.image(p, 800, 600), DB.image(p, 800, 600), DB.image(p, 800, 600)].map((src, i) =>
            '<button class="pp-thumb on" data-action="set-thumb" data-src="' + src + '"><img src="' + src + '" alt="View ' + (i + 1) + '"></button>'
          ).join('') +
        '</div>' +
      '</div>' +
      '<div class="pp-info">' +
        '<div class="pp-badges">' +
          '<span class="pp-brand">' + esc(p.brand) + '</span>' +
          (p.badge ? '<span class="card-badge b-' + (p.badge === 'TOP DEAL' ? 'deal' : 'new') + '">' + p.badge + '</span>' : '') +
          (p.isNew ? '<span class="card-badge b-new">NEW</span>' : '') +
        '</div>' +
        '<h1>' + esc(p.name) + '</h1>' +
        '<div class="pp-rating"><a href="#pp-reviews" data-action="scroll-to" data-target="#pp-reviews">' + stars(p.rating) + ' <strong>' + p.rating.toFixed(1) + '</strong> <span class="muted">(' + p.reviews + ' reviews)</span></a></div>' +
        (p.desc ? '<p class="pp-desc">' + esc(p.desc) + '</p>' : '') +
        '<div class="pp-price-row">' +
          '<span class="pp-price">' + money(p.price) + '</span>' +
          (p.oldPrice ? '<span class="pp-was">' + money(p.oldPrice) + '</span><span class="pp-off">Save ' + off + '%</span>' : '') +
        '</div>' +
        '<div class="pp-stock ' + (p.stock > 0 ? 'in' : 'out') + '">' +
          (p.stock === 0 ? '○ Out of stock' : p.stock < 10 ? '● Only ' + p.stock + ' left — order soon' : '● In stock · Ships in 24h') +
        '</div>' +
        '<ul class="pp-points">' +
          '<li>✓ Free shipping over ' + money(DB.FREE_SHIP_THRESHOLD) + '</li>' +
          '<li>✓ 30-day free returns</li>' +
          '<li>✓ 2-year warranty</li>' +
        '</ul>' +
        '<div class="pp-buy">' +
          '<div class="qty-stepper" id="ppQty">' +
            '<button data-action="qty-dec" aria-label="Decrease">−</button><span>1</span><button data-action="qty-inc" aria-label="Increase">+</button>' +
          '</div>' +
          '<button class="btn btn-primary btn-lg flex1" data-action="add-cart" data-id="' + p.id + '" ' + (p.stock === 0 ? 'disabled' : '') + '>Add to cart</button>' +
          '<button class="btn btn-ghost btn-lg" data-action="buy-now" data-id="' + p.id + '" ' + (p.stock === 0 ? 'disabled' : '') + '>Buy now</button>' +
          '<button class="icon-btn wish-btn pp-wish ' + (Store.inWishlist(p.id) ? 'active' : '') + '" data-action="wish-toggle" data-id="' + p.id + '" aria-label="Wishlist">' +
            (Store.inWishlist(p.id) ? '❤️' : '🤍') + '</button>' +
        '</div>' +
        '<p class="muted small">SKU: ' + p.id.toUpperCase() + ' · Category: ' + esc(cat.name) + '</p>' +
      '</div>' +
    '</section>' +
    '<section class="pp-tabs">' +
      '<div class="pp-tab-head">' +
        '<button class="pp-tab on" data-action="tab" data-tab="specs">Specifications</button>' +
        '<button class="pp-tab" data-action="tab" data-tab="reviews">Reviews (' + p.reviews + ')</button>' +
        '<button class="pp-tab" data-action="tab" data-tab="ship">Shipping &amp; Returns</button>' +
      '</div>' +
      '<div class="pp-tab-body" data-panel="specs">' +
        '<table class="spec-table">' + specs + '</table>' +
      '</div>' +
      '<div class="pp-tab-body" data-panel="reviews" hidden>' +
        '<div id="pp-reviews" class="reviews-wrap">' + reviews +
          '<form class="review-form" data-action="review-submit" data-id="' + p.id + '">' +
            '<h4>Write a review</h4>' +
            '<div class="rf-grid">' +
              '<input id="rvName" placeholder="Your name" required>' +
              '<div class="rf-stars" id="rfStars">' + [1,2,3,4,5].map(i => '<button type="button" data-action="rv-star" data-val="' + i + '">★</button>').join('') + '</div>' +
            '</div>' +
            '<input id="rvTitle" placeholder="Review title" required>' +
            '<textarea id="rvBody" rows="3" placeholder="Share your experience…" required></textarea>' +
            '<button class="btn btn-primary" type="submit">Submit review</button>' +
          '</form>' +
        '</div>' +
      '</div>' +
      '<div class="pp-tab-body" data-panel="ship" hidden>' +
        '<div class="ship-grid">' +
          '<div class="ship-card"><span>🚚</span><h4>Delivery</h4><p>Free shipping over ' + money(DB.FREE_SHIP_THRESHOLD) + ' (else ' + money(DB.SHIPPING_FLAT) + '). Dispatched within 24h, delivered in 2–4 business days.</p></div>' +
          '<div class="ship-card"><span>↩️</span><h4>Returns</h4><p>30-day hassle-free returns. Full refund within 5 days of us receiving the item.</p></div>' +
          '<div class="ship-card"><span>🛡️</span><h4>Warranty</h4><p>Every product includes a 2-year warranty covering manufacturing defects.</p></div>' +
        '</div>' +
      '</div>' +
    '</section>' +
    (related.length ? '<section class="section"><div class="section-head"><h2>You may also like</h2></div><div class="prod-grid">' + related.map(productCard).join('') + '</div></section>' : '');
  }

  function bindProductPage() {
    const stage = $('#zoomStage');
    if (!stage) return;
    const img = $('#zoomImg');
    let zoomed = false;
    if (window.matchMedia('(hover: hover)').matches) {
      stage.addEventListener('mousemove', e => {
        const r = stage.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        img.style.transformOrigin = x + '% ' + y + '%';
      });
      stage.addEventListener('mouseenter', () => { zoomed = true; img.classList.add('zoomed'); });
      stage.addEventListener('mouseleave', () => { zoomed = false; img.classList.remove('zoomed'); });
    } else {
      stage.addEventListener('click', () => {
        zoomed = !zoomed;
        img.classList.toggle('zoomed', zoomed);
        $('#zoomStage .zoom-hint').textContent = zoomed ? 'Tap to zoom out' : 'Tap to zoom';
      });
    }
  }

  function bindReviewForm() {
    const rf = $('#rfStars');
    if (!rf) return;
    rf.dataset.val = '5';
    rf.querySelectorAll('button').forEach(b => b.classList.add('on'));
    rf.addEventListener('click', e => {
      const btn = e.target.closest('[data-action="rv-star"]');
      if (!btn) return;
      rf.dataset.val = btn.dataset.val;
      rf.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.val <= +btn.dataset.val));
    });
  }

  /* ================= ACCOUNT ================= */
  function accountView() {
    const user = Store.currentUser();
    if (!user) {
      return '<section class="auth-landing">' +
        '<div class="auth-hero"><span>👋</span><h1>Welcome to your RockTech account</h1>' +
        '<p>Track orders, manage addresses, save wishlists and speed through checkout.</p>' +
        '<button class="btn btn-primary btn-lg" data-action="open-login">Sign in / Register</button>' +
        '<div class="auth-perks">' +
          '<span>📦 Order tracking</span><span>💳 One-tap checkout</span><span>❤️ Wishlists</span>' +
        '</div></div>' +
        '<div class="auth-aside">' +
          '<h3>Why create an account?</h3>' +
          '<ul><li><strong>Faster checkout</strong> — saved addresses &amp; cards</li>' +
          '<li><strong>Order tracking</strong> — live status and timeline</li>' +
          '<li><strong>Wishlist</strong> — save gadgets for later</li>' +
          '<li><strong>Deal alerts</strong> — early access to sales</li></ul>' +
        '</div>' +
      '</section>';
    }
    return dashboardView(user);
  }

  function dashboardView(user) {
    const userOrders = Store.state.orders.filter(o => o.user === user.id);
    const wishlistItems = Store.state.wishlist.map(DB.byId).filter(Boolean);
    const avatar = '<div class="dash-avatar" style="background:' + user.avatarColor + '">' + esc((user.name || 'U')[0].toUpperCase()) + '</div>';

    const tabs = [
      ['overview', '📊', 'Overview'],
      ['orders', '📦', 'Orders'],
      ['wishlist', '❤️', 'Wishlist'],
      ['addresses', '📍', 'Addresses'],
      ['payments', '💰', 'Wallets'],
      ['settings', '⚙️', 'Settings'],
    ];

    return '<section class="dash">' +
      '<div class="dash-head">' + avatar +
        '<div><h1>Hello, ' + esc(user.name.split(' ')[0]) + ' 👋</h1><p class="muted">Manage your account and orders</p></div>' +
        '<button class="btn btn-ghost btn-sm ml-auto" data-action="logout">Sign out</button>' +
      '</div>' +
      '<div class="dash-body">' +
        '<aside class="dash-nav">' +
          tabs.map((t, i) => '<button class="dash-tab ' + (i === 0 ? 'on' : '') + '" data-action="dash-tab" data-tab="' + t[0] + '"><span>' + t[1] + '</span>' + t[2] + '</button>').join('') +
        '</aside>' +
        '<div class="dash-panel" id="dashPanel">' + dashOverview(user, userOrders, wishlistItems) + '</div>' +
      '</div>' +
    '</section>';
  }

  function dashOverview(user, orders, wishlist) {
    const spend = orders.reduce((s, o) => s + o.totals.total, 0);
    return '<div class="dash-cards">' +
      '<div class="dash-card"><span>📦</span><strong>' + orders.length + '</strong><small>Orders</small></div>' +
      '<div class="dash-card"><span>💸</span><strong>' + money(spend) + '</strong><small>Total spent</small></div>' +
      '<div class="dash-card"><span>❤️</span><strong>' + wishlist.length + '</strong><small>Wishlist</small></div>' +
      '<div class="dash-card"><span>📍</span><strong>' + user.addresses.length + '</strong><small>Addresses</small></div>' +
    '</div>' +
    '<div class="dash-section"><div class="section-head"><h3>Recent orders</h3>' +
      (orders.length ? '<button class="btn btn-ghost btn-sm" data-action="dash-tab" data-tab="orders">View all</button>' : '') + '</div>' +
      (orders.length ? '<div class="order-list">' + orders.slice(0, 3).map(orderCard).join('') + '</div>'
        : '<div class="empty-state sm"><span>🛍️</span><h3>No orders yet</h3><p>Your purchases will appear here.</p><a class="btn btn-primary" data-action="go" data-href="#/shop">Start shopping</a></div>') +
    '</div>';
  }

  function orderCard(o) {
    const first = o.items[0];
    const more = o.items.length - 1;
    return '<a class="order-card" data-action="go" data-href="#/order/' + o.id + '">' +
      '<img class="order-thumb" src="' + DB.image({ ...first, grad: first.grad }, 120, 90) + '" alt="">' +
      '<div class="order-info">' +
        '<div class="order-id"><strong>' + o.id + '</strong><span class="order-status ok">● ' + o.status + '</span></div>' +
        '<p class="muted">' + new Date(o.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
        (more ? ' · +' + more + ' more item' + (more > 1 ? 's' : '') : '') + '</p>' +
      '</div>' +
      '<strong class="order-total">' + money(o.totals.total) + '</strong>' +
    '</a>';
  }

  function dashOrders(user) {
    const orders = Store.state.orders.filter(o => o.user === user.id);
    return '<div class="section-head"><h3>All orders</h3></div>' +
      (orders.length ? '<div class="order-list">' + orders.map(orderCard).join('') + '</div>'
        : '<div class="empty-state sm"><span>🛍️</span><h3>No orders yet</h3><p>When you place an order it will show up here with live tracking.</p><a class="btn btn-primary" data-action="go" data-href="#/shop">Browse gadgets</a></div>');
  }

  function dashWishlist(user) {
    const items = Store.state.wishlist.map(DB.byId).filter(Boolean);
    return '<div class="section-head"><h3>My wishlist</h3></div>' +
      (items.length ? '<div class="prod-grid compact">' + items.map(productCard).join('') + '</div>'
        : '<div class="empty-state sm"><span>🤍</span><h3>Nothing saved yet</h3><p>Tap the heart on any product to save it here.</p><a class="btn btn-primary" data-action="go" data-href="#/shop">Find favorites</a></div>');
  }

  function dashAddresses(user) {
    return '<div class="section-head"><h3>Saved addresses</h3><button class="btn btn-primary btn-sm" data-action="address-form">+ Add address</button></div>' +
      '<div class="addr-grid">' +
        (user.addresses.length ? user.addresses.map((a, i) =>
          '<div class="addr-card">' +
            '<div class="addr-actions">' +
              '<button class="icon-btn sm" data-action="address-form" data-index="' + i + '" aria-label="Edit">✏️</button>' +
              '<button class="icon-btn sm" data-action="address-remove" data-index="' + i + '" aria-label="Delete">🗑️</button>' +
            '</div>' +
            '<strong>' + esc(a.fullName) + '</strong>' +
            '<p class="muted">' + esc(a.line1) + '<br>' + (a.line2 ? esc(a.line2) + '<br>' : '') + esc(a.city) + ', ' + esc(a.state) + ' ' + esc(a.zip) + '<br>' + esc(a.country) + '</p>' +
            '<span class="addr-tag">' + (a.label || 'Home') + '</span>' +
          '</div>').join('') : '<div class="empty-state sm"><span>📍</span><h3>No saved addresses</h3><p>Add one for faster checkout.</p></div>') +
      '</div>';
  }

  function dashPayments(user) {
    const wallets = user.wallets || [];
    return '<div class="section-head"><h3>My payment wallets</h3><button class="btn btn-primary btn-sm" data-action="wallet-form">+ Add wallet</button></div>' +
      '<div class="wallet-grid">' +
        (wallets.length ? wallets.map((w, i) =>
          '<div class="wallet-card w-' + (w.method === 'nagad' ? 'nagad' : 'bkash') + '">' +
            '<div class="w-brand">' + (w.method === 'nagad' ? '🟠 Nagad' : '🔴 bKash') + '</div>' +
            '<div class="w-num">' + esc(w.number) + '</div>' +
            '<div class="w-foot"><span>Personal · sender</span>' +
              '<button class="icon-btn sm" data-action="wallet-remove" data-index="' + i + '" aria-label="Remove">🗑️</button>' +
            '</div>' +
          '</div>').join('') : '<div class="empty-state sm"><span>💰</span><h3>No saved wallets</h3><p>Save your bKash / Nagad number for faster checkout.</p></div>') +
      '</div>' +
      '<div class="wallet-hint"><p class="muted small">Our merchant number for bKash &amp; Nagad (personal):</p><strong class="merchant-num">' + DB.MERCHANT_NUMBER + '</strong></div>';
  }

  function dashSettings(user) {
    return '<div class="section-head"><h3>Profile settings</h3></div>' +
      '<div class="settings-grid">' +
        '<form class="panel-form" data-action="profile-save">' +
          '<h4>Profile</h4>' +
          '<label>Full name<input id="pfName" value="' + esc(user.name) + '" required></label>' +
          '<label>Email<input id="pfEmail" type="email" value="' + esc(user.email || '') + '" required></label>' +
          '<label>Phone<input id="pfPhone" value="' + esc(user.phone || '') + '" placeholder="+1 555 000 1234"></label>' +
          '<button class="btn btn-primary" type="submit">Save changes</button>' +
        '</form>' +
        '<form class="panel-form" data-action="password-save">' +
          '<h4>Change password</h4>' +
          '<label>Current password<input id="pwOld" type="password" required></label>' +
          '<label>New password<input id="pwNew" type="password" minlength="6" required></label>' +
          '<label>Confirm new<input id="pwNew2" type="password" required></label>' +
          '<button class="btn btn-primary" type="submit">Update password</button>' +
        '</form>' +
      '</div>' +
      '<div class="settings-danger">' +
        '<div><h4>Session &amp; data</h4><p class="muted">Sign out of this device, or remove this demo account entirely.</p></div>' +
        '<button class="btn btn-danger" data-action="delete-account">Delete account</button>' +
      '</div>';
  }

  /* ================= ORDERS ================= */
  function orderView(id) {
    const o = Store.state.orders.find(x => x.id === id);
    if (!o) return notFoundView('Order not found');
    const statuses = ['Order placed', 'Processing', 'Shipped', 'Out for delivery', 'Delivered'];
    const stage = Math.min(statuses.length - 1, Math.max(0, Math.floor((Date.now() - new Date(o.date)) / 864e5) + 1));
    const timeline = statuses.map((s, i) =>
      '<div class="tl-step ' + (i <= stage ? 'done' : '') + '">' +
        '<div class="tl-dot">' + (i <= stage ? '✓' : '·') + '</div>' +
        '<div><strong>' + s + '</strong><small class="muted">' + (i <= stage ? (i === 0 ? new Date(o.date).toLocaleDateString() : 'Estimated') : 'Pending') + '</small></div>' +
      '</div>').join('');

    return '<nav class="crumbs">' + crumb('Home', '#/') + crumb('My account', '#/account') + crumb('Order ' + o.id, '#') + '</nav>' +
      '<section class="order-page">' +
        '<div class="order-page-head">' +
          '<div><h1>Order ' + o.id + '</h1><p class="muted">Placed ' + new Date(o.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '</p></div>' +
          '<span class="order-status ok">● ' + o.status + '</span>' +
        '</div>' +
        '<div class="tracking-card"><div class="tracking-head"><span>🚚 Tracking #' + o.tracking + '</span></div>' + timeline + '</div>' +
        '<div class="order-detail-grid">' +
          '<div class="panel-form">' +
            '<h4>Items</h4>' +
            o.items.map(i =>
              '<div class="o-item">' +
                '<img src="' + DB.image(i, 120, 90) + '" alt="">' +
                '<div><strong>' + esc(i.name) + '</strong><p class="muted">Qty ' + i.qty + ' × ' + money(i.price) + '</p></div>' +
                '<strong>' + money(i.price * i.qty) + '</strong>' +
              '</div>').join('') +
          '</div>' +
          '<div class="panel-form">' +
            '<h4>Summary</h4>' +
            '<div class="t-row"><span>Subtotal</span><span>' + money(o.totals.sub) + '</span></div>' +
            (o.totals.discount ? '<div class="t-row t-discount"><span>Discount</span><span>−' + money(o.totals.discount) + '</span></div>' : '') +
            '<div class="t-row"><span>Shipping</span><span>' + (o.totals.shipping ? money(o.totals.shipping) : 'FREE') + '</span></div>' +
            '<div class="t-row"><span>Tax</span><span>' + money(o.totals.tax) + '</span></div>' +
            '<div class="t-row t-total"><span>Total</span><span>' + money(o.totals.total) + '</span></div>' +
            '<hr>' +
            '<h4>Ship to</h4><p class="muted">' + esc(o.shipping.fullName) + '<br>' + esc(o.shipping.line1) + '<br>' + esc(o.shipping.city) + ', ' + esc(o.shipping.state) + ' ' + esc(o.shipping.zip) + '<br>' + esc(o.shipping.country) + '</p>' +
            '<h4>Payment</h4><p class="muted">' + esc(o.payment.label) + '</p>' +
          '</div>' +
        '</div>' +
      '</section>';
  }

  function notFoundView(msg = 'Page not found') {
    return '<section class="empty-state page"><span>🧭</span><h1>' + msg + '</h1><p>The page you\'re looking for doesn\'t exist.</p><a class="btn btn-primary" data-action="go" data-href="#/">Back to home</a></section>';
  }

  /* ================= AUTH MODAL ================= */
  function openLoginModal() {
    openModal(
      '<div class="auth-modal">' +
        '<button class="icon-btn modal-x" data-action="close-modal" aria-label="Close">✕</button>' +
        '<div class="auth-brand"><span class="brand-mark">' +
          '<svg viewBox="0 0 32 32" width="30" height="30"><path d="M16 2 4 8v8c0 7.4 5 12.9 12 14 7-1.1 12-6.6 12-14V8L16 2z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M11 16l3.5 3.5L21 12.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>' +
        '</span></div>' +
        '<div class="auth-tabs">' +
          '<button class="auth-tab on" data-action="auth-tab" data-tab="login">Sign in</button>' +
          '<button class="auth-tab" data-action="auth-tab" data-tab="register">Create account</button>' +
        '</div>' +
        '<div class="auth-pane" id="authPane">' + loginPane() + '</div>' +
        '<div class="auth-social">' +
          '<div class="or-divider"><span>or continue with</span></div>' +
          '<button class="btn btn-social" data-action="social-login" data-provider="Google">' +
            '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h5.9c-.3 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.3z" fill="#4285F4"/><path d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.2-1.9-6-4.4H2.3v2.9C4 20.9 7.7 23 12 23z" fill="#34A853"/><path d="M6 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.8H2.3C1.5 8.4 1 10.1 1 12s.5 3.6 1.3 5.2L6 14.3z" fill="#FBBC05"/><path d="M12 5.3c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 1.8 14.9.8 12 .8 7.7.8 4 2.9 2.3 6.8l3.7 2.9C6.8 7.2 9.2 5.3 12 5.3z" fill="#EA4335"/></svg>Google' +
          '</button>' +
          '<button class="btn btn-social" data-action="social-login" data-provider="Apple">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.4 12.9c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.2.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.5 2.2 2.6 2.1 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4 0 0-2.1-.8-2-3.6zM14.1 6.4c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1.1 1.6-.9 2.6 1 0 1.9-.5 2.5-1.2z"/></svg>Apple' +
          '</button>' +
        '</div>' +
      '</div>', 'auth');
  }

  function loginPane() {
    return '<form data-action="auth-submit" novalidate>' +
      '<label>Email or phone<input id="liId" placeholder="you@email.com or +1 555 000 1234" required></label>' +
      '<label>Password<input id="liPw" type="password" placeholder="••••••••" required></label>' +
      '<button class="btn btn-primary btn-block" type="submit">Sign in</button>' +
      '<button type="button" class="link-btn" data-action="otp-login">Use phone OTP instead →</button>' +
    '</form>';
  }

  function registerPane() {
    return '<form data-action="auth-submit" novalidate>' +
      '<label>Full name<input id="rgName" placeholder="Jordan Lee" required></label>' +
      '<div class="rf-grid">' +
        '<label>Email<input id="rgEmail" type="email" placeholder="you@email.com" required></label>' +
        '<label>Phone<input id="rgPhone" placeholder="+1 555 000 1234"></label>' +
      '</div>' +
      '<div class="rf-grid">' +
        '<label>Password<input id="rgPw" type="password" placeholder="Min 6 characters" minlength="6" required></label>' +
        '<label>Confirm<input id="rgPw2" type="password" placeholder="Repeat password" required></label>' +
      '</div>' +
      '<button class="btn btn-primary btn-block" type="submit">Create account</button>' +
    '</form>';
  }

  function otpPane() {
    return '<div>' +
      '<p class="muted small">We\'ll text you a 6-digit code. Demo hint: code is <strong>123456</strong>.</p>' +
      '<label>Phone number<input id="otpPhone" placeholder="+1 555 000 1234" required></label>' +
      '<button class="btn btn-primary btn-block" data-action="otp-send">Send code</button>' +
      '<button type="button" class="link-btn" data-action="auth-tab" data-tab="login">← Back to sign in</button>' +
    '</div>';
  }

  function otpVerifyPane(phone) {
    return '<div>' +
      '<p class="muted small">Code sent to <strong>' + esc(phone) + '</strong>. Enter it below.</p>' +
      '<label>6-digit code<input id="otpCode" inputmode="numeric" maxlength="6" placeholder="123456" required></label>' +
      '<button class="btn btn-primary btn-block" data-action="otp-verify">Verify &amp; sign in</button>' +
      '<button type="button" class="link-btn" data-action="otp-send">Resend code</button>' +
    '</div>';
  }

  function addressFormModal(index) {
    const user = Store.currentUser();
    const a = index != null ? user.addresses[index] : null;
    openModal(
      '<div class="form-modal">' +
        '<button class="icon-btn modal-x" data-action="close-modal" aria-label="Close">✕</button>' +
        '<h2>' + (a ? 'Edit address' : 'Add address') + '</h2>' +
        '<form data-action="address-save" data-index="' + (index ?? '') + '" novalidate>' +
          '<label>Full name<input id="adName" value="' + esc(a ? a.fullName : '') + '" required></label>' +
          '<label>Address line 1<input id="adLine1" value="' + esc(a ? a.line1 : '') + '" required></label>' +
          '<label>Address line 2<input id="adLine2" value="' + esc(a ? a.line2 : '') + '"></label>' +
          '<div class="rf-grid">' +
            '<label>City<input id="adCity" value="' + esc(a ? a.city : '') + '" required></label>' +
            '<label>State<input id="adState" value="' + esc(a ? a.state : '') + '"></label>' +
          '</div>' +
          '<div class="rf-grid">' +
            '<label>ZIP / Postal<input id="adZip" value="' + esc(a ? a.zip : '') + '" required></label>' +
            '<label>Country<select id="adCountry">' + countries() + '</select></label>' +
          '</div>' +
          '<label>Label<input id="adLabel" placeholder="Home / Work" value="' + esc(a ? a.label : '') + '"></label>' +
          '<button class="btn btn-primary btn-block" type="submit">Save address</button>' +
        '</form>' +
      '</div>', 'form');
  }

  function walletFormModal(index) {
    const user = Store.currentUser();
    const w = index != null ? (user.wallets || [])[index] : null;
    openModal(
      '<div class="form-modal">' +
        '<button class="icon-btn modal-x" data-action="close-modal" aria-label="Close">✕</button>' +
        '<h2>' + (w ? 'Edit wallet' : 'Add wallet') + '</h2>' +
        '<form data-action="wallet-save" data-index="' + (index ?? '') + '" novalidate>' +
          '<label>Wallet type<select id="wdMethod">' +
            '<option value="bkash" ' + (!w || w.method === 'bkash' ? 'selected' : '') + '>🔴 bKash</option>' +
            '<option value="nagad" ' + (w && w.method === 'nagad' ? 'selected' : '') + '>🟠 Nagad</option>' +
          '</select></label>' +
          '<label>Your ' + (w && w.method === 'nagad' ? 'Nagad' : 'bKash') + ' number<input id="wdNumber" placeholder="01XXXXXXXXX" value="' + esc(w ? w.number : '') + '" required></label>' +
          '<button class="btn btn-primary btn-block" type="submit">Save wallet</button>' +
        '</form>' +
      '</div>', 'form');
  }

  function countries() {
    const list = ['Bangladesh', 'United States', 'Canada', 'United Kingdom', 'India', 'Saudi Arabia', 'UAE', 'Singapore', 'Other'];
    return list.map(c => '<option>' + c + '</option>').join('');
  }

  /* ================= ACTIONS ================= */
  const Actions = {

    go(el) { const href = el.dataset.href || el.getAttribute('href'); if (href) location.hash = href; },

    'toggle-menu'() { toggleMobileMenu(); },
    'toggle-cats'(el) {
      const open = !$('#megaMenu').classList.contains('open');
      $('#megaMenu').classList.toggle('open', open);
      el.setAttribute('aria-expanded', String(open));
    },
    theme() { toggleTheme(); },
    'open-cart'() { toggleCart(true); },
    'close-cart'() { toggleCart(false); },
    'close-cart-and-shop'() { toggleCart(false); location.hash = '#/shop'; },

    'add-cart'(el) {
      const id = el.dataset.id;
      const p = DB.byId(id);
      if (!p || p.stock <= 0) return toast('This item is out of stock', 'error');
      Store.addToCart(id);
      toast('✓ ' + p.name.split(' ').slice(0, 3).join(' ') + '… added to cart', 'success');
      toggleCart(true);
    },
    'buy-now'(el) {
      const id = el.dataset.id;
      const p = DB.byId(id);
      if (!p || p.stock <= 0) return toast('This item is out of stock', 'error');
      Store.addToCart(id);
      toast('✓ Added to cart — continuing to checkout', 'success');
      location.hash = '#/checkout';
    },
    'cart-inc'(el) { const i = Store.state.cart.find(x => x.id === el.dataset.id); if (i) Store.setQty(i.id, i.qty + 1); },
    'cart-dec'(el) { const i = Store.state.cart.find(x => x.id === el.dataset.id); if (i) Store.setQty(i.id, i.qty - 1); },
    'cart-remove'(el) { Store.setQty(el.dataset.id, 0); toast('Removed from cart'); },

    'apply-promo'() {
      const code = $('#promoInput').value.trim().toUpperCase();
      if (!code) return;
      if (DB.COUPONS[code]) {
        const c = DB.COUPONS[code];
        if (c.min && Store.cartSubtotal() < c.min) return toast('This code needs a minimum order of ' + money(c.min), 'error');
        Store.state.promo = code;
        UI.renderCartDrawer();
        toast('🎉 Code ' + code + ' applied — ' + c.desc, 'success');
      } else toast('Code "' + code + '" is invalid', 'error');
    },
    'go-checkout'() { toggleCart(false); location.hash = '#/checkout'; },

    'wish-toggle'(el) {
      Store.toggleWishlist(el.dataset.id);
      const active = Store.inWishlist(el.dataset.id);
      el.classList.toggle('active', active);
      if (el.innerHTML.indexOf('svg') >= 0) {
        el.innerHTML = active
          ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 21s-7.5-4.7-10-9.2C.4 8.7 2.2 5 5.8 5c2 0 3.5 1.1 4.2 2.5h4c.7-1.4 2.2-2.5 4.2-2.5 3.6 0 5.4 3.8 6.8-2.5 4.5-10 9.2-10 9.2z"/></svg>'
          : '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 21s-7.5-4.7-10-9.2C.4 8.7 2.2 5 5.8 5c2 0 3.5 1.1 4.2 2.5h4c.7-1.4 2.2-2.5 4.2-2.5 3.6 0 5.4 3.8 6.8-2.5 4.5-10 9.2-10 9.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
      } else {
        el.innerHTML = active ? '❤️' : '🤍';
      }
      toast(active ? 'Saved to wishlist ❤️' : 'Removed from wishlist');
    },

    'open-login'() { openLoginModal(); },
    'close-modal'() { closeModal(); },

    'auth-tab'(el) {
      const tab = el.dataset.tab;
      document.querySelectorAll('.auth-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      $('#authPane').innerHTML = tab === 'login' ? loginPane() : registerPane();
    },
    'otp-login'() { $('#authPane').innerHTML = otpPane(); },

    'auth-submit'(e, el) {
      e.preventDefault();
      const isLogin = !!$('#liId');
      if (isLogin) {
        const id = $('#liId').value.trim();
        const pw = $('#liPw').value;
        if (!id || !pw) return toast('Please fill in all fields', 'error');
        const res = Store.loginByIdentifier(id, pw);
        if (res.error) return toast(res.error, 'error');
        afterLogin(res.user);
      } else {
        const name = $('#rgName').value.trim();
        const email = $('#rgEmail').value.trim();
        const phone = $('#rgPhone').value.trim();
        const pw = $('#rgPw').value;
        const pw2 = $('#rgPw2').value;
        if (!name || !email || !pw) return toast('Please fill in all required fields', 'error');
        if (pw !== pw2) return toast('Passwords do not match', 'error');
        if (Store.state.users.some(u => u.email === email)) return toast('An account with this email already exists', 'error');
        const user = Store.register({ name, email, phone, password: pw });
        afterLogin(user, true);
      }
    },

    'social-login'(el) {
      const user = Store.socialLogin(el.dataset.provider, null);
      afterLogin(user);
    },

    'otp-send'(e, el) {
      e.preventDefault();
      const phone = $('#otpPhone').value.trim();
      if (!/^\+?[0-9\s\-()]{7,}$/.test(phone)) return toast('Enter a valid phone number', 'error');
      const user = Store.state.users.find(u => u.phone === phone);
      if (!user) {
        const created = Store.register({ name: 'OTP User ' + phone.slice(-4), email: '', phone, password: null });
        Store.state.session = null; Store.save('novahub_session', null);
      }
      Store.state.otpPending = { phone, code: '123456', expires: Date.now() + 300000 };
      toast('📲 Demo OTP sent — use 123456', 'info');
      $('#authPane').innerHTML = otpVerifyPane(phone);
    },
    'otp-verify'(e, el) {
      e.preventDefault();
      const code = $('#otpCode').value.trim();
      const pending = Store.state.otpPending;
      if (!pending || Date.now() > pending.expires) return toast('Code expired — request a new one', 'error');
      if (code !== pending.code) return toast('Incorrect code', 'error');
      let user = Store.state.users.find(u => u.phone === pending.phone);
      if (!user) user = Store.register({ name: 'OTP User', phone: pending.phone, password: null });
      else { Store.state.session = user.id; Store.save('novahub_session', user.id); }
      Store.state.otpPending = null;
      afterLogin(user);
    },

    logout() {
      Store.logout();
      toast('Signed out. See you soon! 👋');
      location.hash = '#/account';
      navigate();
    },

    'dash-tab'(el) {
      const user = Store.currentUser();
      const tab = el.dataset.tab;
      document.querySelectorAll('.dash-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      const panel = $('#dashPanel');
      const map = {
        overview: () => dashOverview(user, Store.state.orders.filter(o => o.user === user.id), Store.state.wishlist.map(DB.byId).filter(Boolean)),
        orders: () => dashOrders(user),
        wishlist: () => dashWishlist(user),
        addresses: () => dashAddresses(user),
        payments: () => dashPayments(user),
        settings: () => dashSettings(user),
      };
      panel.innerHTML = map[tab]();
    },

    'address-form'(el) { addressFormModal(el.dataset.index != null ? +el.dataset.index : null); },
    'address-save'(e, el) {
      e.preventDefault();
      const user = Store.currentUser();
      const idx = el.dataset.index;
      const addr = {
        fullName: $('#adName').value.trim(), line1: $('#adLine1').value.trim(), line2: $('#adLine2').value.trim(),
        city: $('#adCity').value.trim(), state: $('#adState').value.trim(), zip: $('#adZip').value.trim(),
        country: $('#adCountry').value, label: $('#adLabel').value.trim() || 'Home',
      };
      if (!addr.fullName || !addr.line1 || !addr.city || !addr.zip) return toast('Please fill in required fields', 'error');
      if (idx !== '') user.addresses[+idx] = addr; else user.addresses.push(addr);
      Store.updateUser({ addresses: user.addresses });
      closeModal();
      toast('✓ Address saved');
      Actions['dash-tab']({ dataset: { tab: 'addresses' } });
    },
    'address-remove'(el) {
      const user = Store.currentUser();
      user.addresses.splice(+el.dataset.index, 1);
      Store.updateUser({ addresses: user.addresses });
      Actions['dash-tab']({ dataset: { tab: 'addresses' } });
    },

    'wallet-form'(el) { walletFormModal(el.dataset.index != null ? +el.dataset.index : null); },
    'wallet-save'(e, el) {
      e.preventDefault();
      const user = Store.currentUser();
      const idx = el.dataset.index;
      const method = $('#wdMethod').value;
      const number = $('#wdNumber').value.trim();
      if (!/^01[3-9]\d{8}$/.test(number)) return toast('Enter a valid ' + (method === 'nagad' ? 'Nagad' : 'bKash') + ' number (01XXXXXXXXX)', 'error');
      user.wallets = user.wallets || [];
      const wallet = { method, number };
      if (idx !== '') user.wallets[+idx] = wallet; else user.wallets.push(wallet);
      Store.updateUser({ wallets: user.wallets });
      closeModal();
      toast('✓ Wallet saved');
      Actions['dash-tab']({ dataset: { tab: 'payments' } });
    },
    'wallet-remove'(el) {
      const user = Store.currentUser();
      user.wallets = user.wallets || [];
      user.wallets.splice(+el.dataset.index, 1);
      Store.updateUser({ wallets: user.wallets });
      Actions['dash-tab']({ dataset: { tab: 'payments' } });
    },

    'profile-save'(e) {
      e.preventDefault();
      const user = Store.currentUser();
      Store.updateUser({ name: $('#pfName').value.trim(), email: $('#pfEmail').value.trim(), phone: $('#pfPhone').value.trim() });
      toast('✓ Profile updated');
    },
    'password-save'(e) {
      e.preventDefault();
      const user = Store.currentUser();
      const old = $('#pwOld').value, nw = $('#pwNew').value, nw2 = $('#pwNew2').value;
      if (user.password && user.password !== Store.hashPw(old)) return toast('Current password is incorrect', 'error');
      if (nw.length < 6) return toast('New password must be at least 6 characters', 'error');
      if (nw !== nw2) return toast('Passwords do not match', 'error');
      Store.updateUser({ password: Store.hashPw(nw) });
      toast('✓ Password updated');
      e.target.reset();
    },
    'delete-account'() {
      if (!confirm('Delete this demo account? This cannot be undone.')) return;
      const user = Store.currentUser();
      Store.state.users = Store.state.users.filter(u => u.id !== user.id);
      Store.save('novahub_users', Store.state.users);
      Store.state.session = null;
      Store.save('novahub_session', null);
      toast('Account deleted');
      location.hash = '#/account';
      navigate();
    },

    'newsletter-submit'(e) {
      e.preventDefault();
      const email = $('#nlEmail').value.trim();
      if (!email) return;
      toast('🎉 Subscribed! Welcome to the newsletter.', 'success');
      e.target.reset();
    },

    /* -------- Shop filters -------- */
    'set-sub'(el) {
      ShopState.sub = ShopState.sub === el.dataset.sub ? '' : el.dataset.sub;
      applyShopState();
    },
    'toggle-brand'(el) {
      const b = el.dataset.brand;
      el.checked ? ShopState.brands.add(b) : ShopState.brands.delete(b);
      applyShopState();
    },
    'toggle-avail'(el) { ShopState.avail = el.checked; applyShopState(); },
    'set-rating'(el) { ShopState.rating = +el.dataset.rating; applyShopState(); },
    'set-sort'(el) { ShopState.sort = el.value; applyShopState(); },
    'apply-price'(el) {
      const min = +($('#priceMin').value || 0);
      const max = +($('#priceMax').value || 0);
      if (min >= 0) ShopState.min = min || null;
      if (max > 0) ShopState.max = max;
      applyShopState();
    },
    'clear-filters'() {
      ShopState.brands = new Set(); ShopState.avail = false; ShopState.min = null; ShopState.max = null; ShopState.rating = 0;
      if (parseRoute().path !== '/shop') { location.hash = '#/shop'; return; }
      navigate();
    },
    'toggle-filters'() {
      const fl = document.querySelector('.filters');
      if (!fl) return;
      fl.classList.toggle('open');
    },
    'tab'(el) {
      const tab = el.dataset.tab;
      document.querySelectorAll('.pp-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      document.querySelectorAll('.pp-tab-body').forEach(p => p.hidden = p.dataset.panel !== tab);
    },
    'scroll-to'(el) { el.scrollIntoView({ behavior: 'smooth' }); },
    'set-thumb'(el) {
      document.querySelectorAll('.pp-thumb').forEach(t => t.classList.remove('on'));
      el.classList.add('on');
      const img = $('#zoomImg');
      img.classList.remove('zoomed');
      img.src = el.dataset.src;
    },
    'qty-inc'() { const s = $('#ppQty span'); s.textContent = Math.min(99, +s.textContent + 1); },
    'qty-dec'() { const s = $('#ppQty span'); s.textContent = Math.max(1, +s.textContent - 1); },

    'rv-star'(el) {
      const rf = $('#rfStars');
      rf.dataset.val = el.dataset.val;
      rf.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.val <= +el.dataset.val));
    },
    'review-submit'(e, el) {
      e.preventDefault();
      const p = DB.byId(el.dataset.id);
      const name = $('#rvName').value.trim();
      const title = $('#rvTitle').value.trim();
      const body = $('#rvBody').value.trim();
      const rating = +($('#rfStars').dataset.val || 5);
      if (!name || !title || !body) return toast('Please fill in all review fields', 'error');
      p.reviewList.unshift({ user: name, rating, date: new Date().toISOString().slice(0, 10), title, body });
      p.reviews++;
      p.rating = Math.round(((p.rating * (p.reviews - 1)) + rating) / p.reviews * 10) / 10;
      toast('✓ Thanks for your review!', 'success');
      navigate();
    },
  };

  function applyShopState() {
    const r = parseRoute();
    const params = new URLSearchParams();
    if (ShopState.cat) params.set('cat', ShopState.cat);
    if (ShopState.sub) params.set('sub', ShopState.sub);
    const q = params.toString();
    const base = r.path;
    location.hash = '#' + base + (q ? '?' + q : '');
    /* filters stay in ShopState; shopView preserves them when cat/sub unchanged */
    navigate();
  }

  function toggleCart(open) {
    Store.state.cartOpen = open;
    const drawer = $('#cartDrawer');
    const overlay = $('#drawerOverlay');
    drawer.classList.toggle('open', open);
    overlay.hidden = !open;
    document.body.classList.toggle('drawer-open', open);
    if (open) UI.renderCartDrawer();
  }

  function afterLogin(user, isNew = false) {
    closeModal();
    Store.state.promo = null;
    toast(isNew ? '🎉 Welcome, ' + (user.name || 'friend') + '! Account created.' : '👋 Welcome back, ' + (user.name || '') + '!', 'success');
    const r = parseRoute();
    if (r.path === '/account') navigate();
    else location.hash = '#/account';
  }

  /* ================= INIT ================= */
  function init() {
    Store.init();
    Store.renderCartBadge();
    initHeader();
    UI.delegate();
    window.addEventListener('hashchange', navigate);
    window.addEventListener('resize', debounce(() => { if (window.innerWidth > 900) toggleMobileMenu(false); }, 150));
    if (!location.hash) location.hash = '#/';
    else navigate();
  }

  document.addEventListener('DOMContentLoaded', init);

  /* checkoutView is provided by checkout.js */
  return { Actions, ShopState, applyShopState, toggleCart };
})();
