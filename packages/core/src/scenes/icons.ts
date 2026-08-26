import { html, type TemplateResult } from 'lit'

const CLOUD_PATH = 'M20 44h24a8 8 0 0 0 1.6-15.8A12 12 0 0 0 22.4 24 9.5 9.5 0 0 0 20 44Z'

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

function svg(inner: TemplateResult): TemplateResult {
  return html`<svg viewBox="0 0 64 64" class="cw-icon" aria-hidden="true">${inner}</svg>`
}

function sunRays(): TemplateResult[] {
  return RAY_ANGLES.map(
    (a) => html`<line x1="32" y1="7" x2="32" y2="14" transform="rotate(${a} 32 32)"></line>`,
  )
}

function sunBody(cx = 32, cy = 32, r = 11): TemplateResult {
  return html`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffd76b"></circle>`
}

function crescent(color: string): TemplateResult {
  return svg(html`
    <g class="cw-float">
      <path d="M40 9 A17 17 0 1 0 54 33 A14 14 0 0 1 40 9 Z" fill="${color}"></path>
      <circle cx="16" cy="18" r="1.3" fill="${color}" opacity="0.85"></circle>
      <circle cx="22" cy="46" r="1" fill="${color}" opacity="0.6"></circle>
    </g>
  `)
}

function smallMoon(): TemplateResult {
  return html`<path d="M28 8 A10 10 0 1 0 39 21 A8 8 0 0 1 28 8 Z" fill="#eef2fb"></path>`
}

function cloud(fill = '#f4f7fb', float = true): TemplateResult {
  const path = html`<path d="${CLOUD_PATH}" fill="${fill}"></path>`
  return float ? html`<g class="cw-float">${path}</g>` : path
}

function drops(delays: number[]): TemplateResult[] {
  const xs = [26, 34, 42]
  return xs.map(
    (x, i) =>
      html`<line
        class="cw-drop"
        style="animation-delay:${delays[i]}s"
        x1="${x}"
        y1="49"
        x2="${x - 2}"
        y2="57"
        stroke="#bcd8ff"
        stroke-width="2.4"
        stroke-linecap="round"
      ></line>`,
  )
}

function flake(cx: number, cy: number): TemplateResult {
  return html`<g class="cw-spin-slow" style="transform-origin:${cx}px ${cy}px" stroke="#eaf6ff" stroke-width="2.2" stroke-linecap="round">
    <line x1="${cx}" y1="${cy - 6}" x2="${cx}" y2="${cy + 6}"></line>
    <line x1="${cx - 5.2}" y1="${cy - 3}" x2="${cx + 5.2}" y2="${cy + 3}"></line>
    <line x1="${cx + 5.2}" y1="${cy - 3}" x2="${cx - 5.2}" y2="${cy + 3}"></line>
  </g>`
}

export function sceneIcon(id: string, night: boolean): TemplateResult {
  switch (id) {
    case 'clear':
      return night ? crescent('#eef2fb') : svg(html`<g class="cw-spin" stroke="#ffd76b" stroke-width="3.2" stroke-linecap="round">${sunRays()}</g>${sunBody()}`)
    case 'partly':
      return night ? svgPartlyNight() : svg(html`${sunBody(23, 21, 8)}${cloud()}`)
    case 'cloudy':
      return svg(cloud())
    case 'shower':
      return svg(html`${cloud()}${drops([0, -0.4])}`)
    case 'rain':
      return svg(html`${cloud()}${drops([0, -0.4, -0.8])}`)
    case 'thunder':
      return svg(html`${cloud()}<polygon points="33,47 26,58 31,58 28,64" fill="#ffd54a"></polygon><line class="cw-drop" x1="41" y1="49" x2="39" y2="56" stroke="#bcd8ff" stroke-width="2.4" stroke-linecap="round"></line>`)
    case 'sleet':
      return svg(html`${cloud()}${drops([0])}${flake(43, 54)}`)
    case 'snow':
      return svg(html`${cloud()}${flake(32, 55)}`)
    case 'fog':
      return svg(html`
        <rect x="13" y="27" width="38" height="4.5" rx="2.25" fill="#eef2f4" opacity="0.95"></rect>
        <rect x="19" y="36" width="30" height="4.5" rx="2.25" fill="#eef2f4" opacity="0.75"></rect>
        <rect x="15" y="45" width="34" height="4.5" rx="2.25" fill="#eef2f4" opacity="0.85"></rect>
      `)
    case 'haze':
      return svg(html`
        <path d="M22 38 a10 10 0 0 1 20 0 Z" fill="#dcb37c"></path>
        <path d="M12 46 q5 -4 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#cfc4b4" stroke-width="3" stroke-linecap="round"></path>
        <path d="M18 53 q5 -4 10 0 t10 0" fill="none" stroke="#cfc4b4" stroke-width="3" stroke-linecap="round" opacity="0.7"></path>
      `)
    case 'sand':
      return svg(html`
        <path d="M12 30 q6 -5 12 0 t12 0 t12 0" fill="none" stroke="#eec06a" stroke-width="3.4" stroke-linecap="round"></path>
        <path d="M18 42 q6 -5 12 0 t12 0" fill="none" stroke="#eec06a" stroke-width="3.4" stroke-linecap="round" opacity="0.8"></path>
        <circle cx="20" cy="52" r="2" fill="#eec06a"></circle>
        <circle cx="34" cy="50" r="1.5" fill="#eec06a" opacity="0.8"></circle>
        <circle cx="46" cy="53" r="2.4" fill="#eec06a" opacity="0.9"></circle>
      `)
    default:
      return svg(html`<path d="${CLOUD_PATH}" fill="none" stroke="#dbe3ea" stroke-width="2.5"></path><text x="32" y="40" text-anchor="middle" font-size="15" fill="#dbe3ea">?</text>`)
  }
}

function svgPartlyNight(): TemplateResult {
  return svg(html`${smallMoon()}${cloud()}`)
}
