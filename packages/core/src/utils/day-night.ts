function parseHM(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

export function isNight(sunrise: string, sunset: string, now = new Date()): boolean {
  const cur = now.getHours() * 60 + now.getMinutes()
  const sr = parseHM(sunrise ?? '')
  const ss = parseHM(sunset ?? '')
  if (sr == null || ss == null || ss <= sr) {
    const h = now.getHours()
    return h < 6 || h >= 18
  }
  return cur < sr || cur >= ss
}
