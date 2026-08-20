import { useRef, useEffect, useCallback, useMemo, type CSSProperties } from 'react'

export interface CrtOptions {
  /** Tube bulge feel 0–0.45 (CSS radius / perspective) */
  curve: number
  scanline: number
  /** RGB fringe in px */
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

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v
}

/** Grade + FX drawn above the native <img> — never CSS-filter the img (kills GIF animation). */
function drawOverlays(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  o: CrtOptions,
  now: number,
  img: HTMLImageElement | null,
) {
  ctx.clearRect(0, 0, w, h)

  // RGB bleed: offset copies of the live GIF frame (img must be unfiltered & in DOM)
  if (img && img.complete && img.naturalWidth > 0 && o.bleed > 0.2) {
    const s = Math.max(1, o.bleed * (w / Math.max(img.clientWidth || w, 1)))
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    ctx.globalAlpha = 0.32
    ctx.drawImage(img, -s, 0, w, h)
    ctx.globalAlpha = 0.28
    ctx.drawImage(img, s, 0, w, h)
    ctx.restore()
  }

  // Brightness (overlay, not CSS filter)
  if (o.brightness < 0.98) {
    ctx.fillStyle = `rgba(0,0,0,${clamp(1 - o.brightness, 0, 0.55)})`
    ctx.fillRect(0, 0, w, h)
  } else if (o.brightness > 1.02) {
    ctx.fillStyle = `rgba(255,255,255,${clamp((o.brightness - 1) * 0.45, 0, 0.35)})`
    ctx.globalCompositeOperation = 'screen'
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }

  // Contrast approximation
  if (o.contrast > 1.05) {
    ctx.fillStyle = `rgba(0,0,0,${clamp((o.contrast - 1) * 0.12, 0, 0.2)})`
    ctx.globalCompositeOperation = 'soft-light'
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }

  // Warmth
  if (o.warmth > 0.01) {
    ctx.fillStyle = `rgba(255, 150, 70,${o.warmth * 0.28})`
    ctx.globalCompositeOperation = 'soft-light'
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }

  if (o.scanline > 0.01) {
    ctx.fillStyle = `rgba(0,0,0,${0.12 + o.scanline * 0.5})`
    for (let y = 0; y < h; y += 2) {
      ctx.fillRect(0, y, w, 1)
    }
    ctx.fillStyle = `rgba(0,0,0,${o.scanline * 0.1})`
    for (let x = 0; x < w; x += 3) {
      ctx.fillRect(x, 0, 1, h)
    }
  }

  if (o.roll) {
    const barY = ((now * 0.045) % (h + 60)) - 30
    const g = ctx.createLinearGradient(0, barY, 0, barY + 36)
    g.addColorStop(0, 'rgba(180,220,255,0)')
    g.addColorStop(0.5, 'rgba(200,230,255,0.1)')
    g.addColorStop(1, 'rgba(180,220,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, barY, w, 36)
  }

  if (o.noise > 0.01) {
    const dots = Math.floor(w * h * o.noise * 0.004)
    for (let i = 0; i < dots; i++) {
      const x = Math.floor(Math.random() * w)
      const y = Math.floor(Math.random() * h)
      const v = Math.random() > 0.5 ? 255 : 0
      ctx.fillStyle = `rgba(${v},${v},${v},${0.12 + o.noise * 0.35})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  if (o.flicker) {
    const flick = 0.92 + Math.sin(now * 0.08) * 0.04 + (Math.random() - 0.5) * 0.03
    ctx.fillStyle = `rgba(0,0,0,${clamp(1 - flick, 0, 0.18)})`
    ctx.fillRect(0, 0, w, h)
  }

  if (o.vignette > 0.01) {
    const g = ctx.createRadialGradient(
      w / 2,
      h / 2,
      w * 0.12,
      w / 2,
      h / 2,
      Math.hypot(w, h) * 0.55,
    )
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.6, 'rgba(0,0,0,0)')
    g.addColorStop(1, `rgba(0,0,0,${0.3 + o.vignette * 0.55})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
}

function channelShiftInPlace(img: ImageData, shift: number) {
  if (shift < 0.3) return
  const { width: w, height: h, data } = img
  const copy = new Uint8ClampedArray(data)
  const s = Math.round(shift)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const xr = clamp(x + s, 0, w - 1)
      const xb = clamp(x - s, 0, w - 1)
      data[i] = copy[(y * w + xr) * 4]
      data[i + 2] = copy[(y * w + xb) * 4 + 2]
    }
  }
}

function applyCanvasGrade(ctx: CanvasRenderingContext2D, o: CrtOptions) {
  const parts = [
    `brightness(${o.brightness})`,
    `contrast(${o.contrast})`,
  ]
  if (o.warmth > 0.01) {
    parts.push(`sepia(${o.warmth * 0.35})`, `hue-rotate(${o.warmth * -8}deg)`)
  }
  ctx.filter = parts.join(' ')
}

export function crtTubeStyle(o: CrtOptions): CSSProperties {
  const rx = 10 + o.curve * 28
  const ry = 8 + o.curve * 22
  return {
    borderRadius: `${rx}% / ${ry}%`,
  }
}

/**
 * Visible media is a plain <img> (no CSS filter) so animated GIFs play.
 * All CRT look is painted on the overlay canvas above it.
 */
export function useCrtTv(src: string | null, options: CrtOptions) {
  const imgRef = useRef<HTMLImageElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const exportRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const optRef = useRef(options)
  optRef.current = options
  const animRef = useRef(0)

  const tubeStyle = useMemo(() => crtTubeStyle(options), [options])

  useEffect(() => {
    let last = 0

    const loop = (t: number) => {
      animRef.current = requestAnimationFrame(loop)
      if (t - last < 33) return
      last = t

      const img = imgRef.current
      const overlay = overlayRef.current
      const exp = exportRef.current
      const wrap = wrapRef.current
      if (!img || !overlay || !wrap) return

      const rect = wrap.getBoundingClientRect()
      const cssW = Math.max(1, Math.round(rect.width))
      const cssH = Math.max(1, Math.round(rect.height))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(cssW * dpr))
      const h = Math.max(1, Math.round(cssH * dpr))

      if (overlay.width !== w || overlay.height !== h) {
        overlay.width = w
        overlay.height = h
        overlay.style.width = `${cssW}px`
        overlay.style.height = `${cssH}px`
      }

      const o = optRef.current
      const octx = overlay.getContext('2d')
      if (octx) drawOverlays(octx, w, h, o, t, img)

      if (!exp || !img.complete || img.naturalWidth < 1) return

      const nw = img.naturalWidth
      const nh = img.naturalHeight
      const ratio = Math.min(720 / nw, 540 / nh, 1)
      const ew = Math.max(1, Math.round(nw * ratio))
      const eh = Math.max(1, Math.round(nh * ratio))
      if (exp.width !== ew || exp.height !== eh) {
        exp.width = ew
        exp.height = eh
      }

      const ectx = exp.getContext('2d')
      if (!ectx) return

      ectx.fillStyle = '#000'
      ectx.fillRect(0, 0, ew, eh)
      applyCanvasGrade(ectx, o)
      ectx.drawImage(img, 0, 0, ew, eh)
      ectx.filter = 'none'

      if (o.bleed > 0.2) {
        const id = ectx.getImageData(0, 0, ew, eh)
        channelShiftInPlace(id, o.bleed)
        ectx.putImageData(id, 0, 0)
      }

      drawOverlays(ectx, ew, eh, o, t, null)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [src])

  const saveAsPng = useCallback(() => {
    const cv = exportRef.current
    if (!cv) return
    const a = document.createElement('a')
    a.href = cv.toDataURL('image/png')
    a.download = 'rgbdot-crt.png'
    a.click()
    a.remove()
  }, [])

  return {
    wrapRef,
    imgRef,
    overlayRef,
    exportRef,
    tubeStyle,
    saveAsPng,
  }
}
