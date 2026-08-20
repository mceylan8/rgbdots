import { type ChangeEvent, useRef } from 'react'
import type { Ps1Options } from '../hooks/usePs1'
import type { ShareableState } from '../lib/urlState'
import { ExportMenu } from './ExportMenu'
import { PresetLibrary } from './PresetLibrary'

interface Props {
  options: Ps1Options
  onChange: (o: Ps1Options) => void
  shareState: ShareableState
  onLoadPreset: (state: ShareableState) => void
  onReset: () => void
  onSavePng: () => void
  getCanvas: () => HTMLCanvasElement | null
}

function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (v: number) => void
}) {
  const dv = step < 1 ? Number(value).toFixed(2) : value
  return (
    <div className="md:flex md:min-h-[44px] md:w-full md:items-center md:gap-3">
      <div className="mb-1 flex items-center justify-between md:mb-0 md:block md:w-24 md:flex-shrink-0">
        <span className="font-mono text-[11px] text-white/40 md:text-xs">{label}</span>
        <span className="font-mono text-[11px] text-white/50 tabular-nums md:hidden">{dv}</span>
      </div>
      <div className="py-2 md:flex-1 md:py-0">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
          className="h-0.5 w-full cursor-pointer accent-white"
        />
      </div>
      <span className="hidden w-8 flex-shrink-0 text-right font-mono text-xs tabular-nums text-white/60 md:block">
        {dv}
      </span>
    </div>
  )
}

function ColorSwatch({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-2 md:min-h-[44px] md:gap-3">
      <span className="w-12 shrink-0 font-mono text-[11px] text-white/45 md:w-14 md:text-xs">{label}</span>
      <button
        type="button"
        aria-label={label}
        className="h-8 w-8 shrink-0 border border-white/25 active:scale-95 md:h-7 md:w-7"
        style={{ backgroundColor: value }}
        onClick={() => ref.current?.click()}
      />
      <input
        ref={ref}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  )
}

export function Ps1Controls({
  options,
  onChange,
  shareState,
  onLoadPreset,
  onReset,
  onSavePng,
  getCanvas,
}: Props) {
  function set<K extends keyof Ps1Options>(key: K, val: Ps1Options[K]) {
    onChange({ ...options, [key]: val })
  }

  const sec = 'my-2 border-t border-white/10 pt-2 md:my-0 md:border-t md:pt-3'

  return (
    <div className="touch-manipulation px-3 pb-2 pt-2 md:flex md:w-full md:max-w-xl md:flex-col md:gap-4 md:rounded-xl md:border md:border-white/10 md:bg-black md:p-4">
      <div className="mb-1 flex items-center justify-between border-b border-white/10 pb-2 md:mb-0 md:pb-3">
        <span className="font-mono text-[11px] text-white/40">PS1 · RETRO 3D</span>
        <ExportMenu getCanvas={getCanvas} onSavePng={onSavePng} />
      </div>

      <p className="font-mono text-[10px] text-white/30">
        Affine warp · vertex snap · dither · GIFs animated
      </p>

      <div className="flex flex-col gap-4 md:gap-3">
        <Slider label="Res" min={40} max={320} step={4} value={options.resolution} onChange={(v) => set('resolution', v)} />
        <Slider label="Depth" min={4} max={64} step={1} value={options.colorDepth} onChange={(v) => set('colorDepth', v)} />
        <Slider label="Dither" min={0} max={1} step={0.05} value={options.dither} onChange={(v) => set('dither', v)} />
        <Slider label="Wobble" min={0} max={1} step={0.05} value={options.wobble} onChange={(v) => set('wobble', v)} />
        <Slider label="Wob. speed" min={0.2} max={3} step={0.1} value={options.wobbleSpeed} onChange={(v) => set('wobbleSpeed', v)} />
        <Slider label="Snap" min={0} max={20} step={1} value={options.snapRate} onChange={(v) => set('snapRate', v)} />
        <Slider label="Fog" min={0} max={1} step={0.05} value={options.fogAmount} onChange={(v) => set('fogAmount', v)} />
      </div>

      <div className={sec}>
        <ColorSwatch label="Fog" value={options.fogColor} onChange={(v) => set('fogColor', v)} />
      </div>

      <PresetLibrary state={shareState} onLoad={onLoadPreset} />

      <div className={`${sec} flex justify-end`}>
        <button
          type="button"
          onClick={onReset}
          className="font-mono text-xs text-white/35 transition-colors hover:text-white/60"
        >
          ← new image
        </button>
      </div>
    </div>
  )
}
