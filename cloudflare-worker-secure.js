/**
 * Secure Cloudflare Worker for SCF V5
 * Enhanced security with authentication and rate limiting
 */

// Configuration (set these as Worker environment variables)
const CONFIG = {
    ALLOWED_ORIGINS: ['http://localhost', 'https://yourdomain.com'],
    RATE_LIMIT_PER_MINUTE: 60,
    AUTH_TOKEN_HEADER: 'X-Auth-Token',
    API_KEY_HEADER: 'X-API-Key',
    MAX_REQUEST_SIZE: 1024 * 100, // 100KB
    CACHE_DURATION: 60 * 5, // 5 minutes
    ENABLE_LOGGING: true
};

// Rate limiting store
const rateLimitStore = new Map();

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    // Security headers
    const securityHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'"
    };

    try {
        // Check request size
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > CONFIG.MAX_REQUEST_SIZE) {
            return jsonResponse({ error: 'Request too large' }, 413, securityHeaders);
        }

        // Validate origin
        const origin = request.headers.get('origin');
        if (!isAllowedOrigin(origin)) {
            return jsonResponse({ error: 'Origin not allowed' }, 403, securityHeaders);
        }

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-API-Key',
            'Access-Control-Max-Age': '86400',
            ...securityHeaders
        };

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Check authentication
        const authToken = request.headers.get(CONFIG.AUTH_TOKEN_HEADER);
        if (!authToken || !await validateAuthToken(authToken)) {
            return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
        }

        // Rate limiting
        const clientId = getClientIdentifier(request);
        if (!checkRateLimit(clientId)) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429, corsHeaders);
        }

        // Route request
        const url = new URL(request.url);
        const path = url.pathname;

        switch (path) {
            case '/api/rss':
                return await handleRSSRequest(request, corsHeaders);
            case '/api/claude':
                return await handleClaudeRequest(request, corsHeaders);
            case '/api/validate':
                return await handleValidation(request, corsHeaders);
            default:
                return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
        }

    } catch (error) {
        console.error('Worker error:', error);
        return jsonResponse(
            { error: 'Internal server error', message: error.message },
            500,
            securityHeaders
        );
    }
}

/**
 * Check if origin is allowed
 */
function isAllowedOrigin(origin) {
    if (!origin) return false;
    return CONFIG.ALLOWED_ORIGINS.some(allowed => 
        origin.startsWith(allowed)
    );
}

/**
 * Validate authentication token
 */
async function validateAuthToken(token) {
    // In production, validate against KV store or external service
    // For now, use HMAC validation
    try {
        const [payload, signature] = token.split('.');
        if (!payload || !signature) return false;

        // Verify signature
        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(AUTH_SECRET || 'default-secret'),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            base64ToArrayBuffer(signature),
            new TextEncoder().encode(payload)
        );

        if (!valid) return false;

        // Check expiration
        const data = JSON.parse(atob(payload));
        return data.exp > Date.now();

    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request) {
    return request.headers.get('CF-Connecting-IP') || 
           request.headers.get('X-Forwarded-For') || 
           'unknown';
}

/**
 * Check rate limit
 */
function checkRateLimit(clientId) {
    const now = Date.now();
    const windowStart = now - (60 * 1000); // 1 minute window

    if (!rateLimitStore.has(clientId)) {
        rateLimitStore.set(clientId, [now]);
        return true;
    }

    const timestamps = rateLimitStore.get(clientId);
    const recentRequests = timestamps.filter(t => t > windowStart);
    
    if (recentRequests.length >= CONFIG.RATE_LIMIT_PER_MINUTE) {
        return false;
    }

    recentRequests.push(now);
    rateLimitStore.set(clientId, recentRequests);
    
    // Clean up old entries
    if (rateLimitStore.size > 1000) {
        const oldestAllowed = now - (5 * 60 * 1000); // 5 minutes
        for (const [id, times] of rateLimitStore.entries()) {
            if (times[times.length - 1] < oldestAllowed) {
                rateLimitStore.delete(id);
            }
        }
    }

    return true;
}

/**
 * Handle RSS feed requests
 */
async function handleRSSRequest(request, headers) {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405, headers);
    }

    try {
        const { url } = await request.json();
        
        if (!url || !isValidUrl(url)) {
            return jsonResponse({ error: 'Invalid URL' }, 400, headers);
        }

        // Check cache
        const cacheKey = `rss:${url}`;
        const cached = await getCache(cacheKey);
        if (cached) {
            return jsonResponse(cached, 200, headers);
        }

        // Fetch RSS feed
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SCF-V5-RSS-Reader/1.0'
            },
            cf: {
                cacheTtl: CONFIG.CACHE_DURATION,
                cacheEverything: true
            }
        });

        if (!response.ok) {
            return jsonResponse(
                { error: 'Failed to fetch RSS feed', status: response.status },
                response.status,
                headers
            );
        }

        const text = await response.text();
        const result = { data: text, fetched: new Date().toISOString() };

        // Cache result
        await setCache(cacheKey, result, CONFIG.CACHE_DURATION);

        return jsonResponse(result, 200, headers);

    } catch (error) {
        console.error('RSS fetch error:', error);
        return jsonResponse(
            { error: 'Failed to process RSS feed', message: error.message },
            500,
            headers
        );
    }
}

/**
 * Handle Claude API requests (secure proxy)
 */
async function handleClaudeRequest(request, headers) {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405, headers);
    }

    try {
        const body = await request.json();
        
        // Get API key from secure header
        const encryptedKey = request.headers.get(CONFIG.API_KEY_HEADER);
        if (!encryptedKey) {
            return jsonResponse({ error: 'API key required' }, 400, headers);
        }

        // Decrypt API key (in production, use KV store)
        const apiKey = await decryptApiKey(encryptedKey);
        if (!apiKey) {
            return jsonResponse({ error: 'Invalid API key' }, 401, headers);
        }

        // Forward to Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body)
        });

        const responseData = await response.json();

        // Log usage for monitoring
        if (CONFIG.ENABLE_LOGGING) {
            await logApiUsage('claude', getClientIdentifier(request));
        }

        return jsonResponse(responseData, response.status, headers);

    } catch (error) {
        console.error('Claude API error:', error);
        return jsonResponse(
            { error: 'Failed to process request', message: error.message },
            500,
            headers
        );
    }
}

/**
 * Handle validation requests
 */
async function handleValidation(request, headers) {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405, headers);
    }

    try {
        const { type, value } = await request.json();
        
        let isValid = false;
        let message = '';

        switch (type) {
            case 'rss':
                isValid = isValidUrl(value) && value.includes('rss');
                message = isValid ? 'Valid RSS URL' : 'Invalid RSS URL';
                break;
            case 'api_key':
                isValid = validateApiKeyFormat(value);
                message = isValid ? 'Valid API key format' : 'Invalid API key format';
                break;
            default:
                message = 'Unknown validation type';
        }

        return jsonResponse({ isValid, message }, 200, headers);

    } catch (error) {
        return jsonResponse(
            { error: 'Validation failed', message: error.message },
            500,
            headers
        );
    }
}

/**
 * Validate URL
 */
function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * Validate API key format
 */
function validateApiKeyFormat(key) {
    // Basic format validation
    return key && key.length > 20 && /^[a-zA-Z0-9-_]+$/.test(key);
}

/**
 * Decrypt API key (placeholder - implement actual decryption)
 */
async function decryptApiKey(encryptedKey) {
    // In production, retrieve from KV store or decrypt
    // This is a placeholder implementation
    try {
        return atob(encryptedKey);
    } catch {
        return null;
    }
}

/**
 * Cache management
 */
async function getCache(key) {
    // In production, use KV store
    // This is a placeholder
    return null;
}

async function setCache(key, value, ttl) {
    // In production, use KV store
    // This is a placeholder
}

/**
 * Log API usage
 */
async function logApiUsage(service, clientId) {
    // In production, write to analytics or KV store
    console.log(`API usage: ${service} by ${clientId} at ${new Date().toISOString()}`);
}

/**
 * Helper functions
 */
function jsonResponse(data, status, headers) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}