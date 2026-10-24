/**
 * Settings Page Module
 */

import { Storage } from '../services/storage.js';
import { getTodayString } from '../services/helpers.js';
import { confirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export function renderSettings(container) {
  container.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Ayarlar & Veri Yönetimi</h1>
        <p class="page-subtitle">Verilerinizi yedekleyin, geri yükleyin veya cihazınızdaki verileri yönetin</p>
      </div>
    </div>

    <!-- Data Privacy Info -->
    <div class="card settings__card">
      <h2 class="settings__card-title">
        <i data-lucide="shield-check" style="vertical-align: middle; color: var(--success); margin-right: 6px;"></i>
        Gizlilik ve Yerel Depolama
      </h2>
      <p class="settings__card-desc">
        Muhasebe uygulaması tamamen sunucusuz çalışır. Şablonlarınız, faturalarınız, harcama ve yatırım kayıtlarınız 
        <strong>sadece bu tarayıcının yerel hafızasında (localStorage)</strong> saklanır. Verileriniz asla üçüncü şahıslara veya harici sunuculara gönderilmez.
      </p>
    </div>

    <!-- Backup & Restore -->
    <div class="card settings__card">
      <h2 class="settings__card-title">Yedekleme ve Geri Yükleme</h2>
      <p class="settings__card-desc">
        Farklı bir cihaza veya tarayıcıya geçmek istediğinizde verilerinizi tek bir JSON dosyası olarak indirebilir ve dilediğiniz zaman geri yükleyebilirsiniz.
      </p>
      <div class="settings__actions">
        <button class="btn btn-primary" id="export-data-btn">
          <i data-lucide="download"></i> Verileri Dışa Aktar (JSON)
        </button>

        <label class="btn btn-ghost" style="cursor: pointer; margin: 0;">
          <i data-lucide="upload"></i> Yedekten İçe Aktar (JSON)
          <input type="file" id="import-file-input" accept=".json" style="display: none;">
        </label>
      </div>
    </div>

    <!-- Demo Data Seed Option -->
    <div class="card settings__card">
      <h2 class="settings__card-title">Örnek Veriler</h2>
      <p class="settings__card-desc">
        Uygulamayı test etmek veya önizlemek isterseniz örnek şablon ve harcama verilerini yeniden yükleyebilirsiniz.
      </p>
      <div class="settings__actions">
        <button class="btn btn-ghost" id="seed-data-btn">
          <i data-lucide="sparkles"></i> Örnek Verileri Yükle
        </button>
      </div>
    </div>

    <!-- Danger Zone: Reset -->
    <div class="card settings__card settings__danger-zone">
      <h2 class="settings__card-title">
        <i data-lucide="alert-triangle" style="vertical-align: middle; margin-right: 6px;"></i>
        Tehlikeli Bölge: Verileri Sıfırla
      </h2>
      <p class="settings__card-desc">
        Tüm fatura şablonlarını, ödeme olaylarını, harcamaları ve yatırımları tarayıcınızdan kalıcı olarak siler. Bu işlem geri alınamaz.
      </p>
      <div class="settings__actions">
        <button class="btn btn-danger" id="reset-data-btn">
          <i data-lucide="trash-2"></i> Tüm Verileri Kalıcı Olarak Temizle
        </button>
      </div>
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ root: container });
  }

  // Export JSON
  const exportBtn = container.querySelector('#export-data-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      try {
        const data = Storage.exportAll();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `muhasebe-yedek-${getTodayString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Yedek JSON dosyası başarıyla indirildi.');
      } catch (err) {
        showToast('Dışa aktarma sırasında hata oluştu: ' + err.message, 'error');
      }
    });
  }

  // Import JSON
  const importInput = container.querySelector('#import-file-input');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = Storage.importAll(event.target.result);
          if (result.success) {
            showToast('Yedek başarıyla yüklendi ve veriler güncellendi!', 'success');
            setTimeout(() => {
              window.location.hash = '#/dashboard';
            }, 600);
          } else {
            showToast('Geçersiz dosya formatı: ' + result.error, 'error');
          }
        } catch (err) {
          showToast('Dosya okunurken hata: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      importInput.value = '';
    });
  }

  // Seed sample data
  const seedBtn = container.querySelector('#seed-data-btn');
  if (seedBtn) {
    seedBtn.addEventListener('click', () => {
      confirmModal({
        title: 'Örnek Verileri Yükle',
        message: 'Mevcut verilerinizin üzerine örnek veriler eklensin mi?',
        confirmText: 'Yükle',
        confirmClass: 'btn-primary',
        onConfirm: () => {
          Storage.initSampleDataIfEmpty();
          showToast('Örnek veriler başarıyla yüklendi.');
          window.location.hash = '#/dashboard';
        }
      });
    });
  }

  // Reset all data
  const resetBtn = container.querySelector('#reset-data-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      confirmModal({
        title: 'Tüm Verileri Sıfırla?',
        message: 'Bu işlem tarayıcınızda kayıtlı TÜM şablonları, faturaları, harcamaları ve yatırımları silecektir. Devam etmek istediğinize emin misiniz?',
        confirmText: 'Evet, Hepsini Sil',
        confirmClass: 'btn-danger',
        onConfirm: () => {
          Storage.clear();
          showToast('Tüm veriler başarıyla temizlendi.', 'warning');
          setTimeout(() => {
            window.location.hash = '#/dashboard';
            renderSettings(container);
          }, 300);
        }
      });
    });
  }
}
