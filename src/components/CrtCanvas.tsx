import { useEffect, useRef } from 'react'
import { useCrtTv, type CrtOptions } from '../hooks/useCrtTv'

interface Props {
  src: string
  options: CrtOptions
  onSaveReady?: (save: () => void) => void
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void
}

export function CrtCanvas({ src, options, onSaveReady, onCanvasReady }: Props) {
  const { wrapRef, imgRef, overlayRef, exportRef, tubeStyle, saveAsPng } = useCrtTv(src, options)
  const saveReadyRef = useRef(onSaveReady)
  saveReadyRef.current = onSaveReady
  const canvasReadyRef = useRef(onCanvasReady)
  canvasReadyRef.current = onCanvasReady

  useEffect(() => {
    saveReadyRef.current?.(saveAsPng)
  }, [saveAsPng])

  useEffect(() => {
    canvasReadyRef.current?.(exportRef.current)
    return () => canvasReadyRef.current?.(null)
  }, [exportRef, src])

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto w-full max-w-full overflow-hidden border-0 bg-black md:max-w-5xl md:rounded-2xl md:border md:border-white/10"
      style={tubeStyle}
    >
      {/* Plain <img>, no CSS filter — required for animated GIF playback in Chrome */}
      <img
        ref={imgRef}
        src={src}
        alt="CRT"
        className="relative z-[1] mx-auto block h-auto max-h-[58vh] w-full object-contain md:max-h-[min(85dvh,960px)]"
        draggable={false}
      />
      <canvas
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
        aria-hidden
      />
      <canvas ref={exportRef} className="hidden" aria-hidden />
    </div>
  )
}
