import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { DropZone } from './components/DropZone'
import { Controls } from './components/Controls'
import { RgbCanvas } from './components/RgbCanvas'
import { HalftoneCanvas } from './components/HalftoneCanvas'
import { FlowCanvas } from './components/FlowCanvas'
import { FlowControls } from './components/FlowControls'
import { AsciiCanvas } from './components/AsciiCanvas'
import { AsciiControls } from './components/AsciiControls'
import { CrtCanvas } from './components/CrtCanvas'
import { CrtControls } from './components/CrtControls'
import { Ps1Canvas } from './components/Ps1Canvas'
import { Ps1Controls } from './components/Ps1Controls'
import { DEFAULT_HALFTONE, type HalftoneOptions } from './hooks/useHalftone'
import { DEFAULT_FLOW, type FlowOptions } from './hooks/useFlowField'
import { DEFAULT_ASCII, type AsciiOptions } from './hooks/useAscii'
import { DEFAULT_CRT, type CrtOptions } from './hooks/useCrtTv'
import { DEFAULT_PS1, type Ps1Options } from './hooks/usePs1'
import {
  copyShareUrl,
  decodeState,
  DEFAULT_RGB,
  DEFAULT_STATE,
  type AppMode,
  type ShareableState,
  writeUrl,
} from './lib/urlState'
import type { RgbDotOptions } from './hooks/useRgbDot'

const MAX_W = 1200
const MAX_H = 800

function readInitial(): ShareableState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE }
  const partial = decodeState(window.location.search)
  return {
    ...DEFAULT_STATE,
    ...partial,
    options: { ...DEFAULT_RGB, ...(partial.options || {}) },
    flowOptions: { ...DEFAULT_FLOW, ...(partial.flowOptions || {}) },
    halftone: { ...DEFAULT_HALFTONE, ...(partial.halftone || {}) },
    ascii: { ...DEFAULT_ASCII, ...(partial.ascii || {}) },
    crt: { ...DEFAULT_CRT, ...(partial.crt || {}) },
    ps1: { ...DEFAULT_PS1, ...(partial.ps1 || {}) },
  }
}

export default function App() {
  const initial = useMemo(() => readInitial(), [])
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [mode, setMode] = useState<AppMode>(initial.mode)
  const [options, setOptions] = useState<RgbDotOptions>(initial.options)
  const [halftone, setHalftone] = useState<HalftoneOptions>(initial.halftone)
  const [halftonePoster, setHalftonePoster] = useState(initial.halftonePoster)
  const [flowOptions, setFlowOptions] = useState<FlowOptions>(initial.flowOptions)
  const [ascii, setAscii] = useState<AsciiOptions>(initial.ascii)
  const [crt, setCrt] = useState<CrtOptions>(initial.crt)
  const [ps1, setPs1] = useState<Ps1Options>(initial.ps1)
  const [linkCopied, setLinkCopied] = useState(false)

  const savePngRef = useRef<(() => void) | null>(null)
  const flowResetRef = useRef<(() => void) | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const shareState: ShareableState = useMemo(
    () => ({ mode, halftonePoster, options, flowOptions, halftone, ascii, crt, ps1 }),
    [mode, halftonePoster, options, flowOptions, halftone, ascii, crt, ps1],
  )

  useEffect(() => {
    writeUrl(shareState)
  }, [shareState])

  const applyShareState = useCallback((s: ShareableState) => {
    setMode(s.mode)
    setHalftonePoster(s.halftonePoster)
    setOptions({ ...DEFAULT_RGB, ...s.options })
    setFlowOptions({ ...DEFAULT_FLOW, ...s.flowOptions })
    setHalftone({ ...DEFAULT_HALFTONE, ...s.halftone })
    setAscii({ ...DEFAULT_ASCII, ...s.ascii })
    setCrt({ ...DEFAULT_CRT, ...s.crt })
    setPs1({ ...DEFAULT_PS1, ...s.ps1 })
  }, [])

  const handleImage = useCallback((url: string) => {
    setImageSrc((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return url
    })
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
    setImageSrc((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
    setImageData(null)
  }, [])

  const handleCopyLink = useCallback(async () => {
    try {
      await copyShareUrl(shareState)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1600)
    } catch {
      /* clipboard denied */
    }
  }, [shareState])

  // CRT / PS1 use src + decoded GIF frames; other modes need ImageData
  const ready = mode === 'crt' || mode === 'ps1' ? !!imageSrc : !!imageData
  const loading = !!imageSrc && !ready
  const getCanvas = useCallback(() => canvasRef.current, [])

  const canvasShell =
    'relative flex max-h-[42vh] w-full flex-1 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-zinc-950/40 to-black px-0.5 py-1 md:max-h-none md:min-h-[320px] md:rounded-2xl md:border md:border-white/[0.07] md:px-4 md:py-6 lg:order-2 lg:min-h-0 lg:flex-[1.1] lg:max-w-4xl'

  const crtShell =
    'relative flex max-h-[62vh] w-full flex-1 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-zinc-950/40 to-black px-0.5 py-1 md:max-h-none md:min-h-[420px] md:rounded-2xl md:border md:border-white/[0.07] md:px-4 md:py-6 lg:order-2 lg:min-h-0 lg:flex-[1.6] lg:max-w-6xl'

  const panelShell =
    'mt-0 w-full max-w-xl shrink-0 max-h-[52vh] overflow-y-auto overscroll-y-contain rounded-lg border border-white/10 bg-zinc-950/95 pb-10 shadow-[0_-8px_28px_rgba(0,0,0,0.45)] md:max-h-[min(calc(100dvh-7rem),900px)] md:overflow-y-auto md:rounded-xl md:bg-transparent md:pb-0 md:shadow-none lg:order-1 lg:w-[min(100%,24rem)]'

  const modes: { id: AppMode; label: string }[] = [
    { id: 'rgb', label: 'RGB' },
    { id: 'flow', label: 'Flow' },
    { id: 'ascii', label: 'ASCII' },
    { id: 'crt', label: 'CRT' },
    { id: 'ps1', label: 'PS1' },
  ]

  const hint =
    mode === 'flow'
      ? 'flow field'
      : mode === 'ascii'
        ? 'glyph'
        : mode === 'crt'
          ? 'old tv · gif ok'
          : mode === 'ps1'
            ? 'retro 3d · gif ok'
            : halftonePoster
              ? 'halftone poster'
              : 'hover · tap to burst'

  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col bg-black font-mono text-[13px] antialiased md:text-xs">
      <header className="sticky top-0 z-30 flex h-10 w-full shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/90 px-3 pt-[max(0.25rem,env(safe-area-inset-top,0px))] backdrop-blur-md md:h-auto md:min-h-0 md:px-6 md:py-4">
        <div className="flex min-w-0 items-center gap-2 md:gap-4">
          <span className="shrink-0 text-xs tracking-widest text-white/45 md:tracking-[0.2em]">
            RGB·DOT
          </span>
          <div className="flex max-w-[min(100%,18rem)] shrink overflow-x-auto rounded-sm border border-white/20 font-mono text-xs md:max-w-none">
            {modes.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={[
                  'shrink-0 px-2 py-1 transition-colors md:min-h-0 md:px-3 md:py-1.5 md:text-[10px] md:uppercase md:tracking-wider',
                  i > 0 ? 'border-l border-white/20' : '',
                  mode === m.id
                    ? 'bg-white font-medium text-black md:bg-white/10 md:font-medium md:text-white'
                    : 'bg-transparent text-white/40 md:bg-transparent md:text-white/35 md:hover:text-white/55',
                ].join(' ')}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="rounded border border-white/15 px-2 py-1 font-mono text-[10px] text-white/40 transition-colors hover:border-white/30 hover:text-white/70 md:text-[11px]"
          >
            {linkCopied ? 'Copied' : 'Copy link'}
          </button>
          {ready && (
            <span className="hidden text-[11px] text-white/25 md:inline md:text-xs">
              {hint} · export
            </span>
          )}
        </div>
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
        ) : mode === 'crt' && imageSrc ? (
          <>
            <div className={crtShell}>
              <CrtCanvas
                src={imageSrc}
                options={crt}
                onSaveReady={(fn) => {
                  savePngRef.current = fn
                }}
                onCanvasReady={(cv) => {
                  canvasRef.current = cv
                }}
              />
            </div>
            <div className={panelShell}>
              <CrtControls
                options={crt}
                onChange={setCrt}
                shareState={shareState}
                onLoadPreset={applyShareState}
                onReset={clearImage}
                onSavePng={() => savePngRef.current?.()}
                getCanvas={getCanvas}
              />
            </div>
          </>
        ) : mode === 'ps1' && imageSrc ? (
          <>
            <div className={crtShell}>
              <Ps1Canvas
                src={imageSrc}
                options={ps1}
                onSaveReady={(fn) => {
                  savePngRef.current = fn
                }}
                onCanvasReady={(cv) => {
                  canvasRef.current = cv
                }}
              />
            </div>
            <div className={panelShell}>
              <Ps1Controls
                options={ps1}
                onChange={setPs1}
                shareState={shareState}
                onLoadPreset={applyShareState}
                onReset={clearImage}
                onSavePng={() => savePngRef.current?.()}
                getCanvas={getCanvas}
              />
            </div>
          </>
        ) : imageData && mode === 'flow' ? (
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
                onCanvasReady={(cv) => {
                  canvasRef.current = cv
                }}
              />
            </div>
            <div className={panelShell}>
              <FlowControls
                options={flowOptions}
                onChange={setFlowOptions}
                shareState={shareState}
                onLoadPreset={applyShareState}
                onReset={clearImage}
                onSavePng={() => savePngRef.current?.()}
                onResetParticles={() => flowResetRef.current?.()}
                getCanvas={getCanvas}
              />
            </div>
          </>
        ) : imageData && mode === 'ascii' ? (
          <>
            <div className={canvasShell}>
              <AsciiCanvas
                imageData={imageData}
                options={ascii}
                onSaveReady={(fn) => {
                  savePngRef.current = fn
                }}
                onCanvasReady={(cv) => {
                  canvasRef.current = cv
                }}
              />
            </div>
            <div className={panelShell}>
              <AsciiControls
                options={ascii}
                onChange={setAscii}
                shareState={shareState}
                onLoadPreset={applyShareState}
                onReset={clearImage}
                onSavePng={() => savePngRef.current?.()}
                getCanvas={getCanvas}
              />
            </div>
          </>
        ) : imageData ? (
          <>
            <div className={canvasShell}>
              {halftonePoster ? (
                <HalftoneCanvas
                  imageData={imageData}
                  options={halftone}
                  onSaveReady={(fn) => {
                    savePngRef.current = fn
                  }}
                  onCanvasReady={(cv) => {
                    canvasRef.current = cv
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
                  onCanvasReady={(cv) => {
                    canvasRef.current = cv
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
                shareState={shareState}
                onLoadPreset={applyShareState}
                onReset={clearImage}
                onSavePng={() => savePngRef.current?.()}
                getCanvas={getCanvas}
              />
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
