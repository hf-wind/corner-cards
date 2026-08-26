import { LitElement, css, html, type PropertyValues, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import { fetchWeather } from './api'
import { cacheKey, readCache, writeCache } from './cache'
import { renderCard, type CardModel } from './layouts'
import { PALETTES, type Palette } from './scenes/palettes'
import { ParticleEngine } from './scenes/particles'
import { resolveScene } from './scenes/registry'
import { isNight } from './utils/day-night'
import type { SizePreset, ThemeMode, WeatherSnapshot } from './types'

export class CornerWeather extends LitElement {
  @property() key = ''
  @property() jwt = ''
  @property() host = ''
  @property({ attribute: 'api-base' }) apiBase = ''
  @property() location = ''
  @property({ type: String }) size: SizePreset = 'standard'
  @property({ type: String }) theme: ThemeMode = 'auto'
  @property({ type: String }) lang = 'zh'
  @property({ type: String }) unit = 'c'

  @state() private snapshot: WeatherSnapshot | null = null
  @state() private loading = false
  @state() private error: string | null = null
  @state() private staleAt: number | null = null

  private engine: ParticleEngine | null = null
  private aborter: AbortController | null = null
  private fetchedKey = ''

  static styles = css`
    :host {
      display: block;
      font-family: var(--cw-font, inherit);
    }
    .cw-card {
      position: relative;
      overflow: hidden;
      border-radius: var(--cw-radius, 16px);
      box-shadow: var(--cw-shadow, 0 8px 28px rgba(0, 0, 0, 0.16));
      color: var(--cw-ink, #ffffff);
      transition: background 0.8s ease;
      min-height: 150px;
      display: flex;
    }
    .standard {
      width: min(340px, 100%);
      min-height: 190px;
    }
    .compact {
      width: min(180px, 100%);
    }
    .banner {
      width: 100%;
      min-height: 96px;
      height: var(--cw-height, 128px);
    }
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .ink-dark {
      --cw-ink: #2f3540;
    }
    .content {
      position: relative;
      z-index: 1;
      padding: 16px 18px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }
    .cw-main {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .cw-head,
    .cw-banner-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .cw-banner-row {
      align-items: center;
      justify-content: flex-start;
      flex: 1;
    }
    .cw-col {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .cw-temp {
      font-size: 44px;
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -1px;
    }
    .compact .cw-temp {
      font-size: 38px;
    }
    .banner .cw-temp {
      font-size: 36px;
      margin-right: 4px;
    }
    .cw-text {
      font-size: 14px;
      opacity: 0.94;
    }
    .cw-meta {
      font-size: 12px;
      opacity: 0.78;
    }
    .cw-glyph {
      width: 64px;
      height: 64px;
      flex: none;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.18));
    }
    .cw-glyph-md {
      width: 54px;
      height: 54px;
    }
    .compact .cw-glyph {
      width: 50px;
      height: 50px;
    }
    .cw-icon {
      width: 100%;
      height: 100%;
      display: block;
    }
    .cw-days {
      display: flex;
      gap: 10px;
      margin-top: auto;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.22);
    }
    .ink-dark .cw-days {
      border-top-color: rgba(47, 53, 64, 0.18);
    }
    .cw-day {
      flex: 1;
      text-align: center;
      font-size: 12px;
      opacity: 0.92;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-width: 0;
    }
    .cw-glyph-sm {
      width: 22px;
      height: 22px;
    }
    .cw-glyph-sm .cw-icon {
      width: 22px;
      height: 22px;
    }
    .cw-range {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    .cw-stale {
      position: absolute;
      top: 10px;
      right: 12px;
      z-index: 2;
      font-size: 11px;
      padding: 2px 9px;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.26);
      backdrop-filter: blur(4px);
    }
    .ink-dark .cw-stale {
      background: rgba(255, 255, 255, 0.55);
    }
    .cw-skel {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
      padding: 0 20px;
    }
    .cw-skel-line {
      display: block;
      height: 13px;
      border-radius: 7px;
      background: rgba(255, 255, 255, 0.35);
      animation: cw-pulse 1.4s ease-in-out infinite;
    }
    .ink-dark .cw-skel-line {
      background: rgba(47, 53, 64, 0.25);
    }
    .cw-error {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 12px;
      padding: 0 20px;
    }
    .cw-retry {
      cursor: pointer;
      border: none;
      border-radius: 8px;
      padding: 6px 16px;
      font-size: 13px;
      background: rgba(255, 255, 255, 0.24);
      color: inherit;
      backdrop-filter: blur(4px);
    }
    .cw-retry:hover {
      background: rgba(255, 255, 255, 0.34);
    }
    .ink-dark .cw-retry {
      background: rgba(47, 53, 64, 0.14);
    }
    .cw-hint {
      padding: 14px 16px;
      font-size: 13px;
      line-height: 1.6;
      background: #f1f3f5;
      color: #495057;
      border-radius: 12px;
    }
    .cw-spin {
      animation: cw-spin 26s linear infinite;
      transform-origin: 32px 32px;
    }
    .cw-spin-slow {
      animation: cw-spin 14s linear infinite;
    }
    .cw-drop {
      stroke-dasharray: 4 6;
      animation: cw-drop 1.15s linear infinite;
    }
    .cw-float {
      animation: cw-float 5.5s ease-in-out infinite alternate;
    }
    @keyframes cw-spin {
      to {
        transform: rotate(360deg);
      }
    }
    @keyframes cw-drop {
      to {
        stroke-dashoffset: -10;
      }
    }
    @keyframes cw-float {
      from {
        transform: translateX(-1.5px);
      }
      to {
        transform: translateX(1.5px);
      }
    }
    @keyframes cw-pulse {
      0%,
      100% {
        opacity: 0.55;
      }
      50% {
        opacity: 1;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .cw-spin,
      .cw-spin-slow,
      .cw-drop,
      .cw-float,
      .cw-skel-line {
        animation: none;
      }
    }
  `

  protected firstUpdated(): void {
    const canvas = this.renderRoot.querySelector<HTMLCanvasElement>('canvas')
    if (canvas) this.engine = new ParticleEngine(canvas)
  }

  protected updated(changed: PropertyValues): void {
    if (
      ['location', 'lang', 'unit', 'key', 'jwt', 'host', 'apiBase'].some((k) =>
        changed.has(k as never),
      )
    ) {
      void this.load(false)
    }
    this.syncScene()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.aborter?.abort()
    this.aborter = null
    this.engine?.destroy()
    this.engine = null
  }

  private async load(force: boolean): Promise<void> {
    if (!this.location) return
    const reqKey = [this.location, this.lang, this.unit, this.key, this.jwt, this.host, this.apiBase].join('|')
    const ck = cacheKey(['wx', this.location, this.lang, this.unit])
    const cached = readCache<WeatherSnapshot>(ck)
    if (cached && !this.snapshot) {
      this.snapshot = cached.data
      this.error = null
      this.staleAt = cached.fresh ? null : cached.fetchedAt
    }
    if (!force && cached?.fresh && reqKey === this.fetchedKey) return
    if (reqKey !== this.fetchedKey || force || !this.snapshot) {
      this.fetchedKey = reqKey
    } else {
      return
    }
    this.aborter?.abort()
    const ac = new AbortController()
    this.aborter = ac
    this.loading = true
    try {
      const snap = await fetchWeather({
        location: this.location,
        lang: this.lang,
        unit: this.unit,
        key: this.key || undefined,
        jwt: this.jwt || undefined,
        host: this.host || undefined,
        apiBase: this.apiBase || undefined,
        signal: ac.signal,
      })
      if (ac.signal.aborted) return
      this.snapshot = snap
      this.staleAt = null
      this.error = null
      writeCache(ck, snap)
      this.dispatchEvent(
        new CustomEvent('weather:loaded', { detail: snap, bubbles: true, composed: true }),
      )
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof Error ? err.message : String(err)
      this.error = msg
      this.dispatchEvent(new CustomEvent('weather:error', { detail: msg, bubbles: true, composed: true }))
    } finally {
      if (this.aborter === ac) {
        this.loading = false
        this.aborter = null
      }
    }
  }

  private effectiveNight(): boolean {
    if (this.theme === 'light') return false
    if (this.theme === 'dark') return true
    if (!this.snapshot) {
      const h = new Date().getHours()
      return h < 6 || h >= 18
    }
    return isNight(this.snapshot.today.sunrise ?? '', this.snapshot.today.sunset ?? '')
  }

  private syncScene(): void {
    if (!this.engine) return
    if (!this.snapshot) {
      this.engine.stop()
      return
    }
    const scene = resolveScene(this.snapshot.now.icon)
    const night = this.effectiveNight()
    const kind = scene.particles === 'stars' && !night ? 'none' : scene.particles
    this.engine.start(kind)
  }

  protected render(): TemplateResult {
    if (!this.location) {
      return html`<div class="cw-hint">
        corner-weather：缺少 location 属性（和风 Location ID，或 "经度,纬度"）
      </div>`
    }
    const night = this.effectiveNight()
    const sceneId = this.snapshot ? resolveScene(this.snapshot.now.icon).id : 'unknown'
    const palette: Palette = PALETTES[sceneId]
    const stops = night ? palette.night : palette.day
    const bg = { background: `linear-gradient(160deg, ${stops[0]}, ${stops[1]})` }
    const model: CardModel = {
      snapshot: this.snapshot,
      size: this.size,
      lang: this.lang,
      night,
      staleMinutes:
        this.staleAt != null ? Math.max(1, Math.round((Date.now() - this.staleAt) / 60000)) : null,
      loading: this.loading,
      error: this.error,
      onRetry: () => void this.load(true),
    }
    return html`
      <div
        class="cw-card ${this.size}${night ? ' night' : ''} ink-${palette.ink}"
        part="card"
        style=${styleMap(bg)}
      >
        <canvas></canvas>
        <div class="content">${renderCard(model)}</div>
      </div>
    `
  }
}

