export interface QWeatherNow {
  obsTime: string
  temp: string
  feelsLike: string
  icon: string
  text: string
  windDir: string
  windScale: string
  windSpeed: string
  humidity: string
  pressure: string
  vis: string
  cloud: string
  dew: string
}

export interface QWeatherDaily {
  fxDate: string
  tempMax: string
  tempMin: string
  icon: string
  text: string
  windDirDay: string
  windScaleDay: string
  sunrise: string
  sunset: string
  uvIndex: string
}

export interface QWeatherNowResponse {
  code: string
  updateTime: string
  fxLink: string
  now: QWeatherNow
}

export interface QWeatherDailyResponse {
  code: string
  updateTime: string
  fxLink: string
  daily: QWeatherDaily[]
}

export type SizePreset = 'compact' | 'standard' | 'banner'
export type ThemeMode = 'auto' | 'light' | 'dark'

export interface WeatherSnapshot {
  now: QWeatherNow
  today: QWeatherDaily
  forecast: QWeatherDaily[]
  fetchedAt: number
}
