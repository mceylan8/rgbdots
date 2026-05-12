import { useRef, useEffect, useCallback } from 'react'

export interface HalftoneOptions {
  gridSize: number
  contrast: number
  angleDeg: number
  dotScale: number
  paperColor: string
  inkColor: string
  title: string
  subtitle: string
  dateLine: string
  titleSize: number
  subtitleSize: number
  dateSize: number
  textColor: string
  noiseOpacity: number
}

export const DEFAULT_HALFTONE: HalftoneOptions = {
  gridSize: 10,
  contrast: 1.25,
  angleDeg: 12,
  dotScale: 1,
  paperColor: '#e8dcc8',
  inkColor: '#1a0a06',
  textColor: '#1a0a06',
  title: '',
  subtitle: '',
  dateLine: '',
  titleSize: 52,
  subtitleSize: 18,
  dateSize: 14,
  noiseOpacity: 0.035,
}

function clamp255(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

function buildLumaMap(img: ImageData, contrast: number): Uint8ClampedArray {
  const { width: w, height: h, data: d } = img
  const lum = new Uint8ClampedArray(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4
      let v = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]
      v = (v - 128) * contrast + 128
      lum[y * w + x] = clamp255(v)
    }
  }
  return lum
}

function sampleLum(lum: Uint8ClampedArray, w: number, h: number, x: number, y: number) {
  const xi = Math.floor(Math.max(0, Math.min(w - 1, x)))
  const yi = Math.floor(Math.max(0, Math.min(h - 1, y)))
  return lum[yi * w + xi] / 255
}

let noiseTile: HTMLCanvasElement | null = null
function getNoiseTile() {
  if (noiseTile) return noiseTile
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const nctx = c.getContext('2d')!
  const img = nctx.createImageData(64, 64)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 55
  }
  nctx.putImageData(img, 0, 0)
  noiseTile = c
  return c
}

export function useHalftone(imageData: ImageData | null, options: HalftoneOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await document.fonts.ready
      if (cancelled) return

      const cv = canvasRef.current
      if (!cv) return

      if (!imageData) {
        const ctx0 = cv.getContext('2d')
        if (ctx0) {
          ctx0.fillStyle = '#000'
          ctx0.fillRect(0, 0, cv.width || 1, cv.height || 1)
        }
        return
      }

      const o = options
      const { width: iw, height: ih } = imageData
      cv.width = iw
      cv.height = ih

      const lum = buildLumaMap(imageData, o.contrast)
      const ctx = cv.getContext('2d')
      if (!ctx) return

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = o.paperColor
      ctx.fillRect(0, 0, iw, ih)

      const cx = iw / 2
      const cy = ih / 2
      const rad = (o.angleDeg * Math.PI) / 180
      const step = Math.max(3, o.gridSize)
      const maxR = (step / 2) * 0.95 * o.dotScale
      const diag = Math.ceil(Math.hypot(iw, ih) + step * 3)

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rad)
      ctx.fillStyle = o.inkColor

      ctx.beginPath()
      for (let ly = -diag; ly <= diag; ly += step) {
        for (let lx = -diag; lx <= diag; lx += step) {
          const wx = cx + lx * Math.cos(rad) - ly * Math.sin(rad)
          const wy = cy + lx * Math.sin(rad) + ly * Math.cos(rad)
          if (wx < 0 || wx >= iw || wy < 0 || wy >= ih) continue
          const L = sampleLum(lum, iw, ih, wx, wy)
          const r = maxR * (1 - L)
          if (r < 0.2) continue
          ctx.moveTo(lx + r, ly)
          ctx.arc(lx, ly, r, 0, Math.PI * 2)
        }
      }
      ctx.fill()
      ctx.restore()

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      type TLine = { text: string; font: string; lineWidth: number; half: number; stepToNext: number }
      const lines: TLine[] = []
      if (o.dateLine.trim()) {
        lines.push({
          text: o.dateLine.trim(),
          font: `400 ${o.dateSize}px Oswald, sans-serif`,
          lineWidth: Math.max(2, o.dateSize * 0.12),
          half: o.dateSize / 2,
          stepToNext: o.dateSize * 0.85 + 6,
        })
      }
      if (o.subtitle.trim()) {
        lines.push({
          text: o.subtitle.trim(),
          font: `600 ${o.subtitleSize}px Oswald, sans-serif`,
          lineWidth: Math.max(2, o.subtitleSize * 0.1),
          half: o.subtitleSize / 2,
          stepToNext: o.subtitleSize * 0.95 + 8,
        })
      }
      if (o.title.trim()) {
        lines.push({
          text: o.title.trim(),
          font: `${o.titleSize}px Anton, Oswald, Impact, sans-serif`,
          lineWidth: Math.max(2, o.titleSize * 0.06),
          half: o.titleSize / 2,
          stepToNext: 0,
        })
      }

      if (lines.length > 0) {
        const pad = Math.max(12, o.titleSize * 0.15)
        let ty = ih - pad - lines[0].half
        ctx.fillStyle = o.textColor
        ctx.strokeStyle = o.paperColor
        for (let i = 0; i < lines.length; i++) {
          const L = lines[i]
          ctx.font = L.font
          ctx.lineWidth = L.lineWidth
          ctx.strokeText(L.text, iw / 2, ty)
          ctx.fillText(L.text, iw / 2, ty)
          if (i < lines.length - 1) ty -= L.stepToNext
        }
      }

      if (o.noiseOpacity > 0.001) {
        const tile = getNoiseTile()
        const pat = ctx.createPattern(tile, 'repeat')
        if (pat) {
          ctx.save()
          ctx.globalAlpha = o.noiseOpacity
          ctx.fillStyle = pat
          ctx.fillRect(0, 0, iw, ih)
          ctx.restore()
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [imageData, options])

  const saveAsPng = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const a = document.createElement('a')
    a.href = cv.toDataURL('image/png')
    a.download = 'rgbdot-halftone.png'
    a.click()
    a.remove()
  }, [])

  return { canvasRef, saveAsPng }
}
