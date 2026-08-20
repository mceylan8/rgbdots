import { GIFEncoder, quantize, applyPalette } from 'gifenc'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function pickMime(): string {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return 'video/webm'
}

/** Record the live canvas for `seconds` into a WebM download. */
export async function exportWebM(
  canvas: HTMLCanvasElement,
  seconds = 3,
  fps = 30,
  filename = 'rgbdot.webm',
): Promise<void> {
  if (typeof canvas.captureStream !== 'function') {
    throw new Error('WebM export not supported in this browser')
  }
  const stream = canvas.captureStream(fps)
  const mime = pickMime()
  const chunks: BlobPart[] = []
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 })

  const done = new Promise<Blob>((resolve, reject) => {
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    rec.onerror = () => reject(new Error('Recording failed'))
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }))
  })

  rec.start(100)
  await new Promise((r) => setTimeout(r, seconds * 1000))
  rec.stop()
  stream.getTracks().forEach((t) => t.stop())
  const blob = await done
  downloadBlob(blob, filename)
}

/** Capture frames from the canvas into an animated GIF. */
export async function exportGif(
  canvas: HTMLCanvasElement,
  seconds = 2.5,
  fps = 12,
  filename = 'rgbdot.gif',
): Promise<void> {
  const frameCount = Math.max(4, Math.round(seconds * fps))
  const delay = Math.round(1000 / fps)
  const gif = GIFEncoder()
  const w = canvas.width
  const h = canvas.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No 2d context')

  const interval = 1000 / fps
  for (let i = 0; i < frameCount; i++) {
    const t0 = performance.now()
    const { data } = ctx.getImageData(0, 0, w, h)
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, w, h, {
      palette,
      delay,
      repeat: i === 0 ? 0 : undefined,
    })
    const wait = interval - (performance.now() - t0)
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  }

  gif.finish()
  const bytes = gif.bytes()
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  downloadBlob(new Blob([copy], { type: 'image/gif' }), filename)
}
