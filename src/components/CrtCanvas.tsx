import { useEffect, useRef } from 'react'
import { useCrtTv, type CrtOptions } from '../hooks/useCrtTv'

interface Props {
  src: string
  options: CrtOptions
  onSaveReady?: (save: () => void) => void
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void
}

export function CrtCanvas({ src, options, onSaveReady, onCanvasReady }: Props) {
  const { canvasRef, saveAsPng } = useCrtTv(src, options)
  const saveReadyRef = useRef(onSaveReady)
  saveReadyRef.current = onSaveReady
  const canvasReadyRef = useRef(onCanvasReady)
  canvasReadyRef.current = onCanvasReady

  useEffect(() => {
    saveReadyRef.current?.(saveAsPng)
  }, [saveAsPng])

  useEffect(() => {
    canvasReadyRef.current?.(canvasRef.current)
    return () => canvasReadyRef.current?.(null)
  }, [canvasRef, src])

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block h-auto w-full max-h-[42vh] max-w-full rounded-lg border-0 bg-black md:max-h-[min(68dvh,800px)] md:max-w-lg md:rounded-xl md:border md:border-white/10"
      style={{ imageRendering: 'auto' }}
    />
  )
}
