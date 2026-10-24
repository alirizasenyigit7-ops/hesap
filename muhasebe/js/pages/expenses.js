/**
 * Expenses Page Module
 */

import { Storage, KEYS } from '../services/storage.js';
import {
  generateId,
  escapeHtml,
  formatCurrency,
  formatDate,
  getTodayString,
  isThisMonth,
  getCurrentMonthName
} from '../services/helpers.js';
import { openModal, confirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

const CATEGORIES = [
  { name: 'Market', color: '#00b894' },
  { name: 'Yemek & Kafe', color: '#ff7675' },
  { name: 'Ulaşım', color: '#74b9ff' },
  { name: 'Sağlık', color: '#fd79a8' },
  { name: 'Eğitim', color: '#a29bfe' },
  { name: 'Eğlence', color: '#ffeaa7' },
  { name: 'Giyim', color: '#e17055' },
  { name: 'Diğer', color: '#b2bec3' }
];

export function renderExpenses(container) {
  const allExpenses = Storage.getAll(KEYS.EXPENSES);

  // Sort descending by date
  allExpenses.sort((a, b) => b.date.localeCompare(a.date));

  // Calculate monthly stats & category breakdown
  const thisMonthExpenses = allExpenses.filter(e => isThisMonth(e.date));
  const totalMonthlyAmount = thisMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Group by category
  const categoryTotals = {};
  CATEGORIES.forEach(cat => { categoryTotals[cat.name] = 0; });
  thisMonthExpenses.forEach(e => {
    const cat = e.category || 'Diğer';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.amount) || 0);
  });

  const categoryBarsHtml = CATEGORIES.map(cat => {
    const amount = categoryTotals[cat.name] || 0;
    const percentage = totalMonthlyAmount > 0 ? ((amount / totalMonthlyAmount) * 100).toFixed(1) : 0;
    return `
      <div class="category-bar-item">
        <div class="category-bar-header">
          <span class="category-bar-name">
            <span style="display:inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${cat.color}; margin-right: 6px;"></span>
            ${escapeHtml(cat.name)} (${percentage}%)
          </span>
          <span class="category-bar-val">${formatCurrency(amount)}</span>
        </div>
        <div class="category-bar-track">
          <div class="category-bar-fill" style="width: ${percentage}%; background: ${cat.color};"></div>
        </div>
      </div>
    `;
  }).join('');

  const renderExpenseRow = (expense) => {
    const catObj = CATEGORIES.find(c => c.name === expense.category) || { color: '#b2bec3', name: 'Diğer' };
    return `
      <div class="data-list-item" data-id="${expense.id}">
        <div class="data-list-col">
          <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${catObj.color};"></span>
            <strong>${escapeHtml(expense.category || 'Diğer')}</strong>
          </div>
          ${expense.note ? `<span class="text-tertiary" style="font-size: var(--font-size-xs); margin-top: 2px;">${escapeHtml(expense.note)}</span>` : ''}
        </div>

        <div class="data-list-col text-secondary" style="font-size: var(--font-size-sm);">
          ${formatDate(expense.date)}
        </div>

        <div class="data-list-col font-mono" style="font-weight: var(--font-weight-semibold); color: var(--text-primary); font-size: var(--font-size-md);">
          ${formatCurrency(expense.amount)}
        </div>

        <div class="data-list-actions">
          <button class="btn btn-ghost btn-sm btn-icon edit-expense-btn" data-id="${expense.id}" title="Düzenle">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="btn btn-ghost btn-sm btn-icon text-danger delete-expense-btn" data-id="${expense.id}" title="Sil">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  };

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Harcamalar</h1>
        <p class="page-subtitle">Günlük harcamalarınızı ve bütçe dağılımınızı takip edin</p>
      </div>
      <button class="btn btn-primary" id="add-expense-btn">
        <i data-lucide="plus"></i> Harcama Ekle
      </button>
    </div>

    <!-- Top Summary & Category Breakdown -->
    <div class="expenses__top-grid">
      <!-- Total Card -->
      <div class="card stat-card" style="display: flex; flex-direction: column; justify-content: center;">
        <span class="stat-card__label">${getCurrentMonthName()} Toplam Harcama</span>
        <div class="stat-card__value" style="font-size: var(--font-size-3xl); margin: var(--spacing-sm) 0; color: var(--danger-light);">
          ${formatCurrency(totalMonthlyAmount)}
        </div>
        <div class="stat-card__subtext">
          <span>Bu ay kaydedilen ${thisMonthExpenses.length} harcama kalemi</span>
        </div>
      </div>

      <!-- Categories Chart -->
      <div class="category-chart-card">
        <h3 class="category-chart-card__title">Bu Ay Kategori Dağılımı</h3>
        <div class="category-bar-list">
          ${categoryBarsHtml}
        </div>
      </div>
    </div>

    <!-- Expense Transactions List -->
    <div class="page-header" style="margin-bottom: var(--spacing-md);">
      <div>
        <h2 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--text-primary);">
          Tüm Harcama Geçmişi
        </h2>
      </div>
    </div>

    <div class="card" style="padding: 0; overflow: hidden;">
      ${allExpenses.length > 0 ? `
        <div>
          ${allExpenses.map(renderExpenseRow).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state__icon">
            <i data-lucide="shopping-bag"></i>
          </div>
          <h3 class="empty-state__title">Henüz Harcama Kaydı Yok</h3>
          <p class="empty-state__desc">Günlük market, yemek, ulaşım veya diğer harcamalarınızı ekleyerek bütçenizi kontrol altında tutun.</p>
          <button class="btn btn-primary" id="empty-add-expense-btn">
            <i data-lucide="plus"></i> İlk Harcamayı Ekle
          </button>
        </div>
      `}
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ root: container });
  }

  // Add Expense
  const handleAddExpense = () => {
    openModal({
      title: 'Yeni Harcama Ekle',
      fields: [
        {
          name: 'amount',
          label: 'Harcama Tutarı (₺)',
          type: 'number',
          step: '0.01',
          min: '0.01',
          required: true,
          placeholder: '0.00'
        },
        {
          name: 'category',
          label: 'Kategori',
          type: 'select',
          required: true,
          options: CATEGORIES.map(c => ({ value: c.name, label: c.name }))
        },
        {
          name: 'date',
          label: 'Tarih',
          type: 'date',
          required: true,
          value: getTodayString()
        },
        {
          name: 'note',
          label: 'Açıklama / Not',
          type: 'textarea',
          required: false,
          placeholder: 'Harcama detayı...'
        }
      ],
      submitText: 'Harcamayı Kaydet',
      onSubmit: (data) => {
        const newExpense = {
          id: generateId('exp'),
          amount: parseFloat(data.amount),
          category: data.category,
          date: data.date,
          note: data.note || '',
          createdAt: new Date().toISOString()
        };
        Storage.add(KEYS.EXPENSES, newExpense);
        showToast('Harcama kaydedildi.');
        renderExpenses(container);
      }
    });
  };

  const addBtn = container.querySelector('#add-expense-btn');
  if (addBtn) addBtn.addEventListener('click', handleAddExpense);

  const emptyAddBtn = container.querySelector('#empty-add-expense-btn');
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', handleAddExpense);

  // Edit Expense
  container.querySelectorAll('.edit-expense-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const expense = Storage.getById(KEYS.EXPENSES, id);
      if (!expense) return;

      openModal({
        title: 'Harcamayı Düzenle',
        fields: [
          {
            name: 'amount',
            label: 'Tutar (₺)',
            type: 'number',
            step: '0.01',
            min: '0.01',
            required: true,
            value: expense.amount
          },
          {
            name: 'category',
            label: 'Kategori',
            type: 'select',
            required: true,
            value: expense.category,
            options: CATEGORIES.map(c => ({ value: c.name, label: c.name }))
          },
          {
            name: 'date',
            label: 'Tarih',
            type: 'date',
            required: true,
            value: expense.date
          },
          {
            name: 'note',
            label: 'Açıklama',
            type: 'textarea',
            value: expense.note || ''
          }
        ],
        submitText: 'Güncelle',
        onSubmit: (data) => {
          Storage.update(KEYS.EXPENSES, id, {
            amount: parseFloat(data.amount),
            category: data.category,
            date: data.date,
            note: data.note || ''
          });
          showToast('Harcama güncellendi.');
          renderExpenses(container);
        }
      });
    });
  });

  // Delete Expense
  container.querySelectorAll('.delete-expense-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      confirmModal({
        title: 'Harcamayı Sil',
        message: 'Bu harcama kaydını silmek istediğinizden emin misiniz?',
        confirmText: 'Sil',
        confirmClass: 'btn-danger',
        onConfirm: () => {
          Storage.delete(KEYS.EXPENSES, id);
          showToast('Harcama silindi.');
          renderExpenses(container);
        }
      });
    });
  });
}
