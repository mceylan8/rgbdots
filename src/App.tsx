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
    <div className="min-h-screen bg-black flex flex-col font-mono">
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-xs tracking-[0.2em] uppercase">RGB·DOT</span>
          <div className="flex border border-white/20">
            <button
              type="button"
              onClick={() => setMode('rgb')}
              className={[
                'px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors',
                mode === 'rgb' ? 'text-white bg-white/10' : 'text-white/30 hover:text-white/50',
              ].join(' ')}
            >
              RGB
            </button>
            <button
              type="button"
              onClick={() => setMode('flow')}
              className={[
                'px-3 py-1.5 text-[10px] uppercase tracking-wider border-l border-white/20 transition-colors',
                mode === 'flow' ? 'text-white bg-white/10' : 'text-white/30 hover:text-white/50',
              ].join(' ')}
            >
              Flow
            </button>
          </div>
        </div>
        {imageData && (
          <span className="text-white/20 text-xs">
            {mode === 'flow'
              ? 'flow field · save png'
              : halftonePoster
                ? 'halftone poster · save png'
                : 'hover · click to burst · save png'}
          </span>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        {!imageSrc ? (
          <DropZone onImage={handleImage} />
        ) : loading ? (
          <p className="text-white/40 text-sm">Loading…</p>
        ) : imageData ? (
          mode === 'flow' ? (
            <>
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
              <FlowControls
                options={flowOptions}
                onChange={setFlowOptions}
                onReset={clearImage}
                onSavePng={() => savePngRef.current?.()}
                onResetParticles={() => flowResetRef.current?.()}
              />
            </>
          ) : (
            <>
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
            </>
          )
        ) : null}
      </main>
    </div>
  )
}
