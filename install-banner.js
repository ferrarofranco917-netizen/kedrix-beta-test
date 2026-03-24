(function () {
  const STORAGE_KEY = 'kedrix-install-banner-dismissed-v1';
  const IOS_HELP_KEY = 'kedrix-install-banner-ios-dismissed-v1';
  const SHOW_DELAY_MS = 2200;

  let deferredPrompt = null;
  let activeBanner = null;

  const ua = window.navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  function getDismissed(key) {
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  }

  function setDismissed(key) {
    try {
      localStorage.setItem(key, '1');
    } catch {}
  }

  function removeBanner() {
    if (activeBanner) {
      activeBanner.remove();
      activeBanner = null;
    }
  }

  function createBaseBanner(title, text) {
    const banner = document.createElement('div');
    banner.className = 'kedrix-install-banner';
    banner.innerHTML = `
      <div class="kedrix-install-banner__inner">
        <div class="kedrix-install-banner__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v12"></path>
            <path d="M8 11l4 4 4-4"></path>
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path>
          </svg>
        </div>
        <div>
          <h3 class="kedrix-install-banner__title">${title}</h3>
          <p class="kedrix-install-banner__text">${text}</p>
          <div class="kedrix-install-banner__actions"></div>
        </div>
        <button class="kedrix-install-banner__close" type="button" aria-label="Close">×</button>
      </div>
    `;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('is-visible'));

    banner.querySelector('.kedrix-install-banner__close').addEventListener('click', () => {
      removeBanner();
    });

    activeBanner = banner;
    return banner;
  }

  function showInstallPromptBanner() {
    if (!deferredPrompt || isStandalone || getDismissed(STORAGE_KEY) || activeBanner) return;

    const banner = createBaseBanner(
      'Install Kedrix',
      'Use Kedrix like a real app. Faster access, always available from your home screen.'
    );

    const actions = banner.querySelector('.kedrix-install-banner__actions');

    const installBtn = document.createElement('button');
    installBtn.className = 'kedrix-install-banner__button';
    installBtn.type = 'button';
    installBtn.textContent = 'Install';
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      removeBanner();
      if (choice?.outcome !== 'accepted') {
        setDismissed(STORAGE_KEY);
      }
    });

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'kedrix-install-banner__dismiss';
    dismissBtn.type = 'button';
    dismissBtn.textContent = 'Not now';
    dismissBtn.addEventListener('click', () => {
      setDismissed(STORAGE_KEY);
      removeBanner();
    });

    actions.appendChild(installBtn);
    actions.appendChild(dismissBtn);
  }

  function showIOSBanner() {
    if (!isIOS || isStandalone || getDismissed(IOS_HELP_KEY) || activeBanner) return;

    const banner = createBaseBanner(
      'Install Kedrix on iPhone/iPad',
      'Add Kedrix to your home screen for a faster app-like experience.'
    );

    const content = banner.querySelector('.kedrix-install-banner__actions').parentElement;
    const steps = document.createElement('ol');
    steps.className = 'kedrix-install-banner__ios-steps';
    steps.innerHTML = `
      <li>Tap <strong>Share</strong> in Safari</li>
      <li>Choose <strong>Add to Home Screen</strong></li>
      <li>Open Kedrix from your device home screen</li>
    `;
    content.appendChild(steps);

    const actions = banner.querySelector('.kedrix-install-banner__actions');
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'kedrix-install-banner__dismiss';
    dismissBtn.type = 'button';
    dismissBtn.textContent = 'Got it';
    dismissBtn.addEventListener('click', () => {
      setDismissed(IOS_HELP_KEY);
      removeBanner();
    });
    actions.appendChild(dismissBtn);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    window.setTimeout(showInstallPromptBanner, SHOW_DELAY_MS);
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    removeBanner();
  });

  window.addEventListener('load', () => {
    if (isIOS) {
      window.setTimeout(showIOSBanner, SHOW_DELAY_MS + 500);
    }
  });
})();
