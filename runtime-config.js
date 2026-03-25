(function (global) {
  const CONFIG = {
    build: '20260325_stage_entry_fix_v1',
    channel: 'beta',
    serviceWorkerVersion: '20260325_stage_entry_fix_v1',
    serviceWorkerPath: './sw.js',
    scope: './',
    endpoints: {
      registry: 'https://script.google.com/macros/s/AKfycbyZIeJRQ6HICOzafg-9uZXTMPfDV-lEkUYe-FnNei6ldP9Smr9JUv5sMiaN5WUiM29F/exec',
      tracking: 'https://script.google.com/macros/s/AKfycbyZIeJRQ6HICOzafg-9uZXTMPfDV-lEkUYe-FnNei6ldP9Smr9JUv5sMiaN5WUiM29F/exec'
    }
  };

  function readMeta(name) {
    try {
      const node = document.querySelector(`meta[name="${name}"]`);
      return node && node.content ? String(node.content).trim() : '';
    } catch (_err) {
      return '';
    }
  }

  function readStorage(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? String(value).trim() : '';
    } catch (_err) {
      return '';
    }
  }

  function normalizeExecUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/\/exec(?:\?|#|$)/.test(raw)) return raw;
    if (/script\.google\.com\/macros\/s\//.test(raw)) return raw.replace(/\/?$/, '/exec');
    return raw;
  }

  const api = {
    getBuild() {
      return readMeta('kedrix-build') || CONFIG.build;
    },
    getChannel() {
      return readMeta('kedrix-channel') || CONFIG.channel;
    },
    getScope() {
      return CONFIG.scope;
    },
    getServiceWorkerUrl() {
      return `${CONFIG.serviceWorkerPath}?v=${CONFIG.serviceWorkerVersion}`;
    },
    getEndpoint(kind) {
      const normalizedKind = String(kind || '').trim().toLowerCase();
      if (!normalizedKind) return '';

      const storageKeys = {
        registry: ['kedrix_registry_endpoint'],
        tracking: ['kedrix_tracking_endpoint', 'kedrix_registry_endpoint']
      };
      const metaKeys = {
        registry: 'kedrix-beta-registry-endpoint',
        tracking: 'kedrix-tracking-endpoint'
      };

      const metaValue = normalizeExecUrl(readMeta(metaKeys[normalizedKind] || ''));
      if (metaValue) return metaValue;

      const storageCandidates = storageKeys[normalizedKind] || [];
      for (const key of storageCandidates) {
        const value = normalizeExecUrl(readStorage(key));
        if (value) return value;
      }

      return normalizeExecUrl(CONFIG.endpoints[normalizedKind] || '');
    }
  };

  try {
    const registry = api.getEndpoint('registry');
    const tracking = api.getEndpoint('tracking');
    if (registry) localStorage.setItem('kedrix_registry_endpoint', registry);
    if (tracking) localStorage.setItem('kedrix_tracking_endpoint', tracking);
  } catch (_err) {}

  global.KedrixRuntimeConfig = api;
})(window);
