/* ============================================================
   RockTech — Multi-step checkout: Shipping → Payment → Review
   Payments: bKash / Nagad (personal 01627691127) / Cash on delivery
   ============================================================ */
'use strict';

(() => {
  const { $, money, toast, esc } = UI;

  const CO = {
    step: 1,
    shipping: null,
    payment: null,
    useSaved: null,
  };

  const STEPS = ['Shipping', 'Payment', 'Review'];

  function checkoutView() {
    if (!Store.cartCount()) {
      return '<section class="empty-state page"><span>🛒</span><h1>Your cart is empty</h1>' +
        '<p>Add some gadgets before checking out.</p>' +
        '<a class="btn btn-primary" data-action="go" data-href="#/shop">Browse gadgets</a></section>';
    }
    const user = Store.currentUser();

    if (!CO.shipping) CO.shipping = { ...(user && user.addresses.length ? user.addresses[0] : {}) };
    if (!CO.payment) CO.payment = user && user.wallets && user.wallets.length ? { ...user.wallets[0], method: user.wallets[0].method } : null;
    CO.step = 1;

    return '<nav class="crumbs">' + crumb('Home', '#/') + crumb('Checkout', '#') + '</nav>' +
      '<section class="checkout">' +
        '<div class="co-head"><h1>Secure checkout</h1><span class="co-lock">🔒 SSL encrypted</span></div>' +
        '<div class="stepper">' +
          STEPS.map((s, i) =>
            '<div class="step ' + (i + 1 <= CO.step ? 'on' : '') + (i + 1 === CO.step ? ' current' : '') + '" data-step="' + (i + 1) + '">' +
              '<span class="step-num">' + (i + 1 < CO.step ? '✓' : i + 1) + '</span><span class="step-label">' + s + '</span>' +
            '</div>').join('') +
        '</div>' +
        '<div class="co-body" id="coBody">' + stepBody(CO.step) + '</div>' +
      '</section>';
  }

  function crumb(label, href) {
    return href === '#' ? '<span class="crumb-current">' + label + '</span>' : '<a data-action="go" data-href="' + href + '">' + label + '</a>';
  }

  function stepBody(step) {
    const user = Store.currentUser();
    switch (step) {
      case 1: return shippingStep(user);
      case 2: return paymentStep(user);
      default: return reviewStep();
    }
  }

  /* ---------------- Step 1: Shipping ---------------- */
  function shippingStep(user) {
    const s = CO.shipping || {};
    const saved =
      user && user.addresses.length
        ? '<div class="saved-picker">' +
            '<h4>Saved addresses</h4>' +
            '<div class="addr-pick-row">' +
              user.addresses.map((a, i) =>
                '<button class="addr-pick ' + (CO.useSaved === i ? 'on' : '') + '" data-action="pick-address" data-index="' + i + '">' +
                  '<strong>' + esc(a.label || 'Address ' + (i + 1)) + '</strong>' +
                  '<span class="muted">' + esc(a.line1 + ', ' + a.city + ' ' + a.zip) + '</span>' +
                '</button>').join('') +
            '</div>' +
          '</div>'
        : '';

    return '<form class="co-panel" data-action="ship-submit" novalidate>' +
      saved +
      '<h3>Shipping details</h3>' +
      '<div class="co-grid2">' +
        '<label>Full name<input id="shName" value="' + esc(s.fullName || (user ? user.name : '') || '') + '" required></label>' +
        '<label>Email<input id="shEmail" type="email" value="' + esc(s.email || (user ? user.email : '') || '') + '" required></label>' +
      '</div>' +
      '<label>Phone<input id="shPhone" value="' + esc(s.phone || (user ? user.phone : '') || '') + '" placeholder="01XXXXXXXXX" required></label>' +
      '<label>Address line 1<input id="shLine1" value="' + esc(s.line1 || '') + '" required></label>' +
      '<label>Address line 2 (optional)<input id="shLine2" value="' + esc(s.line2 || '') + '"></label>' +
      '<div class="co-grid3">' +
        '<label>City<input id="shCity" value="' + esc(s.city || '') + '" required></label>' +
        '<label>State<input id="shState" value="' + esc(s.state || '') + '"></label>' +
        '<label>ZIP / Postal<input id="shZip" value="' + esc(s.zip || '') + '" required></label>' +
      '</div>' +
      '<label>Country<select id="shCountry">' + countries() + '</select></label>' +
      '<label class="f-check co-save"><input type="checkbox" id="shSave"><span class="f-box"></span>Save this address to my account</label>' +
      '<div class="co-actions">' +
        '<button type="button" class="btn btn-ghost" data-action="back-shop">← Back to cart</button>' +
        '<button type="submit" class="btn btn-primary btn-lg">Continue to payment →</button>' +
      '</div>' +
    '</form>';
  }

  /* ---------------- Step 2: Payment (bKash / Nagad / COD) ---------------- */
  function paymentStep(user) {
    const saved =
      user && user.wallets && user.wallets.length
        ? '<div class="saved-picker">' +
            '<h4>Saved wallets</h4>' +
            '<div class="card-pick-row">' +
              user.wallets.map((w, i) =>
                '<button class="card-pick ' + (CO.useSaved === i ? 'on' : '') + '" data-action="pick-wallet" data-index="' + i + '">' +
                  '<span class="cp-brand">' + esc(w.method === 'nagad' ? 'Nagad' : 'bKash') + '</span>' +
                  '<strong>' + esc(w.number) + '</strong>' +
                  '<span class="muted">' + (w.method === 'nagad' ? 'Nagad' : 'bKash') + ' · sender</span>' +
                '</button>').join('') +
            '</div>' +
          '</div>'
        : '';

    const p = CO.payment || { method: 'bkash' };
    const isWallet = p.method === 'bkash' || p.method === 'nagad';

    return '<form class="co-panel" data-action="pay-submit" novalidate>' +
      saved +
      '<h3>Payment method</h3>' +
      '<div class="pay-methods">' +
        ['bkash', 'nagad', 'cod'].map(m =>
          '<label class="pm ' + ((p.method || 'bkash') === m ? 'on' : '') + '">' +
            '<input type="radio" name="pmethod" value="' + m + '" data-action="pmethod" ' + ((p.method || 'bkash') === m ? 'checked' : '') + '>' +
            '<span class="pm-ico">' + { bkash: '🔴', nagad: '🟠', cod: '💵' }[m] + '</span>' +
            '<strong>' + { bkash: 'bKash', nagad: 'Nagad', cod: 'Cash on delivery' }[m] + '</strong>' +
            '<small>' + { bkash: 'Personal', nagad: 'Personal', cod: 'Pay when you receive' }[m] + '</small>' +
          '</label>').join('') +
      '</div>' +
      '<div class="wallet-fields" id="walletFields"' + (isWallet ? '' : ' hidden') + '>' +
        '<div class="wallet-note">' +
          '<span class="wn-ico">' + (p.method === 'nagad' ? '🟠' : '🔴') + '</span>' +
          '<div><strong>Send money to (Personal)</strong><p class="wn-num">' + DB.MERCHANT_NUMBER + '</p>' +
          '<p class="muted small">After sending ' + money(Store.totals().total) + ', enter your number and TrxID below.</p></div>' +
        '</div>' +
        '<div class="co-grid2">' +
          '<label>Your ' + (p.method === 'nagad' ? 'Nagad' : 'bKash') + ' number<input id="pwNumber" placeholder="01XXXXXXXXX" value="' + esc(p.number || '') + '" required></label>' +
          '<label>Transaction ID (TrxID)<input id="pwTrx" placeholder="e.g. 9HM7K2LQ5R" value="' + esc(p.trx || '') + '" required></label>' +
        '</div>' +
      '</div>' +
      '<div class="cod-note" id="codNote"' + (isWallet ? ' hidden' : '') + '>' +
        '<span>💵</span><div><strong>Cash on delivery</strong>' +
        '<p class="muted small">Pay in cash when your order arrives. Delivery fee ' + (Store.totals().shipping ? money(Store.totals().shipping) : 'FREE') + ' applies as usual.</p></div>' +
      '</div>' +
      '<label class="f-check co-save"><input type="checkbox" id="pwSave"><span class="f-box"></span>Save this wallet for faster checkout</label>' +
      '<div class="co-actions">' +
        '<button type="button" class="btn btn-ghost" data-action="prev-step">← Back</button>' +
        '<button type="submit" class="btn btn-primary btn-lg">Review order →</button>' +
      '</div>' +
    '</form>';
  }

  /* ---------------- Step 3: Review ---------------- */
  function reviewStep() {
    const t = Store.totals();
    const s = CO.shipping;
    const pm = CO.payment.method;
    const payLabel = pm === 'bkash'
      ? '🔴 bKash · ' + esc(CO.payment.number) + ' · TrxID ' + esc(CO.payment.trx)
      : pm === 'nagad'
        ? '🟠 Nagad · ' + esc(CO.payment.number) + ' · TrxID ' + esc(CO.payment.trx)
        : '💵 Cash on delivery';

    return '<div class="co-panel">' +
      '<h3>Review your order</h3>' +
      '<div class="co-review">' +
        '<div class="co-review-col">' +
          '<div class="co-block"><h4>Shipping to</h4><p class="muted">' +
            esc(s.fullName) + '<br>' + esc(s.line1) + (s.line2 ? '<br>' + esc(s.line2) : '') +
            '<br>' + esc(s.city) + (s.state ? ', ' + esc(s.state) : '') + ' ' + esc(s.zip) + '<br>' + esc(s.country) + '</p>' +
            '<button class="btn btn-ghost btn-sm" data-action="edit-shipping">Edit</button></div>' +
          '<div class="co-block"><h4>Payment</h4><p class="muted">' + payLabel + '</p>' +
            '<button class="btn btn-ghost btn-sm" data-action="edit-payment">Edit</button></div>' +
        '</div>' +
        '<div class="co-review-col">' +
          '<h4>Items (' + Store.cartCount() + ')</h4>' +
          Store.state.cart.map(i => {
            const p = DB.byId(i.id);
            return '<div class="co-item"><img src="' + DB.image(p, 100, 75) + '" alt="">' +
              '<div class="co-item-info"><strong>' + esc(p.name) + '</strong><span class="muted">Qty ' + i.qty + '</span></div>' +
              '<strong>' + money(p.price * i.qty) + '</strong></div>';
          }).join('') +
          '<div class="co-summary">' +
            '<div class="t-row"><span>Subtotal</span><span>' + money(t.sub) + '</span></div>' +
            (t.discount ? '<div class="t-row t-discount"><span>Discount (' + Store.state.promo + ')</span><span>−' + money(t.discount) + '</span></div>' : '') +
            '<div class="t-row"><span>Shipping</span><span>' + (t.shipping ? money(t.shipping) : 'FREE') + '</span></div>' +
            '<div class="t-row"><span>VAT (5%)</span><span>' + money(t.tax) + '</span></div>' +
            '<div class="t-row t-total"><span>Total</span><span>' + money(t.total) + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="co-actions">' +
        '<button type="button" class="btn btn-ghost" data-action="prev-step">← Back</button>' +
        '<button type="button" class="btn btn-primary btn-lg" data-action="place-order">Place order · ' + money(t.total) + '</button>' +
      '</div>' +
    '</div>';
  }

  function countries() {
    const list = ['Bangladesh', 'United States', 'Canada', 'United Kingdom', 'India', 'Saudi Arabia', 'UAE', 'Singapore', 'Other'];
    return list.map(c => '<option' + (CO.shipping && CO.shipping.country === c ? ' selected' : '') + '>' + c + '</option>').join('');
  }

  /* ---------------- Actions ---------------- */
  const Actions = {
    'back-shop'() { location.hash = '#/shop'; },
    'prev-step'() { CO.step = Math.max(1, CO.step - 1); rerender(); },
    'next-step'() { CO.step = Math.min(3, CO.step + 1); rerender(); },
    'edit-shipping'() { CO.step = 1; rerender(); },
    'edit-payment'() { CO.step = 2; rerender(); },

    'pick-address'(el) {
      const user = Store.currentUser();
      CO.useSaved = +el.dataset.index;
      CO.shipping = { ...user.addresses[CO.useSaved] };
      document.querySelectorAll('.addr-pick').forEach((b, i) => b.classList.toggle('on', i === CO.useSaved));
    },
    'pick-wallet'(el) {
      const user = Store.currentUser();
      CO.useSaved = +el.dataset.index;
      CO.payment = { ...user.wallets[CO.useSaved] };
      document.querySelectorAll('.card-pick').forEach((b, i) => b.classList.toggle('on', i === CO.useSaved));
      syncWalletUI();
    },

    pmethod(el) {
      const method = el.value;
      CO.payment = { ...(CO.payment || {}), method };
      document.querySelectorAll('.pm').forEach(b => b.classList.toggle('on', b.querySelector('input').value === method));
      syncWalletUI();
    },

    'ship-submit'(e) {
      e.preventDefault();
      const get = id => $(id)?.value.trim() ?? '';
      const s = {
        fullName: get('#shName'), email: get('#shEmail'), phone: get('#shPhone'),
        line1: get('#shLine1'), line2: get('#shLine2'), city: get('#shCity'),
        state: get('#shState'), zip: get('#shZip'), country: get('#shCountry') || 'Bangladesh',
      };
      if (!s.fullName || !s.email || !s.phone || !s.line1 || !s.city || !s.zip) return toast('Please fill in all required fields', 'error');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) return toast('Enter a valid email address', 'error');
      CO.shipping = s;
      if ($('#shSave').checked && Store.isAuthed()) {
        const user = Store.currentUser();
        user.addresses.push({ fullName: s.fullName, line1: s.line1, line2: s.line2, city: s.city, state: s.state, zip: s.zip, country: s.country, label: 'New' });
        Store.updateUser({ addresses: user.addresses });
        toast('✓ Address saved to your account');
      }
      CO.step = 2;
      rerender();
    },

    'pay-submit'(e) {
      e.preventDefault();
      const method = $('input[name="pmethod"]:checked').value;
      if (method === 'bkash' || method === 'nagad') {
        const number = $('#pwNumber').value.trim();
        const trx = $('#pwTrx').value.trim();
        if (!/^01[3-9]\d{8}$/.test(number)) return toast('Enter a valid ' + (method === 'nagad' ? 'Nagad' : 'bKash') + ' number (01XXXXXXXXX)', 'error');
        if (!trx) return toast('Please enter the Transaction ID (TrxID)', 'error');
        CO.payment = {
          method, number, trx,
          label: (method === 'nagad' ? '🟠 Nagad' : '🔴 bKash') + ' · ' + number + ' · TrxID ' + trx,
        };
        if ($('#pwSave').checked && Store.isAuthed()) {
          const user = Store.currentUser();
          user.wallets = user.wallets || [];
          if (!user.wallets.some(w => w.method === method && w.number === number)) {
            user.wallets.push({ method, number });
            Store.updateUser({ wallets: user.wallets });
            toast('✓ Wallet saved to your account');
          }
        }
      } else {
        CO.payment = { method, label: '💵 Cash on delivery' };
      }
      CO.step = 3;
      rerender();
    },

    'place-order'() {
      const order = Store.placeOrder({ shipping: CO.shipping, payment: CO.payment });
      toast('🎉 Order placed successfully!', 'success');
      CO.shipping = null; CO.payment = null; CO.step = 1;
      location.hash = '#/order/' + order.id;
    },
  };

  function syncWalletUI() {
    const method = CO.payment?.method || 'bkash';
    const walletFields = $('#walletFields');
    const codNote = $('#codNote');
    if (walletFields) walletFields.hidden = method !== 'bkash' && method !== 'nagad';
    if (codNote) codNote.hidden = method === 'bkash' || method === 'nagad';
    const note = $('#walletFields .wn-ico');
    if (note) {
      note.textContent = method === 'nagad' ? '🟠' : '🔴';
      const strong = $('#walletFields .wallet-note strong');
      if (strong) strong.textContent = 'Send money to (Personal)';
      const p = $('#walletFields .co-grid2 label:first-child');
      if (p) p.childNodes[0].textContent = 'Your ' + (method === 'nagad' ? 'Nagad' : 'bKash') + ' number';
    }
  }

  function rerender() {
    $('#coBody').innerHTML = stepBody(CO.step);
    document.querySelectorAll('.step').forEach(s => {
      s.classList.toggle('on', +s.dataset.step <= CO.step);
      s.classList.toggle('current', +s.dataset.step === CO.step);
    });
    syncWalletUI();
  }

  Object.assign(App.Actions, Actions);
  window.checkoutView = checkoutView;
})();
