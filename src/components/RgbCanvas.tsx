import { useEffect, useRef } from 'react'
import { useRgbDot, RgbDotOptions } from '../hooks/useRgbDot'

interface Props {
  src: string | null
  imageData: ImageData | null
  options: RgbDotOptions
  onSaveReady?: (save: () => void) => void
}

export function RgbCanvas({ src, imageData, options, onSaveReady }: Props) {
  const { canvasRef, loadImage, loadImageData, saveAsPng } = useRgbDot(options)
  const saveReadyRef = useRef(onSaveReady)
  saveReadyRef.current = onSaveReady

  useEffect(() => {
    if (imageData) {
      loadImageData(imageData)
      return
    }
    if (src) loadImage(src)
  }, [src, imageData, loadImage, loadImageData])

  useEffect(() => {
    saveReadyRef.current?.(saveAsPng)
  }, [saveAsPng])

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block h-auto w-full max-h-[min(50dvh,560px)] max-w-full rounded-lg border border-white/10 bg-black sm:max-h-[min(68dvh,800px)] sm:max-w-lg sm:rounded-xl"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
