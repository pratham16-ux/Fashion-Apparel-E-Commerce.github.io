// ===================== STACKLY THEME SCRIPT =====================
// Each feature block below is wrapped in its own try/catch so that if any single
// feature fails in a given browser/environment, it CANNOT block the others
// (in particular: the cart and wishlist must always work).

document.addEventListener('DOMContentLoaded', () => {

  /* ===================== PRELOADER (runs first, always — never let anything below block this) ===================== */
  try{
    const pre = document.querySelector('.preloader');
    const hidePre = () => pre && pre.classList.add('hide');
    window.addEventListener('load', () => setTimeout(hidePre, 300));
    setTimeout(hidePre, 1200); // hard fallback no matter what
  }catch(err){ console.error('Stackly preloader error:', err); }

  /* ===================== SAFE STORAGE (falls back to memory if localStorage is blocked) ===================== */
  const memoryStore = {};
  const storageAvailable = (() => {
    try { const k='__stackly_test__'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return true; }
    catch(e){ return false; }
  })();
  function storeGet(key){
    if(storageAvailable){ try{ return localStorage.getItem(key); }catch(e){ return memoryStore[key] || null; } }
    return memoryStore[key] || null;
  }
  function storeSet(key, val){
    if(storageAvailable){ try{ localStorage.setItem(key, val); return; }catch(e){ /* fall through */ } }
    memoryStore[key] = val;
  }

  /* ===================== TOASTS ===================== */
  const toastStack = document.getElementById('toastStack');
  function showToast(msg, icon){
    icon = icon || 'fa-solid fa-circle-check';
    if(!toastStack) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<i class="' + icon + '"></i><span>' + msg + '</span>';
    toastStack.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(()=>t.remove(), 400); }, 2800);
  }

  /* ===================== CART (core commerce — always runs first) ===================== */
  const CART_KEY = 'stackly_cart';
  function getCart(){
    try{
      const raw = JSON.parse(storeGet(CART_KEY)) || [];
      if(!Array.isArray(raw)) return [];
      // sanitize every entry so a corrupted/legacy record can never crash rendering
      return raw.filter(i => i && typeof i.name === 'string').map(i => ({
        name: i.name,
        price: Number(i.price) || 0,
        img: typeof i.img === 'string' ? i.img : '',
        qty: Number(i.qty) > 0 ? Math.floor(Number(i.qty)) : 1
      }));
    }catch(e){ return []; }
  }
  function saveCart(cart){ try{ storeSet(CART_KEY, JSON.stringify(cart)); }catch(e){} renderCart(); }

  function addToCart(name, price, img){
    const cart = getCart();
    const existing = cart.find(i => i.name === name);
    if(existing){ existing.qty += 1; } else { cart.push({name, price:parseFloat(price)||0, img: img||'', qty:1}); }
    saveCart(cart);
    showToast('Added "' + name + '" to your bag', 'fa-solid fa-bag-shopping');
  }
  function removeFromCart(name){
    saveCart(getCart().filter(i => i.name !== name));
    showToast('Removed "' + name + '" from your bag', 'fa-solid fa-trash');
  }
  function changeQty(name, delta){
    const cart = getCart();
    const item = cart.find(i => i.name === name);
    if(!item) return;
    item.qty += delta;
    if(item.qty <= 0){ saveCart(cart.filter(i => i.name !== name)); }
    else { saveCart(cart); }
  }
  function renderCart(){
    try{
      const cart = getCart();
      const itemsEl = document.getElementById('cartItems');
      const badge = document.getElementById('cartBadge');
      const countEl = document.getElementById('cartCount');
      const subtotalEl = document.getElementById('cartSubtotal');
      const totalQty = cart.reduce((s,i)=>s+i.qty,0);
      const subtotal = cart.reduce((s,i)=>s+i.qty*i.price,0);
      if(badge) badge.textContent = totalQty;
      if(countEl) countEl.textContent = totalQty;
      if(subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
      if(!itemsEl) return;
      if(!cart.length){
        itemsEl.innerHTML = '<p class="cart-empty">Your bag is empty. Start adding pieces you love.</p>';
        return;
      }
      itemsEl.innerHTML = cart.map(i => (
        '<div class="cart-line" data-name="' + i.name + '">' +
          '<img src="' + (i.img || 'https://wsrv.nl/?url=images.unsplash.com/photo-1441984904996-e0b6ba687e04&w=140&h=180&fit=cover&output=webp&q=55') + '" alt="' + i.name + '">' +
          '<div class="cart-line-info">' +
            '<h5>' + i.name + '</h5>' +
            '<div class="cl-price">$' + i.price.toFixed(2) + '</div>' +
            '<div class="cart-line-qty">' +
              '<button class="cl-minus" type="button">\u2212</button>' +
              '<span>' + i.qty + '</span>' +
              '<button class="cl-plus" type="button">+</button>' +
              '<a href="#" class="cart-line-remove">Remove</a>' +
            '</div>' +
          '</div>' +
        '</div>'
      )).join('');
      itemsEl.querySelectorAll('.cart-line').forEach(line => {
        const name = line.dataset.name;
        line.querySelector('.cl-minus').addEventListener('click', () => changeQty(name, -1));
        line.querySelector('.cl-plus').addEventListener('click', () => changeQty(name, 1));
        line.querySelector('.cart-line-remove').addEventListener('click', (e) => { e.preventDefault(); removeFromCart(name); });
      });
    }catch(err){ console.error('Stackly renderCart error:', err); }
  }
  try{ renderCart(); }catch(err){ console.error('Stackly initial renderCart error:', err); }

  const cartDrawer = document.getElementById('cartDrawer');
  const overlayMask = document.getElementById('overlayMask');
  const cartToggle = document.getElementById('cartToggle');
  const cartClose = document.getElementById('cartClose');
  function openCart(){ closeWishlistIfOpen(); cartDrawer && cartDrawer.classList.add('open'); overlayMask && overlayMask.classList.add('show'); document.body.style.overflow='hidden'; }
  function closeWishlistIfOpen(){ const wd = document.getElementById('wishlistDrawer'); wd && wd.classList.remove('open'); }
  function closeCart(){ cartDrawer && cartDrawer.classList.remove('open'); overlayMask && overlayMask.classList.remove('show'); document.body.style.overflow=''; }
  cartToggle && cartToggle.addEventListener('click', e => { e.preventDefault(); openCart(); });
  cartClose && cartClose.addEventListener('click', closeCart);

  const checkoutBtn = document.getElementById('checkoutBtn');
  checkoutBtn && checkoutBtn.addEventListener('click', e => {
    e.preventDefault();
    if(!getCart().length){ showToast('Your bag is empty', 'fa-solid fa-circle-exclamation'); return; }
    showToast('Redirecting to secure checkout...', 'fa-solid fa-lock');
  });

  document.body.addEventListener('click', e => {
    try{
      const quick = e.target.closest('.product-quickadd');
      const jsAdd = e.target.closest('.js-add-cart');
      if(quick){
        e.preventDefault();
        const card = quick.closest('.product-card');
        const name = card && card.querySelector('h4') ? card.querySelector('h4').textContent.trim() : 'Product';
        const priceEl = card ? (card.querySelector('.product-price .new') || card.querySelector('.product-price')) : null;
        const priceText = priceEl ? priceEl.textContent.replace(/[^0-9.]/g,'') : '0';
        const img = card && card.querySelector('img') ? card.querySelector('img').src : '';
        addToCart(name, priceText, img);
      } else if(jsAdd){
        e.preventDefault();
        const name = jsAdd.dataset.name || 'Product';
        const price = jsAdd.dataset.price || '0';
        const mainImg = document.querySelector('.pd-main-img img');
        addToCart(name, price, mainImg ? mainImg.src : '');
      }
    }catch(err){ console.error('Stackly cart error:', err); showToast('Something went wrong adding this item', 'fa-solid fa-triangle-exclamation'); }
  });

  /* ===================== WISHLIST (core commerce — always runs) ===================== */
  const WISH_KEY = 'stackly_wishlist';
  function getWishlist(){ try{ return JSON.parse(storeGet(WISH_KEY)) || []; }catch(e){ return []; } }
  function saveWishlist(list){ storeSet(WISH_KEY, JSON.stringify(list)); renderWishBadge(); renderWishlist(); }
  function renderWishBadge(){
    const badge = document.getElementById('wishBadge');
    if(badge) badge.textContent = getWishlist().length;
  }
  function renderWishlist(){
    try{
      const list = getWishlist();
      const itemsEl = document.getElementById('wishItems');
      const countEl = document.getElementById('wishCount');
      if(countEl) countEl.textContent = list.length;
      if(!itemsEl) return;
      if(!list.length){
        itemsEl.innerHTML = '<p class="cart-empty">Your wishlist is empty. Tap the heart on items you love.</p>';
        return;
      }
      itemsEl.innerHTML = list.map(name => (
        '<div class="cart-line" data-name="' + name + '">' +
          '<div class="cart-line-info">' +
            '<h5>' + name + '</h5>' +
            '<div class="cart-line-qty">' +
              '<a href="#" class="cart-line-remove wish-line-remove">Remove</a>' +
            '</div>' +
          '</div>' +
        '</div>'
      )).join('');
      itemsEl.querySelectorAll('.wish-line-remove').forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          const name = btn.closest('.cart-line').dataset.name;
          const remaining = getWishlist().filter(n => n !== name);
          saveWishlist(remaining);
          const card = document.querySelector('.product-wish.active-wish');
          document.querySelectorAll('.product-wish').forEach(wb => {
            const c = wb.closest('.product-card');
            const n = c && c.querySelector('h4') ? c.querySelector('h4').textContent.trim() : null;
            if(n === name){
              wb.classList.remove('active-wish');
              const icon = wb.querySelector('i');
              if(icon) icon.className = 'fa-regular fa-heart';
              wb.style.color = '';
            }
          });
        });
      });
    }catch(err){ console.error('Stackly renderWishlist error:', err); }
  }
  try{ renderWishBadge(); renderWishlist(); }catch(err){ console.error('Stackly initial wishlist render error:', err); }

  document.body.addEventListener('click', e => {
    const wishBtn = e.target.closest('.product-wish');
    if(!wishBtn) return;
    e.preventDefault();
    try{
      wishBtn.classList.toggle('active-wish');
      const card = wishBtn.closest('.product-card');
      const name = card && card.querySelector('h4') ? card.querySelector('h4').textContent.trim() : 'Item';
      let list = getWishlist();
      const icon = wishBtn.querySelector('i');
      if(wishBtn.classList.contains('active-wish')){
        if(list.indexOf(name) === -1) list.push(name);
        if(icon) icon.className = 'fa-solid fa-heart';
        wishBtn.style.color = '#7c2836';
        showToast('Added "' + name + '" to wishlist', 'fa-solid fa-heart');
      } else {
        list = list.filter(n => n !== name);
        if(icon) icon.className = 'fa-regular fa-heart';
        wishBtn.style.color = '';
        showToast('Removed "' + name + '" from wishlist', 'fa-regular fa-heart');
      }
      saveWishlist(list);
    }catch(err){ console.error('Stackly wishlist error:', err); showToast('Something went wrong', 'fa-solid fa-triangle-exclamation'); }
  });

  const wishlistDrawer = document.getElementById('wishlistDrawer');
  const wishlistToggle = document.getElementById('wishlistToggle');
  const wishlistClose = document.getElementById('wishlistClose');
  function openWishlist(){ renderWishlist(); cartDrawer && cartDrawer.classList.remove('open'); wishlistDrawer && wishlistDrawer.classList.add('open'); overlayMask && overlayMask.classList.add('show'); document.body.style.overflow='hidden'; }
  function closeWishlist(){ wishlistDrawer && wishlistDrawer.classList.remove('open'); overlayMask && overlayMask.classList.remove('show'); document.body.style.overflow=''; }
  wishlistToggle && wishlistToggle.addEventListener('click', e => { e.preventDefault(); openWishlist(); });
  wishlistClose && wishlistClose.addEventListener('click', closeWishlist);

  /* ===================== SEARCH OVERLAY ===================== */
  try{
    const searchOverlay = document.getElementById('searchOverlay');
    const searchToggle = document.getElementById('searchToggle');
    const searchClose = document.getElementById('searchClose');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.getElementById('searchForm');
    function openSearch(){ searchOverlay && searchOverlay.classList.add('open'); overlayMask && overlayMask.classList.add('show'); document.body.style.overflow='hidden'; setTimeout(()=> searchInput && searchInput.focus(), 400); }
    function closeSearch(){ searchOverlay && searchOverlay.classList.remove('open'); overlayMask && overlayMask.classList.remove('show'); document.body.style.overflow=''; }
    searchToggle && searchToggle.addEventListener('click', e => { e.preventDefault(); openSearch(); });
    searchClose && searchClose.addEventListener('click', closeSearch);
    searchForm && searchForm.addEventListener('submit', e => {
      e.preventDefault();
      const q = searchInput.value.trim();
      if(q){ showToast('Searching for "' + q + '"...', 'fa-solid fa-magnifying-glass'); closeSearch(); window.location.href = 'shop.html'; }
    });
    overlayMask && overlayMask.addEventListener('click', () => { closeCart(); closeSearch(); closeWishlist(); });
    document.addEventListener('keydown', e => { if(e.key === 'Escape'){ closeSearch(); closeCart(); closeWishlist(); } });
  }catch(err){ console.error('Stackly search error:', err); }

  /* ===================== FORMS: newsletter / contact ===================== */
  try{
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    function markFieldError(field, show){
      if(!field) return;
      field.classList.toggle('field-error', !!show);
    }
    document.querySelectorAll('form').forEach(f => {
      if(f.id === 'searchForm') return;
      const emailField = f.querySelector('input[type="email"]');
      if(emailField){
        emailField.addEventListener('input', () => markFieldError(emailField, false));
      }
      f.addEventListener('submit', e => {
        e.preventDefault();
        if(emailField){
          const val = emailField.value.trim();
          if(!val){
            markFieldError(emailField, true);
            showToast('Please enter your email address', 'fa-solid fa-triangle-exclamation');
            emailField.focus();
            return;
          }
          if(!EMAIL_RE.test(val)){
            markFieldError(emailField, true);
            showToast('Please enter a valid email address', 'fa-solid fa-triangle-exclamation');
            emailField.focus();
            return;
          }
          markFieldError(emailField, false);
        }
        const btn = f.querySelector('button');
        const original = btn ? btn.textContent : '';
        if(btn){ btn.textContent = 'Thank You!'; }
        showToast('Thank you \u2014 we\u2019ll be in touch shortly!', 'fa-solid fa-envelope-circle-check');
        setTimeout(() => { if(btn) btn.textContent = original; f.reset(); }, 2200);
      });
    });
  }catch(err){ console.error('Stackly form error:', err); }

  /* ===================== SHOP: SORT + FILTER ===================== */
  try{
    const sortSelect = document.querySelector('.toolbar select');
    if(sortSelect){
      sortSelect.addEventListener('change', () => {
        const grid = document.querySelector('.shop-layout .grid-3');
        if(!grid) return;
        const cards = Array.from(grid.children);
        const getPrice = c => { const el = c.querySelector('.product-price .new'); return el ? (parseFloat(el.textContent.replace(/[^0-9.]/g,'')) || 0) : 0; };
        if(sortSelect.value.indexOf('Low to High') !== -1) cards.sort((a,b)=>getPrice(a)-getPrice(b));
        else if(sortSelect.value.indexOf('High to Low') !== -1) cards.sort((a,b)=>getPrice(b)-getPrice(a));
        cards.forEach(c => grid.appendChild(c));
        showToast('Products sorted', 'fa-solid fa-arrow-down-a-z');
      });
    }
    document.querySelectorAll('.filter-check').forEach(f => {
      f.addEventListener('click', () => {
        f.classList.toggle('active-filter');
        f.style.color = f.classList.contains('active-filter') ? '#7c2836' : '';
        f.style.fontWeight = f.classList.contains('active-filter') ? '500' : '300';
      });
    });
  }catch(err){ console.error('Stackly shop-tools error:', err); }

  /* ===================== HAMBURGER FULLSCREEN MENU ===================== */
  try{
    const hamburger = document.querySelector('.hamburger:not(.fs-close)');
    const fsMenu = document.querySelector('.fullscreen-menu');
    const fsClose = document.querySelector('.fs-close');
    function toggleMenu(open){
      fsMenu.classList.toggle('open', open);
      hamburger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    hamburger && hamburger.addEventListener('click', () => toggleMenu(!fsMenu.classList.contains('open')));
    fsClose && fsClose.addEventListener('click', () => toggleMenu(false));
    document.querySelectorAll('.fs-nav a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  }catch(err){ console.error('Stackly menu error:', err); }

  /* ===================== HERO SLIDER — autoplay every 3s ===================== */
  try{
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dots button');
    let idx = 0, timer;
    function showSlide(n){
      slides.forEach(s => s.classList.remove('active'));
      dots.forEach(d => d.classList.remove('active'));
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('active');
      dots[idx] && dots[idx].classList.add('active');
    }
    function nextSlide(){ showSlide(idx + 1); }
    if(slides.length){
      showSlide(0);
      timer = setInterval(nextSlide, 3000);
      dots.forEach((d,i) => d.addEventListener('click', () => { showSlide(i); clearInterval(timer); timer = setInterval(nextSlide,3000); }));
      document.querySelectorAll('.hero-nav-arrows button').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.dataset.dir === 'next' ? nextSlide() : showSlide(idx - 1);
          clearInterval(timer); timer = setInterval(nextSlide, 3000);
        });
      });
    }
  }catch(err){ console.error('Stackly hero slider error:', err); }

  /* ===================== SCROLL REVEAL ANIMATIONS ===================== */
  try{
    const revealEls = document.querySelectorAll('.reveal, .reveal-scale');
    if(typeof IntersectionObserver !== 'undefined'){
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
      }, {threshold:.15});
      revealEls.forEach(el => io.observe(el));
    } else {
      // No IntersectionObserver support — just show everything immediately.
      revealEls.forEach(el => el.classList.add('in'));
    }
  }catch(err){ console.error('Stackly reveal error:', err); document.querySelectorAll('.reveal, .reveal-scale').forEach(el => el.classList.add('in')); }

  /* ===================== BACK TO TOP ===================== */
  try{
    const toTop = document.querySelector('.to-top');
    window.addEventListener('scroll', () => { if(toTop) toTop.classList.toggle('show', window.scrollY > 600); });
    toTop && toTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  }catch(err){ console.error('Stackly to-top error:', err); }

  /* ===================== ACCORDION (FAQ) ===================== */
  try{
    document.querySelectorAll('.accordion-item').forEach(item => {
      item.querySelector('.accordion-head').addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        item.parentElement.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
        if(!isOpen) item.classList.add('open');
      });
    });
  }catch(err){ console.error('Stackly accordion error:', err); }

  /* ===================== TABS (product page) ===================== */
  try{
    document.querySelectorAll('.tabs-nav button').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.closest('.tabs-wrap');
        group.querySelectorAll('.tabs-nav button').forEach(b => b.classList.remove('active'));
        group.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        group.querySelector('#'+btn.dataset.tab).classList.add('active');
      });
    });
  }catch(err){ console.error('Stackly tabs error:', err); }

  /* ===================== SIZE / COLOUR SELECTORS ===================== */
  try{
    document.querySelectorAll('.size-box').forEach(box => {
      box.addEventListener('click', () => {
        box.parentElement.querySelectorAll('.size-box').forEach(b => b.classList.remove('active'));
        box.classList.add('active');
      });
    });
    document.querySelectorAll('.swatch').forEach(s => {
      s.addEventListener('click', () => {
        s.parentElement.querySelectorAll('.swatch').forEach(b => b.classList.remove('active'));
        s.classList.add('active');
      });
    });
  }catch(err){ console.error('Stackly selector error:', err); }

  /* ===================== QTY STEPPER ===================== */
  try{
    document.querySelectorAll('.qty-box').forEach(box => {
      const input = box.querySelector('input');
      box.querySelector('.minus').addEventListener('click', () => input.value = Math.max(1, +input.value - 1));
      box.querySelector('.plus').addEventListener('click', () => input.value = +input.value + 1);
    });
  }catch(err){ console.error('Stackly qty error:', err); }

  /* ===================== PRODUCT IMAGE THUMB SWAP ===================== */
  try{
    document.querySelectorAll('.pd-thumbs img').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.pd-thumbs img').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        const mainImg = document.querySelector('.pd-main-img img');
        if(mainImg) mainImg.src = t.src.replace('w=140','w=900');
      });
    });
  }catch(err){ console.error('Stackly thumb error:', err); }

  /* ===================== AMBIENT CURSOR BLOB (desktop only) ===================== */
  try{
    const blob = document.querySelector('.ambient-blob');
    if(blob && window.innerWidth > 900){
      window.addEventListener('mousemove', e => {
        blob.style.transform = 'translate(' + (e.clientX-210) + 'px,' + (e.clientY-210) + 'px)';
      });
    }
  }catch(err){ console.error('Stackly ambient blob error:', err); }

});