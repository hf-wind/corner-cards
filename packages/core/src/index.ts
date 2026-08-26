import { CornerWeather } from './corner-weather'

if (!customElements.get('corner-weather')) {
  customElements.define('corner-weather', CornerWeather)
}

export { CornerWeather }
export * from './types'
