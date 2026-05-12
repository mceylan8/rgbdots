import { useRef, useEffect, useCallback } from 'react'

export interface RgbDotOptions {
  grid: number
  split: number
  useColor: boolean
  flicker: boolean
  spin: boolean
}

interface SampledDots {
  // Per dot: x, y, then 3×(r,g,b) = 11 values
  data: Float32Array
  count: number
  w: number
  h: number
}

const CHANNEL_PHASES = [0, 2.094, 4.189] // 0°, 120°, 240°
const PURE_RGB = [
  [255, 40, 0],
  [30, 255, 55],
  [20, 55, 255],
] as const

function sampleDots(
  imgData: ImageData,
  grid: number,
  useColor: boolean,
): SampledDots {
  const { width: w, height: h, data: d } = imgData
  const positions: number[] = []
  const colors: number[] = []

  for (let y = 2; y < h - 2; y += grid) {
    for (let x = 2; x < w - 2; x += grid) {
      const i = (y * w + x) * 4
      const pa = d[i + 3]
      const pr = d[i], pg = d[i + 1], pb = d[i + 2]
      if (pa < 30 || (pr + pg + pb) / 3 < 18) continue

      // Slight random jitter baked in at sample time
      const jx = (Math.random() - 0.5) * 2
      const jy = (Math.random() - 0.5) * 2
      positions.push(x + jx, y + jy)

      for (let c = 0; c < 3; c++) {
        let r, g, b
        if (useColor) {
          if (c === 0) {
            r = Math.min(255, pr + 70); g = Math.max(0, pg - 50); b = Math.max(0, pb - 50)
          } else if (c === 1) {
            r = Math.max(0, pr - 40); g = Math.min(255, pg + 70); b = Math.max(0, pb - 40)
          } else {
            r = Math.max(0, pr - 50); g = Math.max(0, pg - 50); b = Math.min(255, pb + 70)
          }
        } else {
          ;[r, g, b] = PURE_RGB[c]
        }
        colors.push(r, g, b)
      }
    }
  }

  const count = positions.length / 2
  const flat = new Float32Array(count * 11)
  for (let i = 0; i < count; i++) {
    flat[i * 11]     = positions[i * 2]
    flat[i * 11 + 1] = positions[i * 2 + 1]
    for (let c = 0; c < 3; c++) {
      flat[i * 11 + 2 + c * 3] = colors[i * 9 + c * 3]
      flat[i * 11 + 3 + c * 3] = colors[i * 9 + c * 3 + 1]
      flat[i * 11 + 4 + c * 3] = colors[i * 9 + c * 3 + 2]
    }
  }

  return { data: flat, count, w, h }
}

export function useRgbDot(options: RgbDotOptions) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const dotsRef     = useRef<SampledDots | null>(null)
  const angleRef    = useRef(0)
  const animRef     = useRef(0)
  const lastRef     = useRef(0)
  const optRef      = useRef(options)
  optRef.current    = options

  // --- render one frame --------------------------------------------------
  const render = useCallback(() => {
    const cv = canvasRef.current
    const dots = dotsRef.current
    if (!cv || !dots) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const { data, count, w, h } = dots
    const { split, flicker, grid } = optRef.current
    const DOTR = grid * 0.34
    const a = angleRef.current

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)

    for (let c = 0; c < 3; c++) {
      const ox = Math.cos(a + CHANNEL_PHASES[c]) * split
      const oy = Math.sin(a + CHANNEL_PHASES[c]) * split
      const ci = 2 + c * 3

      // Check if all dots in this channel share the same color (pure RGB mode)
      // For pure RGB we can batch into one path — much faster
      const r0 = data[ci], g0 = data[ci + 1], b0 = data[ci + 2]
      let sameColor = true
      if (count > 1) {
        const r1 = data[11 + ci], g1 = data[11 + ci + 1], b1 = data[11 + ci + 2]
        sameColor = r0 === r1 && g0 === g1 && b0 === b1
      }

      if (sameColor) {
        ctx.fillStyle = `rgb(${Math.round(r0)},${Math.round(g0)},${Math.round(b0)})`
        ctx.beginPath()
        for (let i = 0; i < count; i++) {
          if (flicker && Math.random() < 0.13) continue
          const x = data[i * 11] + ox
          const y = data[i * 11 + 1] + oy
          ctx.moveTo(x + DOTR, y)
          ctx.arc(x, y, DOTR, 0, Math.PI * 2)
        }
        ctx.fill()
      } else {
        // Colored mode — group by color string to batch as many as possible
        const buckets = new Map<string, [number, number][]>()
        for (let i = 0; i < count; i++) {
          if (flicker && Math.random() < 0.13) continue
          const r = Math.round(data[i * 11 + ci])
          const g = Math.round(data[i * 11 + ci + 1])
          const b = Math.round(data[i * 11 + ci + 2])
          const key = `${r},${g},${b}`
          if (!buckets.has(key)) buckets.set(key, [])
          buckets.get(key)!.push([data[i * 11] + ox, data[i * 11 + 1] + oy])
        }
        for (const [key, pts] of buckets) {
          ctx.fillStyle = `rgb(${key})`
          ctx.beginPath()
          for (const [x, y] of pts) {
            ctx.moveTo(x + DOTR, y)
            ctx.arc(x, y, DOTR, 0, Math.PI * 2)
          }
          ctx.fill()
        }
      }
    }
  }, [])

  // --- animation loop ----------------------------------------------------
  useEffect(() => {
    const loop = (t: number) => {
      animRef.current = requestAnimationFrame(loop)
      if (t - lastRef.current < 50) return // ~20 fps cap
      lastRef.current = t
      if (optRef.current.spin) angleRef.current += 0.04
      render()
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [render])

  // --- re-sample when grid or color mode changes -------------------------
  const resample = useCallback((imgData: ImageData) => {
    const { grid, useColor } = optRef.current
    dotsRef.current = sampleDots(imgData, grid, useColor)
    const cv = canvasRef.current
    if (cv) {
      cv.width  = dotsRef.current.w
      cv.height = dotsRef.current.h
    }
  }, [])

  // --- load image from data URL ------------------------------------------
  const loadImage = useCallback((src: string) => {
    const img = new Image()
    img.onload = () => {
      const MAX_W = 1200, MAX_H = 800
      const ratio = Math.min(MAX_W / img.width, MAX_H / img.height, 1)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)

      const off = document.createElement('canvas')
      off.width = w; off.height = h
      const oc = off.getContext('2d')!
      oc.drawImage(img, 0, 0, w, h)
      const imgData = oc.getImageData(0, 0, w, h)

      const cv = canvasRef.current
      if (cv) { cv.width = w; cv.height = h }
      dotsRef.current = sampleDots(imgData, optRef.current.grid, optRef.current.useColor)

      // Keep imgData around so grid/color changes can resample without re-loading
      ;(canvasRef as any)._imgData = imgData
    }
    img.src = src
  }, [])

  // Re-sample when grid or useColor changes
  useEffect(() => {
    const imgData = (canvasRef as any)._imgData as ImageData | undefined
    if (!imgData) return
    resample(imgData)
  }, [options.grid, options.useColor, resample])

  return { canvasRef, loadImage }
}
