import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2020',
    lib: {
      entry: 'src/index.ts',
      name: 'CornerWeatherCard',
      formats: ['es', 'iife'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'corner-weather-card.iife.js'),
    },
  },
})
