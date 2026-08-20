import { type ChangeEvent } from 'react'
import type { AsciiOptions, AsciiCharset } from '../hooks/useAscii'
import type { ShareableState } from '../lib/urlState'
import { ExportMenu } from './ExportMenu'
import { PresetLibrary } from './PresetLibrary'

interface Props {
  options: AsciiOptions
  onChange: (o: AsciiOptions) => void
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

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 md:min-h-[44px]">
      <div
        onClick={() => onChange(!value)}
        className={[
          'relative h-3.5 w-7 shrink-0 rounded-full transition-colors md:h-4 md:w-8',
          value ? 'bg-white md:bg-white/70' : 'bg-white/20',
        ].join(' ')}
      >
        <div
          className={[
            'absolute top-0.5 h-2.5 w-2.5 rounded-full bg-black transition-transform md:h-3 md:w-3',
            value ? 'translate-x-3 md:translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </div>
      <span className="font-mono text-[11px] text-white/50 md:text-xs">{label}</span>
    </label>
  )
}

export function AsciiControls({
  options,
  onChange,
  shareState,
  onLoadPreset,
  onReset,
  onSavePng,
  getCanvas,
}: Props) {
  function set<K extends keyof AsciiOptions>(key: K, val: AsciiOptions[K]) {
    onChange({ ...options, [key]: val })
  }

  const sec = 'my-2 border-t border-white/10 pt-2 md:my-0 md:border-t md:pt-3'

  return (
    <div className="touch-manipulation px-3 pb-2 pt-2 md:flex md:w-full md:max-w-xl md:flex-col md:gap-4 md:rounded-xl md:border md:border-white/10 md:bg-black md:p-4">
      <div className="mb-1 flex items-center justify-between border-b border-white/10 pb-2 md:mb-0 md:pb-3">
        <span className="font-mono text-[11px] text-white/40">ASCII / Glyph</span>
        <ExportMenu getCanvas={getCanvas} onSavePng={onSavePng} />
      </div>

      <div className="flex flex-col gap-4 md:gap-3">
        <Slider label="Cell" min={5} max={16} value={options.grid} onChange={(v) => set('grid', v)} />
        <Slider
          label="Contrast"
          min={0.5}
          max={2.5}
          step={0.05}
          value={options.contrast}
          onChange={(v) => set('contrast', v)}
        />
        <Slider
          label="Threshold"
          min={0}
          max={80}
          value={options.threshold}
          onChange={(v) => set('threshold', v)}
        />
      </div>

      <div className={`${sec} flex flex-wrap items-center gap-2`}>
        <span className="font-mono text-[11px] text-white/30">Charset</span>
        <select
          value={options.charset}
          onChange={(e) => set('charset', e.target.value as AsciiCharset)}
          className="rounded border border-white/10 bg-black py-1 pl-2 pr-6 font-mono text-xs text-white/75 focus:border-white/35 focus:outline-none"
        >
          <option value="standard">Standard</option>
          <option value="blocks">Blocks</option>
          <option value="minimal">Minimal</option>
        </select>
      </div>

      <div className={`${sec} flex flex-wrap gap-x-3 gap-y-2`}>
        <Toggle label="Color" value={options.useColor} onChange={(v) => set('useColor', v)} />
        <Toggle label="Invert" value={options.invert} onChange={(v) => set('invert', v)} />
        <Toggle label="Glitch" value={options.glitch} onChange={(v) => set('glitch', v)} />
        <Toggle label="Scanline" value={options.scanline} onChange={(v) => set('scanline', v)} />
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
