import { useRef, useEffect, useCallback } from 'react'
import { Ps1FilterWebGL, type Ps1GlConfig } from '../lib/ps1FilterWebGL'
import { loadCrtMedia, type CrtMedia } from '../lib/loadCrtMedia'

export interface Ps1Options {
  resolution: number
  colorDepth: number
  dither: number
  wobble: number
  wobbleSpeed: number
  snapRate: number
  fogAmount: number
  fogColor: string
}

export const DEFAULT_PS1: Ps1Options = {
  resolution: 160,
  colorDepth: 20,
  dither: 0.6,
  wobble: 0.35,
  wobbleSpeed: 1.2,
  snapRate: 8,
  fogAmount: 0.25,
  fogColor: '#382e52',
}

const MAX_W = 960
const MAX_H = 720

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return [r || 0, g || 0, b || 0]
}

function fitSize(nw: number, nh: number) {
  const ratio = Math.min(MAX_W / nw, MAX_H / nh, 1)
  return {
    w: Math.max(1, Math.round(nw * ratio)),
    h: Math.max(1, Math.round(nh * ratio)),
  }
}

export function optionsToGlConfig(o: Ps1Options): Partial<Ps1GlConfig> {
  return {
    resX: o.resolution,
    resY: Math.max(30, Math.round(o.resolution * 0.75)),
    wobble: o.wobble,
    wobbleSpeed: o.wobbleSpeed,
    snapRate: o.snapRate,
    levels: o.colorDepth,
    dither: o.dither,
    fogAmount: o.fogAmount,
    fogColor: hexToRgb01(o.fogColor),
  }
}

/** Same GIF frame pipeline as CRT — decoded frames, not browser <img> animation. */
export function usePs1(src: string | null, options: Ps1Options) {
  const sourceRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<HTMLCanvasElement>(null)
  const filterRef = useRef<Ps1FilterWebGL | null>(null)
  const mediaRef = useRef<CrtMedia | null>(null)
  const frameIndexRef = useRef(0)
  const frameUntilRef = useRef(0)
  const optRef = useRef(options)
  optRef.current = options
  const animRef = useRef(0)
  const scratchRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const source = sourceRef.current
    const glCanvas = glRef.current
    if (!source || !glCanvas) return

    let filter: Ps1FilterWebGL | null = null
    try {
      filter = new Ps1FilterWebGL(source, glCanvas, optionsToGlConfig(options))
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
    if (!src) {
      mediaRef.current = null
      return
    }
    let cancelled = false
    mediaRef.current = null
    frameIndexRef.current = 0
    frameUntilRef.current = 0

    void loadCrtMedia(src)
      .then((media) => {
        if (cancelled) return
        mediaRef.current = media
        frameIndexRef.current = 0
        frameUntilRef.current = 0
      })
      .catch((e) => console.error(e))

    return () => {
      cancelled = true
    }
  }, [src])

  useEffect(() => {
    const loop = (t: number) => {
      animRef.current = requestAnimationFrame(loop)

      const source = sourceRef.current
      const filter = filterRef.current
      const media = mediaRef.current
      if (!source || !filter || !media) return

      const { w, h } = fitSize(media.width, media.height)
      if (source.width !== w || source.height !== h) {
        source.width = w
        source.height = h
      }

      const ctx = source.getContext('2d')
      if (!ctx) return

      if (media.kind === 'gif') {
        if (frameUntilRef.current === 0) {
          frameUntilRef.current = t + (media.delays[0] ?? 100)
        }
        if (t >= frameUntilRef.current) {
          frameIndexRef.current = (frameIndexRef.current + 1) % media.frames.length
          frameUntilRef.current = t + (media.delays[frameIndexRef.current] ?? 100)
        }
        const frame = media.frames[frameIndexRef.current]
        if (!scratchRef.current) scratchRef.current = document.createElement('canvas')
        const scratch = scratchRef.current
        if (scratch.width !== media.width || scratch.height !== media.height) {
          scratch.width = media.width
          scratch.height = media.height
        }
        const sctx = scratch.getContext('2d')!
        sctx.putImageData(frame, 0, 0)
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(scratch, 0, 0, w, h)
      } else {
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(media.image, 0, 0, w, h)
      }

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
    a.download = 'rgbdot-ps1.png'
    a.click()
    a.remove()
  }, [])

  return { sourceRef, glRef, saveAsPng }
}
