import type { QWeatherDailyResponse, QWeatherNowResponse, WeatherSnapshot } from './types'

const DEFAULT_HOST = 'devapi.qweather.com'

export interface FetchOptions {
  location: string
  lang?: string
  unit?: string
  key?: string
  host?: string
  apiBase?: string
  signal?: AbortSignal
}

function buildUrl(path: string, params: URLSearchParams, opts: FetchOptions): string {
  if (opts.apiBase) {
    return `${opts.apiBase.replace(/\/+$/, '')}${path}?${params}`
  }
  const host = opts.host?.trim() || DEFAULT_HOST
  return `https://${host}${path}?${params}`
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = (await res.json()) as T & { code?: string }
  if (json.code && json.code !== '200') throw new Error(`QWeather code ${json.code}`)
  return json
}

export async function fetchWeather(opts: FetchOptions): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    location: opts.location,
    lang: opts.lang ?? 'zh',
    unit: opts.unit ?? 'c',
  })
  if (!opts.apiBase && opts.key) params.set('key', opts.key)
  const [nowRes, dailyRes] = await Promise.all([
    getJson<QWeatherNowResponse>(buildUrl('/v7/weather/now', params, opts), opts.signal),
    getJson<QWeatherDailyResponse>(buildUrl('/v7/weather/3d', params, opts), opts.signal),
  ])
  const today = dailyRes.daily[0]
  if (!today) throw new Error('empty forecast')
  return { now: nowRes.now, today, forecast: dailyRes.daily, fetchedAt: Date.now() }
}
