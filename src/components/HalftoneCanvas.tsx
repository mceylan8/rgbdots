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
      className="mx-auto block h-auto w-full max-h-[min(50dvh,560px)] max-w-full rounded-lg border border-white/10 bg-black sm:max-h-[min(68dvh,800px)] sm:max-w-lg sm:rounded-xl"
      style={{ imageRendering: 'auto' }}
    />
  )
}
