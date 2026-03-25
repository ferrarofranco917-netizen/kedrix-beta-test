// ============================================================
// KEDRIX BETA — LICENSE SYSTEM
// VERSION: STABLE v1.0
// ============================================================

const LICENSE_STORAGE_KEY = 'kedrix_license_data';
const SESSION_STORAGE_KEY = 'kedrix_session';

class LicenseSystem {
    
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
    
    static async autoLogin() {
        const urlParams = new URLSearchParams(window.location.search);
        let licenseKey = urlParams.get('license');
        let testerId = urlParams.get('tester');
        let email = urlParams.get('email');
        
        const existingData = this.getLicenseData();
        
        if (licenseKey && testerId && email) {
            this.setLicenseData(licenseKey, testerId, email);
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
            return { success: true, data: { license_key: licenseKey, tester_id: testerId, email: email } };
        }
        
        if (existingData) {
            return { success: true, data: existingData };
        }
        
        return { success: false, error: 'No valid license found' };
    }
    
    static async validateLicense(licenseKey, testerId) {
        try {
            const response = await fetch('https://script.google.com/macros/s/AKfycbz_StagingEndpoint/exec', {
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
            window.location.href = '/';
            return false;
        }
        
        const validation = await this.validateLicense(licenseData.license_key, licenseData.tester_id);
        
        if (!validation.valid) {
            localStorage.removeItem(LICENSE_STORAGE_KEY);
            window.location.href = '/';
            return false;
        }
        
        licenseData.last_check = new Date().toISOString();
        localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(licenseData));
        
        return true;
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
        localStorage.removeItem(LICENSE_STORAGE_KEY);
        sessionStorage.clear();
        window.location.href = '/';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LicenseSystem;
}
