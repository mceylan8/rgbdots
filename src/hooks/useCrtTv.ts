import { useRef, useEffect, useCallback } from 'react'
import { CrtFilterWebGL, type CrtGlConfig } from '../lib/crtFilterWebGL'

export interface CrtOptions {
  curve: number
  scanline: number
  bleed: number
  brightness: number
  contrast: number
  noise: number
  flicker: boolean
  roll: boolean
  glow: number
  dotMask: boolean
  warmth: number
}

export const DEFAULT_CRT: CrtOptions = {
  curve: 0.55,
  scanline: 0.8,
  bleed: 0.45,
  brightness: 1.05,
  contrast: 1.15,
  noise: 0.35,
  flicker: true,
  roll: true,
  glow: 0.55,
  dotMask: true,
  warmth: 0.12,
}

const MAX_W = 960
const MAX_H = 720

export function optionsToGlConfig(o: CrtOptions): Partial<CrtGlConfig> {
  return {
    barrel: 0.04 + o.curve * 0.28,
    chroma: 0.0006 + o.bleed * 0.007,
    noise: o.noise * 0.14,
    tear: o.roll ? 0.0014 : 0.00025,
    glow: o.glow * 0.4,
    jitter: o.flicker ? 0.0022 : 0.0005,
    scanlines: o.scanline > 0.04,
    scanStrength: o.scanline,
    phosphor: o.dotMask,
    brightness: o.brightness * (1 + o.warmth * 0.04),
    contrast: o.contrast,
    fade: o.warmth * 0.35,
    flicker: o.flicker ? 0.04 : 0,
    syncLoss: o.roll ? 0.09 : 0.02,
  }
}

/** Source canvas + own WebGL CRT pass; off-screen <img> keeps GIF frames advancing. */
export function useCrtTv(src: string | null, options: CrtOptions) {
  const imgRef = useRef<HTMLImageElement>(null)
  const sourceRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<HTMLCanvasElement>(null)
  const filterRef = useRef<CrtFilterWebGL | null>(null)
  const optRef = useRef(options)
  optRef.current = options
  const animRef = useRef(0)

  useEffect(() => {
    const source = sourceRef.current
    const glCanvas = glRef.current
    if (!source || !glCanvas) return

    let filter: CrtFilterWebGL | null = null
    try {
      filter = new CrtFilterWebGL(source, glCanvas, optionsToGlConfig(options))
      filterRef.current = filter
    } catch (e) {
      console.error(e)
      return
    }

    return () => {
      filter?.destroy()
      filterRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    filterRef.current?.setConfig(optionsToGlConfig(options))
  }, [options])

  useEffect(() => {
    let last = 0

    const loop = (t: number) => {
      animRef.current = requestAnimationFrame(loop)
      if (t - last < 32) return
      last = t

      const img = imgRef.current
      const source = sourceRef.current
      const filter = filterRef.current
      if (!img || !source || !filter || !img.complete || img.naturalWidth < 1) return

      const nw = img.naturalWidth
      const nh = img.naturalHeight
      const ratio = Math.min(MAX_W / nw, MAX_H / nh, 1)
      const w = Math.max(1, Math.round(nw * ratio))
      const h = Math.max(1, Math.round(nh * ratio))

      if (source.width !== w || source.height !== h) {
        source.width = w
        source.height = h
      }

      const ctx = source.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)

      filter.setConfig(optionsToGlConfig(optRef.current))
      filter.render()
    }

    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [src])

  const saveAsPng = useCallback(() => {
    const cv = glRef.current
    if (!cv) return
    const a = document.createElement('a')
    a.href = cv.toDataURL('image/png')
    a.download = 'rgbdot-crt.png'
    a.click()
    a.remove()
  }, [])

  return { imgRef, sourceRef, glRef, saveAsPng }
}
