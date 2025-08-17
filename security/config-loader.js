/**
 * Configuration Loader - Environment-based configuration management
 * SCF V5 Security Module
 */

class ConfigLoader {
    constructor() {
        this.config = {};
        this.encrypted = false;
        this.apiKeyManager = null;
    }

    /**
     * Initialize configuration with API Key Manager
     */
    async init() {
        // Check if APIKeyManager is available
        if (typeof APIKeyManager !== 'undefined') {
            this.apiKeyManager = new APIKeyManager();
        }

        // Load configuration from various sources
        await this.loadConfiguration();
        
        return this;
    }

    /**
     * Load configuration from available sources
     */
    async loadConfiguration() {
        // Priority: Environment > Encrypted Storage > LocalStorage > Defaults
        
        // 1. Try to load from encrypted storage first
        if (this.apiKeyManager && this.apiKeyManager.hasStoredKeys()) {
            await this.loadFromEncryptedStorage();
        }
        
        // 2. Load from localStorage (non-sensitive settings)
        this.loadFromLocalStorage();
        
        // 3. Apply defaults for missing values
        this.applyDefaults();
        
        // 4. Validate configuration
        this.validateConfiguration();
    }

    /**
     * Load API keys from encrypted storage
     */
    async loadFromEncryptedStorage() {
        // This will be called with user password when needed
        this.encrypted = true;
    }

    /**
     * Load non-sensitive settings from localStorage
     */
    loadFromLocalStorage() {
        const stored = localStorage.getItem('scf_v5_config');
        if (stored) {
            try {
                const config = JSON.parse(stored);
                // Only load non-sensitive configuration
                this.config = {
                    ...this.config,
                    ...this.filterNonSensitive(config)
                };
            } catch (error) {
                console.error('Failed to parse stored configuration:', error);
            }
        }
    }

    /**
     * Filter out sensitive information
     */
    filterNonSensitive(config) {
        const sensitive = [
            'ANTHROPIC_API_KEY',
            'OPENAI_API_KEY',
            'GOOGLE_VISION_API_KEY',
            'CLOUDFLARE_API_TOKEN',
            'GOOGLE_APPLICATION_CREDENTIALS'
        ];

        const filtered = {};
        for (const [key, value] of Object.entries(config)) {
            if (!sensitive.includes(key)) {
                filtered[key] = value;
            }
        }
        return filtered;
    }

    /**
     * Apply default configuration values
     */
    applyDefaults() {
        const defaults = {
            // Application Settings
            APP_NAME: 'Smart Content Factory V5',
            APP_VERSION: '5.0.0',
            APP_ENVIRONMENT: 'production',

            // Security Settings
            ENABLE_API_KEY_ENCRYPTION: true,
            SESSION_TIMEOUT_MINUTES: 30,
            MAX_LOGIN_ATTEMPTS: 5,
            API_KEY_ROTATION_DAYS: 90,

            // CORS Settings
            ALLOWED_ORIGINS: window.location.origin,
            CORS_MAX_AGE: 86400,

            // Database Configuration
            INDEXEDDB_VERSION: 2,
            ENABLE_LOCALSTORAGE_FALLBACK: true,
            CACHE_DURATION_DAYS: 60,

            // Feature Flags
            ENABLE_OCR: true,
            ENABLE_RSS_PROXY: true,
            ENABLE_DEBUG_MODE: false,
            ENABLE_ANALYTICS: false,

            // Rate Limiting
            API_RATE_LIMIT_PER_MINUTE: 60,
            RSS_FETCH_INTERVAL_SECONDS: 300,

            // Cloudflare Worker
            CLOUDFLARE_WORKER_URL: 'https://polished-snow-477a.yutapii.workers.dev',

            // Proxy Services
            RSS_PROXY_PRIMARY: 'https://api.rss2json.com/v1/api.json',
            RSS_PROXY_SECONDARY: 'https://api.allorigins.win/raw',
            RSS_PROXY_TERTIARY: 'https://cors-anywhere.herokuapp.com'
        };

        this.config = { ...defaults, ...this.config };
    }

    /**
     * Validate configuration
     */
    validateConfiguration() {
        const errors = [];

        // Check required non-sensitive settings
        if (!this.config.APP_NAME) {
            errors.push('APP_NAME is required');
        }

        if (!this.config.CLOUDFLARE_WORKER_URL) {
            errors.push('CLOUDFLARE_WORKER_URL is required');
        }

        if (this.config.SESSION_TIMEOUT_MINUTES < 5) {
            errors.push('SESSION_TIMEOUT_MINUTES must be at least 5');
        }

        if (errors.length > 0) {
            console.error('Configuration validation errors:', errors);
        }

        return errors.length === 0;
    }

    /**
     * Get configuration value
     */
    get(key, defaultValue = null) {
        return this.config[key] !== undefined ? this.config[key] : defaultValue;
    }

    /**
     * Set configuration value (non-sensitive only)
     */
    set(key, value) {
        const sensitive = [
            'ANTHROPIC_API_KEY',
            'OPENAI_API_KEY',
            'GOOGLE_VISION_API_KEY',
            'CLOUDFLARE_API_TOKEN'
        ];

        if (sensitive.includes(key)) {
            throw new Error(`Cannot set sensitive configuration ${key} directly. Use secure storage.`);
        }

        this.config[key] = value;
        this.saveToLocalStorage();
    }

    /**
     * Get API key (requires password)
     */
    async getAPIKey(keyName, password) {
        if (!this.apiKeyManager) {
            throw new Error('API Key Manager not initialized');
        }

        if (!password) {
            throw new Error('Password required to access API keys');
        }

        try {
            const keys = await this.apiKeyManager.getAPIKeys(password);
            return keys ? keys[keyName] : null;
        } catch (error) {
            console.error('Failed to get API key:', error);
            throw error;
        }
    }

    /**
     * Store API keys securely
     */
    async storeAPIKeys(keys, password) {
        if (!this.apiKeyManager) {
            throw new Error('API Key Manager not initialized');
        }

        return await this.apiKeyManager.storeAPIKeys(keys, password);
    }

    /**
     * Save non-sensitive configuration to localStorage
     */
    saveToLocalStorage() {
        const toSave = this.filterNonSensitive(this.config);
        localStorage.setItem('scf_v5_config', JSON.stringify(toSave));
    }

    /**
     * Check if running in development mode
     */
    isDevelopment() {
        return this.get('APP_ENVIRONMENT') === 'development' || 
               this.get('ENABLE_DEBUG_MODE') === true;
    }

    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.get(feature, false) === true;
    }

    /**
     * Get all non-sensitive configuration
     */
    getPublicConfig() {
        return this.filterNonSensitive(this.config);
    }

    /**
     * Create a secure API request configuration
     */
    async createSecureRequest(service, password) {
        const config = {
            headers: {},
            timeout: 30000
        };

        // Add API key if available
        if (service === 'anthropic') {
            const apiKey = await this.getAPIKey('ANTHROPIC_API_KEY', password);
            if (apiKey) {
                config.headers['x-api-key'] = apiKey;
                config.headers['anthropic-version'] = '2023-06-01';
            }
        } else if (service === 'openai') {
            const apiKey = await this.getAPIKey('OPENAI_API_KEY', password);
            if (apiKey) {
                config.headers['Authorization'] = `Bearer ${apiKey}`;
            }
        }

        // Add CORS headers if needed
        if (this.get('ALLOWED_ORIGINS')) {
            config.headers['Origin'] = window.location.origin;
        }

        return config;
    }

    /**
     * Export configuration for backup
     */
    exportConfig() {
        return {
            config: this.getPublicConfig(),
            version: this.get('APP_VERSION'),
            exported: new Date().toISOString()
        };
    }

    /**
     * Import configuration from backup
     */
    importConfig(backup) {
        if (!backup || !backup.config) {
            throw new Error('Invalid backup data');
        }

        // Only import non-sensitive configuration
        const filtered = this.filterNonSensitive(backup.config);
        this.config = { ...this.config, ...filtered };
        this.saveToLocalStorage();
        
        return true;
    }

    /**
     * Clear all configuration
     */
    clearAll() {
        this.config = {};
        localStorage.removeItem('scf_v5_config');
        
        if (this.apiKeyManager) {
            this.apiKeyManager.clearAPIKeys();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigLoader;
} else {
    window.ConfigLoader = ConfigLoader;
}