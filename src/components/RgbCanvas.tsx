import { useEffect } from 'react'
import { useRgbDot, RgbDotOptions } from '../hooks/useRgbDot'

interface Props {
  src: string
  options: RgbDotOptions
}

export function RgbCanvas({ src, options }: Props) {
  const { canvasRef, loadImage } = useRgbDot(options)

  useEffect(() => {
    loadImage(src)
  }, [src, loadImage])

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-4xl rounded-xl bg-black"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
