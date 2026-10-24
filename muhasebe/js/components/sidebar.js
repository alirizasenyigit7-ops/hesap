/**
 * Sidebar Navigation Component
 */

const NAV_ITEMS = [
  { hash: '#/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { hash: '#/templates', label: 'Şablonlar', icon: 'file-text' },
  { hash: '#/invoices', label: 'Fatura Ödemeleri', icon: 'receipt' },
  { hash: '#/expenses', label: 'Harcamalar', icon: 'credit-card' },
  { hash: '#/investments', label: 'Yatırımlar', icon: 'trending-up' },
  { hash: '#/settings', label: 'Ayarlar', icon: 'settings' }
];

export function renderSidebar() {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const currentHash = window.location.hash || '#/dashboard';

  const linksHtml = NAV_ITEMS.map(item => {
    const isActive = currentHash.startsWith(item.hash) ? 'active' : '';
    return `
      <a href="${item.hash}" class="sidebar__link ${isActive}" data-hash="${item.hash}">
        <i data-lucide="${item.icon}"></i>
        <span>${item.label}</span>
      </a>
    `;
  }).join('');

  container.innerHTML = `
    <!-- Mobile Backdrop -->
    <div id="sidebar-backdrop" class="sidebar-backdrop"></div>

    <div class="sidebar" id="sidebar">
      <div class="sidebar__brand">
        <div class="sidebar__logo">₺</div>
        <div class="sidebar__brand-text">
          <span class="sidebar__brand-name">Muhasebe</span>
          <span class="sidebar__brand-tag">Kişisel Finans</span>
        </div>
      </div>

      <nav class="sidebar__nav">
        ${linksHtml}
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__version">v1.0.0 • Tarayıcıda Güvende</div>
      </div>
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ root: container });
  }

  // Mobile toggle logic
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const toggleBtn = document.getElementById('menu-toggle-btn');

  const closeSidebar = () => {
    sidebar.classList.remove('sidebar--open');
    backdrop.classList.remove('sidebar-backdrop--visible');
  };

  const openSidebar = () => {
    sidebar.classList.add('sidebar--open');
    backdrop.classList.add('sidebar-backdrop--visible');
  };

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (sidebar.classList.contains('sidebar--open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  // Close sidebar on link click (mobile)
  container.querySelectorAll('.sidebar__link').forEach(link => {
    link.addEventListener('click', closeSidebar);
  });
}

export function updateSidebarActive(hash) {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  container.querySelectorAll('.sidebar__link').forEach(link => {
    const targetHash = link.getAttribute('data-hash');
    if (hash === targetHash || (targetHash !== '#/dashboard' && hash.startsWith(targetHash))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}
