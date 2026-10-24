/**
 * Dashboard Page Module
 */

import { Storage, KEYS } from '../services/storage.js';
import {
  formatCurrency,
  formatDate,
  getCurrentMonthName,
  getEffectiveDate,
  getEffectiveAmount,
  getPaymentStatus,
  isThisMonth,
  escapeHtml,
  getTodayString
} from '../services/helpers.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export function renderDashboard(container) {
  const templates = Storage.getAll(KEYS.TEMPLATES);
  const payments = Storage.getAll(KEYS.PAYMENTS);
  const expenses = Storage.getAll(KEYS.EXPENSES);
  const investments = Storage.getAll(KEYS.INVESTMENTS);

  // 1. Calculate stats for CURRENT MONTH
  // Monthly invoices
  const thisMonthPayments = payments.filter(p => isThisMonth(getEffectiveDate(p)));
  const pendingInvoices = thisMonthPayments.filter(p => p.status !== 'paid');
  const pendingInvoicesTotal = pendingInvoices.reduce((sum, p) => sum + getEffectiveAmount(p), 0);

  // Monthly expenses
  const thisMonthExpenses = expenses.filter(e => isThisMonth(e.date));
  const totalExpenses = thisMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Monthly investments
  const thisMonthInvestments = investments.filter(inv => isThisMonth(inv.date));
  const totalInvestments = thisMonthInvestments.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  // 2. Filter upcoming / pending payments (ordered by effective date)
  // Include this month's payments or any overdue payments
  const upcomingPayments = payments
    .filter(p => p.status !== 'paid' || isThisMonth(getEffectiveDate(p)))
    .sort((a, b) => getEffectiveDate(a).localeCompare(getEffectiveDate(b)))
    .slice(0, 10); // Show top 10

  const renderPaymentItem = (payment) => {
    const effDate = getEffectiveDate(payment);
    const effAmount = getEffectiveAmount(payment);
    const status = getPaymentStatus(payment);
    const isPaid = payment.status === 'paid';

    return `
      <div class="payment-row">
        <div class="payment-row__name">
          <span>${escapeHtml(payment.invoiceNameSnapshot)}</span>
          ${payment.note ? `<span class="payment-row__subtext">${escapeHtml(payment.note)}</span>` : ''}
        </div>

        <div class="payment-row__amount">
          ${formatCurrency(effAmount)}
        </div>

        <div>
          <div style="font-size: var(--font-size-sm); color: var(--text-primary);">
            ${formatDate(effDate)}
          </div>
          ${payment.status === 'postponed' ? `
            <div class="payment-row__postponed-info">
              <i data-lucide="corner-down-right" style="width: 12px; height: 12px;"></i>
              <span>Ertelendi</span>
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
            <button class="btn btn-success btn-sm btn-icon dash-pay-btn" data-id="${payment.id}" title="Ödendi İşaretle">
              <i data-lucide="check"></i>
            </button>
            <button class="btn btn-warning btn-sm btn-icon dash-postpone-btn" data-id="${payment.id}" title="Ertele">
              <i data-lucide="clock"></i>
            </button>
          ` : `
            <span class="text-tertiary" style="font-size: var(--font-size-xs);">Tamamlandı</span>
          `}
        </div>
      </div>
    `;
  };

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">${getCurrentMonthName()} genel finansal durumunuz ve yaklaşan planlarınız</p>
      </div>
    </div>

    <!-- 3 Stat Cards -->
    <div class="dashboard__stats">
      <!-- Invoices Stat -->
      <div class="card stat-card" style="border-left: 4px solid var(--primary);">
        <div class="stat-card__icon" style="background: rgba(108, 92, 231, 0.15); color: var(--primary-light);">
          <i data-lucide="receipt"></i>
        </div>
        <div class="stat-card__content">
          <span class="stat-card__label">Bekleyen Faturalar (${getCurrentMonthName()})</span>
          <div class="stat-card__value">${formatCurrency(pendingInvoicesTotal)}</div>
          <div class="stat-card__subtext">
            <span>${pendingInvoices.length} fatura ödenmeyi bekliyor</span>
          </div>
        </div>
      </div>

      <!-- Expenses Stat -->
      <div class="card stat-card" style="border-left: 4px solid var(--danger);">
        <div class="stat-card__icon" style="background: rgba(255, 107, 107, 0.15); color: var(--danger-light);">
          <i data-lucide="credit-card"></i>
        </div>
        <div class="stat-card__content">
          <span class="stat-card__label">Bu Ay Harcamalar</span>
          <div class="stat-card__value">${formatCurrency(totalExpenses)}</div>
          <div class="stat-card__subtext">
            <span>Toplam ${thisMonthExpenses.length} harcama kalemi</span>
          </div>
        </div>
      </div>

      <!-- Investments Stat -->
      <div class="card stat-card" style="border-left: 4px solid var(--accent);">
        <div class="stat-card__icon" style="background: rgba(0, 206, 201, 0.15); color: var(--accent-light);">
          <i data-lucide="trending-up"></i>
        </div>
        <div class="stat-card__content">
          <span class="stat-card__label">Bu Ay Yatırımlar</span>
          <div class="stat-card__value">${formatCurrency(totalInvestments)}</div>
          <div class="stat-card__subtext">
            <span>${thisMonthInvestments.length} tasarruf / yatırım işlemi</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="dashboard__quick-actions">
      <button class="dashboard__quick-btn dashboard__quick-btn--invoice" id="dash-quick-invoice">
        <span class="icon-wrap"><i data-lucide="receipt"></i></span>
        <span>+ Fatura Ödemesi Ekle</span>
      </button>

      <button class="dashboard__quick-btn dashboard__quick-btn--expense" id="dash-quick-expense">
        <span class="icon-wrap"><i data-lucide="credit-card"></i></span>
        <span>+ Harcama Ekle</span>
      </button>

      <button class="dashboard__quick-btn dashboard__quick-btn--investment" id="dash-quick-investment">
        <span class="icon-wrap"><i data-lucide="trending-up"></i></span>
        <span>+ Yatırım Ekle</span>
      </button>
    </div>

    <!-- Upcoming Invoices Section -->
    <div class="dashboard__section-title">
      <h2>Yaklaşan ve Bu Ayki Ödemeler</h2>
      <a href="#/invoices" class="btn btn-ghost btn-sm">Tümünü Gör <i data-lucide="chevron-right"></i></a>
    </div>

    <div class="card" style="padding: 0; overflow: hidden; margin-bottom: var(--spacing-2xl);">
      ${upcomingPayments.length > 0 ? `
        <div style="overflow-x: auto;">
          ${upcomingPayments.map(renderPaymentItem).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state__icon">
            <i data-lucide="check-circle-2"></i>
          </div>
          <h3 class="empty-state__title">Bekleyen Fatura Yok!</h3>
          <p class="empty-state__desc">Tüm faturalarınız ödendi veya henüz planlanmış bir fatura ödemesi bulunmuyor.</p>
          <button class="btn btn-primary" id="dash-empty-invoice-btn">
            <i data-lucide="plus"></i> Yeni Ödeme Planla
          </button>
        </div>
      `}
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ root: container });
  }

  // Quick Action: Add Invoice
  const handleQuickInvoice = () => {
    if (templates.length === 0) {
      showToast('Fatura ödemesi eklemek için önce şablon oluşturmalısınız.', 'warning');
      window.location.hash = '#/templates';
      return;
    }
    window.location.hash = '#/invoices';
  };

  const quickInvoiceBtn = container.querySelector('#dash-quick-invoice');
  if (quickInvoiceBtn) quickInvoiceBtn.addEventListener('click', handleQuickInvoice);

  const dashEmptyBtn = container.querySelector('#dash-empty-invoice-btn');
  if (dashEmptyBtn) dashEmptyBtn.addEventListener('click', handleQuickInvoice);

  // Quick Action: Add Expense
  const quickExpenseBtn = container.querySelector('#dash-quick-expense');
  if (quickExpenseBtn) {
    quickExpenseBtn.addEventListener('click', () => {
      window.location.hash = '#/expenses';
    });
  }

  // Quick Action: Add Investment
  const quickInvestmentBtn = container.querySelector('#dash-quick-investment');
  if (quickInvestmentBtn) {
    quickInvestmentBtn.addEventListener('click', () => {
      window.location.hash = '#/investments';
    });
  }

  // Fast Pay from Dashboard
  container.querySelectorAll('.dash-pay-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      Storage.update(KEYS.PAYMENTS, id, {
        status: 'paid',
        paidDate: getTodayString()
      });
      showToast('Fatura ödendi!', 'success');
      renderDashboard(container);
    });
  });

  // Fast Postpone from Dashboard
  container.querySelectorAll('.dash-postpone-btn').forEach(btn => {
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
            label: 'Erteleme Notu',
            type: 'textarea',
            required: false,
            value: payment.note || ''
          }
        ],
        submitText: 'Ertele',
        submitClass: 'btn-warning',
        onSubmit: (data) => {
          Storage.update(KEYS.PAYMENTS, id, {
            status: 'postponed',
            postponedTo: data.postponedTo,
            postponedAmount: parseFloat(data.postponedAmount),
            note: data.note || ''
          });
          showToast('Fatura ertelendi.', 'warning');
          renderDashboard(container);
        }
      });
    });
  });
}
