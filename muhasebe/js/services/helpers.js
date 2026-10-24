/**
 * Helper Utility Functions
 */

export function generateId(prefix = '') {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).substring(2, 10);
  return `${prefix}${prefix ? '_' : ''}${random}`;
}

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? dateStr : new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getEffectiveDate(payment) {
  if (payment.status === 'postponed' && payment.postponedTo) {
    return payment.postponedTo;
  }
  return payment.paymentDate;
}

export function getEffectiveAmount(payment) {
  if (payment.status === 'postponed' && payment.postponedAmount != null) {
    return Number(payment.postponedAmount) || 0;
  }
  return Number(payment.amount) || 0;
}

export function daysDiff(targetDateStr) {
  if (!targetDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = targetDateStr.split('-');
  let target;
  if (parts.length === 3) {
    target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  } else {
    target = new Date(targetDateStr);
  }
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getPaymentStatus(payment) {
  if (payment.status === 'paid') {
    return {
      label: 'Ödendi',
      badgeClass: 'badge-success',
      icon: 'check-circle'
    };
  }

  const effDate = getEffectiveDate(payment);
  const diff = daysDiff(effDate);

  if (diff < 0) {
    return {
      label: `${Math.abs(diff)} gün gecikti`,
      badgeClass: 'badge-danger badge-pulse',
      icon: 'alert-circle'
    };
  } else if (diff === 0) {
    return {
      label: 'Bugün son gün',
      badgeClass: 'badge-warning',
      icon: 'clock'
    };
  } else {
    const isPostponed = payment.status === 'postponed';
    return {
      label: `${diff} gün kaldı${isPostponed ? ' (Ertelendi)' : ''}`,
      badgeClass: isPostponed ? 'badge-warning' : 'badge-primary',
      icon: isPostponed ? 'calendar-clock' : 'calendar'
    };
  }
}

export function isThisMonth(dateStr) {
  if (!dateStr) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return Number(parts[0]) === currentYear && Number(parts[1]) === currentMonth;
  }
  const date = new Date(dateStr);
  return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth;
}

export function getCurrentMonthName() {
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date());
}

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
