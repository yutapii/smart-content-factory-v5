/**
 * Cryptographic Utilities - Enhanced security functions
 * SCF V5 Security Module
 */

class CryptoUtils {
    constructor() {
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
    }

    /**
     * Generate a secure random string
     */
    generateSecureToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Hash data using SHA-256
     */
    async hashSHA256(data) {
        const encoded = this.encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate HMAC signature
     */
    async generateHMAC(key, data) {
        const keyData = this.encoder.encode(key);
        const algorithm = { name: 'HMAC', hash: 'SHA-256' };
        
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            algorithm,
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign(
            'HMAC',
            cryptoKey,
            this.encoder.encode(data)
        );

        return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }

    /**
     * Verify HMAC signature
     */
    async verifyHMAC(key, data, signature) {
        const expectedSignature = await this.generateHMAC(key, data);
        return expectedSignature === signature;
    }

    /**
     * Generate RSA key pair for additional security
     */
    async generateKeyPair() {
        const keyPair = await crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true,
            ['encrypt', 'decrypt']
        );

        // Export keys for storage
        const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
        const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

        return {
            publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
            privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
        };
    }

    /**
     * Encrypt data with RSA public key
     */
    async encryptRSA(data, publicKeyBase64) {
        const publicKeyBuffer = Uint8Array.from(
            atob(publicKeyBase64),
            c => c.charCodeAt(0)
        );

        const publicKey = await crypto.subtle.importKey(
            'spki',
            publicKeyBuffer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            false,
            ['encrypt']
        );

        const encrypted = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            this.encoder.encode(data)
        );

        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    }

    /**
     * Decrypt data with RSA private key
     */
    async decryptRSA(encryptedData, privateKeyBase64) {
        const privateKeyBuffer = Uint8Array.from(
            atob(privateKeyBase64),
            c => c.charCodeAt(0)
        );

        const privateKey = await crypto.subtle.importKey(
            'pkcs8',
            privateKeyBuffer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            false,
            ['decrypt']
        );

        const encryptedBuffer = Uint8Array.from(
            atob(encryptedData),
            c => c.charCodeAt(0)
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: 'RSA-OAEP' },
            privateKey,
            encryptedBuffer
        );

        return this.decoder.decode(decrypted);
    }

    /**
     * Time-based One-Time Password (TOTP) generator
     */
    async generateTOTP(secret, timeStep = 30) {
        const time = Math.floor(Date.now() / 1000 / timeStep);
        const timeBuffer = new ArrayBuffer(8);
        const timeView = new DataView(timeBuffer);
        timeView.setUint32(4, time, false);

        const key = await crypto.subtle.importKey(
            'raw',
            this.encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-1' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, timeBuffer);
        const signatureArray = new Uint8Array(signature);
        
        const offset = signatureArray[signatureArray.length - 1] & 0xf;
        const binary = 
            ((signatureArray[offset] & 0x7f) << 24) |
            ((signatureArray[offset + 1] & 0xff) << 16) |
            ((signatureArray[offset + 2] & 0xff) << 8) |
            (signatureArray[offset + 3] & 0xff);

        const otp = binary % 1000000;
        return otp.toString().padStart(6, '0');
    }

    /**
     * Secure password strength checker
     */
    checkPasswordStrength(password) {
        const checks = {
            length: password.length >= 12,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            noCommon: !this.isCommonPassword(password)
        };

        const score = Object.values(checks).filter(Boolean).length;
        const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';

        return {
            score,
            strength,
            checks,
            suggestions: this.getPasswordSuggestions(checks)
        };
    }

    /**
     * Check if password is common
     */
    isCommonPassword(password) {
        const common = [
            'password', '123456', 'password123', 'admin', 'letmein',
            'welcome', 'monkey', '1234567890', 'qwerty', 'abc123'
        ];
        return common.includes(password.toLowerCase());
    }

    /**
     * Get password improvement suggestions
     */
    getPasswordSuggestions(checks) {
        const suggestions = [];
        
        if (!checks.length) suggestions.push('Use at least 12 characters');
        if (!checks.uppercase) suggestions.push('Add uppercase letters');
        if (!checks.lowercase) suggestions.push('Add lowercase letters');
        if (!checks.numbers) suggestions.push('Add numbers');
        if (!checks.special) suggestions.push('Add special characters');
        if (!checks.noCommon) suggestions.push('Avoid common passwords');

        return suggestions;
    }

    /**
     * Secure data sanitization
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Remove potential XSS vectors
        return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
    }

    /**
     * Generate secure nonce for CSP
     */
    generateNonce() {
        return btoa(this.generateSecureToken(16));
    }

    /**
     * Constant-time string comparison (prevent timing attacks)
     */
    secureCompare(a, b) {
        if (a.length !== b.length) return false;
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }

    /**
     * Encrypt sensitive data for transit
     */
    async encryptForTransit(data, password) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            this.encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            this.encoder.encode(JSON.stringify(data))
        );

        // Package everything together
        const packagedData = {
            salt: btoa(String.fromCharCode(...salt)),
            iv: btoa(String.fromCharCode(...iv)),
            data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
            timestamp: Date.now(),
            version: '1.0'
        };

        return btoa(JSON.stringify(packagedData));
    }

    /**
     * Decrypt data from transit
     */
    async decryptFromTransit(encryptedPackage, password) {
        try {
            const packagedData = JSON.parse(atob(encryptedPackage));
            
            const salt = Uint8Array.from(atob(packagedData.salt), c => c.charCodeAt(0));
            const iv = Uint8Array.from(atob(packagedData.iv), c => c.charCodeAt(0));
            const encrypted = Uint8Array.from(atob(packagedData.data), c => c.charCodeAt(0));

            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                this.encoder.encode(password),
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );

            const key = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );

            const decryptedText = this.decoder.decode(decrypted);
            return JSON.parse(decryptedText);
        } catch (error) {
            throw new Error('Decryption failed - invalid password or corrupted data');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptoUtils;
} else {
    window.CryptoUtils = CryptoUtils;
}