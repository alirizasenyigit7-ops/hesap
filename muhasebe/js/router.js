/**
 * SPA Hash Router
 */

import { updateSidebarActive } from './components/sidebar.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderTemplates } from './pages/templates.js';
import { renderInvoices } from './pages/invoices.js';
import { renderExpenses } from './pages/expenses.js';
import { renderInvestments } from './pages/investments.js';
import { renderSettings } from './pages/settings.js';

const ROUTES = {
  '#/dashboard': renderDashboard,
  '#/templates': renderTemplates,
  '#/invoices': renderInvoices,
  '#/expenses': renderExpenses,
  '#/investments': renderInvestments,
  '#/settings': renderSettings
};

export const Router = {
  currentRoute: null,

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    // Also listen for storage data changes to auto-refresh current page if needed
    window.addEventListener('muhasebe-data-changed', () => {
      this.refreshCurrent();
    });

    this.handleRoute();
  },

  handleRoute() {
    let hash = window.location.hash || '#/dashboard';
    if (!ROUTES[hash]) {
      hash = '#/dashboard';
      window.location.hash = hash;
      return;
    }

    this.currentRoute = hash;
    updateSidebarActive(hash);

    const container = document.getElementById('page-content');
    if (!container) return;

    // Smooth page fade transition
    container.style.opacity = '0';
    container.style.transform = 'translateY(6px)';
    container.style.transition = 'opacity 180ms ease, transform 180ms ease';

    setTimeout(() => {
      const renderPage = ROUTES[hash];
      if (typeof renderPage === 'function') {
        renderPage(container);
      }
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 90);
  },

  refreshCurrent() {
    const container = document.getElementById('page-content');
    if (!container || !this.currentRoute) return;
    const renderPage = ROUTES[this.currentRoute];
    if (typeof renderPage === 'function') {
      renderPage(container);
    }
  }
};
