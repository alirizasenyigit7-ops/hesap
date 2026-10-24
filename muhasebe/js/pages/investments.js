/**
 * Investments Page Module
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

export function renderInvestments(container) {
  const allInvestments = Storage.getAll(KEYS.INVESTMENTS);

  // Sort descending by date
  allInvestments.sort((a, b) => b.date.localeCompare(a.date));

  // Monthly vs All-time stats
  const thisMonthInvestments = allInvestments.filter(inv => isThisMonth(inv.date));
  const thisMonthTotal = thisMonthInvestments.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const allTimeTotal = allInvestments.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  const renderInvestmentRow = (inv) => {
    return `
      <div class="data-list-item" data-id="${inv.id}">
        <div class="data-list-col">
          <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
            <div class="stat-card__icon" style="width: 32px; height: 32px; font-size: 14px; background: rgba(0, 206, 201, 0.15); color: var(--accent-light);">
              <i data-lucide="trending-up"></i>
            </div>
            <strong>${escapeHtml(inv.note || 'Yatırım')}</strong>
          </div>
        </div>

        <div class="data-list-col text-secondary" style="font-size: var(--font-size-sm);">
          ${formatDate(inv.date)}
        </div>

        <div class="data-list-col font-mono" style="font-weight: var(--font-weight-semibold); color: var(--accent-light); font-size: var(--font-size-md);">
          +${formatCurrency(inv.amount)}
        </div>

        <div class="data-list-actions">
          <button class="btn btn-ghost btn-sm btn-icon edit-investment-btn" data-id="${inv.id}" title="Düzenle">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="btn btn-ghost btn-sm btn-icon text-danger delete-investment-btn" data-id="${inv.id}" title="Sil">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  };

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Yatırımlar & Birikimler</h1>
        <p class="page-subtitle">Altın, döviz, hisse ve fon yatırımlarınızı takip ederek varlıklarınızı büyütün</p>
      </div>
      <button class="btn btn-primary" id="add-investment-btn">
        <i data-lucide="plus"></i> Yatırım Ekle
      </button>
    </div>

    <!-- Summary Stats -->
    <div class="dashboard__stats" style="margin-bottom: var(--spacing-2xl);">
      <div class="card stat-card" style="border-left: 4px solid var(--accent);">
        <div class="stat-card__icon" style="background: rgba(0, 206, 201, 0.15); color: var(--accent-light);">
          <i data-lucide="calendar"></i>
        </div>
        <div class="stat-card__content">
          <span class="stat-card__label">${getCurrentMonthName()} Toplam Yatırım</span>
          <div class="stat-card__value" style="color: var(--accent-light);">${formatCurrency(thisMonthTotal)}</div>
          <div class="stat-card__subtext">
            <span>Bu ay ${thisMonthInvestments.length} işlem yapıldı</span>
          </div>
        </div>
      </div>

      <div class="card stat-card" style="border-left: 4px solid var(--primary-light);">
        <div class="stat-card__icon" style="background: rgba(162, 155, 254, 0.15); color: var(--primary-light);">
          <i data-lucide="piggy-bank"></i>
        </div>
        <div class="stat-card__content">
          <span class="stat-card__label">Genel Toplam Portföy / Birikim</span>
          <div class="stat-card__value" style="color: var(--primary-light);">${formatCurrency(allTimeTotal)}</div>
          <div class="stat-card__subtext">
            <span>Tüm zamanlar toplam ${allInvestments.length} kayıt</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions List -->
    <div class="page-header" style="margin-bottom: var(--spacing-md);">
      <div>
        <h2 style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--text-primary);">
          İşlem Geçmişi
        </h2>
      </div>
    </div>

    <div class="card" style="padding: 0; overflow: hidden;">
      ${allInvestments.length > 0 ? `
        <div>
          ${allInvestments.map(renderInvestmentRow).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state__icon">
            <i data-lucide="trending-up"></i>
          </div>
          <h3 class="empty-state__title">Henüz Yatırım Kaydı Yok</h3>
          <p class="empty-state__desc">Tasarruflarınızı, altın, döviz veya hisse senedi alımlarınızı kaydederek birikimlerinizi izleyin.</p>
          <button class="btn btn-primary" id="empty-add-investment-btn">
            <i data-lucide="plus"></i> İlk Yatırımı Ekle
          </button>
        </div>
      `}
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ root: container });
  }

  // Add Investment
  const handleAddInvestment = () => {
    openModal({
      title: 'Yeni Yatırım / Birikim Ekle',
      fields: [
        {
          name: 'amount',
          label: 'Yatırım Tutarı (₺)',
          type: 'number',
          step: '0.01',
          min: '0.01',
          required: true,
          placeholder: '0.00'
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
          label: 'Açıklama / Enstrüman',
          type: 'text',
          required: true,
          placeholder: 'Örn: Gram Altın, TEFAS Fonu, THYAO Hisse'
        }
      ],
      submitText: 'Yatırımı Kaydet',
      onSubmit: (data) => {
        const newInvestment = {
          id: generateId('invs'),
          amount: parseFloat(data.amount),
          date: data.date,
          note: data.note || 'Yatırım',
          createdAt: new Date().toISOString()
        };
        Storage.add(KEYS.INVESTMENTS, newInvestment);
        showToast('Yatırım kaydedildi.');
        renderInvestments(container);
      }
    });
  };

  const addBtn = container.querySelector('#add-investment-btn');
  if (addBtn) addBtn.addEventListener('click', handleAddInvestment);

  const emptyAddBtn = container.querySelector('#empty-add-investment-btn');
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', handleAddInvestment);

  // Edit Investment
  container.querySelectorAll('.edit-investment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const inv = Storage.getById(KEYS.INVESTMENTS, id);
      if (!inv) return;

      openModal({
        title: 'Yatırımı Düzenle',
        fields: [
          {
            name: 'amount',
            label: 'Tutar (₺)',
            type: 'number',
            step: '0.01',
            min: '0.01',
            required: true,
            value: inv.amount
          },
          {
            name: 'date',
            label: 'Tarih',
            type: 'date',
            required: true,
            value: inv.date
          },
          {
            name: 'note',
            label: 'Açıklama',
            type: 'text',
            required: true,
            value: inv.note || ''
          }
        ],
        submitText: 'Güncelle',
        onSubmit: (data) => {
          Storage.update(KEYS.INVESTMENTS, id, {
            amount: parseFloat(data.amount),
            date: data.date,
            note: data.note || ''
          });
          showToast('Yatırım kaydı güncellendi.');
          renderInvestments(container);
        }
      });
    });
  });

  // Delete Investment
  container.querySelectorAll('.delete-investment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      confirmModal({
        title: 'Yatırım Kaydını Sil',
        message: 'Bu yatırım kaydını silmek istediğinizden emin misiniz?',
        confirmText: 'Sil',
        confirmClass: 'btn-danger',
        onConfirm: () => {
          Storage.delete(KEYS.INVESTMENTS, id);
          showToast('Yatırım silindi.');
          renderInvestments(container);
        }
      });
    });
  });
}
