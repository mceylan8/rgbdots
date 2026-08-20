import { useEffect, useRef } from 'react'
import { useCrtTv, type CrtOptions } from '../hooks/useCrtTv'

interface Props {
  src: string
  options: CrtOptions
  onSaveReady?: (save: () => void) => void
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void
}

export function CrtCanvas({ src, options, onSaveReady, onCanvasReady }: Props) {
  const { imgRef, sourceRef, glRef, saveAsPng } = useCrtTv(src, options)
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
      {/* Off-screen but painted — GIFs won't animate if display:none */}
      <img
        ref={imgRef}
        src={src}
        alt=""
        aria-hidden
        className="pointer-events-none fixed left-[-9999px] top-0 max-h-none max-w-none"
        draggable={false}
      />
      <canvas ref={sourceRef} className="hidden" aria-hidden />
      <canvas
        ref={glRef}
        className="relative z-[1] mx-auto block h-auto max-h-[58vh] w-full rounded-lg bg-black md:max-h-[min(85dvh,960px)] md:rounded-2xl md:border md:border-white/10"
      />
    </div>
  )
}
