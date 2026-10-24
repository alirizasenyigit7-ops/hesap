/**
 * Invoices Page Module
 */

import { Storage, KEYS } from '../services/storage.js';
import {
  generateId,
  escapeHtml,
  formatCurrency,
  formatDate,
  getTodayString,
  getEffectiveDate,
  getEffectiveAmount,
  getPaymentStatus,
  isThisMonth,
  daysDiff
} from '../services/helpers.js';
import { openModal, confirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let currentPeriodFilter = 'all';
let currentStatusFilter = 'all';

export function renderInvoices(container) {
  const templates = Storage.getAll(KEYS.TEMPLATES);
  const allPayments = Storage.getAll(KEYS.PAYMENTS);

  // Filter payments
  let filteredPayments = allPayments.filter(payment => {
    const effDate = getEffectiveDate(payment);
    const diff = daysDiff(effDate);

    // Period filter
    if (currentPeriodFilter === 'this_month') {
      if (!isThisMonth(effDate)) return false;
    } else if (currentPeriodFilter === 'overdue') {
      if (payment.status === 'paid' || diff >= 0) return false;
    } else if (currentPeriodFilter === 'upcoming') {
      if (payment.status === 'paid' || diff < 0) return false;
    }

    // Status filter
    if (currentStatusFilter !== 'all') {
      if (payment.status !== currentStatusFilter) return false;
    }

    return true;
  });

  // Sort by effective date (earliest first)
  filteredPayments.sort((a, b) => {
    const dateA = getEffectiveDate(a);
    const dateB = getEffectiveDate(b);
    return dateA.localeCompare(dateB);
  });

  const renderPaymentRow = (payment) => {
    const effDate = getEffectiveDate(payment);
    const effAmount = getEffectiveAmount(payment);
    const status = getPaymentStatus(payment);
    const isPostponed = payment.status === 'postponed';
    const isPaid = payment.status === 'paid';

    return `
      <div class="payment-row" data-id="${payment.id}">
        <div class="payment-row__name">
          <span>${escapeHtml(payment.invoiceNameSnapshot)}</span>
          ${payment.note ? `<span class="payment-row__subtext">${escapeHtml(payment.note)}</span>` : ''}
          ${isPaid && payment.paidDate ? `<span class="text-tertiary" style="font-size: 11px;">Ödendi: ${formatDate(payment.paidDate)}</span>` : ''}
        </div>

        <div class="payment-row__amount">
          <div>${formatCurrency(effAmount)}</div>
          ${isPostponed && payment.postponedAmount !== payment.amount ? `
            <div class="payment-row__subtext text-tertiary" style="text-decoration: line-through;">
              ${formatCurrency(payment.amount)}
            </div>
          ` : ''}
        </div>

        <div>
          <div style="font-size: var(--font-size-sm); color: var(--text-primary);">
            ${formatDate(effDate)}
          </div>
          ${isPostponed ? `
            <div class="payment-row__postponed-info">
              <i data-lucide="corner-down-right" style="width: 12px; height: 12px;"></i>
              <span>Eski: ${formatDate(payment.paymentDate)}</span>
            </div>
          ` : ''}
        </div>

        <div>
          <span class="badge ${status.badgeClass}">
            <i data-lucide="${status.icon}"></i>
            ${status.label}
          </span>
        </div>

        <div class="payment-row__actions">
          ${!isPaid ? `
            <button class="btn btn-success btn-sm btn-icon pay-invoice-btn" data-id="${payment.id}" title="Ödendi Olarak İşaretle">
              <i data-lucide="check"></i>
            </button>
            <button class="btn btn-warning btn-sm btn-icon postpone-invoice-btn" data-id="${payment.id}" title="Ertele">
              <i data-lucide="clock"></i>
            </button>
          ` : `
            <button class="btn btn-ghost btn-sm btn-icon unpay-invoice-btn" data-id="${payment.id}" title="Ödemeyi Geri Al (Bekliyor yap)">
              <i data-lucide="rotate-ccw"></i>
            </button>
          `}
          <button class="btn btn-ghost btn-sm btn-icon edit-invoice-btn" data-id="${payment.id}" title="Düzenle">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="btn btn-ghost btn-sm btn-icon text-danger delete-invoice-btn" data-id="${payment.id}" title="Sil">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  };

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Fatura Ödeme Olayları</h1>
        <p class="page-subtitle">Şablonlarınıza bağlı ödemelerinizi planlayın, erteleyin veya tamamlayın</p>
      </div>
      <button class="btn btn-primary" id="add-payment-btn">
        <i data-lucide="plus"></i> Yeni Ödeme Ekle
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="invoices__filter-bar">
      <div class="invoices__filter-group">
        <span class="invoices__filter-label">Dönem:</span>
        <select id="period-filter-select" class="form-select form-select-sm" style="width: auto;">
          <option value="all" ${currentPeriodFilter === 'all' ? 'selected' : ''}>Tüm Dönemler</option>
          <option value="this_month" ${currentPeriodFilter === 'this_month' ? 'selected' : ''}>Bu Ay</option>
          <option value="overdue" ${currentPeriodFilter === 'overdue' ? 'selected' : ''}>Gecikmişler</option>
          <option value="upcoming" ${currentPeriodFilter === 'upcoming' ? 'selected' : ''}>Gelecekler</option>
        </select>
      </div>

      <div class="invoices__filter-group">
        <span class="invoices__filter-label">Durum:</span>
        <select id="status-filter-select" class="form-select form-select-sm" style="width: auto;">
          <option value="all" ${currentStatusFilter === 'all' ? 'selected' : ''}>Tümü</option>
          <option value="pending" ${currentStatusFilter === 'pending' ? 'selected' : ''}>Bekleyenler</option>
          <option value="postponed" ${currentStatusFilter === 'postponed' ? 'selected' : ''}>Ertelenenler</option>
          <option value="paid" ${currentStatusFilter === 'paid' ? 'selected' : ''}>Ödenenler</option>
        </select>
      </div>

      <div style="margin-left: auto; font-size: var(--font-size-xs); color: var(--text-secondary);">
        Toplam ${filteredPayments.length} kayıt listeleniyor
      </div>
    </div>

    <!-- Payments List Card -->
    <div class="card" style="padding: 0; overflow: hidden;">
      ${filteredPayments.length > 0 ? `
        <div style="overflow-x: auto;">
          ${filteredPayments.map(renderPaymentRow).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state__icon">
            <i data-lucide="receipt"></i>
          </div>
          <h3 class="empty-state__title">Ödeme Kaydı Bulunamadı</h3>
          <p class="empty-state__desc">Seçili filtrelere uygun fatura ödemesi bulunamadı veya henüz ödeme eklemediniz.</p>
          <button class="btn btn-primary" id="empty-add-payment-btn">
            <i data-lucide="plus"></i> Ödeme Ekle
          </button>
        </div>
      `}
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ root: container });
  }

  // Filter change handlers
  const periodSelect = container.querySelector('#period-filter-select');
  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
      currentPeriodFilter = e.target.value;
      renderInvoices(container);
    });
  }

  const statusSelect = container.querySelector('#status-filter-select');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      currentStatusFilter = e.target.value;
      renderInvoices(container);
    });
  }

  // Add payment modal
  const handleAddPayment = () => {
    if (templates.length === 0) {
      showToast('Ödeme eklemek için önce en az 1 fatura şablonu oluşturmalısınız.', 'warning');
      window.location.hash = '#/templates';
      return;
    }

    const templateOptions = templates.map(t => ({
      value: t.id,
      label: t.name
    }));

    openModal({
      title: 'Yeni Fatura Ödemesi Ekle',
      fields: [
        {
          name: 'templateId',
          label: 'Fatura Şablonu',
          type: 'select',
          required: true,
          options: templateOptions
        },
        {
          name: 'amount',
          label: 'Tutar (₺)',
          type: 'number',
          step: '0.01',
          min: '0.01',
          required: true,
          placeholder: '0.00'
        },
        {
          name: 'paymentDate',
          label: 'Ödeme Tarihi',
          type: 'date',
          required: true,
          value: getTodayString()
        },
        {
          name: 'note',
          label: 'Not / Açıklama',
          type: 'textarea',
          required: false,
          placeholder: 'Bu ödemeye özel not...'
        }
      ],
      submitText: 'Ödemeyi Kaydet',
      onSubmit: (data) => {
        const selectedTemplate = templates.find(t => t.id === data.templateId);
        const newPayment = {
          id: generateId('inv'),
          invoiceTemplateId: data.templateId,
          invoiceNameSnapshot: selectedTemplate ? selectedTemplate.name : 'Fatura',
          amount: parseFloat(data.amount),
          paymentDate: data.paymentDate,
          status: 'pending',
          postponedTo: null,
          postponedAmount: null,
          note: data.note || '',
          paidDate: null,
          createdAt: new Date().toISOString()
        };
        Storage.add(KEYS.PAYMENTS, newPayment);
        showToast('Ödeme başarıyla planlandı.');
        renderInvoices(container);
      }
    });
  };

  const addBtn = container.querySelector('#add-payment-btn');
  if (addBtn) addBtn.addEventListener('click', handleAddPayment);

  const emptyAddBtn = container.querySelector('#empty-add-payment-btn');
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', handleAddPayment);

  // Pay action
  container.querySelectorAll('.pay-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const today = getTodayString();
      Storage.update(KEYS.PAYMENTS, id, {
        status: 'paid',
        paidDate: today
      });
      showToast('Fatura ödendi olarak işaretlendi!', 'success');
      renderInvoices(container);
    });
  });

  // Unpay action (undo)
  container.querySelectorAll('.unpay-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      Storage.update(KEYS.PAYMENTS, id, {
        status: 'pending',
        paidDate: null
      });
      showToast('Ödeme durumu bekliyor olarak güncellendi.', 'info');
      renderInvoices(container);
    });
  });

  // Postpone action
  container.querySelectorAll('.postpone-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const payment = Storage.getById(KEYS.PAYMENTS, id);
      if (!payment) return;

      const currentEffDate = getEffectiveDate(payment);
      const currentEffAmount = getEffectiveAmount(payment);

      openModal({
        title: `Faturayı Ertele: ${payment.invoiceNameSnapshot}`,
        fields: [
          {
            name: 'postponedTo',
            label: 'Yeni Ödeme Tarihi',
            type: 'date',
            required: true,
            value: currentEffDate
          },
          {
            name: 'postponedAmount',
            label: 'Yeni Tutar (₺)',
            type: 'number',
            step: '0.01',
            min: '0.01',
            required: true,
            value: currentEffAmount
          },
          {
            name: 'note',
            label: 'Erteleme Sebebi / Not',
            type: 'textarea',
            required: false,
            value: payment.note || '',
            placeholder: 'Neden ertelendi?'
          }
        ],
        submitText: 'Faturayı Ertele',
        submitClass: 'btn-warning',
        onSubmit: (data) => {
          Storage.update(KEYS.PAYMENTS, id, {
            status: 'postponed',
            postponedTo: data.postponedTo,
            postponedAmount: parseFloat(data.postponedAmount),
            note: data.note || ''
          });
          showToast('Fatura başarıyla ertelendi.', 'warning');
          renderInvoices(container);
        }
      });
    });
  });

  // Edit payment
  container.querySelectorAll('.edit-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const payment = Storage.getById(KEYS.PAYMENTS, id);
      if (!payment) return;

      openModal({
        title: 'Ödeme Kaydını Düzenle',
        fields: [
          {
            name: 'amount',
            label: 'Tutar (₺)',
            type: 'number',
            step: '0.01',
            required: true,
            value: payment.amount
          },
          {
            name: 'paymentDate',
            label: 'Ödeme Tarihi',
            type: 'date',
            required: true,
            value: payment.paymentDate
          },
          {
            name: 'note',
            label: 'Not',
            type: 'textarea',
            value: payment.note || ''
          }
        ],
        submitText: 'Güncelle',
        onSubmit: (data) => {
          Storage.update(KEYS.PAYMENTS, id, {
            amount: parseFloat(data.amount),
            paymentDate: data.paymentDate,
            note: data.note || ''
          });
          showToast('Ödeme kaydı güncellendi.');
          renderInvoices(container);
        }
      });
    });
  });

  // Delete payment
  container.querySelectorAll('.delete-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const payment = Storage.getById(KEYS.PAYMENTS, id);

      confirmModal({
        title: 'Ödemeyi Sil',
        message: `"${payment ? payment.invoiceNameSnapshot : 'Bu ödeme'}" kaydını kalıcı olarak silmek istediğinizden emin misiniz?`,
        confirmText: 'Sil',
        confirmClass: 'btn-danger',
        onConfirm: () => {
          Storage.delete(KEYS.PAYMENTS, id);
          showToast('Ödeme kaydı silindi.');
          renderInvoices(container);
        }
      });
    });
  });
}
