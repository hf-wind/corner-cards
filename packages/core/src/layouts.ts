import { html, type TemplateResult } from 'lit'
import type { SizePreset, WeatherSnapshot } from './types'
import { resolveScene } from './scenes/registry'
import { sceneIcon } from './scenes/icons'

export interface CardModel {
  snapshot: WeatherSnapshot | null
  size: SizePreset
  lang: string
  night: boolean
  staleMinutes: number | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

const ZH_LABELS = ['今天', '明天', '后天']
const EN_LABELS = ['Today', 'Tomorrow']

function isZh(lang: string): boolean {
  return lang.toLowerCase().startsWith('zh')
}

function dayLabel(index: number, date: string, lang: string): string {
  const zh = isZh(lang)
  if (zh && index < ZH_LABELS.length) return ZH_LABELS[index]
  if (!zh && index < EN_LABELS.length) return EN_LABELS[index]
  try {
    return new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(`${date}T00:00:00`))
  } catch {
    return date
  }
}

function dayItems(m: CardModel) {
  return (m.snapshot?.forecast ?? []).slice(0, 3).map((d, i) => ({
    label: dayLabel(i, d.fxDate, m.lang),
    icon: sceneIcon(resolveScene(d.icon).id, false),
    range: `${d.tempMin}° ~ ${d.tempMax}°`,
  }))
}

function staleBadge(m: CardModel): TemplateResult {
  if (m.staleMinutes == null) return html``
  const text = isZh(m.lang) ? `缓存 · ${m.staleMinutes} 分钟前` : `cache · ${m.staleMinutes} min ago`
  return html`<span class="cw-stale">${text}</span>`
}

function skeleton(): TemplateResult {
  return html`
    <div class="cw-skel">
      <span class="cw-skel-line" style="width:56%"></span>
      <span class="cw-skel-line" style="width:34%"></span>
      <span class="cw-skel-line" style="width:44%"></span>
    </div>
  `
}

function errorState(m: CardModel): TemplateResult {
  return html`
    <div class="cw-error">
      <span class="cw-text">${m.error}</span>
      <button class="cw-retry" @click=${() => m.onRetry()}>${isZh(m.lang) ? '重试' : 'Retry'}</button>
    </div>
  `
}

function compactBody(m: CardModel, s: WeatherSnapshot): TemplateResult {
  const scene = resolveScene(s.now.icon)
  return html`
    ${staleBadge(m)}
    <div class="cw-main">
      <span class="cw-temp">${s.now.temp}°</span>
      <span class="cw-glyph">${sceneIcon(scene.id, m.night)}</span>
    </div>
    <div class="cw-text">${s.now.text}</div>
  `
}

function standardBody(m: CardModel, s: WeatherSnapshot): TemplateResult {
  const zh = isZh(m.lang)
  const scene = resolveScene(s.now.icon)
  const meta = zh
    ? `湿度 ${s.now.humidity}% · ${s.now.windDir} ${s.now.windScale} 级`
    : `${s.now.windDir} ${s.now.windScale} · RH ${s.now.humidity}%`
  return html`
    ${staleBadge(m)}
    <div class="cw-head">
      <span class="cw-glyph">${sceneIcon(scene.id, m.night)}</span>
      <div class="cw-col">
        <span class="cw-temp">${s.now.temp}°</span>
        <span class="cw-text">${s.now.text}</span>
        <span class="cw-meta">${zh ? '体感' : 'Feels'} ${s.now.feelsLike}° · ${meta}</span>
      </div>
    </div>
    <div class="cw-days">
      ${dayItems(m).map(
        (d) => html`
          <div class="cw-day">
            <span>${d.label}</span>
            <span class="cw-glyph-sm">${d.icon}</span>
            <span class="cw-range">${d.range}</span>
          </div>
        `,
      )}
    </div>
  `
}

function bannerBody(m: CardModel, s: WeatherSnapshot): TemplateResult {
  const scene = resolveScene(s.now.icon)
  const inline = dayItems(m).map((d) => `${d.label} ${d.range}`).join(' · ')
  return html`
    ${staleBadge(m)}
    <div class="cw-banner-row">
      <span class="cw-glyph cw-glyph-md">${sceneIcon(scene.id, m.night)}</span>
      <span class="cw-temp">${s.now.temp}°</span>
      <div class="cw-col">
        <span class="cw-text">${s.now.text}</span>
        <span class="cw-meta">${inline}</span>
      </div>
    </div>
  `
}

export function renderCard(m: CardModel): TemplateResult {
  if (!m.snapshot) {
    return m.error && !m.loading ? errorState(m) : skeleton()
  }
  const body =
    m.size === 'compact'
      ? compactBody(m, m.snapshot)
      : m.size === 'banner'
        ? bannerBody(m, m.snapshot)
        : standardBody(m, m.snapshot)
  return body
}
