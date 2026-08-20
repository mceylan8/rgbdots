import { useEffect, useRef } from 'react'
import { useRgbDot, RgbDotOptions } from '../hooks/useRgbDot'

interface Props {
  src: string | null
  imageData: ImageData | null
  options: RgbDotOptions
  onSaveReady?: (save: () => void) => void
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void
}

export function RgbCanvas({ src, imageData, options, onSaveReady, onCanvasReady }: Props) {
  const { canvasRef, loadImage, loadImageData, saveAsPng } = useRgbDot(options)
  const saveReadyRef = useRef(onSaveReady)
  saveReadyRef.current = onSaveReady
  const canvasReadyRef = useRef(onCanvasReady)
  canvasReadyRef.current = onCanvasReady

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

  useEffect(() => {
    canvasReadyRef.current?.(canvasRef.current)
    return () => canvasReadyRef.current?.(null)
  }, [canvasRef, imageData])

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block h-auto w-full max-h-[42vh] max-w-full rounded-lg border-0 bg-black md:max-h-[min(68dvh,800px)] md:max-w-lg md:rounded-xl md:border md:border-white/10"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
