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

  const canvasShell =
    'relative flex max-h-[42vh] w-full flex-1 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-zinc-950/40 to-black px-0.5 py-1 md:max-h-none md:min-h-[320px] md:rounded-2xl md:border md:border-white/[0.07] md:px-4 md:py-6 lg:order-2 lg:min-h-0 lg:flex-[1.1] lg:max-w-4xl'

  const panelShell =
    'mt-0 w-full max-w-xl shrink-0 max-h-[52vh] overflow-y-auto overscroll-y-contain rounded-lg border border-white/10 bg-zinc-950/95 pb-10 shadow-[0_-8px_28px_rgba(0,0,0,0.45)] md:max-h-[min(calc(100dvh-7rem),900px)] md:overflow-y-auto md:rounded-xl md:bg-transparent md:pb-0 md:shadow-none lg:order-1 lg:w-[min(100%,24rem)]'

  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col bg-black font-mono text-[13px] antialiased md:text-xs">
      <header className="sticky top-0 z-30 flex h-10 w-full shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/90 px-3 pt-[max(0.25rem,env(safe-area-inset-top,0px))] backdrop-blur-md md:h-auto md:min-h-0 md:px-6 md:py-4">
        <div className="flex items-center gap-3 md:gap-4">
          <span className="shrink-0 text-xs tracking-widest text-white/45 md:tracking-[0.2em]">
            RGB·DOT
          </span>
          <div className="flex shrink-0 rounded-sm border border-white/20 font-mono text-xs">
            <button
              type="button"
              onClick={() => setMode('rgb')}
              className={[
                'px-3 py-1 transition-colors md:min-h-0 md:px-3 md:py-1.5 md:text-[10px] md:uppercase md:tracking-wider',
                mode === 'rgb'
                  ? 'bg-white font-medium text-black md:bg-white/10 md:font-medium md:text-white'
                  : 'bg-transparent text-white/40 md:bg-transparent md:text-white/35 md:hover:text-white/55',
              ].join(' ')}
            >
              RGB
            </button>
            <button
              type="button"
              onClick={() => setMode('flow')}
              className={[
                'border-l border-white/20 px-3 py-1 transition-colors md:min-h-0 md:px-3 md:py-1.5 md:text-[10px] md:uppercase md:tracking-wider',
                mode === 'flow'
                  ? 'bg-white font-medium text-black md:bg-white/10 md:font-medium md:text-white'
                  : 'bg-transparent text-white/40 md:bg-transparent md:text-white/35 md:hover:text-white/55',
              ].join(' ')}
            >
              Flow
            </button>
          </div>
        </div>
        {imageData && (
          <span className="hidden text-[11px] text-white/25 md:ml-auto md:inline md:text-xs">
            {mode === 'flow'
              ? 'flow field · save png'
              : halftonePoster
                ? 'halftone poster · save png'
                : 'hover · tap to burst · save png'}
          </span>
        )}
      </header>

      <main className="flex flex-1 min-h-0 flex-col gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-1 md:gap-6 md:px-6 md:pb-6 md:pt-4 lg:flex-row lg:items-stretch lg:justify-center lg:gap-10 lg:px-10 lg:py-6">
        {!imageSrc ? (
          <div className="flex flex-1 flex-col items-center justify-center py-4 md:py-10">
            <DropZone onImage={handleImage} />
          </div>
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center py-10 md:py-16">
            <p className="text-sm text-white/40">Loading…</p>
          </div>
        ) : imageData ? (
          mode === 'flow' ? (
            <>
              <div className={canvasShell}>
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
              <div className={panelShell}>
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
              <div className={canvasShell}>
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
              <div className={panelShell}>
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
