import { useState, useCallback, useRef, useEffect } from 'react'
import { DropZone } from './components/DropZone'
import { Controls } from './components/Controls'
import { RgbCanvas } from './components/RgbCanvas'
import { HalftoneCanvas } from './components/HalftoneCanvas'
import { FlowCanvas } from './components/FlowCanvas'
import { FlowControls } from './components/FlowControls'
import { RgbDotOptions } from './hooks/useRgbDot'
import { DEFAULT_HALFTONE, HalftoneOptions } from './hooks/useHalftone'
import { DEFAULT_FLOW, FlowOptions } from './hooks/useFlowField'

type Mode = 'rgb' | 'flow'

const DEFAULT: RgbDotOptions = {
  grid: 5,
  split: 4,
  useColor: true,
  flicker: true,
  spin: true,
  crt: false,
  threshold: 10,
  shape: 'circle',
  preset: 'rgb',
}

const MAX_W = 1200
const MAX_H = 800

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [mode, setMode] = useState<Mode>('rgb')
  const [options, setOptions] = useState<RgbDotOptions>(DEFAULT)
  const [halftone, setHalftone] = useState<HalftoneOptions>(DEFAULT_HALFTONE)
  const [halftonePoster, setHalftonePoster] = useState(false)
  const [flowOptions, setFlowOptions] = useState<FlowOptions>(DEFAULT_FLOW)
  const savePngRef = useRef<(() => void) | null>(null)
  const flowResetRef = useRef<(() => void) | null>(null)

  const handleImage = useCallback((dataUrl: string) => {
    setImageSrc(dataUrl)
  }, [])

  useEffect(() => {
    if (!imageSrc) {
      setImageData(null)
      return
    }
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
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
    img.src = imageSrc
    return () => {
      cancelled = true
    }
  }, [imageSrc])

  const clearImage = useCallback(() => {
    setImageSrc(null)
    setImageData(null)
  }, [])

  const loading = imageSrc !== null && imageData === null

  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col bg-black font-mono text-[13px] antialiased sm:text-xs">
      <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-white/10 bg-black/85 px-safe pt-safe pb-3 backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:py-4">
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
          <span className="shrink-0 text-[10px] tracking-[0.2em] text-white/45 sm:text-xs">
            RGB·DOT
          </span>
          <div className="flex shrink-0 border border-white/20">
            <button
              type="button"
              onClick={() => setMode('rgb')}
              className={[
                'min-h-11 min-w-[4.5rem] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider transition-colors active:bg-white/15 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5 sm:text-[10px]',
                mode === 'rgb' ? 'text-white bg-white/10' : 'text-white/35 hover:text-white/55',
              ].join(' ')}
            >
              RGB
            </button>
            <button
              type="button"
              onClick={() => setMode('flow')}
              className={[
                'min-h-11 min-w-[4.5rem] border-l border-white/20 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider transition-colors active:bg-white/15 sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5 sm:text-[10px]',
                mode === 'flow' ? 'text-white bg-white/10' : 'text-white/35 hover:text-white/55',
              ].join(' ')}
            >
              Flow
            </button>
          </div>
        </div>
        {imageData && (
          <span className="hidden text-[11px] text-white/25 sm:inline sm:text-xs">
            {mode === 'flow'
              ? 'flow field · save png'
              : halftonePoster
                ? 'halftone poster · save png'
                : 'hover · tap to burst · save png'}
          </span>
        )}
      </header>

      <main className="flex flex-1 min-h-0 flex-col gap-3 px-safe pb-safe pt-2 sm:gap-6 sm:px-6 sm:pb-6 sm:pt-4 lg:flex-row lg:items-stretch lg:justify-center lg:gap-10 lg:px-10 lg:py-6">
        {!imageSrc ? (
          <div className="flex flex-1 flex-col items-center justify-center py-6 sm:py-10">
            <DropZone onImage={handleImage} />
          </div>
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="text-sm text-white/40">Loading…</p>
          </div>
        ) : imageData ? (
          mode === 'flow' ? (
            <>
              <div className="relative flex min-h-[36dvh] w-full flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-b from-zinc-950/40 to-black px-1 py-3 sm:min-h-[320px] sm:rounded-2xl sm:px-4 sm:py-6 lg:order-2 lg:min-h-0 lg:flex-[1.1] lg:max-w-4xl">
                <FlowCanvas
                  imageData={imageData}
                  options={flowOptions}
                  onSaveReady={(fn) => {
                    savePngRef.current = fn
                  }}
                  onResetReady={(fn) => {
                    flowResetRef.current = fn
                  }}
                />
              </div>
              <div className="mt-0 w-full max-w-xl shrink-0 self-center max-h-[min(46vh,520px)] overflow-y-auto overscroll-y-contain rounded-xl border border-white/10 bg-zinc-950/95 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] sm:max-h-none sm:overflow-visible sm:bg-transparent sm:shadow-none lg:order-1 lg:max-h-[min(calc(100dvh-7rem),900px)] lg:w-[min(100%,24rem)]">
                <FlowControls
                  options={flowOptions}
                  onChange={setFlowOptions}
                  onReset={clearImage}
                  onSavePng={() => savePngRef.current?.()}
                  onResetParticles={() => flowResetRef.current?.()}
                />
              </div>
            </>
          ) : (
            <>
              <div className="relative flex min-h-[36dvh] w-full flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-b from-zinc-950/40 to-black px-1 py-3 sm:min-h-[320px] sm:rounded-2xl sm:px-4 sm:py-6 lg:order-2 lg:min-h-0 lg:flex-[1.1] lg:max-w-4xl">
                {halftonePoster ? (
                  <HalftoneCanvas
                    imageData={imageData}
                    options={halftone}
                    onSaveReady={(fn) => {
                      savePngRef.current = fn
                    }}
                  />
                ) : (
                  <RgbCanvas
                    src={imageSrc}
                    imageData={imageData}
                    options={options}
                    onSaveReady={(fn) => {
                      savePngRef.current = fn
                    }}
                  />
                )}
              </div>
              <div className="mt-0 w-full max-w-xl shrink-0 self-center max-h-[min(46vh,520px)] overflow-y-auto overscroll-y-contain rounded-xl border border-white/10 bg-zinc-950/95 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] sm:max-h-none sm:overflow-visible sm:bg-transparent sm:shadow-none lg:order-1 lg:max-h-[min(calc(100dvh-7rem),900px)] lg:w-[min(100%,24rem)]">
                <Controls
                  options={options}
                  onChange={setOptions}
                  halftonePoster={halftonePoster}
                  onHalftonePoster={setHalftonePoster}
                  halftone={halftone}
                  onHalftoneChange={setHalftone}
                  onReset={clearImage}
                  onSavePng={() => savePngRef.current?.()}
                />
              </div>
            </>
          )
        ) : null}
      </main>
    </div>
  )
}
