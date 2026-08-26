interface Env {
  QWEATHER_KEY: string
  QWEATHER_HOST?: string
  ALLOWED_ORIGIN?: string
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const cors = corsHeaders(env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    if (url.pathname.startsWith('/api/weather/')) {
      const path = url.pathname.slice('/api/weather'.length)
      const target = new URL(`https://${env.QWEATHER_HOST || 'devapi.qweather.com'}${path}`)
      url.searchParams.forEach((value, key) => target.searchParams.set(key, value))
      target.searchParams.set('key', env.QWEATHER_KEY)
      const upstream = await fetch(target.toString())
      const body = await upstream.text()
      return new Response(body, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json;charset=UTF-8', ...cors },
      })
    }

    if (url.pathname === '/api/ai') {
      return new Response(
        JSON.stringify({
          code: '501',
          message: 'AI module (DeepSeek) ships in a later Corner Cards release; endpoint reserved.',
        }),
        { status: 501, headers: { 'Content-Type': 'application/json;charset=UTF-8', ...cors } },
      )
    }

    return new Response('corner-weather-proxy is running.\n', {
      headers: { 'Content-Type': 'text/plain;charset=UTF-8', ...cors },
    })
  },
}
