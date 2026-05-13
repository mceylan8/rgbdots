import { useEffect, useRef } from 'react'
import { useHalftone, HalftoneOptions } from '../hooks/useHalftone'

interface Props {
  imageData: ImageData
  options: HalftoneOptions
  onSaveReady?: (save: () => void) => void
}

export function HalftoneCanvas({ imageData, options, onSaveReady }: Props) {
  const { canvasRef, saveAsPng } = useHalftone(imageData, options)
  const saveReadyRef = useRef(onSaveReady)
  saveReadyRef.current = onSaveReady

  useEffect(() => {
    saveReadyRef.current?.(saveAsPng)
  }, [saveAsPng])

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block h-auto w-full max-h-[42vh] max-w-full rounded-lg border-0 bg-black md:max-h-[min(68dvh,800px)] md:max-w-lg md:rounded-xl md:border md:border-white/10"
      style={{ imageRendering: 'auto' }}
    />
  )
}
