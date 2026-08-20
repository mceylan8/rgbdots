import { useRef, useEffect, useCallback } from 'react'

export interface CrtOptions {
  /** Barrel curvature 0–0.45 */
  curve: number
  scanline: number
  /** RGB phosphor bleed in px */
  bleed: number
  brightness: number
  contrast: number
  noise: number
  flicker: boolean
  /** Rolling interference bar */
  roll: boolean
  vignette: number
  /** Warm CRT tint 0–1 */
  warmth: number
}

export const DEFAULT_CRT: CrtOptions = {
  curve: 0.22,
  scanline: 0.45,
  bleed: 1.2,
  brightness: 1.05,
  contrast: 1.15,
  noise: 0.08,
  flicker: true,
  roll: true,
  vignette: 0.55,
  warmth: 0.12,
}

const MAX_W = 720
const MAX_H = 540

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v
}

/** Sample source with barrel distortion into dest ImageData. */
function warpTo(
  src: ImageData,
  dest: ImageData,
  curve: number,
  brightness: number,
  contrast: number,
  warmth: number,
) {
  const sw = src.width
  const sh = src.height
  const dw = dest.width
  const dh = dest.height
  const sd = src.data
  const dd = dest.data
  const cx = dw / 2
  const cy = dh / 2
  const k = curve * 0.55

  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const nx = (x - cx) / cx
      const ny = (y - cy) / cy
      const r2 = nx * nx + ny * ny
      const f = 1 + k * r2
      const sx = Math.round(((nx * f + 1) * 0.5) * (sw - 1))
      const sy = Math.round(((ny * f + 1) * 0.5) * (sh - 1))
      const di = (y * dw + x) * 4

      if (sx < 0 || sy < 0 || sx >= sw || sy >= sh || r2 > 1.15) {
        dd[di] = dd[di + 1] = dd[di + 2] = 0
        dd[di + 3] = 255
        continue
      }

      const si = (sy * sw + sx) * 4
      let r = sd[si]
      let g = sd[si + 1]
      let b = sd[si + 2]

      r = (r - 128) * contrast + 128
      g = (g - 128) * contrast + 128
      b = (b - 128) * contrast + 128
      r *= brightness
      g *= brightness
      b *= brightness
      // Warm phosphor bias
      r = r * (1 + warmth * 0.25) + warmth * 18
      g = g * (1 + warmth * 0.05)
      b = b * (1 - warmth * 0.2)

      dd[di] = clamp(r, 0, 255)
      dd[di + 1] = clamp(g, 0, 255)
      dd[di + 2] = clamp(b, 0, 255)
      dd[di + 3] = 255
    }
  }
}

function channelShift(img: ImageData, shift: number) {
  if (shift < 0.3) return
  const { width: w, height: h, data } = img
  const copy = new Uint8ClampedArray(data)
  const s = Math.round(shift)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const xr = clamp(x + s, 0, w - 1)
      const xb = clamp(x - s, 0, w - 1)
      data[i] = copy[(y * w + xr) * 4] // R from right
      data[i + 2] = copy[(y * w + xb) * 4 + 2] // B from left
    }
  }
}

function drawOverlays(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  o: CrtOptions,
  now: number,
) {
  // Scanlines
  if (o.scanline > 0.01) {
    ctx.fillStyle = `rgba(0,0,0,${0.15 + o.scanline * 0.55})`
    for (let y = 0; y < h; y += 2) {
      ctx.fillRect(0, y, w, 1)
    }
    // Fine phosphor grill
    ctx.fillStyle = `rgba(0,0,0,${o.scanline * 0.12})`
    for (let x = 0; x < w; x += 3) {
      ctx.fillRect(x, 0, 1, h)
    }
  }

  // Rolling bar
  if (o.roll) {
    const barY = ((now * 0.045) % (h + 60)) - 30
    const g = ctx.createLinearGradient(0, barY, 0, barY + 36)
    g.addColorStop(0, 'rgba(180,220,255,0)')
    g.addColorStop(0.5, 'rgba(200,230,255,0.09)')
    g.addColorStop(1, 'rgba(180,220,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, barY, w, 36)
  }

  // Noise (cheap speckles — avoid full-buffer read each frame)
  if (o.noise > 0.01) {
    const dots = Math.floor(w * h * o.noise * 0.004)
    for (let i = 0; i < dots; i++) {
      const x = Math.floor(Math.random() * w)
      const y = Math.floor(Math.random() * h)
      const v = Math.random() > 0.5 ? 255 : 0
      ctx.fillStyle = `rgba(${v},${v},${v},${0.15 + o.noise * 0.35})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  // Flicker
  if (o.flicker) {
    const flick = 0.92 + Math.sin(now * 0.08) * 0.04 + (Math.random() - 0.5) * 0.03
    ctx.fillStyle = `rgba(0,0,0,${clamp(1 - flick, 0, 0.2)})`
    ctx.fillRect(0, 0, w, h)
  }

  // Vignette + tube edge
  if (o.vignette > 0.01) {
    const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, Math.hypot(w, h) * 0.55)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.65, 'rgba(0,0,0,0)')
    g.addColorStop(1, `rgba(0,0,0,${0.35 + o.vignette * 0.55})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }

  // Soft tube mask (rounded dark corners)
  ctx.strokeStyle = 'rgba(0,0,0,0.85)'
  ctx.lineWidth = Math.max(8, Math.min(w, h) * 0.04)
  ctx.strokeRect(2, 2, w - 4, h - 4)
}

export function useCrtTv(src: string | null, options: CrtOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const optRef = useRef(options)
  optRef.current = options
  const imgRef = useRef<HTMLImageElement | null>(null)
  const srcBufRef = useRef<HTMLCanvasElement | null>(null)
  const warpBufRef = useRef<ImageData | null>(null)
  const animRef = useRef(0)
  const sizeRef = useRef({ w: 0, h: 0 })

  const ensureBuffers = useCallback((iw: number, ih: number) => {
    const ratio = Math.min(MAX_W / iw, MAX_H / ih, 1)
    const w = Math.max(1, Math.round(iw * ratio))
    const h = Math.max(1, Math.round(ih * ratio))
    if (sizeRef.current.w === w && sizeRef.current.h === h && srcBufRef.current) {
      return { w, h }
    }
    sizeRef.current = { w, h }
    const srcBuf = document.createElement('canvas')
    srcBuf.width = w
    srcBuf.height = h
    srcBufRef.current = srcBuf
    warpBufRef.current = new ImageData(w, h)
    const cv = canvasRef.current
    if (cv) {
      cv.width = w
      cv.height = h
    }
    return { w, h }
  }, [])

  useEffect(() => {
    if (!src) {
      imgRef.current = null
      return
    }
    const img = new Image()
    img.decoding = 'sync'
    img.src = src
    imgRef.current = img
  }, [src])

  useEffect(() => {
    let last = 0
    const loop = (t: number) => {
      animRef.current = requestAnimationFrame(loop)
      if (t - last < 33) return
      last = t

      const cv = canvasRef.current
      const img = imgRef.current
      if (!cv || !img || !img.complete || img.naturalWidth < 1) return
      const ctx = cv.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      const o = optRef.current
      const { w, h } = ensureBuffers(img.naturalWidth, img.naturalHeight)
      const srcBuf = srcBufRef.current
      if (!srcBuf) return
      const sc = srcBuf.getContext('2d', { willReadFrequently: true })!
      sc.clearRect(0, 0, w, h)
      sc.drawImage(img, 0, 0, w, h)
      const srcData = sc.getImageData(0, 0, w, h)

      let warp = warpBufRef.current
      if (!warp || warp.width !== w || warp.height !== h) {
        warp = new ImageData(w, h)
        warpBufRef.current = warp
      }

      warpTo(srcData, warp, o.curve, o.brightness, o.contrast, o.warmth)
      channelShift(warp, o.bleed)
      ctx.putImageData(warp, 0, 0)
      drawOverlays(ctx, w, h, o, t)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [src, ensureBuffers])

  const saveAsPng = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const a = document.createElement('a')
    a.href = cv.toDataURL('image/png')
    a.download = 'rgbdot-crt.png'
    a.click()
    a.remove()
  }, [])

  return { canvasRef, saveAsPng }
}
