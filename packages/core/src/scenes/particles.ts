export type ParticleKind = 'none' | 'rain' | 'snow' | 'dust' | 'stars'

interface Particle {
  x: number
  y: number
  z: number
  o: number
  ph: number
}

export class ParticleEngine {
  private ctx: CanvasRenderingContext2D
  private raf = 0
  private last = 0
  private parts: Particle[] = []
  private kind: ParticleKind = 'none'
  private ro: ResizeObserver | null = null
  private w = 0
  private h = 0
  private dpr = 1

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    this.ctx = ctx
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize())
      this.ro.observe(canvas.parentElement ?? canvas)
    }
    this.resize()
  }

  start(kind: ParticleKind): void {
    if (kind === 'none' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.stop()
      return
    }
    if (this.kind !== kind) {
      this.kind = kind
      this.spawn()
    }
    if (!this.raf) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.loop)
    }
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    this.kind = 'none'
    this.parts = []
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  destroy(): void {
    this.stop()
    this.ro?.disconnect()
    this.ro = null
  }

  private spawn(): void {
    const area = Math.max(1, this.w * this.h)
    const per =
      this.kind === 'rain' ? 9000 : this.kind === 'snow' ? 12000 : this.kind === 'dust' ? 22000 : 26000
    const count = Math.round(Math.min(160, Math.max(24, area / per)))
    this.parts = Array.from({ length: count }, () => this.make(true))
  }

  private make(anywhere: boolean): Particle {
    const z = Math.random()
    return {
      x: Math.random(),
      y: anywhere ? Math.random() : -0.05 * z,
      z,
      o: 0.25 + z * 0.55,
      ph: Math.random() * Math.PI * 2,
    }
  }

  private resize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect()
    this.w = Math.max(0, Math.round(rect?.width ?? 0))
    this.h = Math.max(0, Math.round(rect?.height ?? 0))
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.max(1, Math.round(this.w * this.dpr))
    this.canvas.height = Math.max(1, Math.round(this.h * this.dpr))
    if (this.kind !== 'none') this.spawn()
  }

  private readonly loop = (now: number): void => {
    if (!this.kind) {
      this.raf = 0
      return
    }
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    const ctx = this.ctx
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, this.w, this.h)
    for (const p of this.parts) {
      switch (this.kind) {
        case 'rain':
          p.y += (0.9 + p.z * 1.1) * dt
          p.x += 0.06 * dt
          if (p.y > 1.05) Object.assign(p, this.make(false))
          if (p.x > 1.02) p.x -= 1.04
          ctx.strokeStyle = `rgba(255,255,255,${p.o * 0.55})`
          ctx.lineWidth = 0.6 + p.z
          ctx.beginPath()
          ctx.moveTo(p.x * this.w, p.y * this.h)
          ctx.lineTo(p.x * this.w + (10 + p.z * 16) * 0.25, p.y * this.h + 10 + p.z * 16)
          ctx.stroke()
          break
        case 'snow':
          p.y += (0.05 + p.z * 0.08) * dt
          p.x += Math.sin(now * 0.0008 + p.ph) * 0.03 * dt
          if (p.y > 1.05) Object.assign(p, this.make(false))
          ctx.fillStyle = `rgba(255,255,255,${p.o})`
          ctx.beginPath()
          ctx.arc(p.x * this.w, p.y * this.h, 0.8 + p.z * 1.8, 0, Math.PI * 2)
          ctx.fill()
          break
        case 'dust':
          p.x += (0.03 + p.z * 0.05) * dt
          p.y += Math.sin(now * 0.001 + p.ph) * 0.01 * dt
          if (p.x > 1.05) Object.assign(p, this.make(true), { x: -0.05 })
          ctx.fillStyle = `rgba(255,238,190,${p.o * 0.4})`
          ctx.beginPath()
          ctx.arc(p.x * this.w, p.y * this.h, 0.6 + p.z * 1.4, 0, Math.PI * 2)
          ctx.fill()
          break
        case 'stars': {
          const tw = 0.5 + 0.5 * Math.sin(now * 0.002 + p.ph)
          ctx.fillStyle = `rgba(255,255,255,${p.o * tw})`
          ctx.beginPath()
          ctx.arc(p.x * this.w, p.y * this.h * 0.72, 0.5 + p.z, 0, Math.PI * 2)
          ctx.fill()
          break
        }
      }
    }
  }
}
