/**
 * Modal Component
 */

import { escapeHtml } from '../services/helpers.js';

let modalContainer = null;
let currentKeyHandler = null;

export function initModal() {
  modalContainer = document.getElementById('modal-container');
}

export function closeModal() {
  if (!modalContainer) return;

  if (currentKeyHandler) {
    window.removeEventListener('keydown', currentKeyHandler);
    currentKeyHandler = null;
  }

  const overlay = modalContainer.querySelector('.modal-overlay');
  if (overlay) {
    overlay.classList.add('modal-overlay--closing');
    let cleaned = false;
    const finish = () => {
      if (cleaned) return;
      cleaned = true;
      modalContainer.innerHTML = '';
    };

    overlay.addEventListener('animationend', finish, { once: true });
    // Safety fallback so modal never gets stuck
    setTimeout(finish, 170);
  } else {
    modalContainer.innerHTML = '';
  }
}

/**
 * Open Form Modal
 * @param {Object} options
 * @param {string} options.title - Modal title
 * @param {Array} options.fields - Form fields configuration
 * @param {Function} options.onSubmit - Callback returning form object
 * @param {string} [options.submitText='Kaydet'] - Submit button text
 * @param {string} [options.submitClass='btn-primary'] - CSS class for submit button
 */
export function openModal({ title, fields = [], onSubmit, submitText = 'Kaydet', submitClass = 'btn-primary' }) {
  if (!modalContainer) initModal();

  const renderField = (field) => {
    const val = field.value != null ? field.value : '';
    const req = field.required ? 'required' : '';

    let inputHtml = '';
    if (field.type === 'select') {
      const optionsHtml = (field.options || []).map(opt => {
        const isSelected = String(opt.value) === String(val) ? 'selected' : '';
        return `<option value="${escapeHtml(opt.value)}" ${isSelected}>${escapeHtml(opt.label)}</option>`;
      }).join('');
      inputHtml = `<select id="field_${field.name}" name="${field.name}" class="form-select" ${req}>${optionsHtml}</select>`;
    } else if (field.type === 'textarea') {
      inputHtml = `<textarea id="field_${field.name}" name="${field.name}" class="form-textarea" placeholder="${escapeHtml(field.placeholder || '')}" ${req} rows="3">${escapeHtml(val)}</textarea>`;
    } else {
      const step = field.step ? `step="${field.step}"` : '';
      const min = field.min != null ? `min="${field.min}"` : '';
      inputHtml = `<input type="${field.type || 'text'}" id="field_${field.name}" name="${field.name}" class="form-input" value="${escapeHtml(val)}" placeholder="${escapeHtml(field.placeholder || '')}" ${step} ${min} ${req}>`;
    }

    return `
      <div class="form-group">
        <label for="field_${field.name}" class="form-label">
          ${escapeHtml(field.label)}
          ${field.required ? '<span class="text-danger">*</span>' : ''}
        </label>
        ${inputHtml}
        ${field.helpText ? `<span class="form-help">${escapeHtml(field.helpText)}</span>` : ''}
      </div>
    `;
  };

  const html = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <h2 id="modal-title" class="modal-title">${escapeHtml(title)}</h2>
          <button class="modal-close" id="modal-close-btn" aria-label="Kapat">
            <i data-lucide="x"></i>
          </button>
        </div>
        <form id="modal-form" class="modal-body">
          ${fields.map(renderField).join('')}
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" id="modal-cancel-btn">Vazgeç</button>
            <button type="submit" class="btn ${submitClass}" id="modal-submit-btn">${escapeHtml(submitText)}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalContainer.innerHTML = html;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ root: modalContainer });
  }

  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const form = document.getElementById('modal-form');

  const handleClose = () => closeModal();
  closeBtn.addEventListener('click', handleClose);
  cancelBtn.addEventListener('click', handleClose);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) handleClose();
  });

  currentKeyHandler = (e) => {
    if (e.key === 'Escape') handleClose();
  };
  window.addEventListener('keydown', currentKeyHandler);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value.trim();
    }
    closeModal();
    if (typeof onSubmit === 'function') {
      onSubmit(data);
    }
  });

  // Focus first input
  const firstInput = form.querySelector('input, select, textarea');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 50);
  }
}

/**
 * Open Confirmation Modal
 */
export function confirmModal({ title = 'Onaylıyor musunuz?', message, confirmText = 'Evet, Devam Et', confirmClass = 'btn-danger', onConfirm }) {
  if (!modalContainer) initModal();

  const html = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <h2 id="modal-title" class="modal-title">${escapeHtml(title)}</h2>
          <button class="modal-close" id="modal-close-btn" aria-label="Kapat">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); line-height: 1.6; font-size: var(--font-size-md); margin-bottom: var(--spacing-xl);">
            ${escapeHtml(message)}
          </p>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" id="modal-cancel-btn">İptal</button>
            <button type="button" class="btn ${confirmClass}" id="modal-confirm-btn">${escapeHtml(confirmText)}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  modalContainer.innerHTML = html;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ root: modalContainer });
  }

  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const confirmBtn = document.getElementById('modal-confirm-btn');

  const handleClose = () => closeModal();
  closeBtn.addEventListener('click', handleClose);
  cancelBtn.addEventListener('click', handleClose);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) handleClose();
  });

  currentKeyHandler = (e) => {
    if (e.key === 'Escape') handleClose();
  };
  window.addEventListener('keydown', currentKeyHandler);

  confirmBtn.addEventListener('click', () => {
    closeModal();
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  });
}
