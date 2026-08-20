import { DEFAULT_FLOW, type FlowOptions } from '../hooks/useFlowField'
import { DEFAULT_HALFTONE, type HalftoneOptions } from '../hooks/useHalftone'
import type { RgbDotOptions, RgbDotPreset, RgbDotShape } from '../hooks/useRgbDot'
import { DEFAULT_ASCII, type AsciiOptions } from '../hooks/useAscii'

export type AppMode = 'rgb' | 'flow' | 'ascii'

export const DEFAULT_RGB: RgbDotOptions = {
  grid: 5,
  split: 4,
  useColor: true,
  flicker: true,
  spin: true,
  crt: false,
  glitch: false,
  scanline: false,
  parallax: false,
  threshold: 10,
  contrast: 1.3,
  colorBoost: 1.45,
  shape: 'circle',
  preset: 'rgb',
}

export interface ShareableState {
  mode: AppMode
  halftonePoster: boolean
  options: RgbDotOptions
  flowOptions: FlowOptions
  halftone: HalftoneOptions
  ascii: AsciiOptions
}

export const DEFAULT_STATE: ShareableState = {
  mode: 'rgb',
  halftonePoster: false,
  options: DEFAULT_RGB,
  flowOptions: { ...DEFAULT_FLOW },
  halftone: { ...DEFAULT_HALFTONE },
  ascii: { ...DEFAULT_ASCII },
}

function b(v: string | null, fallback: boolean) {
  if (v === null) return fallback
  return v === '1' || v === 'true'
}

function n(v: string | null, fallback: number) {
  if (v === null || v === '') return fallback
  const x = Number(v)
  return Number.isFinite(x) ? x : fallback
}

function s<T extends string>(v: string | null, allowed: readonly T[], fallback: T): T {
  if (v && (allowed as readonly string[]).includes(v)) return v as T
  return fallback
}

export function encodeState(state: ShareableState): string {
  const p = new URLSearchParams()
  p.set('mode', state.mode)
  if (state.halftonePoster) p.set('poster', '1')

  if (state.mode === 'flow') {
    const f = state.flowOptions
    p.set('count', String(f.count))
    p.set('speed', String(f.speed))
    p.set('trail', String(f.trailAlpha))
    p.set('fade', String(f.fadeSpeed))
    p.set('flow', String(f.flowInfluence))
    p.set('bg', f.bgColor.replace('#', ''))
    p.set('ink', f.particleColor.replace('#', ''))
    if (f.brightnessOnly) p.set('bright', '1')
    if (f.noiseBlend) p.set('noise', '1')
  } else if (state.mode === 'ascii') {
    const a = state.ascii
    p.set('grid', String(a.grid))
    p.set('chars', a.charset)
    p.set('contrast', String(a.contrast))
    p.set('thr', String(a.threshold))
    p.set('invert', a.invert ? '1' : '0')
    p.set('color', a.useColor ? '1' : '0')
    p.set('glitch', a.glitch ? '1' : '0')
    p.set('scan', a.scanline ? '1' : '0')
  } else if (state.halftonePoster) {
    const h = state.halftone
    p.set('grid', String(h.gridSize))
    p.set('contrast', String(h.contrast))
    p.set('angle', String(h.angleDeg))
    p.set('dot', String(h.dotScale))
    p.set('min', String(h.minDot))
    p.set('paper', h.paperColor.replace('#', ''))
    p.set('ink', h.inkColor.replace('#', ''))
    p.set('text', h.textColor.replace('#', ''))
    if (h.invert) p.set('invert', '1')
    if (h.title) p.set('title', h.title)
    if (h.subtitle) p.set('sub', h.subtitle)
    if (h.dateLine) p.set('date', h.dateLine)
  } else {
    const o = state.options
    p.set('grid', String(o.grid))
    p.set('split', String(o.split))
    p.set('thr', String(o.threshold))
    p.set('contrast', String(o.contrast))
    p.set('boost', String(o.colorBoost))
    p.set('shape', o.shape)
    p.set('preset', o.preset)
    p.set('color', o.useColor ? '1' : '0')
    p.set('flicker', o.flicker ? '1' : '0')
    p.set('spin', o.spin ? '1' : '0')
    p.set('crt', o.crt ? '1' : '0')
    p.set('glitch', o.glitch ? '1' : '0')
    p.set('scan', o.scanline ? '1' : '0')
    p.set('parallax', o.parallax ? '1' : '0')
  }

  return p.toString()
}

export function decodeState(search: string): Partial<ShareableState> {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  if (![...q.keys()].length) return {}

  const mode = s(q.get('mode'), ['rgb', 'flow', 'ascii'] as const, 'rgb')
  const out: Partial<ShareableState> = { mode }

  if (q.has('poster')) out.halftonePoster = b(q.get('poster'), false)

  if (mode === 'flow') {
    out.flowOptions = {
      count: n(q.get('count'), DEFAULT_FLOW.count),
      speed: n(q.get('speed'), DEFAULT_FLOW.speed),
      trailAlpha: n(q.get('trail'), DEFAULT_FLOW.trailAlpha),
      fadeSpeed: n(q.get('fade'), DEFAULT_FLOW.fadeSpeed),
      flowInfluence: n(q.get('flow'), DEFAULT_FLOW.flowInfluence),
      bgColor: `#${(q.get('bg') || '0a0a0a').replace(/^#/, '')}`,
      particleColor: `#${(q.get('ink') || 'e8e0d0').replace(/^#/, '')}`,
      brightnessOnly: b(q.get('bright'), false),
      noiseBlend: b(q.get('noise'), false),
    }
  } else if (mode === 'ascii') {
    out.ascii = {
      grid: n(q.get('grid'), DEFAULT_ASCII.grid),
      charset: s(q.get('chars'), ['standard', 'blocks', 'minimal'] as const, DEFAULT_ASCII.charset),
      contrast: n(q.get('contrast'), DEFAULT_ASCII.contrast),
      threshold: n(q.get('thr'), DEFAULT_ASCII.threshold),
      invert: q.has('invert') ? b(q.get('invert'), false) : false,
      useColor: q.has('color') ? b(q.get('color'), true) : DEFAULT_ASCII.useColor,
      glitch: q.has('glitch') ? b(q.get('glitch'), false) : false,
      scanline: q.has('scan') ? b(q.get('scan'), false) : false,
    }
  } else if (out.halftonePoster) {
    out.halftone = {
      ...DEFAULT_HALFTONE,
      gridSize: n(q.get('grid'), DEFAULT_HALFTONE.gridSize),
      contrast: n(q.get('contrast'), DEFAULT_HALFTONE.contrast),
      angleDeg: n(q.get('angle'), DEFAULT_HALFTONE.angleDeg),
      dotScale: n(q.get('dot'), DEFAULT_HALFTONE.dotScale),
      minDot: n(q.get('min'), DEFAULT_HALFTONE.minDot),
      paperColor: `#${(q.get('paper') || 'e8dcc8').replace(/^#/, '')}`,
      inkColor: `#${(q.get('ink') || '1a0a06').replace(/^#/, '')}`,
      textColor: `#${(q.get('text') || '1a0a06').replace(/^#/, '')}`,
      invert: b(q.get('invert'), false),
      title: q.get('title') || '',
      subtitle: q.get('sub') || '',
      dateLine: q.get('date') || '',
    }
  } else {
    out.options = {
      ...DEFAULT_RGB,
      grid: n(q.get('grid'), DEFAULT_RGB.grid),
      split: n(q.get('split'), DEFAULT_RGB.split),
      threshold: n(q.get('thr'), DEFAULT_RGB.threshold),
      contrast: n(q.get('contrast'), DEFAULT_RGB.contrast),
      colorBoost: n(q.get('boost'), DEFAULT_RGB.colorBoost),
      shape: s(q.get('shape'), ['circle', 'square', 'diamond'] as const, DEFAULT_RGB.shape) as RgbDotShape,
      preset: s(q.get('preset'), ['rgb', 'cmyk', 'neon', 'mono'] as const, DEFAULT_RGB.preset) as RgbDotPreset,
      useColor: q.has('color') ? b(q.get('color'), true) : DEFAULT_RGB.useColor,
      flicker: q.has('flicker') ? b(q.get('flicker'), true) : DEFAULT_RGB.flicker,
      spin: q.has('spin') ? b(q.get('spin'), true) : DEFAULT_RGB.spin,
      crt: q.has('crt') ? b(q.get('crt'), false) : false,
      glitch: q.has('glitch') ? b(q.get('glitch'), false) : false,
      scanline: q.has('scan') ? b(q.get('scan'), false) : false,
      parallax: q.has('parallax') ? b(q.get('parallax'), false) : false,
    }
  }

  return out
}

export function writeUrl(state: ShareableState) {
  const qs = encodeState(state)
  const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', url)
}

export function copyShareUrl(state: ShareableState): Promise<void> {
  const qs = encodeState(state)
  const url = `${window.location.origin}${window.location.pathname}?${qs}`
  return navigator.clipboard.writeText(url)
}
