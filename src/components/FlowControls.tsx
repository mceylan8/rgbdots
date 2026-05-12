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
    <div className="flex items-center gap-3">
      <span className="text-white/40 text-xs w-28 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-white h-0.5 bg-white/20 rounded cursor-pointer"
      />
      <span className="text-white/60 text-xs w-10 text-right tabular-nums shrink-0">
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
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!value)}
        className={[
          'w-8 h-4 rounded-full transition-colors relative',
          value ? 'bg-white/70' : 'bg-white/20',
        ].join(' ')}
      >
        <div
          className={[
            'absolute top-0.5 w-3 h-3 rounded-full bg-black transition-transform',
            value ? 'translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </div>
      <span className="text-white/50 text-xs">{label}</span>
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
    <div className="flex items-center gap-2">
      <span className="text-white/40 text-xs w-14 shrink-0">{label}</span>
      <button
        type="button"
        aria-label={label}
        className="w-7 h-7 shrink-0 border border-white/20 cursor-pointer"
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
    <div className="w-full max-w-xl bg-black border border-white/10 rounded-xl p-4 flex flex-col gap-4 text-xs font-mono">
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
            className="w-7 h-7 border border-white/20 hover:border-white/40 transition-colors"
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
          className="px-3 py-1 border border-white/10 text-white/60 hover:text-white/90 hover:border-white/25"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onSavePng}
          className="px-3 py-1 border border-white/10 text-white/60 hover:text-white/90 hover:border-white/25"
        >
          Save PNG
        </button>
        <button type="button" onClick={onReset} className="ml-auto text-white/30 hover:text-white/60 transition-colors">
          ← new image
        </button>
      </div>
    </div>
  )
}
