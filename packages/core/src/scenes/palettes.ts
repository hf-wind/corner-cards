export type SceneId =
  | 'clear'
  | 'partly'
  | 'cloudy'
  | 'shower'
  | 'thunder'
  | 'rain'
  | 'sleet'
  | 'snow'
  | 'fog'
  | 'haze'
  | 'sand'
  | 'unknown'

export interface Palette {
  day: [string, string]
  night: [string, string]
  ink: 'light' | 'dark'
}

export const PALETTES: Record<SceneId, Palette> = {
  clear: { day: ['#2f7cf6', '#8fd3ff'], night: ['#0b1026', '#2b3a67'], ink: 'light' },
  partly: { day: ['#4a90e2', '#9cc6f5'], night: ['#101a33', '#33436b'], ink: 'light' },
  cloudy: { day: ['#7d93ab', '#c3d3e0'], night: ['#182234', '#31415c'], ink: 'light' },
  shower: { day: ['#51677f', '#93a8bc'], night: ['#0e1626', '#26344c'], ink: 'light' },
  rain: { day: ['#3c5068', '#74889c'], night: ['#0a111f', '#20304a'], ink: 'light' },
  thunder: { day: ['#241f4e', '#5b3fa8'], night: ['#0d0a24', '#2e2860'], ink: 'light' },
  sleet: { day: ['#5a7186', '#aebfce'], night: ['#0d1524', '#27364e'], ink: 'light' },
  snow: { day: ['#7590a8', '#d7e3ec'], night: ['#131c2c', '#39485f'], ink: 'light' },
  fog: { day: ['#9aa5ae', '#dde3e7'], night: ['#1a2129', '#3a434d'], ink: 'dark' },
  haze: { day: ['#a39a91', '#d8d1c8'], night: ['#211d19', '#453e35'], ink: 'dark' },
  sand: { day: ['#c07b2d', '#eec06a'], night: ['#3d2708', '#8a5a12'], ink: 'light' },
  unknown: { day: ['#708090', '#b8c4ce'], night: ['#151b22', '#333c46'], ink: 'light' },
}
