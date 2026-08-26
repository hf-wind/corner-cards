interface Env {
  QWEATHER_HOST?: string
  ALLOWED_ORIGIN?: string
  QWEATHER_KEY?: string
  JWT_PRIVATE_KEY?: string
  JWT_KID?: string
  JWT_SUB?: string
}

const TOKEN_LIFETIME = 86340
const TOKEN_REFRESH_MARGIN = 300

let cachedToken: { value: string; refreshAt: number } | null = null
let privateKey: CryptoKey | null = null

function corsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function base64UrlEncode(data: Uint8Array): string {
  let str = ''
  for (const byte of data) str += String.fromCharCode(byte)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey('pkcs8', der.buffer as ArrayBuffer, { name: 'Ed25519' }, false, [
    'sign',
  ])
}

async function signJwt(env: Env, iatSec: number): Promise<string> {
  if (!privateKey) privateKey = await importPrivateKey(env.JWT_PRIVATE_KEY as string)
  const encoder = new TextEncoder()
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: 'EdDSA', kid: env.JWT_KID })))
  const payload = base64UrlEncode(
    encoder.encode(JSON.stringify({ sub: env.JWT_SUB, iat: iatSec, exp: iatSec + TOKEN_LIFETIME })),
  )
  const signature = await crypto.subtle.sign(
    'Ed25519',
    privateKey,
    encoder.encode(`${header}.${payload}`),
  )
  return `${header}.${payload}.${base64UrlEncode(new Uint8Array(signature))}`
}

async function bearerToken(env: Env): Promise<string> {
  const nowMs = Date.now()
  if (cachedToken && nowMs < cachedToken.refreshAt) return cachedToken.value
  const iatSec = Math.floor(nowMs / 1000)
  const value = await signJwt(env, iatSec)
  cachedToken = { value, refreshAt: (iatSec + TOKEN_LIFETIME - TOKEN_REFRESH_MARGIN) * 1000 }
  return value
}

function jwtMode(env: Env): boolean {
  return !!(env.JWT_PRIVATE_KEY && env.JWT_KID && env.JWT_SUB)
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

      let requestHeaders: Record<string, string> = {}
      if (jwtMode(env)) {
        target.searchParams.delete('key')
        requestHeaders = { Authorization: `Bearer ${await bearerToken(env)}` }
      } else if (env.QWEATHER_KEY) {
        target.searchParams.set('key', env.QWEATHER_KEY)
      } else {
        return new Response(
          JSON.stringify({
            code: '503',
            message:
              'corner-weather-proxy is not configured. Provide either QWEATHER_KEY, or JWT_PRIVATE_KEY + JWT_KID + JWT_SUB.',
          }),
          { status: 503, headers: { 'Content-Type': 'application/json;charset=UTF-8', ...cors } },
        )
      }

      const upstream = await fetch(target.toString(), { headers: requestHeaders })
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
