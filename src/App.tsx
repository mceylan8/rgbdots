import { useState, useCallback, useRef } from 'react'
import { DropZone } from './components/DropZone'
import { Controls } from './components/Controls'
import { RgbCanvas } from './components/RgbCanvas'
import { HalftoneCanvas } from './components/HalftoneCanvas'
import { RgbDotOptions } from './hooks/useRgbDot'
import { DEFAULT_HALFTONE, HalftoneOptions } from './hooks/useHalftone'

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

export default function App() {
  const [src, setSrc] = useState<string | null>(null)
  const [options, setOptions] = useState<RgbDotOptions>(DEFAULT)
  const [halftone, setHalftone] = useState<HalftoneOptions>(DEFAULT_HALFTONE)
  const [halftonePoster, setHalftonePoster] = useState(false)
  const savePngRef = useRef<(() => void) | null>(null)

  const handleImage = useCallback((s: string) => setSrc(s), [])

  return (
    <div className="min-h-screen bg-black flex flex-col font-mono">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <span className="text-white/40 text-xs tracking-[0.2em] uppercase">RGB·DOT</span>
        {src && (
          <span className="text-white/20 text-xs">
            {halftonePoster ? 'halftone poster · save png' : 'hover · click to burst · save png'}
          </span>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        {!src ? (
          <DropZone onImage={handleImage} />
        ) : (
          <>
            {halftonePoster ? (
              <HalftoneCanvas
                src={src}
                options={halftone}
                onSaveReady={(fn) => {
                  savePngRef.current = fn
                }}
              />
            ) : (
              <RgbCanvas
                src={src}
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
              onReset={() => setSrc(null)}
              onSavePng={() => savePngRef.current?.()}
            />
          </>
        )}
      </main>
    </div>
  )
}
