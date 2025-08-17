/**
 * API Key Manager - Secure API key storage and management
 * SCF V5 Security Module
 */

class APIKeyManager {
    constructor() {
        this.storageKey = 'scf_v5_encrypted_keys';
        this.sessionKey = 'scf_v5_session_token';
        this.initCrypto();
    }

    /**
     * Initialize Web Crypto API
     */
    async initCrypto() {
        this.crypto = window.crypto || window.msCrypto;
        if (!this.crypto) {
            throw new Error('Web Crypto API is not available');
        }
    }

    /**
     * Generate a cryptographic key from password
     */
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await this.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        return await this.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypt API key with user password
     */
    async encryptAPIKey(apiKey, password) {
        try {
            const salt = this.crypto.getRandomValues(new Uint8Array(16));
            const iv = this.crypto.getRandomValues(new Uint8Array(12));
            const key = await this.deriveKey(password, salt);
            
            const encoder = new TextEncoder();
            const encrypted = await this.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encoder.encode(apiKey)
            );

            // Combine salt, iv, and encrypted data
            const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(new Uint8Array(encrypted), salt.length + iv.length);

            // Convert to base64 for storage
            return btoa(String.fromCharCode.apply(null, combined));
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt API key');
        }
    }

    /**
     * Decrypt API key with user password
     */
    async decryptAPIKey(encryptedData, password) {
        try {
            // Convert from base64
            const combined = new Uint8Array(
                atob(encryptedData).split('').map(char => char.charCodeAt(0))
            );

            // Extract salt, iv, and encrypted data
            const salt = combined.slice(0, 16);
            const iv = combined.slice(16, 28);
            const encrypted = combined.slice(28);

            const key = await this.deriveKey(password, salt);
            
            const decrypted = await this.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt API key - incorrect password or corrupted data');
        }
    }

    /**
     * Store encrypted API keys
     */
    async storeAPIKeys(keys, password) {
        const encryptedKeys = {};
        
        for (const [name, value] of Object.entries(keys)) {
            if (value && value.trim()) {
                encryptedKeys[name] = await this.encryptAPIKey(value, password);
            }
        }

        // Store in localStorage with additional metadata
        const storage = {
            keys: encryptedKeys,
            timestamp: Date.now(),
            version: '1.0',
            lastAccess: Date.now()
        };

        localStorage.setItem(this.storageKey, JSON.stringify(storage));
        
        // Create session token for temporary access
        this.createSessionToken(password);
        
        return true;
    }

    /**
     * Retrieve and decrypt API keys
     */
    async getAPIKeys(password) {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) {
            return null;
        }

        try {
            const storage = JSON.parse(stored);
            const decryptedKeys = {};

            for (const [name, encryptedValue] of Object.entries(storage.keys)) {
                decryptedKeys[name] = await this.decryptAPIKey(encryptedValue, password);
            }

            // Update last access time
            storage.lastAccess = Date.now();
            localStorage.setItem(this.storageKey, JSON.stringify(storage));

            return decryptedKeys;
        } catch (error) {
            console.error('Failed to retrieve API keys:', error);
            throw error;
        }
    }

    /**
     * Create temporary session token
     */
    createSessionToken(password) {
        const token = btoa(JSON.stringify({
            hash: this.hashPassword(password),
            expires: Date.now() + (30 * 60 * 1000) // 30 minutes
        }));
        sessionStorage.setItem(this.sessionKey, token);
    }

    /**
     * Validate session token
     */
    validateSession() {
        const token = sessionStorage.getItem(this.sessionKey);
        if (!token) return false;

        try {
            const data = JSON.parse(atob(token));
            return data.expires > Date.now();
        } catch {
            return false;
        }
    }

    /**
     * Simple password hashing for session validation
     */
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    /**
     * Check if API keys are stored
     */
    hasStoredKeys() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    /**
     * Remove all stored API keys
     */
    clearAPIKeys() {
        localStorage.removeItem(this.storageKey);
        sessionStorage.removeItem(this.sessionKey);
    }

    /**
     * Validate API key format
     */
    validateAPIKey(key, type) {
        const patterns = {
            anthropic: /^sk-ant-api\d{2}-[\w-]{40,}$/,
            openai: /^sk-[a-zA-Z0-9]{48}$/,
            google: /^AIza[a-zA-Z0-9-_]{35}$/,
            generic: /^[\w-]{20,}$/
        };

        const pattern = patterns[type] || patterns.generic;
        return pattern.test(key);
    }

    /**
     * Export encrypted keys for backup
     */
    exportEncryptedKeys() {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return null;

        const data = JSON.parse(stored);
        return {
            ...data,
            exported: Date.now(),
            device: navigator.userAgent
        };
    }

    /**
     * Import encrypted keys from backup
     */
    importEncryptedKeys(backupData) {
        if (!backupData || !backupData.keys) {
            throw new Error('Invalid backup data');
        }

        const storage = {
            keys: backupData.keys,
            timestamp: backupData.timestamp || Date.now(),
            version: backupData.version || '1.0',
            lastAccess: Date.now(),
            imported: Date.now()
        };

        localStorage.setItem(this.storageKey, JSON.stringify(storage));
        return true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIKeyManager;
} else {
    window.APIKeyManager = APIKeyManager;
}