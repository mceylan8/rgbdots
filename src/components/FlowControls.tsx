import { useRef } from 'react'
import { FlowOptions } from '../hooks/useFlowField'
import { FLOW_PRESETS } from './PresetPalettes'

interface Props {
  options: FlowOptions
  onChange: (o: FlowOptions) => void
  onReset: () => void
  onSavePng: () => void
  onResetParticles: () => void
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
  return (
    <div className="flex min-h-[44px] items-center gap-2 sm:gap-3">
      <span className="w-24 shrink-0 text-[11px] text-white/45 sm:w-28 sm:text-xs">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-white sm:h-0.5"
      />
      <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-white/55 sm:w-10 sm:text-xs">
        {step < 1 ? value.toFixed(2) : value}
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
    <label className="flex min-h-[44px] cursor-pointer select-none items-center gap-2 py-0.5 sm:min-h-0 sm:py-0">
      <div
        onClick={() => onChange(!value)}
        className={[
          'relative h-8 w-9 shrink-0 rounded-full transition-colors sm:h-4 sm:w-8',
          value ? 'bg-white/70' : 'bg-white/20',
        ].join(' ')}
      >
        <div
          className={[
            'absolute top-1 h-3.5 w-3.5 rounded-full bg-black transition-transform sm:top-0.5 sm:h-3 sm:w-3',
            value ? 'translate-x-[1.125rem] sm:translate-x-4' : 'translate-x-1 sm:translate-x-0.5',
          ].join(' ')}
        />
      </div>
      <span className="text-[11px] text-white/50 sm:text-xs">{label}</span>
    </label>
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
    <div className="flex min-h-[44px] items-center gap-3">
      <span className="w-14 shrink-0 text-[11px] text-white/45 sm:text-xs">{label}</span>
      <button
        type="button"
        aria-label={label}
        className="h-11 w-11 shrink-0 border border-white/25 active:scale-95 sm:h-7 sm:w-7"
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

export function FlowControls({ options, onChange, onReset, onSavePng, onResetParticles }: Props) {
  function set<K extends keyof FlowOptions>(key: K, val: FlowOptions[K]) {
    onChange({ ...options, [key]: val })
  }

  return (
    <div className="flex w-full max-w-xl touch-manipulation flex-col gap-4 bg-transparent p-4 pb-5 font-mono text-[13px] sm:text-xs sm:rounded-xl sm:border sm:border-white/10 sm:bg-black sm:p-4 sm:pb-4">
      <div className="flex flex-col gap-3">
        <Slider label="Particles" min={500} max={8000} step={100} value={options.count} onChange={(v) => set('count', v)} />
        <Slider label="Speed" min={0.1} max={3} step={0.05} value={options.speed} onChange={(v) => set('speed', v)} />
        <Slider label="Trail α" min={0.01} max={0.15} step={0.005} value={options.trailAlpha} onChange={(v) => set('trailAlpha', v)} />
        <Slider label="Fade" min={0} max={0.02} step={0.001} value={options.fadeSpeed} onChange={(v) => set('fadeSpeed', v)} />
        <Slider label="Flow" min={0} max={2} step={0.05} value={options.flowInfluence} onChange={(v) => set('flowInfluence', v)} />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
        <ColorSwatch label="BG" value={options.bgColor} onChange={(v) => set('bgColor', v)} />
        <ColorSwatch label="Ink" value={options.particleColor} onChange={(v) => set('particleColor', v)} />
      </div>

      <div className="flex flex-wrap gap-1.5 items-center border-t border-white/10 pt-3">
        <span className="text-white/30 text-[10px] uppercase mr-1">Presets</span>
        {FLOW_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.label}
            onClick={() => onChange({ ...options, bgColor: p.bg, particleColor: p.fg })}
            className="h-11 w-11 shrink-0 border border-white/20 transition-colors active:scale-95 sm:h-7 sm:w-7"
            style={{ background: `linear-gradient(135deg, ${p.bg} 50%, ${p.fg} 50%)` }}
          />
        ))}
      </div>

      <div className="border-t border-white/10 pt-3 flex flex-wrap gap-4 items-center">
        <Toggle label="Bright mask" value={options.brightnessOnly} onChange={(v) => set('brightnessOnly', v)} />
        <Toggle label="Noise blend" value={options.noiseBlend} onChange={(v) => set('noiseBlend', v)} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={onResetParticles}
          className="min-h-11 min-w-[5.5rem] rounded border border-white/15 px-4 text-[12px] text-white/70 transition-colors active:bg-white/10 hover:border-white/30 hover:text-white sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1 sm:text-xs"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onSavePng}
          className="min-h-11 min-w-[5.5rem] rounded border border-white/15 px-4 text-[12px] text-white/70 transition-colors active:bg-white/10 hover:border-white/30 hover:text-white sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1 sm:text-xs"
        >
          Save PNG
        </button>
        <button
          type="button"
          onClick={onReset}
          className="ml-auto flex min-h-11 items-center text-[12px] text-white/35 transition-colors active:text-white/50 hover:text-white/60 sm:min-h-0 sm:text-xs"
        >
          ← new image
        </button>
      </div>
    </div>
  )
}
