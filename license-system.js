// ============================================================
// KEDRIX BETA — LICENSE SYSTEM / APP ENTRY BRIDGE
// VERSION: 20260325_stage_entry_fix_v2
// ============================================================

(function (global) {
  const LICENSE_STORAGE_KEY = 'kedrix_license_data';
  const SESSION_STORAGE_KEY = 'kedrix_session';
  const LANDING_URL = 'https://kedrix-landing-v2.kedrix-corp.workers.dev';
  const APP_URL = 'https://kedrix-beta-test.pages.dev';
  const DEFAULT_LIMITS = {
    free: { maxTransactions: 50, maxCategories: 3, csvImport: false },
    premium: { maxTransactions: Infinity, maxCategories: Infinity, csvImport: true }
  };

  function safeJsonParse(value) {
    try {
      return value ? JSON.parse(value) : null;
    } catch (_err) {
      return null;
    }
  }

  function safeTrim(value) {
    return String(value == null ? '' : value).trim();
  }

  function decodeParam(value) {
    const raw = safeTrim(value);
    if (!raw) return '';
    try {
      return decodeURIComponent(raw);
    } catch (_err) {
      return raw;
    }
  }

  function normalizeEmail(value) {
    return decodeParam(value).toLowerCase();
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function buildLicenseState(licenseKey, testerId, email, extra = {}) {
    return {
      license_key: safeTrim(licenseKey),
      tester_id: safeTrim(testerId),
      email: normalizeEmail(email),
      activated_at: extra.activated_at || nowIso(),
      last_check: nowIso(),
      source: extra.source || 'app_entry_bridge',
      expires_at: safeTrim(extra.expires_at || ''),
      status: safeTrim(extra.status || 'active')
    };
  }

  class LicenseSystem {
    static getSessionId() {
      try {
        let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!sessionId) {
          sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
          sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        }
        return sessionId;
      } catch (_err) {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
      }
    }

    static getLicenseData() {
      const structured = safeJsonParse(localStorage.getItem(LICENSE_STORAGE_KEY));
      if (structured && structured.license_key && structured.tester_id && structured.email) {
        return structured;
      }

      const legacyLicense = safeTrim(localStorage.getItem('license_key') || localStorage.getItem('kedrix_license_key'));
      const legacyTester = safeTrim(localStorage.getItem('tester_id') || localStorage.getItem('kedrix_tester_id'));
      const legacyEmail = normalizeEmail(localStorage.getItem('license_email') || localStorage.getItem('kedrix_email'));
      const legacyExpiry = safeTrim(localStorage.getItem('license_expires_at') || '');
      const legacyStatus = safeTrim(localStorage.getItem('license_status') || 'active');
      if (legacyLicense && legacyTester && legacyEmail) {
        const recovered = buildLicenseState(legacyLicense, legacyTester, legacyEmail, {
          activated_at: safeTrim(localStorage.getItem('license_activated_at') || ''),
          expires_at: legacyExpiry,
          source: 'legacy_storage_recovered',
          status: legacyStatus
        });
        localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(recovered));
        return recovered;
      }

      return null;
    }

    static setLicenseData(licenseKey, testerId, email, extra = {}) {
      const state = buildLicenseState(licenseKey, testerId, email, extra);
      localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem('license_key', state.license_key);
      localStorage.setItem('kedrix_license_key', state.license_key);
      localStorage.setItem('tester_id', state.tester_id);
      localStorage.setItem('kedrix_tester_id', state.tester_id);
      localStorage.setItem('license_email', state.email);
      localStorage.setItem('kedrix_email', state.email);
      localStorage.setItem('license_expires_at', state.expires_at || '');
      localStorage.setItem('license_activated_at', state.activated_at || '');
      localStorage.setItem('license_status', state.status || 'active');
      localStorage.setItem('bw-license-valid', 'valid');
      localStorage.setItem('kedrix_last_entry_source', state.source || 'app_entry_bridge');
      sessionStorage.setItem('kedrix_last_bridge_at', nowIso());

      try {
        if (global.KedrixLicenseGuard && typeof global.KedrixLicenseGuard.sealLicense === 'function') {
          global.KedrixLicenseGuard.sealLicense({
            email: state.email,
            testerId: state.tester_id,
            status: state.status || 'active',
            expiresAt: state.expires_at || ''
          });
        }
      } catch (_err) {}

      return state;
    }

    static clearLicenseData() {
      [
        LICENSE_STORAGE_KEY,
        'license_key',
        'kedrix_license_key',
        'tester_id',
        'kedrix_tester_id',
        'license_email',
        'kedrix_email',
        'license_expires_at',
        'license_activated_at',
        'license_status',
        'bw-license-valid',
        'kedrix_last_entry_source',
        'kedrix_trial_used'
      ].forEach((key) => localStorage.removeItem(key));
    }

    static readUrlPayload() {
      const url = new URL(global.location.href);
      const params = url.searchParams;
      const licenseKey = decodeParam(params.get('license') || params.get('license_key'));
      const testerId = decodeParam(params.get('tester') || params.get('tester_id'));
      const email = normalizeEmail(params.get('email'));
      if (!licenseKey || !testerId || !email) return null;
      return { license_key: licenseKey, tester_id: testerId, email, source: 'url_params' };
    }

    static cleanUrl() {
      try {
        const cleanUrl = global.location.pathname + (global.location.hash || '');
        global.history.replaceState({}, document.title, cleanUrl);
      } catch (_err) {}
    }

    static autoLogin() {
      const payload = this.readUrlPayload();
      if (payload) {
        const saved = this.setLicenseData(payload.license_key, payload.tester_id, payload.email, {
          source: payload.source,
          status: 'active'
        });
        this.cleanUrl();
        console.log('KEDRIX ENTRY BRIDGE OK', saved.tester_id);
        return { success: true, data: saved, source: 'url_params' };
      }

      const existing = this.getLicenseData();
      if (existing && existing.license_key && existing.tester_id && existing.email) {
        localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify({ ...existing, last_check: nowIso() }));
        return { success: true, data: existing, source: 'storage' };
      }

      return { success: false, error: 'no_valid_license' };
    }

    static async validateLicense(licenseKey, testerId) {
      const endpoint = (global.KedrixRuntimeConfig && typeof global.KedrixRuntimeConfig.getEndpoint === 'function')
        ? global.KedrixRuntimeConfig.getEndpoint('registry')
        : '';
      if (!endpoint) {
        return { valid: false, error: 'missing_registry_endpoint' };
      }
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'validate_license',
            license_key: safeTrim(licenseKey),
            tester_id: safeTrim(testerId),
            source: 'app_validation'
          }),
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store'
        });
        const rawText = await response.text();
        try {
          return rawText ? JSON.parse(rawText) : { valid: false, error: 'empty_response' };
        } catch (_err) {
          return { valid: false, error: 'invalid_json_response', rawText };
        }
      } catch (error) {
        return { valid: false, error: error && error.message ? error.message : 'network_error' };
      }
    }

    static async ensureValidLicense() {
      const result = this.autoLogin();
      if (result.success) return true;
      global.location.href = LANDING_URL;
      return false;
    }

    static getCurrentTesterId() {
      const data = this.getLicenseData();
      return data ? data.tester_id : null;
    }

    static getCurrentEmail() {
      const data = this.getLicenseData();
      return data ? data.email : null;
    }

    static getCurrentLicenseKey() {
      const data = this.getLicenseData();
      return data ? data.license_key : null;
    }

    static logout() {
      this.clearLicenseData();
      try { sessionStorage.clear(); } catch (_err) {}
      global.location.href = LANDING_URL;
    }
  }

  class KedrixLicense {
    constructor() {
      this.limits = DEFAULT_LIMITS;
      this.syncFromStorage();
    }

    syncFromStorage() {
      const data = LicenseSystem.getLicenseData();
      this.state = data || null;
      this.isPremium = !!(data && data.license_key && data.tester_id && data.email && this.getStatus() === 'active');
      this.trialUsed = localStorage.getItem('kedrix_trial_used') === 'true';
      return this.state;
    }

    getStatus() {
      const state = this.state || LicenseSystem.getLicenseData();
      if (!state || !state.license_key || !state.tester_id || !state.email) return 'missing';
      const status = String(state.status || 'active').trim().toLowerCase();
      if (status) return status;
      return 'active';
    }

    checkPremiumStatus() {
      this.syncFromStorage();
      return this.hasFullPremiumAccess();
    }

    hasFullPremiumAccess() {
      this.syncFromStorage();
      return this.getStatus() === 'active';
    }

    getPlanInfo() {
      const active = this.hasFullPremiumAccess();
      return active
        ? { name: 'Premium', status: 'Attivo', remaining: this.state && this.state.email ? this.state.email : '' }
        : { name: 'Free', status: 'Limitato' };
    }

    canUseFeature(feature) {
      const active = this.hasFullPremiumAccess();
      if (active) return true;
      if (feature === 'transactions') return true;
      return false;
    }

    canAddTransaction(count) {
      if (this.hasFullPremiumAccess()) return true;
      return Number(count || 0) < this.limits.free.maxTransactions;
    }

    getCurrentLimits() {
      return this.hasFullPremiumAccess() ? this.limits.premium : this.limits.free;
    }

    getUpgradeMessage(feature) {
      const target = safeTrim(feature || 'questa funzionalità');
      return `${target} è disponibile con accesso Premium beta.`;
    }

    startTrial() {
      if (this.hasFullPremiumAccess() || this.trialUsed) return false;
      localStorage.setItem('kedrix_trial_used', 'true');
      this.trialUsed = true;
      return false;
    }

    async activateLicense(email, key) {
      const normalizedEmail = normalizeEmail(email);
      const normalizedKey = safeTrim(key);
      const current = LicenseSystem.getLicenseData();
      if (current && normalizedEmail === current.email && normalizedKey === current.license_key) {
        LicenseSystem.setLicenseData(current.license_key, current.tester_id, current.email, {
          activated_at: current.activated_at,
          expires_at: current.expires_at,
          source: 'manual_reconfirm',
          status: 'active'
        });
        this.syncFromStorage();
        return true;
      }

      if (!normalizedEmail || !normalizedKey) return false;

      const testerFromStorage = current && current.tester_id ? current.tester_id : safeTrim(localStorage.getItem('tester_id'));
      if (!testerFromStorage) return false;

      const validation = await LicenseSystem.validateLicense(normalizedKey, testerFromStorage);
      const looksValid = !!(validation && (validation.valid || validation.ok || String(validation.status || '').toLowerCase() === 'active'));
      if (!looksValid) return false;

      LicenseSystem.setLicenseData(normalizedKey, testerFromStorage, normalizedEmail, {
        activated_at: current && current.activated_at ? current.activated_at : nowIso(),
        expires_at: safeTrim(validation.expires_at || ''),
        source: 'validated_activation',
        status: safeTrim(validation.status || 'active') || 'active'
      });
      this.syncFromStorage();
      return true;
    }
  }

  global.LicenseSystem = LicenseSystem;
  global.KedrixLicense = KedrixLicense;
  global.KedrixEntryBridge = {
    landingUrl: LANDING_URL,
    appUrl: APP_URL,
    autoLogin: () => LicenseSystem.autoLogin(),
    getLicenseData: () => LicenseSystem.getLicenseData()
  };

  LicenseSystem.autoLogin();
 const result = LicenseSystem.autoLogin();

if (result && result.success) {
  console.log('🔁 Sync license after bridge');
  if (global.KedrixLicenseInstance) {
    global.KedrixLicenseInstance.syncFromStorage();
  }
}
