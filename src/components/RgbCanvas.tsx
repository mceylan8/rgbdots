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
      className="w-full max-w-lg rounded-xl bg-black"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
