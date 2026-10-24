/**
 * Templates Page Module
 */

import { Storage, KEYS } from '../services/storage.js';
import { generateId, escapeHtml, formatDate, getTodayString } from '../services/helpers.js';
import { openModal, confirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export function renderTemplates(container) {
  const templates = Storage.getAll(KEYS.TEMPLATES);
  const payments = Storage.getAll(KEYS.PAYMENTS);

  // Calculate payment count per template
  const paymentCountMap = {};
  payments.forEach(p => {
    paymentCountMap[p.invoiceTemplateId] = (paymentCountMap[p.invoiceTemplateId] || 0) + 1;
  });

  const cardsHtml = templates.length > 0
    ? templates.map(tpl => {
        const count = paymentCountMap[tpl.id] || 0;
        return `
          <div class="template-card" data-id="${tpl.id}">
            <div class="template-card__header">
              <div>
                <h3 class="template-card__title">${escapeHtml(tpl.name)}</h3>
                <span class="text-tertiary" style="font-size: var(--font-size-xs)">
                  Oluşturulma: ${formatDate(tpl.createdAt)}
                </span>
              </div>
              <span class="badge badge-primary">${count} Kayıt</span>
            </div>
            
            <p class="template-card__note">
              ${tpl.note ? escapeHtml(tpl.note) : '<span style="opacity: 0.5; font-style: italic;">Açıklama belirtilmedi</span>'}
            </p>

            <div class="template-card__actions">
              <button class="btn btn-accent btn-sm create-invoice-btn" data-id="${tpl.id}" data-name="${escapeHtml(tpl.name)}">
                <i data-lucide="plus"></i> Ödeme Ekle
              </button>
              <div class="template-card__btn-group">
                <button class="btn btn-ghost btn-icon edit-template-btn" data-id="${tpl.id}" title="Düzenle">
                  <i data-lucide="edit-3"></i>
                </button>
                <button class="btn btn-ghost btn-icon text-danger delete-template-btn" data-id="${tpl.id}" data-name="${escapeHtml(tpl.name)}" title="Sil">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')
    : `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state__icon">
          <i data-lucide="file-plus"></i>
        </div>
        <h3 class="empty-state__title">Henüz Fatura Şablonu Yok</h3>
        <p class="empty-state__desc">Elektrik, Su, İnternet, Kira gibi düzenli veya tekil faturalarınız için bir şablon oluşturarak başlayın.</p>
        <button class="btn btn-primary" id="empty-add-template-btn">
          <i data-lucide="plus"></i> İlk Şablonu Oluştur
        </button>
      </div>
    `;

  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Fatura Şablonları</h1>
        <p class="page-subtitle">Ödemelerinizi oluşturmak için kullandığınız fatura türlerini yönetin</p>
      </div>
      <button class="btn btn-primary" id="add-template-btn">
        <i data-lucide="plus"></i> Yeni Şablon
      </button>
    </div>

    <div class="templates__grid">
      ${cardsHtml}
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ root: container });
  }

  // Event handlers
  const handleAddTemplate = () => {
    openModal({
      title: 'Yeni Fatura Şablonu Ekle',
      fields: [
        {
          name: 'name',
          label: 'Şablon Adı',
          type: 'text',
          required: true,
          placeholder: 'Örn: Ev Kirası, Doğalgaz, Turkcell'
        },
        {
          name: 'note',
          label: 'Açıklama / Not',
          type: 'textarea',
          required: false,
          placeholder: 'İsteğe bağlı not veya abone numarası...'
        }
      ],
      submitText: 'Şablonu Kaydet',
      onSubmit: (data) => {
        const newTemplate = {
          id: generateId('tpl'),
          name: data.name,
          note: data.note || '',
          createdAt: new Date().toISOString()
        };
        Storage.add(KEYS.TEMPLATES, newTemplate);
        showToast(`"${newTemplate.name}" şablonu oluşturuldu.`);
        renderTemplates(container);
      }
    });
  };

  const addBtn = container.querySelector('#add-template-btn');
  if (addBtn) addBtn.addEventListener('click', handleAddTemplate);

  const emptyAddBtn = container.querySelector('#empty-add-template-btn');
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', handleAddTemplate);

  // Edit template
  container.querySelectorAll('.edit-template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const template = Storage.getById(KEYS.TEMPLATES, id);
      if (!template) return;

      openModal({
        title: 'Şablonu Düzenle',
        fields: [
          {
            name: 'name',
            label: 'Şablon Adı',
            type: 'text',
            required: true,
            value: template.name
          },
          {
            name: 'note',
            label: 'Açıklama / Not',
            type: 'textarea',
            required: false,
            value: template.note
          }
        ],
        submitText: 'Güncelle',
        onSubmit: (data) => {
          Storage.update(KEYS.TEMPLATES, id, {
            name: data.name,
            note: data.note || ''
          });
          showToast('Şablon güncellendi.');
          renderTemplates(container);
        }
      });
    });
  });

  // Delete template
  container.querySelectorAll('.delete-template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');

      confirmModal({
        title: 'Şablonu Sil',
        message: `"${name}" şablonunu silmek istediğinizden emin misiniz? Önceden oluşturulmuş ödeme kayıtları korunacaktır.`,
        confirmText: 'Şablonu Sil',
        confirmClass: 'btn-danger',
        onConfirm: () => {
          Storage.delete(KEYS.TEMPLATES, id);
          showToast('Şablon silindi.');
          renderTemplates(container);
        }
      });
    });
  });

  // Direct create invoice from template card
  container.querySelectorAll('.create-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const templateId = btn.getAttribute('data-id');
      const templateName = btn.getAttribute('data-name');

      openModal({
        title: `Yeni Ödeme: ${templateName}`,
        fields: [
          {
            name: 'amount',
            label: 'Ödeme Tutarı (₺)',
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
            label: 'Not',
            type: 'textarea',
            required: false,
            placeholder: 'Ödeme hakkında özel not...'
          }
        ],
        submitText: 'Ödemeyi Planla',
        onSubmit: (data) => {
          const newPayment = {
            id: generateId('inv'),
            invoiceTemplateId: templateId,
            invoiceNameSnapshot: templateName,
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
          showToast(`"${templateName}" için ödeme kaydı oluşturuldu.`);
          // Redirect or re-render
          window.location.hash = '#/invoices';
        }
      });
    });
  });
}
