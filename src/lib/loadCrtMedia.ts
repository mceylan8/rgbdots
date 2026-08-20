import { parseGIF, decompressFrames, type ParsedFrame } from 'gifuct-js'

export type CrtMedia =
  | {
      kind: 'gif'
      width: number
      height: number
      /** Full composited frames ready to putImageData */
      frames: ImageData[]
      delays: number[]
    }
  | {
      kind: 'still'
      width: number
      height: number
      image: HTMLImageElement
    }

function isGifBuffer(buf: ArrayBuffer) {
  const u = new Uint8Array(buf)
  return u.length >= 6 && u[0] === 0x47 && u[1] === 0x49 && u[2] === 0x46 // GIF
}

/** Build full-size RGBA frames from gifuct patches + disposal rules. */
function compositeGifFrames(
  width: number,
  height: number,
  parsed: ParsedFrame[],
): { frames: ImageData[]; delays: number[] } {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const patchCanvas = document.createElement('canvas')
  const patchCtx = patchCanvas.getContext('2d')!

  const frames: ImageData[] = []
  const delays: number[] = []

  for (const frame of parsed) {
    const { dims, delay, disposalType, patch } = frame
    const snapshot =
      disposalType === 3 ? ctx.getImageData(0, 0, width, height) : null

    patchCanvas.width = dims.width
    patchCanvas.height = dims.height
    const img = patchCtx.createImageData(dims.width, dims.height)
    img.data.set(patch)
    patchCtx.putImageData(img, 0, 0)
    ctx.drawImage(patchCanvas, dims.left, dims.top)

    frames.push(ctx.getImageData(0, 0, width, height))
    delays.push(Math.max(20, delay || 100))

    if (disposalType === 2) {
      ctx.clearRect(dims.left, dims.top, dims.width, dims.height)
    } else if (disposalType === 3 && snapshot) {
      ctx.putImageData(snapshot, 0, 0)
    }
  }

  return { frames, delays }
}

export async function loadCrtMedia(src: string): Promise<CrtMedia> {
  const res = await fetch(src)
  const buf = await res.arrayBuffer()

  if (isGifBuffer(buf)) {
    const gif = parseGIF(buf)
    const parsed = decompressFrames(gif, true)
    if (parsed.length > 1) {
      const width = gif.lsd.width
      const height = gif.lsd.height
      const { frames, delays } = compositeGifFrames(width, height, parsed)
      return { kind: 'gif', width, height, frames, delays }
    }
    // single-frame GIF → still path below
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })

  return {
    kind: 'still',
    width: image.naturalWidth,
    height: image.naturalHeight,
    image,
  }
}
