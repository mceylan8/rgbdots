import { useEffect, useRef } from 'react'
import { useFlowField, FlowOptions } from '../hooks/useFlowField'

interface Props {
  imageData: ImageData
  options: FlowOptions
  onSaveReady?: (save: () => void) => void
  onResetReady?: (reset: () => void) => void
}

export function FlowCanvas({ imageData, options, onSaveReady, onResetReady }: Props) {
  const { canvasRef, reset, saveAsPng } = useFlowField(imageData, options)
  const saveReadyRef = useRef(onSaveReady)
  saveReadyRef.current = onSaveReady
  const resetReadyRef = useRef(onResetReady)
  resetReadyRef.current = onResetReady

  useEffect(() => {
    saveReadyRef.current?.(saveAsPng)
  }, [saveAsPng])

  useEffect(() => {
    resetReadyRef.current?.(reset)
  }, [reset])

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block h-auto w-full max-h-[min(50dvh,560px)] max-w-full rounded-lg border border-white/10 bg-black sm:max-h-[min(68dvh,800px)] sm:max-w-lg sm:rounded-xl"
      style={{ imageRendering: 'auto' }}
    />
  )
}
