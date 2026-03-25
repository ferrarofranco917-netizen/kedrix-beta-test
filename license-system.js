// ============================================================
// KEDRIX BETA — LICENSE SYSTEM
// VERSION: STABLE v1.0
// ============================================================

const LICENSE_STORAGE_KEY = 'kedrix_license_data';
const SESSION_STORAGE_KEY = 'kedrix_session';

class LicenseSystem {
    
    // ============================================================
    // METODI DI LETTURA/SCRITTURA LOCALSTORAGE
    // ============================================================
    
    static getLicenseData() {
        try {
            const stored = localStorage.getItem(LICENSE_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error reading license data:', e);
        }
        return null;
    }
    
    static setLicenseData(licenseKey, testerId, email) {
        const data = {
            license_key: licenseKey,
            tester_id: testerId,
            email: email,
            activated_at: new Date().toISOString(),
            last_check: new Date().toISOString()
        };
        localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(data));
        return data;
    }
    
    static clearLicenseData() {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
    }
    
    // ============================================================
    // SESSION ID
    // ============================================================
    
    static getSessionId() {
        try {
            let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (!sessionId) {
                sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
                sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
            }
            return sessionId;
        } catch (e) {
            return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
        }
    }
    
    // ============================================================
    // AUTO-LOGIN — LEGGE I PARAMETRI DALL'URL
    // ============================================================
    
    static autoLogin() {
        // Leggi parametri dall'URL
        const urlParams = new URLSearchParams(window.location.search);
        let licenseKey = urlParams.get('license');
        let testerId = urlParams.get('tester');
        let email = urlParams.get('email');
        
        // Se i parametri esistono, salva e pulisci URL
        if (licenseKey && testerId && email) {
            this.setLicenseData(licenseKey, testerId, email);
            
            // Rimuovi parametri dall'URL senza ricaricare la pagina
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
            
            console.log('Auto-login effettuato con successo');
            return { success: true, data: { license_key: licenseKey, tester_id: testerId, email: email } };
        }
        
        // Se non ci sono parametri, verifica se esiste già una licenza salvata
        const existingData = this.getLicenseData();
        if (existingData) {
            console.log('Licenza esistente trovata:', existingData.tester_id);
            return { success: true, data: existingData };
        }
        
        // Nessuna licenza trovata — reindirizza alla landing
        console.log('Nessuna licenza trovata, reindirizzamento alla landing');
        window.location.href = 'https://kedrix-landing-v2.kedrix-corp.workers.dev';
        return { success: false, error: 'No valid license found' };
    }
    
    // ============================================================
    // VALIDAZIONE LICENZA (opzionale, chiamata periodica)
    // ============================================================
    
    static async validateLicense(licenseKey, testerId) {
        try {
            const response = await fetch('https://script.google.com/macros/s/AKfycbyZIeJRQ6HICOzafg-9uZXTMPfDV-lEkUYe-FnNei6ldP9Smr9JUv5sMiaN5WUiM29F/exec', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'validate_license',
                    license_key: licenseKey,
                    tester_id: testerId
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('License validation error:', error);
            return { valid: false, error: 'Network error' };
        }
    }
    
    static async ensureValidLicense() {
        const licenseData = this.getLicenseData();
        
        if (!licenseData) {
            window.location.href = 'https://kedrix-landing-v2.kedrix-corp.workers.dev';
            return false;
        }
        
        // Opzionale: valida con backend (chiamata async)
        // const validation = await this.validateLicense(licenseData.license_key, licenseData.tester_id);
        // if (!validation.valid) {
        //     this.clearLicenseData();
        //     window.location.href = 'https://kedrix-landing-v2.kedrix-corp.workers.dev';
        //     return false;
        // }
        
        licenseData.last_check = new Date().toISOString();
        localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(licenseData));
        
        return true;
    }
    
    // ============================================================
    // GETTER
    // ============================================================
    
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
    
    // ============================================================
    // LOGOUT
    // ============================================================
    
    static logout() {
        this.clearLicenseData();
        sessionStorage.clear();
        window.location.href = 'https://kedrix-landing-v2.kedrix-corp.workers.dev';
    }
}

// ============================================================
// INIZIALIZZAZIONE AUTOMATICA ALL'AVVIO
// ============================================================

// Esegui auto-login quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        LicenseSystem.autoLogin();
    });
} else {
    LicenseSystem.autoLogin();
}

// Esporta per moduli (se usi moduli ES6)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LicenseSystem;
}
