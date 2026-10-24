/**
 * Toast Notification Component
 */

let container = null;

export function initToast() {
  container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
}

export function showToast(message, type = 'success', duration = 3200) {
  if (!container) initToast();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const iconName = {
    success: 'check-circle-2',
    error: 'alert-triangle',
    warning: 'alert-circle',
    info: 'info'
  }[type] || 'info';

  toast.innerHTML = `
    <div class="toast__icon">
      <i data-lucide="${iconName}"></i>
    </div>
    <div class="toast__message">${message}</div>
    <button class="toast__close" aria-label="Kapat">
      <i data-lucide="x"></i>
    </button>
  `;

  const closeBtn = toast.querySelector('.toast__close');
  const removeToast = () => {
    toast.classList.add('toast--hiding');
    let removed = false;
    const finish = () => {
      if (removed) return;
      removed = true;
      toast.remove();
    };
    toast.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 220);
  };

  closeBtn.addEventListener('click', removeToast);

  container.appendChild(toast);
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ root: toast });
  }

  setTimeout(removeToast, duration);
}
