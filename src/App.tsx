import { useState, useCallback } from 'react'
import { DropZone } from './components/DropZone'
import { Controls } from './components/Controls'
import { RgbCanvas } from './components/RgbCanvas'
import { RgbDotOptions } from './hooks/useRgbDot'

const DEFAULT: RgbDotOptions = {
  grid: 5,
  split: 4,
  useColor: true,
  flicker: true,
  spin: true,
}

export default function App() {
  const [src, setSrc] = useState<string | null>(null)
  const [options, setOptions] = useState<RgbDotOptions>(DEFAULT)

  const handleImage = useCallback((s: string) => setSrc(s), [])

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <span className="text-white/40 text-xs tracking-[0.2em] uppercase">RGB·DOT</span>
        {src && (
          <span className="text-white/20 text-xs">click canvas to pause spin</span>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        {!src ? (
          <DropZone onImage={handleImage} />
        ) : (
          <>
            <RgbCanvas src={src} options={options} />
            <Controls options={options} onChange={setOptions} onReset={() => setSrc(null)} />
          </>
        )}
      </main>
    </div>
  )
}
