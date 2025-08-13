// Cloudflare Worker for Claude API Proxy
// このコードをCloudflare Workerにデプロイしてください

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Max-Age': '86400',
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

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