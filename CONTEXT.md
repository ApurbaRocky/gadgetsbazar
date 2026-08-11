# RockTech — Smart Gadget E-Commerce Platform

## Project Overview
A modern, responsive e-commerce website for a smart gadgets business (BDT marketplace).
Built as a fully client-side demo — no build tools, no server, no dependencies. Runs by
opening `index.html` in any modern browser.

## Tech Stack
- **Vanilla HTML / CSS / JS** (ES2017+), single-page app with hash-based routing (`#/`)
- **localStorage** for persistence: cart, users, session, wishlist, orders, theme
- Product imagery is **generated inline SVG data URIs** (no image files needed)

## Project Structure
```
index.html          App shell: header, search, nav, cart drawer, toasts, modals, footer
css/styles.css      Design tokens, dark/light themes, responsive layout, components
js/data.js          DB: categories, products, brands, coupons, reviews, image lookup
js/state.js         Store: cart, auth, wishlist, orders, promo, totals, localStorage
js/ui.js            Helpers: money() (৳), star ratings, toasts, modals, cart drawer render
js/app.js           App: router, home/shop/product/account/order views, search, auth,
                    account dashboard, global event delegation (Actions registry)
js/checkout.js      Multi-step checkout (Shipping → Payment → Review) + payment actions
js/admin.js         Hidden admin panel: login gate, orders/status, product CRUD, stock,
                    customers, coupons (route `#/admin`)
assets/img/         28 real product photos (p001.jpg–p028.jpg, CC-licensed, CREDITS.txt)
deploy.ps1          Deploy script: build → ./deploy, JS syntax check, ZIP release,
                    self-contained local HTTP server (-Serve) with browser open (-Open)
```

Script load order matters: `data.js` → `state.js` → `ui.js` → `app.js` → `checkout.js` → `admin.js`.

## Product Data
- **Real photos:** every product has `img: 'assets/img/<id>.jpg'`. `DB.image()` returns the
  real file when present, else falls back to generated SVG (admin-added products).
- **Descriptions:** every product has a `desc` marketing paragraph, shown on its own
  landing page (`#/product/:id`) between rating and price.
- Each product gets its own single landing page with zoom, specs, stock, reviews and
  related items — `DB.byId()` must resolve the id in the route.

## Business Configuration (js/data.js)
| Setting | Value |
|---|---|
| Currency | BDT (৳) — `UI.money()` in `js/ui.js` |
| VAT | 5% (`TAX_RATE = 0.05`) |
| Free shipping threshold | ৳2,000 (`FREE_SHIP_THRESHOLD`) |
| Flat shipping | ৳99 (`SHIPPING_FLAT`) |
| Merchant (personal) number | **01627691127** (`MERCHANT_NUMBER`) — bKash & Nagad |
| Promo codes | `SAVE10` (10%), `WELCOME5` (5%), `GADGET20` (20% over ৳2,000) |

## Payment Methods
1. **bKash** (Personal) — send money to `01627691127`, then enter sender number + TrxID
2. **Nagad** (Personal) — send money to `01627691127`, then enter sender number + TrxID
3. **Cash on Delivery (COD)** — pay cash on arrival

Payment flow lives in `js/checkout.js` (Step 2). Wallets saved to the user account
render in the Wallets tab of the dashboard.

## Admin Panel (hidden from customers)
- **Route:** `#/admin` — no links in the customer UI except a small locker icon (🔒)
  in the footer bottom bar. Guests who click it see only a login gate (no admin content leaks).
- **Demo login:** `admin@rocktech.store` / `admin123` (stored in `sessionStorage`)
- **Features:** revenue/order/product/low-stock stats, order list with status updates
  (Confirmed → Processing → Shipped → Delivered) and order detail modal, product
  CRUD (add/edit/delete, specs builder, stock steppers), customer list, coupons overview
- **Location:** `js/admin.js` — extends the Actions registry, exposes `window.adminView`

## Pages / Routes
| Route | View |
|---|---|
| `#/` | Home: hero, perks, categories, featured, top deals, new arrivals, newsletter |
| `#/shop` | Catalog with filters (category, sub, brand, price, rating, stock) + sorting |
| `#/shop?cat=&sub=&filter=deal\|new&q=` | Pre-filtered catalog |
| `#/product/:id` | Detail: image zoom, specs, stock, reviews + review form, related items |
| `#/account` | Guest: sign-in prompt / User: dashboard (overview, orders, wishlist, addresses, wallets, settings) |
| `#/checkout` | Multi-step checkout |
| `#/order/:id` | Order confirmation + tracking timeline |

## Authentication (simulated)
- Email + password, Phone OTP (demo code: **123456**), Google / Apple (mock)
- Users and session stored in localStorage (`novahub_users`, `novahub_session`)
- Passwords stored as simple salted hashes — demo only, never for production

## Global Actions (event delegation)
All interactive elements use `data-action="..."` attributes resolved by the `Actions`
registry (in `js/app.js`, extended by `js/checkout.js`). Examples: `go`, `add-cart`,
`theme`, `open-cart`, `wish-toggle`, `auth-submit`, `pay-submit`, `place-order`.

## Theming
Dark/light toggle via header button — sets `data-theme` on `<html>` and persists in
localStorage (`novahub_theme`). All colors come from CSS custom properties in
`css/styles.css` (e.g. `--accent` electric cyan, `--surface-2`, `--text`).

## Responsive Behavior
- Desktop: inline nav, mega-menu on Categories, hover-zoom product images
- Tablet/mobile: hamburger menu, slide-in nav, tap-to-zoom, stacked filters,
  full-width grids; cart is a slide-over drawer on all sizes

## Deploy Script (deploy.ps1)
```
.\deploy.ps1                 # build release into .\deploy
.\deploy.ps1 -Serve          # build + serve at http://localhost:8080
.\deploy.ps1 -Serve -Open    # ...and open the browser automatically
.\deploy.ps1 -Zip            # also create rocktech-release.zip
.\deploy.ps1 -Port 3000 -Serve -DeployPath "C:\www\rocktech"
```
- Validates required files, runs `node --check` on every JS file (skipped if Node
  is missing), copies the site into `./deploy`, optionally zips it.
- `-Serve` starts a dependency-free static server (System.Net.HttpListener — no
  Python/Node needed) with correct MIME types; press Ctrl+C to stop.

## Conventions
- Prices stored as integers (BDT); `money()` formats with ৳ and thousand separators
- Product IDs: `p001`–`p028`; keep them unique if adding products
- Add products by appending `mk(...)` entries in `js/data.js`
- No external libraries; keep it dependency-free
