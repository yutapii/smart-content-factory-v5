// Cloudflare Worker - RSS CORS Proxy + Claude API Proxy
// 既存のpolished-snow-477aを置き換えるか、新しいWorkerとして使用可能

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Max-Age': '86400',
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Claude API proxy endpoint
  if (url.pathname === '/claude' || url.pathname === '/api/claude') {
    return handleClaudeAPI(request, corsHeaders)
  }

  // RSS proxy (既存の機能)
  if (url.pathname === '/fetch-rss' || url.pathname === '/') {
    return handleRSSProxy(request, corsHeaders)
  }

  // Default response
  return new Response('Worker is running. Use /fetch-rss for RSS or /claude for Claude API', {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
  })
}

// Claude API proxy handler
async function handleClaudeAPI(request, corsHeaders) {
  try {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      })
    }

    // Parse request body
    const body = await request.json()
    
    // Extract API key from request
    const apiKey = body.apiKey
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Remove apiKey from body before forwarding
    delete body.apiKey

    // Forward request to Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })

    // Get response text
    const responseText = await response.text()

    // Return response with CORS headers
    return new Response(responseText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// RSS proxy handler (既存の機能)
async function handleRSSProxy(request, corsHeaders) {
  try {
    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('url')
    
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch the RSS feed
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.statusText}`)
    }

    const content = await response.text()

    // Return the RSS content with CORS headers
    return new Response(content, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/xml'
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch RSS',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}