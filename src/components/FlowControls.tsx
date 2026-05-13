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

function displaySliderValue(value: number, step: number) {
  return step < 1 ? Number(value).toFixed(2) : value
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
  const dv = displaySliderValue(value, step)
  return (
    <div className="md:flex md:min-h-[44px] md:w-full md:items-center md:gap-3">
      <div className="mb-1 flex items-center justify-between md:mb-0 md:block md:w-28 md:flex-shrink-0">
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
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-0.5 w-full cursor-pointer accent-white md:bg-white/20"
        />
      </div>
      <span className="hidden w-10 flex-shrink-0 text-right font-mono text-xs tabular-nums text-white/60 md:block">
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
            value ? 'translate-x-3 md:translate-x-4' : 'translate-x-0.5 md:translate-x-0.5',
          ].join(' ')}
        />
      </div>
      <span className="font-mono text-[11px] text-white/50 md:text-xs">{label}</span>
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

export function FlowControls({ options, onChange, onReset, onSavePng, onResetParticles }: Props) {
  function set<K extends keyof FlowOptions>(key: K, val: FlowOptions[K]) {
    onChange({ ...options, [key]: val })
  }

  const sec = 'my-2 border-t border-white/10 pt-2 md:my-0 md:border-t md:pt-3'

  return (
    <div className="touch-manipulation px-3 pb-2 pt-2 md:flex md:w-full md:max-w-xl md:flex-col md:gap-4 md:rounded-xl md:border md:border-white/10 md:bg-black md:p-4 md:pb-4">
      <div className="flex flex-col gap-4 md:gap-3">
        <Slider label="Particles" min={500} max={8000} step={100} value={options.count} onChange={(v) => set('count', v)} />
        <Slider label="Speed" min={0.1} max={3} step={0.05} value={options.speed} onChange={(v) => set('speed', v)} />
        <Slider label="Trail α" min={0.01} max={0.15} step={0.005} value={options.trailAlpha} onChange={(v) => set('trailAlpha', v)} />
        <Slider label="Fade" min={0} max={0.02} step={0.001} value={options.fadeSpeed} onChange={(v) => set('fadeSpeed', v)} />
        <Slider label="Flow" min={0} max={2} step={0.05} value={options.flowInfluence} onChange={(v) => set('flowInfluence', v)} />
      </div>

      <div className={`${sec} flex flex-wrap items-center gap-3`}>
        <ColorSwatch label="BG" value={options.bgColor} onChange={(v) => set('bgColor', v)} />
        <ColorSwatch label="Ink" value={options.particleColor} onChange={(v) => set('particleColor', v)} />
      </div>

      <div className={sec}>
        <span className="mb-1.5 block font-mono text-[10px] uppercase text-white/30 md:mb-0 md:inline">Presets</span>
        <div className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto pb-1 md:mx-0 md:flex-wrap md:overflow-visible">
          {FLOW_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.label}
              aria-label={p.label}
              onClick={() => onChange({ ...options, bgColor: p.bg, particleColor: p.fg })}
              className="h-8 w-8 shrink-0 rounded border border-white/20 transition-colors active:scale-95 md:h-7 md:w-7"
              style={{ background: `linear-gradient(135deg, ${p.bg} 50%, ${p.fg} 50%)` }}
            />
          ))}
        </div>
      </div>

      <div className={`${sec} flex flex-wrap gap-x-3 gap-y-2`}>
        <Toggle label="Bright mask" value={options.brightnessOnly} onChange={(v) => set('brightnessOnly', v)} />
        <Toggle label="Noise blend" value={options.noiseBlend} onChange={(v) => set('noiseBlend', v)} />
      </div>

      <div className={`${sec} flex flex-wrap items-center justify-between gap-y-2`}>
        <button
          type="button"
          onClick={onSavePng}
          className="rounded border border-white/20 px-3 py-1 font-mono text-[11px] text-white/40 transition-colors hover:border-white/35 hover:text-white md:min-h-11 md:min-w-[5.5rem] md:rounded md:border-white/15 md:px-4 md:text-xs md:text-white/70 md:hover:border-white/30"
        >
          Save PNG
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetParticles}
            className="rounded border border-white/20 px-3 py-1 font-mono text-[11px] text-white/40 transition-colors hover:border-white/35 hover:text-white md:min-h-11 md:min-w-[5.5rem] md:rounded md:border-white/15 md:px-4 md:text-xs md:text-white/70 md:hover:border-white/30"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onReset}
            className="font-mono text-[11px] text-white/35 transition-colors hover:text-white/55 md:text-xs md:text-white/35 md:hover:text-white/60"
          >
            <span className="md:hidden">New</span>
            <span className="hidden md:inline">← new image</span>
          </button>
        </div>
      </div>
    </div>
  )
}
