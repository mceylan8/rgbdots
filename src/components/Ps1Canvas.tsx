import { useEffect, useRef } from 'react'
import { usePs1, type Ps1Options } from '../hooks/usePs1'

interface Props {
  src: string
  options: Ps1Options
  onSaveReady?: (save: () => void) => void
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void
}

export function Ps1Canvas({ src, options, onSaveReady, onCanvasReady }: Props) {
  const { sourceRef, glRef, saveAsPng } = usePs1(src, options)
  const saveReadyRef = useRef(onSaveReady)
  saveReadyRef.current = onSaveReady
  const canvasReadyRef = useRef(onCanvasReady)
  canvasReadyRef.current = onCanvasReady

  useEffect(() => {
    saveReadyRef.current?.(saveAsPng)
  }, [saveAsPng])

  useEffect(() => {
    canvasReadyRef.current?.(glRef.current)
    return () => canvasReadyRef.current?.(null)
  }, [glRef, src])

  return (
    <div className="relative mx-auto w-full max-w-full md:max-w-5xl">
      <canvas ref={sourceRef} className="hidden" aria-hidden />
      <canvas
        ref={glRef}
        className="relative z-[1] mx-auto block h-auto max-h-[58vh] w-full rounded-lg bg-black [image-rendering:pixelated] md:max-h-[min(85dvh,960px)] md:rounded-2xl md:border md:border-white/10"
      />
    </div>
  )
}
