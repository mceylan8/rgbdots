import { useRef, useEffect, useCallback } from 'react'

export interface FlowOptions {
  count: number
  speed: number
  trailAlpha: number
  fadeSpeed: number
  flowInfluence: number
  bgColor: string
  particleColor: string
  brightnessOnly: boolean
  noiseBlend: boolean
}

export const DEFAULT_FLOW: FlowOptions = {
  count: 3000,
  speed: 0.8,
  trailAlpha: 0.05,
  fadeSpeed: 0.005,
  flowInfluence: 1,
  bgColor: '#0a0a0a',
  particleColor: '#e8e0d0',
  brightnessOnly: false,
  noiseBlend: false,
}

const MAX_AGE = 800
const DAMP = 0.95
const MIN_FRAME_MS = 16.67

function buildLuminance(img: ImageData): Float32Array {
  const { width: w, height: h, data: d } = img
  const L = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const p = i * 4
    L[i] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]
  }
  return L
}

export function computeGradients(imageData: ImageData): Float32Array {
  const { width: w, height: h, data: d } = imageData
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const p = i * 4
    gray[i] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]
  }

  const angles = new Float32Array(w * h)
  const g = (x: number, y: number) => gray[y * w + x]

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const Gx =
        -g(x - 1, y - 1) +
        g(x + 1, y - 1) +
        -2 * g(x - 1, y) +
        2 * g(x + 1, y) +
        -g(x - 1, y + 1) +
        g(x + 1, y + 1)
      const Gy =
        -g(x - 1, y - 1) -
        2 * g(x, y - 1) -
        g(x + 1, y - 1) +
        g(x - 1, y + 1) +
        2 * g(x, y + 1) +
        g(x + 1, y + 1)
      angles[y * w + x] = Math.atan2(Gy, Gx)
    }
  }
  return angles
}

function parseHexRgb(hex: string): [number, number, number] {
  const m = hex.replace(/^#/, '').match(/.{2}/g)
  if (!m || m.length < 3) return [10, 10, 10]
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)]
}

function spawnOne(
  i: number,
  w: number,
  h: number,
  px: Float32Array,
  py: Float32Array,
  vx: Float32Array,
  vy: Float32Array,
  age: Uint16Array,
  lum: Float32Array | null,
  brightnessOnly: boolean,
) {
  let x = 0,
    y = 0
  if (!brightnessOnly || !lum) {
    x = Math.random() * w
    y = Math.random() * h
  } else {
    for (let t = 0; t < 80; t++) {
      x = Math.random() * w
      y = Math.random() * h
      const xi = Math.min(w - 1, Math.max(0, Math.floor(x)))
      const yi = Math.min(h - 1, Math.max(0, Math.floor(y)))
      const L = lum[yi * w + xi] / 255
      if (L > 0.38 || Math.random() < L * 0.85) break
    }
  }
  px[i] = x
  py[i] = y
  vx[i] = 0
  vy[i] = 0
  age[i] = 0
}

function respawnAll(
  n: number,
  w: number,
  h: number,
  px: Float32Array,
  py: Float32Array,
  vx: Float32Array,
  vy: Float32Array,
  age: Uint16Array,
  lum: Float32Array | null,
  brightnessOnly: boolean,
) {
  for (let i = 0; i < n; i++) spawnOne(i, w, h, px, py, vx, vy, age, lum, brightnessOnly)
}

export function useFlowField(imageData: ImageData | null, options: FlowOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const optRef = useRef(options)
  optRef.current = options

  const anglesRef = useRef<Float32Array | null>(null)
  const lumRef = useRef<Float32Array | null>(null)
  const wRef = useRef(0)
  const hRef = useRef(0)

  const pxRef = useRef<Float32Array | null>(null)
  const pyRef = useRef<Float32Array | null>(null)
  const vxRef = useRef<Float32Array | null>(null)
  const vyRef = useRef<Float32Array | null>(null)
  const ageRef = useRef<Uint16Array | null>(null)

  const applyImageData = useCallback((img: ImageData) => {
    anglesRef.current = computeGradients(img)
    lumRef.current = buildLuminance(img)
    wRef.current = img.width
    hRef.current = img.height
    const cv = canvasRef.current
    if (cv) {
      cv.width = img.width
      cv.height = img.height
    }
    const o = optRef.current
    const n = o.count
    const px = new Float32Array(n)
    const py = new Float32Array(n)
    const vx = new Float32Array(n)
    const vy = new Float32Array(n)
    const age = new Uint16Array(n)
    respawnAll(n, img.width, img.height, px, py, vx, vy, age, lumRef.current, o.brightnessOnly)
    pxRef.current = px
    pyRef.current = py
    vxRef.current = vx
    vyRef.current = vy
    ageRef.current = age

    const ctx = cv?.getContext('2d')
    if (ctx) {
      const [br, bgc, bb] = parseHexRgb(o.bgColor)
      ctx.fillStyle = `rgb(${br},${bgc},${bb})`
      ctx.fillRect(0, 0, img.width, img.height)
    }
  }, [])

  const loadImage = useCallback(
    (img: ImageData) => {
      applyImageData(img)
    },
    [applyImageData],
  )

  /** Update gradient field without respawning particles. */
  const updateField = useCallback(
    (img: ImageData) => {
      if (img.width !== wRef.current || img.height !== hRef.current || !anglesRef.current) {
        applyImageData(img)
        return
      }
      anglesRef.current = computeGradients(img)
      lumRef.current = buildLuminance(img)
    },
    [applyImageData],
  )

  const resizeParticles = useCallback(() => {
    const angles = anglesRef.current
    const lum = lumRef.current
    const w = wRef.current
    const h = hRef.current
    if (!angles || w === 0) return
    const o = optRef.current
    const n = o.count
    const px = new Float32Array(n)
    const py = new Float32Array(n)
    const vx = new Float32Array(n)
    const vy = new Float32Array(n)
    const age = new Uint16Array(n)
    respawnAll(n, w, h, px, py, vx, vy, age, lum, o.brightnessOnly)
    pxRef.current = px
    pyRef.current = py
    vxRef.current = vx
    vyRef.current = vy
    ageRef.current = age
  }, [])

  const lastImageRef = useRef<ImageData | null>(null)

  useEffect(() => {
    if (!imageData) {
      anglesRef.current = null
      lastImageRef.current = null
      return
    }
    const newBuffer = imageData !== lastImageRef.current
    lastImageRef.current = imageData
    const sameDims =
      wRef.current === imageData.width &&
      hRef.current === imageData.height &&
      anglesRef.current !== null

    if (!sameDims) {
      applyImageData(imageData)
    } else if (newBuffer) {
      // Same size, new pixels — keep particles, refresh field
      anglesRef.current = computeGradients(imageData)
      lumRef.current = buildLuminance(imageData)
    } else {
      resizeParticles()
    }
  }, [imageData, options.count, options.brightnessOnly, applyImageData, resizeParticles])

  const reset = useCallback(() => {
    const cv = canvasRef.current
    const px = pxRef.current
    const py = pyRef.current
    const vx = vxRef.current
    const vy = vyRef.current
    const age = ageRef.current
    const w = wRef.current
    const h = hRef.current
    const lum = lumRef.current
    if (!cv || !px || !py || !vx || !vy || !age || w === 0) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const o = optRef.current
    const [br, bgc, bb] = parseHexRgb(o.bgColor)
    ctx.fillStyle = `rgb(${br},${bgc},${bb})`
    ctx.fillRect(0, 0, w, h)
    respawnAll(px.length, w, h, px, py, vx, vy, age, lum, o.brightnessOnly)
  }, [])

  useEffect(() => {
    if (!imageData || !anglesRef.current) return

    let raf = 0
    let lastT = performance.now()

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      if (t - lastT < MIN_FRAME_MS) return
      lastT = t

      const cv = canvasRef.current
      const angles = anglesRef.current
      const lum = lumRef.current
      const px = pxRef.current
      const py = pyRef.current
      const vx = vxRef.current
      const vy = vyRef.current
      const age = ageRef.current
      if (!cv || !angles || !px || !py || !vx || !vy || !age) return

      const ctx = cv.getContext('2d')
      if (!ctx) return

      const o = optRef.current
      const w = wRef.current
      const h = hRef.current
      const [br, bgc, bb] = parseHexRgb(o.bgColor)
      const fade = Math.max(0, Math.min(1, o.fadeSpeed))
      ctx.fillStyle = `rgba(${br},${bgc},${bb},${fade})`
      ctx.fillRect(0, 0, w, h)

      ctx.globalAlpha = Math.max(0.01, Math.min(1, o.trailAlpha))
      ctx.strokeStyle = o.particleColor
      ctx.lineWidth = 0.8
      ctx.lineCap = 'round'
      ctx.beginPath()

      for (let i = 0; i < px.length; i++) {
        const xi = Math.floor(px[i])
        const yi = Math.floor(py[i])
        if (xi < 1 || xi >= w - 1 || yi < 1 || yi >= h - 1 || age[i] > MAX_AGE) {
          spawnOne(i, w, h, px, py, vx, vy, age, lum, o.brightnessOnly)
          continue
        }

        let angle = angles[yi * w + xi]
        if (o.noiseBlend) {
          angle += Math.sin(px[i] * 0.01) * Math.cos(py[i] * 0.01) * 0.35
        }

        vx[i] += Math.cos(angle) * o.speed * o.flowInfluence
        vy[i] += Math.sin(angle) * o.speed * o.flowInfluence
        vx[i] *= DAMP
        vy[i] *= DAMP

        const ox = px[i]
        const oy = py[i]
        const nx = ox + vx[i]
        const ny = oy + vy[i]

        if (o.brightnessOnly && lum) {
          const L = lum[yi * w + xi] / 255
          if (L > 0.2) {
            ctx.moveTo(ox, oy)
            ctx.lineTo(nx, ny)
          }
        } else {
          ctx.moveTo(ox, oy)
          ctx.lineTo(nx, ny)
        }

        px[i] = nx
        py[i] = ny
        age[i]++
      }

      ctx.stroke()
      ctx.globalAlpha = 1
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [imageData, options.count])

  const saveAsPng = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const a = document.createElement('a')
    a.href = cv.toDataURL('image/png')
    a.download = 'rgbdot-flow.png'
    a.click()
    a.remove()
  }, [])

  return { canvasRef, loadImage, updateField, reset, saveAsPng }
}
