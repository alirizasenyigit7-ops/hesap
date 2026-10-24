/**
 * LocalStorage Service
 */

export const KEYS = {
  TEMPLATES: 'invoiceTemplates',
  PAYMENTS: 'invoicePayments',
  EXPENSES: 'expenses',
  INVESTMENTS: 'investments'
};

export const Storage = {
  getAll(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading key "${key}" from localStorage:`, e);
      return [];
    }
  },

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('muhasebe-data-changed', { detail: { key } }));
      return true;
    } catch (e) {
      console.error(`Error saving key "${key}" to localStorage:`, e);
      return false;
    }
  },

  getById(key, id) {
    const list = this.getAll(key);
    return list.find(item => item.id === id) || null;
  },

  add(key, item) {
    const list = this.getAll(key);
    list.unshift(item);
    this.save(key, list);
    return item;
  },

  update(key, id, updates) {
    const list = this.getAll(key);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      this.save(key, list);
      return list[index];
    }
    return null;
  },

  delete(key, id) {
    const list = this.getAll(key);
    const filtered = list.filter(item => item.id !== id);
    this.save(key, filtered);
    return true;
  },

  clear() {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent('muhasebe-data-changed', { detail: { action: 'clear' } }));
  },

  exportAll() {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        invoiceTemplates: this.getAll(KEYS.TEMPLATES),
        invoicePayments: this.getAll(KEYS.PAYMENTS),
        expenses: this.getAll(KEYS.EXPENSES),
        investments: this.getAll(KEYS.INVESTMENTS)
      }
    };
    return exportData;
  },

  importAll(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const data = parsed.data || parsed;

      if (data.invoiceTemplates && Array.isArray(data.invoiceTemplates)) {
        this.save(KEYS.TEMPLATES, data.invoiceTemplates);
      }
      if (data.invoicePayments && Array.isArray(data.invoicePayments)) {
        this.save(KEYS.PAYMENTS, data.invoicePayments);
      }
      if (data.expenses && Array.isArray(data.expenses)) {
        this.save(KEYS.EXPENSES, data.expenses);
      }
      if (data.investments && Array.isArray(data.investments)) {
        this.save(KEYS.INVESTMENTS, data.investments);
      }
      window.dispatchEvent(new CustomEvent('muhasebe-data-changed', { detail: { action: 'import' } }));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  initSampleDataIfEmpty() {
    const templates = this.getAll(KEYS.TEMPLATES);
    if (templates.length === 0) {
      const sampleTemplates = [
        { id: 'tpl_kira', name: 'Ev Kirası', note: 'Her ayın 1\'inde ev sahibine', createdAt: new Date().toISOString() },
        { id: 'tpl_elektrik', name: 'Elektrik Faturası', note: 'EnerjiSA', createdAt: new Date().toISOString() },
        { id: 'tpl_internet', name: 'Fiber İnternet', note: 'TurkNet 1000 Mbps', createdAt: new Date().toISOString() }
      ];
      this.save(KEYS.TEMPLATES, sampleTemplates);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

      const samplePayments = [
        {
          id: 'inv_1',
          invoiceTemplateId: 'tpl_kira',
          invoiceNameSnapshot: 'Ev Kirası',
          amount: 17500,
          paymentDate: `${currentYear}-${currentMonth}-01`,
          status: 'paid',
          postponedTo: null,
          postponedAmount: null,
          note: 'Banka transferi yapıldı',
          paidDate: `${currentYear}-${currentMonth}-01`,
          createdAt: new Date().toISOString()
        },
        {
          id: 'inv_2',
          invoiceTemplateId: 'tpl_elektrik',
          invoiceNameSnapshot: 'Elektrik Faturası',
          amount: 620,
          paymentDate: `${currentYear}-${currentMonth}-25`,
          status: 'pending',
          postponedTo: null,
          postponedAmount: null,
          note: '',
          paidDate: null,
          createdAt: new Date().toISOString()
        },
        {
          id: 'inv_3',
          invoiceTemplateId: 'tpl_internet',
          invoiceNameSnapshot: 'Fiber İnternet',
          amount: 440,
          paymentDate: `${currentYear}-${currentMonth}-28`,
          status: 'pending',
          postponedTo: null,
          postponedAmount: null,
          note: 'Otomatik ödeme',
          paidDate: null,
          createdAt: new Date().toISOString()
        }
      ];
      this.save(KEYS.PAYMENTS, samplePayments);

      const sampleExpenses = [
        {
          id: 'exp_1',
          amount: 1450,
          category: 'Market',
          date: `${currentYear}-${currentMonth}-15`,
          note: 'Haftalık mutfak alışverişi',
          createdAt: new Date().toISOString()
        },
        {
          id: 'exp_2',
          amount: 320,
          category: 'Ulaşım',
          date: `${currentYear}-${currentMonth}-18`,
          note: 'Akbil dolumu & Taksi',
          createdAt: new Date().toISOString()
        }
      ];
      this.save(KEYS.EXPENSES, sampleExpenses);

      const sampleInvestments = [
        {
          id: 'invs_1',
          amount: 5000,
          date: `${currentYear}-${currentMonth}-10`,
          note: 'Gram Altın alımı (1.6 gr)',
          createdAt: new Date().toISOString()
        }
      ];
      this.save(KEYS.INVESTMENTS, sampleInvestments);
    }
  }
};
