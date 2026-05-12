import { useEffect, useRef } from 'react'
import { useRgbDot, RgbDotOptions } from '../hooks/useRgbDot'

interface Props {
  src: string
  options: RgbDotOptions
  onSaveReady?: (save: () => void) => void
}

export function RgbCanvas({ src, options, onSaveReady }: Props) {
  const { canvasRef, loadImage, saveAsPng } = useRgbDot(options)
  const saveReadyRef = useRef(onSaveReady)
  saveReadyRef.current = onSaveReady

  useEffect(() => {
    loadImage(src)
  }, [src, loadImage])

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
