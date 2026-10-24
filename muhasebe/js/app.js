/**
 * Main Application Bootstrap
 */

import { Storage } from './services/storage.js';
import { renderSidebar } from './components/sidebar.js';
import { initToast } from './components/toast.js';
import { initModal } from './components/modal.js';
import { Router } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize sample data if first time
  Storage.initSampleDataIfEmpty();

  // 2. Initialize global UI modules
  initToast();
  initModal();
  renderSidebar();

  // 3. Start Router
  Router.init();
});
