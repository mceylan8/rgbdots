import { useEffect, useState, useRef } from 'react'
import { useHalftone, HalftoneOptions } from '../hooks/useHalftone'

const MAX_W = 800
const MAX_H = 1100

interface Props {
  src: string
  options: HalftoneOptions
  onSaveReady?: (save: () => void) => void
}

export function HalftoneCanvas({ src, options, onSaveReady }: Props) {
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const { canvasRef, saveAsPng } = useHalftone(imageData, options)
  const saveReadyRef = useRef(onSaveReady)
  saveReadyRef.current = onSaveReady

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const ratio = Math.min(MAX_W / img.width, MAX_H / img.height, 1)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      const off = document.createElement('canvas')
      off.width = w
      off.height = h
      const oc = off.getContext('2d')!
      oc.drawImage(img, 0, 0, w, h)
      setImageData(oc.getImageData(0, 0, w, h))
    }
    img.src = src
  }, [src])

  useEffect(() => {
    saveReadyRef.current?.(saveAsPng)
  }, [saveAsPng])

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-lg bg-black border border-white/10"
      style={{ imageRendering: 'auto' }}
    />
  )
}
