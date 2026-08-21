/* ===================== STACKLY — DASHBOARD SHARED LOGIC ===================== */

function showDashToast(msg){
  const t = document.getElementById('dashToast');
  if(!t) return;
  document.getElementById('dashToastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

function initDashboard(requiredRole){
  // ---------- Auth guard ----------
  let session = null;
  try{ session = JSON.parse(localStorage.getItem('stackly_session')); }catch(e){}

  if(!session || !session.role){
    window.location.href = 'login.html';
    return;
  }
  if(session.role !== requiredRole){
    // wrong dashboard for this role — send to correct one
    window.location.href = session.role === 'admin' ? 'dashboard-admin.html' : 'dashboard-customer.html';
    return;
  }

  // ---------- Populate user info everywhere ----------
  const initial = (session.name || (requiredRole === 'admin' ? 'Admin' : 'Customer')).trim().charAt(0).toUpperCase();
  const displayName = session.name ? session.name.charAt(0).toUpperCase() + session.name.slice(1) : (requiredRole === 'admin' ? 'Admin' : 'Customer');

  const setText = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setText('sideAvatar', initial);
  setText('chipAvatar', initial);
  setText('sideName', displayName);
  setText('chipName', displayName);
  setText('sideId', session.id);
  setText('chipId', 'ID: ' + session.id);
  setText('welcomeId', session.id);
  setText('welcomeName', requiredRole === 'admin' ? ('Welcome back, ' + displayName) : ('Welcome back, ' + displayName + '!'));

  const setIdField = document.getElementById('setId');
  if(setIdField) setIdField.value = session.id;
  const setEmailField = document.getElementById('setEmail');
  if(setEmailField && session.email) setEmailField.value = session.email;
  const setNameField = document.getElementById('setName');
  if(setNameField && session.name) setNameField.value = displayName;

  // ---------- Sidebar nav / view switching ----------
  const navLinks = document.querySelectorAll('.nav-link');
  const views = document.querySelectorAll('.dash-view');
  const pageTitle = document.getElementById('pageTitle');

  const bottomNavLinks = document.querySelectorAll('.dash-bottom-nav a');

  function goToView(viewName){
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.view === viewName));
    bottomNavLinks.forEach(l => l.classList.toggle('active', l.dataset.view === viewName));
    views.forEach(v => {
      const isTarget = v.id === 'view-' + viewName;
      if(isTarget){
        // restart entrance animation each time the view is opened
        v.classList.remove('active');
        // eslint-disable-next-line no-unused-expressions
        v.offsetHeight; // force reflow
      }
      v.classList.toggle('active', isTarget);
    });
    const activeLink = document.querySelector('.nav-link[data-view="'+viewName+'"]') || document.querySelector('.dash-bottom-nav a[data-view="'+viewName+'"]');
    if(pageTitle && activeLink) pageTitle.textContent = activeLink.textContent.trim();
    closeSidebar();
    closeNotifPanel();
    window.scrollTo({top:0, behavior:'smooth'});
    animateStatNumbers(viewName);
  }

  navLinks.forEach(link=>{
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      goToView(link.dataset.view);
    });
  });

  bottomNavLinks.forEach(link=>{
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      goToView(link.dataset.view);
    });
  });

  document.querySelectorAll('[data-goto]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.preventDefault();
      goToView(el.dataset.goto);
    });
  });

  // ---------- Mobile sidebar ----------
  const sidebar = document.getElementById('dashSidebar');
  const overlay = document.getElementById('dashOverlay');
  const menuBtn = document.getElementById('dashMenuBtn');
  const closeBtn = document.getElementById('sidebarClose');

  function openSidebar(){
    sidebar.classList.add('open');
    overlay.classList.add('show');
  }
  function closeSidebar(){
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  }
  if(menuBtn) menuBtn.addEventListener('click', openSidebar);
  if(closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if(overlay) overlay.addEventListener('click', closeSidebar);

  // ---------- Notifications dropdown ----------
  const notifBtn = document.getElementById('notifBtn');
  const notifPanel = document.getElementById('notifPanel');
  const notifClearAll = document.getElementById('notifClearAll');

  function closeNotifPanel(){
    if(notifPanel) notifPanel.classList.remove('show');
  }
  if(notifBtn && notifPanel){
    notifBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      notifPanel.classList.toggle('show');
    });
    notifPanel.addEventListener('click', (e)=> e.stopPropagation());
    document.addEventListener('click', closeNotifPanel);
  }
  if(notifClearAll){
    notifClearAll.addEventListener('click', ()=>{
      document.querySelectorAll('.notif-item.unread').forEach(n=>n.classList.remove('unread'));
      const dot = document.querySelector('.notif-dot-live');
      if(dot) dot.style.display = 'none';
      showDashToast('All notifications marked as read');
    });
  }

  // ---------- Animated stat counters ----------
  function animateStatNumbers(viewName){
    if(viewName && viewName !== 'overview') return;
    document.querySelectorAll('#view-overview .stat-card h3').forEach(el=>{
      const raw = el.textContent.trim();
      const match = raw.match(/[\d,]+(\.\d+)?/);
      if(!match) return;
      const prefix = raw.slice(0, match.index);
      const suffix = raw.slice(match.index + match[0].length);
      const target = parseFloat(match[0].replace(/,/g,''));
      const hasDecimals = match[0].includes('.');
      const duration = 900;
      const start = performance.now();
      function tick(now){
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = target * eased;
        const display = hasDecimals ? val.toFixed(2) : Math.round(val).toLocaleString('en-US');
        el.textContent = prefix + display + suffix;
        if(progress < 1) requestAnimationFrame(tick);
        else el.textContent = raw;
      }
      requestAnimationFrame(tick);
    });
  }
  // run once on initial load for the default overview view
  animateStatNumbers('overview');

  // ---------- Ripple effect on interactive buttons ----------
  document.querySelectorAll('.btn-solid-sm, .btn-outline-sm, .logout-btn, .row-actions button, .icon-btn, .remove-wish').forEach(btn=>{
    btn.addEventListener('click', function(e){
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'dash-ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
      this.appendChild(ripple);
      setTimeout(()=> ripple.remove(), 650);
    });
  });

  // ---------- Logout ----------
  function doLogout(){
    localStorage.removeItem('stackly_session');
    window.location.href = 'login.html';
  }
  const topLogout = document.getElementById('topLogout');
  const sidebarLogout = document.getElementById('sidebarLogout');
  if(topLogout) topLogout.addEventListener('click', doLogout);
  if(sidebarLogout) sidebarLogout.addEventListener('click', doLogout);

  // ---------- Settings save ----------
  const saveBtn = document.getElementById('saveSettings');
  if(saveBtn){
    saveBtn.addEventListener('click', ()=>{
      const nameVal = document.getElementById('setName') ? document.getElementById('setName').value : session.name;
      const emailVal = document.getElementById('setEmail') ? document.getElementById('setEmail').value : session.email;
      session.name = nameVal;
      session.email = emailVal;
      localStorage.setItem('stackly_session', JSON.stringify(session));
      const newInitial = nameVal.trim().charAt(0).toUpperCase();
      setText('sideAvatar', newInitial);
      setText('chipAvatar', newInitial);
      setText('sideName', nameVal);
      setText('chipName', nameVal);
      showDashToast('Settings saved successfully');
    });
  }

  // ---------- Wishlist remove buttons ----------
  const wishGrid = document.querySelector('.wish-grid');
  document.querySelectorAll('.remove-wish').forEach(btn=>{
    btn.addEventListener('click', function(){
      const card = this.closest('.wish-card');
      if(card){
        card.style.transition = 'all .3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(.9)';
        setTimeout(()=>{
          card.remove();
          if(wishGrid && wishGrid.querySelectorAll('.wish-card').length === 0){
            wishGrid.insertAdjacentHTML('afterend', `
              <div class="empty-state" id="wishEmptyState">
                <div class="ic"><i class="fa-regular fa-heart"></i></div>
                <h6>Your wishlist is empty</h6>
                <p>Items you save for later will show up here so you can find them fast.</p>
              </div>`);
          }
        }, 300);
        showDashToast('Removed from wishlist');
      }
    });
  });

  // ---------- Generic row action buttons (view/edit/delete/track/etc.) ----------
  document.querySelectorAll('.row-actions button').forEach(btn=>{
    btn.addEventListener('click', function(){
      const icon = this.querySelector('i');
      let msg = 'Action completed';
      if(icon){
        if(icon.classList.contains('fa-trash')) msg = 'Item deleted';
        else if(icon.classList.contains('fa-pen')) msg = 'Opening editor...';
        else if(icon.classList.contains('fa-eye')) msg = 'Opening details...';
        else if(icon.classList.contains('fa-file-invoice')) msg = 'Generating invoice...';
        else if(icon.classList.contains('fa-truck')) msg = 'Tracking shipment...';
        else if(icon.classList.contains('fa-rotate-right')) msg = 'Reordering item...';
        else if(icon.classList.contains('fa-check')) msg = 'Order approved';
        else if(icon.classList.contains('fa-envelope')) msg = 'Opening message...';
      }
      showDashToast(msg);
    });
  });

  // ---------- Add product button (admin) ----------
  const addProductBtn = document.getElementById('addProductBtn');
  if(addProductBtn){
    addProductBtn.addEventListener('click', ()=> showDashToast('Add Product form would open here'));
  }

  // ---------- Notification bell ----------
  document.querySelectorAll('.icon-btn').forEach(btn=>{
    if(btn.tagName === 'A') return;
    btn.addEventListener('click', ()=> showDashToast('No new notifications'));
  });
}