/* ============================================================
   RockTech — Mock Data Layer
   All products, categories, brands, coupons & reviews.
   Prices in Bangladeshi Taka (BDT).
   Product "images" are generated as inline SVG data URIs.
   ============================================================ */
'use strict';

const DB = (() => {

  const CATEGORIES = [
    {
      key: 'mobile', name: 'Mobile Accessories', tagline: 'Power, protect & listen on the go.',
      glyph: '📱', grad: ['#0ea5e9', '#2563eb'],
      subs: ['Chargers', 'Power Banks', 'Screen Protectors', 'Phone Cases', 'Wireless Earbuds / TWS', 'Cables'],
    },
    {
      key: 'computer', name: 'Computer Accessories', tagline: 'Upgrade your desk, unleash your workflow.',
      glyph: '💻', grad: ['#8b5cf6', '#4f46e5'],
      subs: ['Keyboards', 'Mice', 'Laptop Stands', 'USB Hubs', 'Webcams', 'Desk Mats'],
    },
    {
      key: 'networking', name: 'Internet & Networking', tagline: 'Blazing-fast, reliable connectivity.',
      glyph: '📡', grad: ['#06b6d4', '#0d9488'],
      subs: ['Wi-Fi Routers', 'Range Extenders', 'Ethernet Cables', 'Portable Wi-Fi Dongles'],
    },
  ];

  const BRANDS = ['NovaTech', 'PulseCore', 'VoltEdge', 'AeroLink', 'GlidePro', 'NexWave', 'ZenCharge', 'KiteMesh'];

  /* Personal merchant number for bKash / Nagad payments */
  const MERCHANT_NUMBER = '01627691127';

  const mk = (id, name, brand, category, sub, price, stock, rating, opts = {}) => ({
    id, name, brand, category, sub,
    price, stock, rating,
    oldPrice: opts.oldPrice || null,
    badge: opts.badge || null,
    glyph: opts.glyph || '📦',
    grad: opts.grad || ['#334155', '#0f172a'],
    reviews: opts.reviews || 0,
    isNew: opts.isNew || false,
    featured: opts.featured || false,
    specs: opts.specs || {},
    reviewList: opts.reviewList || [],
  });

  const PRODUCTS = [
    /* ---------- Mobile: Chargers ---------- */
    mk('p001', 'NovaTech 65W GaN Dual-Port Charger', 'NovaTech', 'mobile', 'Chargers', 3499, 48, 4.8,
      { oldPrice: 4599, badge: 'TOP DEAL', glyph: '🔌', grad: ['#38bdf8', '#0284c7'], isNew: true, featured: true,
        specs: { Power: '65W (USB-C PD 45W + USB-A 20W)', 'GaN Tech': 'Yes — 40% smaller', 'Fast Charge': 'PD 3.0 / QC 4.0', Ports: '1× USB-C, 1× USB-A', 'Foldable Plug': 'Yes' },
        reviews: 214, reviewList: [
          { user: 'Marcus T.', rating: 5, date: '2026-07-28', title: 'Tiny but mighty', body: 'Charges my laptop and phone simultaneously. Stays cool, folds flat for travel.' },
          { user: 'Priya S.', rating: 5, date: '2026-07-11', title: 'Perfect travel charger', body: 'Replaced 3 chargers with this one. The GaN size is unreal.' },
          { user: 'Dan K.', rating: 4, date: '2026-06-30', title: 'Great, slight heat', body: 'Gets a little warm at 65W but nothing concerning. Very fast.' },
        ] }),
    mk('p002', 'VoltEdge 20W USB-C Fast Charger', 'VoltEdge', 'mobile', 'Chargers', 1299, 120, 4.6,
      { glyph: '🔌', grad: ['#a5b4fc', '#4338ca'], specs: { Power: '20W USB-C PD', 'Fast Charge': 'iPhone / Galaxy 0→50% in ~25 min', Size: 'Palm-sized cube', Cable: 'Not included (USB-C → USB-C recommended)' },
        reviews: 96, reviewList: [{ user: 'Lena V.', rating: 5, date: '2026-07-02', title: 'Snappy', body: 'Small, light, and genuinely fast. Great value.' }] }),

    /* ---------- Mobile: Power Banks ---------- */
    mk('p003', 'ZenCharge 20,000mAh Power Bank', 'ZenCharge', 'mobile', 'Power Banks', 2499, 64, 4.7,
      { oldPrice: 3299, badge: 'TOP DEAL', glyph: '🔋', grad: ['#34d399', '#059669'], featured: true,
        specs: { Capacity: '20,000mAh', Output: '22.5W max (USB-C + USB-A)', 'Charge Devices': '~4 full phone charges', Display: 'LED battery %', 'Airline Safe': 'Yes (<100Wh)' },
        reviews: 178, reviewList: [
          { user: 'Omar R.', rating: 5, date: '2026-07-19', title: 'Festival champ', body: 'Kept two phones topped up all weekend. LED readout is a nice touch.' },
          { user: 'Jess F.', rating: 4, date: '2026-06-22', title: 'Solid bank', body: 'Heavy-ish but reliable. Output is genuinely fast.' },
        ] }),
    mk('p004', 'PulseCore MagSafe Power Bank 10K', 'PulseCore', 'mobile', 'Power Banks', 2999, 40, 4.5,
      { glyph: '🧲', grad: ['#fb7185', '#e11d48'], specs: { Capacity: '10,000mAh', Output: '15W wireless / 20W wired', Mount: 'Magnetic snap-on', 'Feet': 'Fold-out stand included' },
        reviews: 87, reviewList: [{ user: 'Aiko N.', rating: 5, date: '2026-07-08', title: 'MagSafe magic', body: 'Snaps on perfectly and the stand is great for video calls.' }] }),

    /* ---------- Mobile: Screen Protectors ---------- */
    mk('p005', 'GlidePro 9H Tempered Glass (2-Pack)', 'GlidePro', 'mobile', 'Screen Protectors', 999, 200, 4.7,
      { badge: 'NEW', glyph: '🛡️', grad: ['#93c5fd', '#1d4ed8'], isNew: true,
        specs: { Hardness: '9H', Thickness: '0.25mm', Coating: 'Oleophobic, anti-fingerprint', 'Install Kit': 'Alignment frame + wipes included', Compatibility: 'Latest iPhone & Galaxy flagships' },
        reviews: 310, reviewList: [{ user: 'Ben C.', rating: 5, date: '2026-07-25', title: 'Invisible', body: 'Crystal clear, the alignment frame makes install idiot-proof.' }] }),
    mk('p006', 'NovaTech Privacy Glass Matte', 'NovaTech', 'mobile', 'Screen Protectors', 1199, 75, 4.4,
      { glyph: '🛡️', grad: ['#e2e8f0', '#64748b'], specs: { Privacy: '28° viewing angle', Finish: 'Matte anti-glare', Hardness: '9H', 'Blue Light': 'Filter included' },
        reviews: 42, reviewList: [{ user: 'Tina W.', rating: 4, date: '2026-06-15', title: 'Private & smooth', body: 'Matte feel is great for gaming; slight film grain visible.' }] }),

    /* ---------- Mobile: Phone Cases ---------- */
    mk('p007', 'AeroLink ClearGuard Shock Case', 'AeroLink', 'mobile', 'Phone Cases', 899, 150, 4.6,
      { glyph: '📱', grad: ['#7dd3fc', '#0369a1'], specs: { Material: 'TPU + polycarbonate hybrid', Drop: 'MIL-STD 810G 2.4m', 'Yellowing': 'UV-resistant coating', 'MagSafe': 'Compatible' },
        reviews: 129, reviewList: [{ user: 'Ray D.', rating: 5, date: '2026-07-05', title: 'Tough and clear', body: 'Survived my clumsy week. Still looks crystal clear.' }] }),
    mk('p008', 'NovaTech Leather Folio Wallet Case', 'NovaTech', 'mobile', 'Phone Cases', 1299, 88, 4.3,
      { glyph: '👝', grad: ['#fbbf24', '#b45309'], specs: { Material: 'Premium vegan leather', Slots: '3 card slots + cash pocket', 'Stand': 'Built-in kickstand', 'Auto Wake': 'Supported' },
        reviews: 54, reviewList: [{ user: 'Sara M.', rating: 4, date: '2026-06-28', title: 'Classy', body: 'Looks way more expensive than it is. Cards fit snugly.' }] }),

    /* ---------- Mobile: Earbuds ---------- */
    mk('p009', 'PulseCore AirBuds Pro (ANC)', 'PulseCore', 'mobile', 'Wireless Earbuds / TWS', 6999, 96, 4.9,
      { oldPrice: 8999, badge: 'TOP DEAL', glyph: '🎧', grad: ['#67e8f9', '#0e7490'], isNew: true, featured: true,
        specs: { Driver: '11mm dynamic + dual mics', ANC: 'Hybrid, up to 40dB', Battery: '8h buds / 32h w/ case', 'Wireless Charge': 'Yes', 'Water Resist': 'IPX5', Codecs: 'AAC, SBC, LDAC' },
        reviews: 412, reviewList: [
          { user: 'Mia L.', rating: 5, date: '2026-07-30', title: 'Silence is golden', body: 'ANC rivals sets twice the price. Call quality is superb on windy streets.' },
          { user: 'Chris P.', rating: 5, date: '2026-07-14', title: 'Battery for days', body: 'Case is small but somehow lasts a full week of commuting.' },
          { user: 'Nadia B.', rating: 5, date: '2026-06-19', title: 'Bought a second pair', body: 'Sound is balanced with punchy bass. Transparency mode feels natural.' },
        ] }),
    mk('p010', 'KiteMesh Mini TWS earbuds', 'KiteMesh', 'mobile', 'Wireless Earbuds / TWS', 1999, 140, 4.2,
      { badge: 'NEW', glyph: '🎧', grad: ['#f9a8d4', '#be185d'], isNew: true,
        specs: { Driver: '8mm', Battery: '5h buds / 20h w/ case', Bluetooth: '5.3', 'Touch Controls': 'Yes', 'Water Resist': 'IPX4' },
        reviews: 66, reviewList: [{ user: 'Kofi A.', rating: 4, date: '2026-07-17', title: 'Budget heroes', body: 'Incredible for the price. Slight bass bias but fun to listen to.' }] }),

    /* ---------- Mobile: Cables ---------- */
    mk('p011', 'VoltEdge USB-C 100W Braided Cable (2m)', 'VoltEdge', 'mobile', 'Cables', 899, 260, 4.8,
      { glyph: '🔗', grad: ['#6ee7b7', '#047857'], featured: true,
        specs: { 'Charge Rate': '100W PD 3.1', Data: '480Mbps', Length: '2m', Jacket: 'Nylon braid, 30k bend rating', Warranty: 'Lifetime' },
        reviews: 233, reviewList: [{ user: 'Hugo E.', rating: 5, date: '2026-07-22', title: 'Indestructible', body: 'My cat chews everything. Not this cable. Charges laptop at full speed.' }] }),
    mk('p012', 'NovaTech Nylon Lightning Cable (1m)', 'NovaTech', 'mobile', 'Cables', 699, 190, 4.5,
      { glyph: '🔗', grad: ['#94a3b8', '#334155'], specs: { 'Charge Rate': '18W fast charge', Data: '480Mbps', Length: '1m', 'MFi Certified': 'Yes' },
        reviews: 71, reviewList: [{ user: 'Alice G.', rating: 5, date: '2026-06-25', title: 'Reliable', body: 'MFi cert means no annoying pop-ups. Feels sturdy.' }] }),

    /* ---------- Computer: Keyboards ---------- */
    mk('p013', 'GlidePro Mech TKL RGB Keyboard', 'GlidePro', 'computer', 'Keyboards', 7999, 57, 4.8,
      { oldPrice: 10999, badge: 'TOP DEAL', glyph: '⌨️', grad: ['#a78bfa', '#6d28d9'], isNew: true, featured: true,
        specs: { Switch: 'Hot-swappable (Red/Brown/Blue)', Layout: 'TKL, 87 keys', RGB: 'Per-key, 16.8M colors', Build: 'Aluminum top plate, gasket mount', Connection: '2.4GHz / BT / USB-C' },
        reviews: 189, reviewList: [
          { user: 'Victor H.', rating: 5, date: '2026-07-27', title: 'Thocky heaven', body: 'Out-of-box stabilizers are flawless. Stock reds feel amazing.' },
          { user: 'Renée A.', rating: 5, date: '2026-07-09', title: 'Best under 10k', body: 'Tri-mode connectivity and per-key RGB at this price is a steal.' },
        ] }),
    mk('p014', 'KiteMesh Slim Silent Keyboard', 'KiteMesh', 'computer', 'Keyboards', 3899, 82, 4.3,
      { glyph: '⌨️', grad: ['#cbd5e1', '#475569'], specs: { Keys: 'Scissor-switch, low profile', Layout: 'Full + numpad', Connection: 'BT 5.1 + USB dongle, 3 devices', Battery: '8 months (2×AAA)' },
        reviews: 58, reviewList: [{ user: 'Tom B.', rating: 4, date: '2026-06-20', title: 'Office quiet', body: 'Near-silent typing. Great for open-plan offices.' }] }),

    /* ---------- Computer: Mice ---------- */
    mk('p015', 'NovaTech Ergo Mouse (Wireless)', 'NovaTech', 'computer', 'Mice', 2899, 110, 4.6,
      { glyph: '🖱️', grad: ['#86efac', '#15803d'], specs: { Sensor: '8000 DPI optical', Grip: 'Vertical ergonomic', Connection: 'BT + 2.4GHz', Battery: '3 months', Buttons: '6 (programmable)' },
        reviews: 143, reviewList: [{ user: 'Yuki T.', rating: 5, date: '2026-07-21', title: 'Wrist pain gone', body: 'Two weeks in and my wrist pain is gone. Seamless pairing.' }] }),
    mk('p016', 'PulseCore StrikeX Gaming Mouse', 'PulseCore', 'computer', 'Mice', 4999, 73, 4.7,
      { badge: 'NEW', glyph: '🖱️', grad: ['#fca5a5', '#dc2626'], isNew: true, featured: true,
        specs: { Sensor: '26K DPI optical (PAW3395)', Polling: '4000Hz', Weight: '58g ultralight', RGB: '9-zone', Buttons: '8, hot-swap switches' },
        reviews: 167, reviewList: [{ user: 'Max R.', rating: 5, date: '2026-07-29', title: 'Competitive edge', body: '58g is featherlight. 4K polling feels like cheating in FPS.' }] }),

    /* ---------- Computer: Laptop Stands ---------- */
    mk('p017', 'AeroLink Aluminum Laptop Stand', 'AeroLink', 'computer', 'Laptop Stands', 2499, 65, 4.7,
      { glyph: '🖥️', grad: ['#bae6fd', '#0284c7'], specs: { Material: 'CNC aluminum', Fit: '11"–17" laptops', Height: '6-level adjustable', Ventilation: 'Open-air design' },
        reviews: 201, reviewList: [{ user: 'Emma W.', rating: 5, date: '2026-07-12', title: 'Sturdy & sleek', body: 'Fits my 16" laptop perfectly. Desk posture improved overnight.' }] }),
    mk('p018', 'ZenCharge Foldable Travel Stand', 'ZenCharge', 'computer', 'Laptop Stands', 1599, 130, 4.4,
      { glyph: '🖥️', grad: ['#fde68a', '#d97706'], specs: { Material: 'Aluminum + silicone pads', Weight: '290g', 'Max Load': '8kg', 'Folded Size': 'Pocketable' },
        reviews: 39, reviewList: [{ user: 'Ivan D.', rating: 4, date: '2026-06-18', title: 'Coffee shop essential', body: 'Packs flat in my sleeve. Locks at 7 angles.' }] }),

    /* ---------- Computer: USB Hubs ---------- */
    mk('p019', 'GlidePro 7-in-1 USB-C Hub', 'GlidePro', 'computer', 'USB Hubs', 4299, 94, 4.8,
      { badge: 'TOP DEAL', glyph: '🔀', grad: ['#818cf8', '#3730a3'], featured: true,
        specs: { Ports: 'HDMI 4K60, 2× USB-A 3.1, USB-C PD 100W, SD/TF, 3.5mm', Display: '4K@60Hz single', Build: 'Aluminum, bus-powered' },
        reviews: 256, reviewList: [{ user: 'Noor K.', rating: 5, date: '2026-07-26', title: 'Dock in my pocket', body: 'Single cable to my laptop gives me monitors, peripherals and 100W power.' }] }),
    mk('p020', 'VoltEdge 4-Port Slim Hub', 'VoltEdge', 'computer', 'USB Hubs', 1499, 150, 4.4,
      { glyph: '🔀', grad: ['#99f6e4', '#0f766e'], specs: { Ports: '4× USB-A 3.0', Speed: '5Gbps per port', Design: 'Flat, fits under laptop' },
        reviews: 45, reviewList: [{ user: 'Paul X.', rating: 4, date: '2026-06-24', title: 'Handy', body: 'Slides perfectly under my laptop. Zero dead ports so far.' }] }),

    /* ---------- Computer: Webcams ---------- */
    mk('p021', 'NexWave 1080p Pro Webcam', 'NexWave', 'computer', 'Webcams', 5999, 36, 4.7,
      { glyph: '📹', grad: ['#fdba74', '#ea580c'], isNew: true, featured: true,
        specs: { Sensor: '2MP Sony, 1080p@60fps', FOV: '90°', Mic: 'Dual noise-cancel', Mount: 'Magnetic + tripod thread', 'Low Light': 'HDR auto-compensate' },
        reviews: 98, reviewList: [{ user: 'Fatima Z.', rating: 5, date: '2026-07-31', title: 'Studio quality', body: 'Colleagues think I bought a ring light. Colors are accurate, autofocus sticks.' }] }),
    mk('p022', 'KiteMesh ClipCam 720p', 'KiteMesh', 'computer', 'Webcams', 1899, 120, 4.1,
      { glyph: '📹', grad: ['#fecaca', '#b91c1c'], specs: { Resolution: '720p@30fps', Mic: 'Built-in', Mount: 'Clip + foldable', 'Privacy': 'Physical shutter' },
        reviews: 33, reviewList: [{ user: 'Gary S.', rating: 4, date: '2026-06-27', title: 'Good enough', body: 'Fine for meetings. The shutter is a thoughtful touch.' }] }),

    /* ---------- Computer: Desk Mats ---------- */
    mk('p023', 'NovaTech XXL Desk Mat (900×400mm)', 'NovaTech', 'computer', 'Desk Mats', 1799, 175, 4.6,
      { glyph: '🖼️', grad: ['#a78bfa', '#4c1d95'], specs: { Size: '900×400×4mm', Surface: 'Stitched microfiber', Base: 'Natural rubber, anti-slip', Colors: 'Navy / Slate / Cyan edge' },
        reviews: 118, reviewList: [{ user: 'Lucas M.', rating: 5, date: '2026-07-16', title: 'Complete the setup', body: 'Thick, stitched edges, zero smell. Mouse glides beautifully.' }] }),
    mk('p024', 'GlidePro RGB Gaming Mat XL', 'GlidePro', 'computer', 'Desk Mats', 2899, 89, 4.5,
      { badge: 'NEW', glyph: '🖼️', grad: ['#22d3ee', '#0e7490'], isNew: true,
        specs: { Size: '800×300mm', RGB: 'Edgeless 3-zone', Surface: 'Smooth speed cloth', 'Power': 'USB-A' },
        reviews: 77, reviewList: [{ user: 'Zoe P.', rating: 5, date: '2026-07-20', title: 'Gamer glow', body: 'The edge lighting is subtle and gorgeous. Glide is silky.' }] }),

    /* ---------- Networking ---------- */
    mk('p025', 'NexWave WiFi 6 AX3000 Router', 'NexWave', 'networking', 'Wi-Fi Routers', 8999, 42, 4.8,
      { oldPrice: 11999, badge: 'TOP DEAL', glyph: '📶', grad: ['#5eead4', '#0f766e'], isNew: true, featured: true,
        specs: { 'Wi-Fi Standard': 'Wi-Fi 6 (802.11ax)', Speed: '3000Mbps (2.4+5GHz)', Coverage: 'Up to 200m²', Ports: '1× 2.5G WAN + 3× Gigabit LAN', Devices: '128 concurrent' },
        reviews: 268, reviewList: [
          { user: 'Sam J.', rating: 5, date: '2026-07-24', title: 'Whole flat covered', body: 'Dead zone in my bathroom is gone. App setup took 3 minutes.' },
          { user: 'Ivy C.', rating: 5, date: '2026-07-01', title: 'Game changer', body: 'Latency dropped noticeably in multiplayer. 2.5G WAN is future-proof.' },
        ] }),
    mk('p026', 'KiteMesh Dual-Band Range Extender', 'KiteMesh', 'networking', 'Range Extenders', 3499, 60, 4.3,
      { glyph: '📶', grad: ['#f0abfc', '#a21caf'], specs: { 'Wi-Fi Standard': 'Wi-Fi 6, dual band', Speed: '1800Mbps', Plug: 'Direct wall outlet', Features: 'WPS one-touch setup' },
        reviews: 64, reviewList: [{ user: 'Leo G.', rating: 4, date: '2026-06-26', title: 'Fixed the garage', body: 'Simple WPS pairing and the garage now streams 4K.' }] }),
    mk('p027', 'AeroLink Cat8 Ethernet Cable (3m)', 'AeroLink', 'networking', 'Ethernet Cables', 1099, 220, 4.7,
      { glyph: '🔌', grad: ['#7dd3fc', '#1d4ed8'], specs: { Standard: 'Cat8, 40Gbps / 2000MHz', Connectors: 'Shielded RJ45, gold plated', Length: '3m', Jacket: 'PVC, flat design' },
        reviews: 92, reviewList: [{ user: 'Ana R.', rating: 5, date: '2026-07-15', title: 'Future-proof', body: 'Thick shielding, snug connectors. Fully rated speeds at 2.5GbE.' }] }),
    mk('p028', 'PulseCore USB Wi-Fi Dongle AC1200', 'PulseCore', 'networking', 'Portable Wi-Fi Dongles', 1999, 104, 4.5,
      { badge: 'NEW', glyph: '📡', grad: ['#bef264', '#3f6212'], isNew: true, featured: true,
        specs: { Speed: 'AC1200 dual band', Interface: 'USB-A, plug & play', Range: 'External dual antennas', 'OS Support': 'Win / macOS / Linux' },
        reviews: 108, reviewList: [{ user: 'Jon D.', rating: 5, date: '2026-07-18', title: 'Desktop rescue', body: 'My desktop PC finally has full-speed Wi-Fi. Drivers auto-installed.' }] }),
  ];

  /* Real product photos (assets/img/*.jpg) + marketing descriptions */
  const IMG_FILES = {
    p001: 'assets/img/p001.jpg', p002: 'assets/img/p002.jpg', p003: 'assets/img/p003.jpg',
    p004: 'assets/img/p004.jpg', p005: 'assets/img/p005.jpg', p006: 'assets/img/p006.jpg',
    p007: 'assets/img/p007.jpg', p008: 'assets/img/p008.jpg', p009: 'assets/img/p009.jpg',
    p010: 'assets/img/p010.jpg', p011: 'assets/img/p011.jpg', p012: 'assets/img/p012.jpg',
    p013: 'assets/img/p013.jpg', p014: 'assets/img/p014.jpg', p015: 'assets/img/p015.jpg',
    p016: 'assets/img/p016.jpg', p017: 'assets/img/p017.jpg', p018: 'assets/img/p018.jpg',
    p019: 'assets/img/p019.jpg', p020: 'assets/img/p020.jpg', p021: 'assets/img/p021.jpg',
    p022: 'assets/img/p022.jpg', p023: 'assets/img/p023.jpg', p024: 'assets/img/p024.jpg',
    p025: 'assets/img/p025.jpg', p026: 'assets/img/p026.jpg', p027: 'assets/img/p027.jpg',
    p028: 'assets/img/p028.jpg',
  };

  const DESCRIPTIONS = {
    p001: 'Meet the charger that replaces three bricks in your bag. Powered by gallium nitride, the NovaTech 65W GaN delivers laptop-grade 45W over USB-C PD plus 20W on USB-A — simultaneously — while running cool and fitting in a shirt pocket. Folds flat for travel and never trips over-current protection.',
    p002: 'The everyday fast charger. 20W USB-C Power Delivery takes compatible phones from 0 to 50% in about 25 minutes, and its palm-sized cube slips into any pocket. Light, cool and safe for overnight charging.',
    p003: 'Carry a week of power in one hand. The ZenCharge 20,000mAh power bank charges phones about four times over at up to 22.5W, shows exact remaining capacity on its LED display, and is airline-safe at under 100Wh.',
    p004: 'Snap-on convenience meets 15W wireless speed. The PulseCore MagSafe power bank magnetically attaches to your phone, doubles as a kickstand for video calls, and tops itself up via USB-C when you reach the desk.',
    p005: 'Invisible protection with bulletproof clarity. This 9H tempered glass is 0.25mm thin, oleophobic against fingerprints, and ships with an alignment frame so installation takes 30 seconds with zero bubbles.',
    p006: 'Work, bank and scroll in private. The matte finish kills glare and smudges while a 28-degree privacy filter keeps prying eyes out of your screen — with blue-light filtration built in for late nights.',
    p007: 'Slim on the outside, tank on the inside. AeroLink’s hybrid TPU + polycarbonate case absorbs drops up to 2.4 metres, resists yellowing with UV-coated clear back, and stays MagSafe-compatible.',
    p008: 'Carry your essentials in style. A premium vegan-leather folio with three card slots, a cash pocket, a built-in kickstand and auto wake/sleep — protection that looks like it costs twice as much.',
    p009: 'Silence the world, keep the music. Hybrid ANC cancels up to 40dB of noise while 11mm drivers deliver warm, detailed sound. 8 hours per charge, 32 with the wireless-charging case, IPX5 sweat resistance and crystal-clear calls on windy streets.',
    p010: 'Big audio in a tiny shell. KiteMesh Mini earbuds pair instantly over Bluetooth 5.3, run 5 hours per charge with 20 hours in the case, and pack punchy bass and touch controls at a price that’s hard to believe.',
    p011: 'The last cable you’ll ever need. Nylon-braided and rated for 30,000 bends, this 2-metre USB-C cable charges laptops and tablets at a full 100W while syncing data — and carries a lifetime warranty.',
    p012: 'Certified, fast and built to last. This MFi-certified nylon Lightning cable delivers 18W fast charging with no error pop-ups, reinforced connectors, and a braided jacket that shrugs off daily abuse.',
    p013: 'Type the way you play. A gasket-mounted TKL chassis with per-key RGB, hot-swappable switches (red, brown or blue) and tri-mode connectivity — 2.4GHz, Bluetooth or wired — built on an aluminium plate that thocks beautifully out of the box.',
    p014: 'Silence your keystrokes. Scissor-switch keys with a low profile make this full-size keyboard almost inaudible, while Bluetooth 5.1 pairs it with three devices and a single charge lasts up to 8 months.',
    p015: 'Give your wrist a break. The vertical grip aligns your hand naturally to reduce strain, the 8000 DPI sensor glides across any surface, and six programmable buttons plus 3-month battery life make it the perfect office companion.',
    p016: 'Featherweight. Competitive. 58 grams with a 26K DPI PAW3395 sensor and 4000Hz polling — the StrikeX is built for aim-first gamers who refuse to leave milliseconds on the table.',
    p017: 'Raise your laptop, straighten your posture. CNC-machined aluminium, six height levels, open-air cooling and a rock-solid base for anything from an 11-inch ultrabook to a 17-inch workstation.',
    p018: 'A desk upgrade that fits in a sleeve. This 290g aluminium stand locks at seven angles, holds up to 8kg, and folds flat for the coffee shop, the office and the airport lounge.',
    p019: 'One cable to rule your desk. HDMI 4K@60Hz, two 5Gbps USB-A ports, USB-C passthrough at 100W, SD/TF readers and a 3.5mm jack — all in a pocket-sized aluminium hub that runs your entire setup.',
    p020: 'Four fast ports, zero clutter. This slim flat hub adds four USB 3.0 ports at 5Gbps each, slips invisibly under your laptop, and needs no drivers on Windows, macOS or Linux.',
    p021: 'Look sharp on every call. A Sony 2MP sensor delivers 1080p@60fps with true-to-life colour, HDR low-light compensation, dual noise-cancelling mics and a magnetic mount with tripod thread.',
    p022: 'Meetings solved for less. Crisp 720p video, a built-in mic, a foldable clip for any screen and a physical privacy shutter — everything a busy professional needs, minus the price tag.',
    p023: 'The foundation of a great setup. A 900×400mm stitched microfiber surface with a natural-rubber base that stays put, giving your mouse silky glide and your wrists a soft landing.',
    p024: 'Glow up your game. An 800×300mm speed cloth with edgeless 3-zone RGB lighting, USB-powered, with a smooth weave that lets your mouse track flawlessly during clutch moments.',
    p025: 'Dead zones, meet your match. Wi-Fi 6 with 3000Mbps dual-band speeds, a 2.5G WAN port and coverage up to 200m² handles 128 devices at once — and sets up from your phone in three minutes.',
    p026: 'Extend your Wi-Fi’s reach, not your patience. Plug this dual-band extender straight into the wall, press WPS, and enjoy up to 1800Mbps of boosted coverage in the garage, garden or upstairs bedroom.',
    p027: 'Wire it properly, once. Cat8 spec rated for 40Gbps and 2000MHz with shielded RJ45 connectors — the flat PVC jacket routes neatly along skirting boards and delivers full speed at 2.5GbE and beyond.',
    p028: 'Instant Wi-Fi for any desktop. Plug in, drivers auto-install, and the AC1200 dual-band USB dongle with external antennas delivers strong, stable signal to PCs and old laptops that lack Wi-Fi.',
  };

  for (const p of PRODUCTS) {
    p.img = IMG_FILES[p.id] || null;
    p.desc = DESCRIPTIONS[p.id] || null;
  }

  const REVIEWERS = ['Alex Chen', 'Maya Patel', 'Diego Torres', 'Sofia Rossi', 'Kevin Park', 'Layla Ahmed', 'Jonas Berg'];
  const REVIEW_TITLES = ['Exactly as described', 'Worth every cent', 'Buy it, trust me', 'Excellent quality', 'Fast shipping, great product'];
  const REVIEW_BODIES = [
    'Packed well and arrived in two days. Product quality exceeds the price point.',
    'Been using it daily for two weeks — flawless so far. Would recommend to friends.',
    'Solid build, works exactly as advertised. RockTech shipping was impressively fast.',
    'Great value for money. The design is sleek and matches the photos perfectly.',
    'Minor nitpicks aside, this is a great buy. Customer support was helpful too.',
  ];

  function seededReviews(product) {
    if (product.reviewList.length) return product.reviewList;
    const out = [];
    const count = Math.min(product.reviews, 3 + (product.id.charCodeAt(2) % 3));
    for (let i = 0; i < count; i++) {
      const idx = (product.id.charCodeAt(2) + i * 3) % REVIEWERS.length;
      out.push({
        user: REVIEWERS[idx],
        rating: Math.max(3, Math.round(product.rating - (i % 2) * 0.5)),
        date: `2026-0${(i % 6) + 1}-${String((i * 7) % 27 + 1).padStart(2, '0')}`,
        title: REVIEW_TITLES[(idx + i) % REVIEW_TITLES.length],
        body: REVIEW_BODIES[(idx + i) % REVIEW_BODIES.length],
      });
    }
    return out;
  }

  const COUPONS = {
    SAVE10: { type: 'percent', value: 10, desc: '10% off your order' },
    WELCOME5: { type: 'percent', value: 5, desc: '5% off your first order' },
    GADGET20: { type: 'percent', value: 20, desc: '20% off orders over ৳2,000', min: 2000 },
  };

  const FREE_SHIP_THRESHOLD = 2000;
  const SHIPPING_FLAT = 99;
  const TAX_RATE = 0.05;

  /* ---------- Product image ---------- */
  const _imgCache = new Map();
  function image(product, w = 800, h = 600) {
    if (product.img) return product.img;
    const key = product.id + w + h;
    if (_imgCache.has(key)) return _imgCache.get(key);
    const [c1, c2] = product.grad;
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="h" cx="0.35" cy="0.25" r="0.8">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <rect width="800" height="600" fill="url(#h)"/>
  <g stroke="#ffffff" stroke-opacity="0.08" stroke-width="2">
    <line x1="0" y1="120" x2="800" y2="120"/><line x1="0" y1="240" x2="800" y2="240"/>
    <line x1="0" y1="360" x2="800" y2="360"/><line x1="0" y1="480" x2="800" y2="480"/>
    <line x1="160" y1="0" x2="160" y2="600"/><line x1="320" y1="0" x2="320" y2="600"/>
    <line x1="480" y1="0" x2="480" y2="600"/><line x1="640" y1="0" x2="640" y2="600"/>
  </g>
  <circle cx="660" cy="120" r="90" fill="#ffffff" fill-opacity="0.07"/>
  <circle cx="120" cy="480" r="130" fill="#ffffff" fill-opacity="0.06"/>
  <text x="400" y="360" font-size="240" text-anchor="middle" dominant-baseline="central">${product.glyph}</text>
  <text x="40" y="545" font-family="Inter,Arial,sans-serif" font-size="30" font-weight="800" fill="#ffffff" fill-opacity="0.85">${product.brand.toUpperCase()}</text>
  <text x="40" y="578" font-family="Inter,Arial,sans-serif" font-size="22" fill="#ffffff" fill-opacity="0.6">${product.sub.toUpperCase()}</text>
</svg>`;
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    _imgCache.set(key, url);
    return url;
  }

  function byId(id) { return PRODUCTS.find(p => p.id === id); }
  function search(q) {
    q = (q || '').toLowerCase().trim();
    if (!q) return [];
    return PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sub.toLowerCase().includes(q)
    );
  }

  return { CATEGORIES, BRANDS, PRODUCTS, COUPONS, FREE_SHIP_THRESHOLD, SHIPPING_FLAT, TAX_RATE, MERCHANT_NUMBER, image, byId, search, reviews: seededReviews };
})();
