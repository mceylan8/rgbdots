import { useRef, useEffect, useCallback } from 'react'

export type AsciiCharset = 'standard' | 'blocks' | 'minimal'

export interface AsciiOptions {
  grid: number
  charset: AsciiCharset
  invert: boolean
  useColor: boolean
  contrast: number
  threshold: number
  glitch: boolean
  scanline: boolean
}

export const DEFAULT_ASCII: AsciiOptions = {
  grid: 8,
  charset: 'standard',
  invert: false,
  useColor: true,
  contrast: 1.2,
  threshold: 8,
  glitch: false,
  scanline: false,
}

const CHARSETS: Record<AsciiCharset, string> = {
  standard: ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  blocks: ' ░▒▓█',
  minimal: ' .:-=+*#%@',
}

function clamp255(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

function drawScanlines(ctx: CanvasRenderingContext2D, w: number, h: number, now: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1)
  }
  const barY = ((now * 0.08) % (h + 40)) - 20
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  ctx.fillRect(0, barY, w, 18)
}

function drawGlitchBands(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bands = 2 + Math.floor(Math.random() * 4)
  for (let i = 0; i < bands; i++) {
    const y = Math.floor(Math.random() * h)
    const bh = 2 + Math.floor(Math.random() * 14)
    const shift = (Math.random() - 0.5) * 40
    try {
      const slice = ctx.getImageData(0, y, w, bh)
      ctx.putImageData(slice, shift, y)
      if (Math.random() < 0.4) {
        ctx.fillStyle = `rgba(${Math.random() < 0.5 ? 255 : 0},${Math.random() < 0.5 ? 255 : 40},255,0.08)`
        ctx.fillRect(0, y, w, bh)
      }
    } catch {
      /* ignore */
    }
  }
}

export function useAscii(imageData: ImageData | null, options: AsciiOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const optRef = useRef(options)
  optRef.current = options
  const imgRef = useRef(imageData)
  imgRef.current = imageData
  const animRef = useRef(0)

  const render = useCallback(() => {
    const cv = canvasRef.current
    const img = imgRef.current
    if (!cv || !img) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const o = optRef.current
    const { width: iw, height: ih, data: d } = img
    if (cv.width !== iw || cv.height !== ih) {
      cv.width = iw
      cv.height = ih
    }

    const step = Math.max(4, o.grid)
    const chars = CHARSETS[o.charset]
    const thr = o.threshold * 2.55
    const now = performance.now()

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, iw, ih)
    ctx.font = `${Math.max(6, step)}px ui-monospace, SFMono-Regular, Menlo, monospace`
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    for (let y = 0; y < ih - step; y += step) {
      let rowShift = 0
      if (o.glitch && Math.random() < 0.04) {
        rowShift = (Math.random() - 0.5) * step * 3
      }
      for (let x = 0; x < iw - step; x += step) {
        const i = (y * iw + x) * 4
        let r = d[i],
          g = d[i + 1],
          b = d[i + 2]
        const a = d[i + 3]
        if (a < 20) continue

        r = clamp255((r - 128) * o.contrast + 128)
        g = clamp255((g - 128) * o.contrast + 128)
        b = clamp255((b - 128) * o.contrast + 128)
        let lum = 0.299 * r + 0.587 * g + 0.114 * b
        if (lum < thr) continue
        if (o.invert) lum = 255 - lum

        const t = lum / 255
        const ci = Math.min(chars.length - 1, Math.floor(t * (chars.length - 1)))
        const ch = chars[ci]

        if (o.useColor) {
          ctx.fillStyle = `rgb(${r},${g},${b})`
        } else {
          const v = Math.round(lum)
          ctx.fillStyle = `rgb(${v},${v},${v})`
        }
        ctx.fillText(ch, x + rowShift, y)
      }
    }

    if (o.glitch && Math.random() < 0.25) {
      drawGlitchBands(ctx, iw, ih)
    }
    if (o.scanline) {
      drawScanlines(ctx, iw, ih, now)
    }
  }, [])

  useEffect(() => {
    let last = 0
    const loop = (t: number) => {
      animRef.current = requestAnimationFrame(loop)
      if (t - last < 33) return
      last = t
      render()
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [render, imageData, options.grid, options.charset])

  const saveAsPng = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const a = document.createElement('a')
    a.href = cv.toDataURL('image/png')
    a.download = 'rgbdot-ascii.png'
    a.click()
    a.remove()
  }, [])

  return { canvasRef, saveAsPng }
}
