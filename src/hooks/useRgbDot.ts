import { useRef, useEffect, useCallback } from 'react'

export type RgbDotShape = 'circle' | 'square' | 'diamond'
export type RgbDotPreset = 'rgb' | 'cmyk' | 'neon' | 'mono'

export interface RgbDotOptions {
  grid: number
  split: number
  useColor: boolean
  flicker: boolean
  spin: boolean
  crt: boolean
  threshold: number
  shape: RgbDotShape
  preset: RgbDotPreset
}

interface SampledDots {
  data: Float32Array
  count: number
  w: number
  h: number
}

const CHANNEL_PHASES = [0, 2.094, 4.189]

const PRESET_PALETTES: Record<
  RgbDotPreset,
  readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]]
> = {
  rgb: [
    [255, 40, 0],
    [30, 255, 55],
    [20, 55, 255],
  ],
  cmyk: [
    [0, 255, 255],
    [255, 0, 255],
    [255, 255, 0],
  ],
  neon: [
    [255, 20, 147],
    [0, 255, 255],
    [50, 255, 50],
  ],
  mono: [
    [255, 255, 255],
    [255, 255, 255],
    [255, 255, 255],
  ],
}

/** Per dot: rest(2), lum, phase, exVx, exVy, exBurstFrames, exOff(2), mouseOff(2), 3×(r,g,b) */
const STRIDE = 20
const I_RX = 0
const I_RY = 1
const I_LUM = 2
const I_PHASE = 3
const I_EXVX = 4
const I_EXVY = 5
const I_EXBURST = 6
const I_EXOX = 7
const I_EXOY = 8
const I_MOX = 9
const I_MOY = 10
const I_COL0 = 11

const MOUSE_REPULSE_RADIUS = 80
const EXPLOSION_RADIUS = 120
const EXPLOSION_BURST_FRAMES = Math.round(800 / (1000 / 30))
const FPS_INTERVAL_MS = 33
const SPRING = 0.08
const MOUSE_SPRING = 0.15
const REVEAL_MS = 1000

function sampleDots(imgData: ImageData, grid: number, useColor: boolean, threshold: number, preset: RgbDotPreset): SampledDots {
  const { width: w, height: h, data: d } = imgData
  const positions: number[] = []
  const colors: number[] = []
  const lums: number[] = []
  const phases: number[] = []

  const thr = threshold * 2.55
  const palette = PRESET_PALETTES[preset]

  for (let y = 2; y < h - 2; y += grid) {
    for (let x = 2; x < w - 2; x += grid) {
      const i = (y * w + x) * 4
      const pa = d[i + 3]
      const pr = d[i],
        pg = d[i + 1],
        pb = d[i + 2]
      const avg = (pr + pg + pb) / 3
      if (pa < 30 || avg < thr) continue

      const jx = (Math.random() - 0.5) * 2
      const jy = (Math.random() - 0.5) * 2
      positions.push(x + jx, y + jy)
      lums.push(avg / 255)
      phases.push(Math.random() * Math.PI * 2)

      for (let c = 0; c < 3; c++) {
        let r: number, g: number, b: number
        if (useColor) {
          if (c === 0) {
            r = Math.min(255, pr + 70)
            g = Math.max(0, pg - 50)
            b = Math.max(0, pb - 50)
          } else if (c === 1) {
            r = Math.max(0, pr - 40)
            g = Math.min(255, pg + 70)
            b = Math.max(0, pb - 40)
          } else {
            r = Math.max(0, pr - 50)
            g = Math.max(0, pg - 50)
            b = Math.min(255, pb + 70)
          }
        } else {
          ;[r, g, b] = palette[c]
        }
        colors.push(r, g, b)
      }
    }
  }

  const count = positions.length / 2
  const flat = new Float32Array(count * STRIDE)
  for (let i = 0; i < count; i++) {
    const base = i * STRIDE
    flat[base + I_RX] = positions[i * 2]
    flat[base + I_RY] = positions[i * 2 + 1]
    flat[base + I_LUM] = lums[i]
    flat[base + I_PHASE] = phases[i]
    flat[base + I_EXVX] = 0
    flat[base + I_EXVY] = 0
    flat[base + I_EXBURST] = 0
    flat[base + I_EXOX] = 0
    flat[base + I_EXOY] = 0
    flat[base + I_MOX] = 0
    flat[base + I_MOY] = 0
    for (let c = 0; c < 3; c++) {
      flat[base + I_COL0 + c * 3] = colors[i * 9 + c * 3]
      flat[base + I_COL0 + c * 3 + 1] = colors[i * 9 + c * 3 + 1]
      flat[base + I_COL0 + c * 3 + 2] = colors[i * 9 + c * 3 + 2]
    }
  }

  return { data: flat, count, w, h }
}

function canvasPointFromEvent(cv: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = cv.getBoundingClientRect()
  const scaleX = cv.width / rect.width
  const scaleY = cv.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

function drawDotShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  shape: RgbDotShape,
) {
  if (shape === 'circle') {
    ctx.moveTo(x + r, y)
    ctx.arc(x, y, r, 0, Math.PI * 2)
    return
  }
  if (shape === 'square') {
    ctx.rect(x - r, y - r, r * 2, r * 2)
    return
  }
  ctx.moveTo(x, y - r)
  ctx.lineTo(x + r, y)
  ctx.lineTo(x, y + r)
  ctx.lineTo(x - r, y)
  ctx.closePath()
}

function updateDotMotion(
  data: Float32Array,
  base: number,
  w: number,
  h: number,
  maxRevealDist: number,
  revealProgress: number,
  mx: number,
  my: number,
  mouseOn: boolean,
) {
  const rx = data[base + I_RX]
  const ry = data[base + I_RY]
  const distFromCenter = Math.hypot(rx - w / 2, ry - h / 2) / maxRevealDist
  const revealed = distFromCenter <= revealProgress

  if (!revealed) {
    let mox = data[base + I_MOX]
    let moy = data[base + I_MOY]
    mox += (0 - mox) * MOUSE_SPRING
    moy += (0 - moy) * MOUSE_SPRING
    data[base + I_MOX] = mox
    data[base + I_MOY] = moy

    let exox = data[base + I_EXOX]
    let exoy = data[base + I_EXOY]
    let burst = data[base + I_EXBURST]
    if (burst > 0) {
      data[base + I_EXBURST] = 0
      data[base + I_EXVX] = 0
      data[base + I_EXVY] = 0
    }
    exox += (0 - exox) * SPRING
    exoy += (0 - exoy) * SPRING
    data[base + I_EXOX] = exox
    data[base + I_EXOY] = exoy
    return
  }

  let mox = data[base + I_MOX]
  let moy = data[base + I_MOY]
  if (mouseOn) {
    const dx = rx - mx
    const dy = ry - my
    const d = Math.hypot(dx, dy)
    let tx = 0,
      ty = 0
    if (d < MOUSE_REPULSE_RADIUS && d > 0.001) {
      const fall = (1 - d / MOUSE_REPULSE_RADIUS) ** 2
      const f = fall * 14
      tx = (dx / d) * f
      ty = (dy / d) * f
    }
    mox += (tx - mox) * MOUSE_SPRING
    moy += (ty - moy) * MOUSE_SPRING
    data[base + I_MOX] = mox
    data[base + I_MOY] = moy
  } else {
    mox += (0 - mox) * MOUSE_SPRING
    moy += (0 - moy) * MOUSE_SPRING
    data[base + I_MOX] = mox
    data[base + I_MOY] = moy
  }

  let exox = data[base + I_EXOX]
  let exoy = data[base + I_EXOY]
  let burst = data[base + I_EXBURST]
  let evx = data[base + I_EXVX]
  let evy = data[base + I_EXVY]

  if (burst > 0) {
    exox += evx
    exoy += evy
    evx *= 0.98
    evy *= 0.98
    burst -= 1
    data[base + I_EXOX] = exox
    data[base + I_EXOY] = exoy
    data[base + I_EXVX] = evx
    data[base + I_EXVY] = evy
    data[base + I_EXBURST] = burst
  } else {
    exox += (0 - exox) * SPRING
    exoy += (0 - exoy) * SPRING
    data[base + I_EXOX] = exox
    data[base + I_EXOY] = exoy
    data[base + I_EXVX] = 0
    data[base + I_EXVY] = 0
    data[base + I_EXBURST] = 0
  }
}

function drawCrtOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  for (let y = 0; y < h; y += 2) {
    ctx.fillRect(0, y, w, 1)
  }

  const cx = w / 2
  const cy = h / 2
  const outer = Math.hypot(w / 2, h / 2) * 1.08
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, outer)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function dotDrawPosition(data: Float32Array, base: number, now: number, ox: number, oy: number) {
  const rx = data[base + I_RX]
  const ry = data[base + I_RY]
  const lum = data[base + I_LUM]
  const ph = data[base + I_PHASE]
  const driftX =
    Math.sin(now * 0.001 + ph) * lum * 2.2 + Math.cos(now * 0.00085 + ph * 1.7) * lum * 1.6
  const driftY =
    Math.cos(now * 0.0011 + ph * 0.9) * lum * 2.0 + Math.sin(now * 0.00075 + ph * 2.1) * lum * 1.5
  const px = rx + driftX + data[base + I_MOX] + data[base + I_EXOX] + ox
  const py = ry + driftY + data[base + I_MOY] + data[base + I_EXOY] + oy
  return { px, py, rx, ry }
}

export function useRgbDot(options: RgbDotOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<SampledDots | null>(null)
  const imgDataRef = useRef<ImageData | null>(null)
  const angleRef = useRef(0)
  const animRef = useRef(0)
  const lastRef = useRef(0)
  const optRef = useRef(options)
  optRef.current = options

  const mouseRef = useRef({ x: -1e9, y: -1e9, active: false })
  const revealStartRef = useRef(0)
  const revealProgressRef = useRef(1)

  const render = useCallback(() => {
    const cv = canvasRef.current
    const dots = dotsRef.current
    if (!cv || !dots) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const { data, count, w, h } = dots
    const { split, flicker, grid, shape, crt } = optRef.current
    const DOTR = grid * 0.34
    const a = angleRef.current
    const now = performance.now()

    if (revealStartRef.current > 0) {
      revealProgressRef.current = Math.min(1, (now - revealStartRef.current) / REVEAL_MS)
    } else {
      revealProgressRef.current = 1
    }

    const maxRevealDist = Math.hypot(w / 2, h / 2) || 1
    const mx = mouseRef.current.x
    const my = mouseRef.current.y
    const mouseOn = mouseRef.current.active
    const rp = revealProgressRef.current

    for (let i = 0; i < count; i++) {
      updateDotMotion(data, i * STRIDE, w, h, maxRevealDist, rp, mx, my, mouseOn)
    }

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)

    for (let c = 0; c < 3; c++) {
      const ox = Math.cos(a + CHANNEL_PHASES[c]) * split
      const oy = Math.sin(a + CHANNEL_PHASES[c]) * split
      const ci = I_COL0 + c * 3

      const r0 = data[ci],
        g0 = data[ci + 1],
        b0 = data[ci + 2]
      let sameColor = true
      if (count > 1) {
        const r1 = data[STRIDE + ci],
          g1 = data[STRIDE + ci + 1],
          b1 = data[STRIDE + ci + 2]
        sameColor = r0 === r1 && g0 === g1 && b0 === b1
      }

      if (sameColor) {
        ctx.fillStyle = `rgb(${Math.round(r0)},${Math.round(g0)},${Math.round(b0)})`
        ctx.beginPath()
        for (let i = 0; i < count; i++) {
          if (flicker && Math.random() < 0.13) continue
          const base = i * STRIDE
          const { px, py, rx, ry } = dotDrawPosition(data, base, now, ox, oy)
          const distFromCenter = Math.hypot(rx - w / 2, ry - h / 2) / maxRevealDist
          if (distFromCenter > rp) continue
          drawDotShape(ctx, px, py, DOTR, shape)
        }
        ctx.fill()
      } else {
        const buckets = new Map<string, [number, number][]>()
        for (let i = 0; i < count; i++) {
          if (flicker && Math.random() < 0.13) continue
          const base = i * STRIDE
          const { px, py, rx, ry } = dotDrawPosition(data, base, now, ox, oy)
          const distFromCenter = Math.hypot(rx - w / 2, ry - h / 2) / maxRevealDist
          if (distFromCenter > rp) continue
          const r = Math.round(data[base + ci])
          const g = Math.round(data[base + ci + 1])
          const b = Math.round(data[base + ci + 2])
          const key = `${r},${g},${b}`
          if (!buckets.has(key)) buckets.set(key, [])
          buckets.get(key)!.push([px, py])
        }
        for (const [key, pts] of buckets) {
          ctx.fillStyle = `rgb(${key})`
          ctx.beginPath()
          for (const [x, y] of pts) {
            drawDotShape(ctx, x, y, DOTR, shape)
          }
          ctx.fill()
        }
      }
    }

    if (crt) {
      drawCrtOverlay(ctx, w, h)
    }
  }, [])

  useEffect(() => {
    const loop = (t: number) => {
      animRef.current = requestAnimationFrame(loop)
      if (t - lastRef.current < FPS_INTERVAL_MS) return
      lastRef.current = t
      if (optRef.current.spin) angleRef.current += 0.04
      render()
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [render])

  const triggerExplosion = useCallback((canvasX: number, canvasY: number) => {
    const dots = dotsRef.current
    if (!dots) return
    const { data, count, w, h } = dots
    const maxRevealDist = Math.hypot(w / 2, h / 2) || 1
    const rp = revealProgressRef.current

    for (let i = 0; i < count; i++) {
      const base = i * STRIDE
      const rx = data[base + I_RX]
      const ry = data[base + I_RY]
      const distFromCenter = Math.hypot(rx - w / 2, ry - h / 2) / maxRevealDist
      if (distFromCenter > rp) continue

      const d = Math.hypot(rx - canvasX, ry - canvasY)
      if (d >= EXPLOSION_RADIUS || d < 0.001) continue
      const ang = Math.random() * Math.PI * 2
      const speed = 2.5 + Math.random() * 7
      data[base + I_EXVX] = Math.cos(ang) * speed
      data[base + I_EXVY] = Math.sin(ang) * speed
      data[base + I_EXBURST] = EXPLOSION_BURST_FRAMES
    }
  }, [])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return

    const onMove = (e: MouseEvent) => {
      const p = canvasPointFromEvent(cv, e.clientX, e.clientY)
      mouseRef.current = { x: p.x, y: p.y, active: true }
    }
    const onLeave = () => {
      mouseRef.current = { ...mouseRef.current, active: false }
    }
    const onClick = (e: MouseEvent) => {
      const p = canvasPointFromEvent(cv, e.clientX, e.clientY)
      triggerExplosion(p.x, p.y)
    }

    cv.addEventListener('mousemove', onMove)
    cv.addEventListener('mouseleave', onLeave)
    cv.addEventListener('click', onClick)
    return () => {
      cv.removeEventListener('mousemove', onMove)
      cv.removeEventListener('mouseleave', onLeave)
      cv.removeEventListener('click', onClick)
    }
  }, [triggerExplosion])

  const resample = useCallback((imgData: ImageData) => {
    const { grid, useColor, threshold, preset } = optRef.current
    dotsRef.current = sampleDots(imgData, grid, useColor, threshold, preset)
    const cv = canvasRef.current
    if (cv) {
      cv.width = dotsRef.current.w
      cv.height = dotsRef.current.h
    }
  }, [])

  const loadImage = useCallback((src: string) => {
    const img = new Image()
    img.onload = () => {
      const MAX_W = 1200,
        MAX_H = 800
      const ratio = Math.min(MAX_W / img.width, MAX_H / img.height, 1)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)

      const off = document.createElement('canvas')
      off.width = w
      off.height = h
      const oc = off.getContext('2d')!
      oc.drawImage(img, 0, 0, w, h)
      const imgData = oc.getImageData(0, 0, w, h)
      imgDataRef.current = imgData

      const cv = canvasRef.current
      if (cv) {
        cv.width = w
        cv.height = h
      }
      dotsRef.current = sampleDots(
        imgData,
        optRef.current.grid,
        optRef.current.useColor,
        optRef.current.threshold,
        optRef.current.preset,
      )
      revealStartRef.current = performance.now()
      revealProgressRef.current = 0
    }
    img.src = src
  }, [])

  const loadImageData = useCallback((imgData: ImageData) => {
    imgDataRef.current = imgData
    const cv = canvasRef.current
    if (cv) {
      cv.width = imgData.width
      cv.height = imgData.height
    }
    dotsRef.current = sampleDots(
      imgData,
      optRef.current.grid,
      optRef.current.useColor,
      optRef.current.threshold,
      optRef.current.preset,
    )
    revealStartRef.current = performance.now()
    revealProgressRef.current = 0
  }, [])

  useEffect(() => {
    const imgData = imgDataRef.current
    if (!imgData) return
    resample(imgData)
  }, [options.grid, options.useColor, options.threshold, options.preset, resample])

  const saveAsPng = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const url = cv.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'rgbdot.png'
    a.click()
    a.remove()
  }, [])

  return { canvasRef, loadImage, loadImageData, saveAsPng }
}
