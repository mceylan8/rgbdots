import { RgbDotOptions, RgbDotPreset, RgbDotShape } from '../hooks/useRgbDot'

interface Props {
  options: RgbDotOptions
  onChange: (o: RgbDotOptions) => void
  onReset: () => void
  onSavePng: () => void
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
      <span className="text-white/40 text-xs w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-white h-0.5 bg-white/20 rounded cursor-pointer"
      />
      <span className="text-white/60 text-xs w-8 text-right tabular-nums">{value}</span>
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

const PRESET_LABELS: { id: RgbDotPreset; label: string }[] = [
  { id: 'rgb', label: 'RGB' },
  { id: 'cmyk', label: 'CMYK' },
  { id: 'neon', label: 'Neon' },
  { id: 'mono', label: 'Mono' },
]

export function Controls({ options, onChange, onReset, onSavePng }: Props) {
  function set<K extends keyof RgbDotOptions>(key: K, val: RgbDotOptions[K]) {
    onChange({ ...options, [key]: val })
  }

  function applyPreset(p: RgbDotPreset) {
    onChange({ ...options, useColor: false, preset: p })
  }

  return (
    <div className="w-full max-w-xl bg-black border border-white/10 rounded-xl p-4 flex flex-col gap-4 text-xs">
      <div className="flex flex-col gap-3">
        <Slider label="Dot grid" min={3} max={10} value={options.grid} onChange={(v) => set('grid', v)} />
        <Slider label="RGB split" min={0} max={14} step={0.5} value={options.split} onChange={(v) => set('split', v)} />
        <Slider label="Threshold" min={0} max={100} value={options.threshold} onChange={(v) => set('threshold', v)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
        <span className="text-white/30 w-full sm:w-auto shrink-0">Presets</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_LABELS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => applyPreset(id)}
              className={[
                'px-2 py-1 rounded border text-[10px] uppercase tracking-wide transition-colors',
                !options.useColor && options.preset === id
                  ? 'border-white/50 text-white/90 bg-white/10'
                  : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
        <span className="text-white/30 shrink-0">Shape</span>
        <select
          value={options.shape}
          onChange={(e) => set('shape', e.target.value as RgbDotShape)}
          className="bg-black border border-white/10 rounded px-2 py-1 text-white/70 cursor-pointer hover:border-white/20 focus:outline-none focus:border-white/30"
        >
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="diamond">Diamond</option>
        </select>
        <button
          type="button"
          onClick={onSavePng}
          className="ml-auto px-3 py-1 rounded border border-white/10 text-white/60 hover:text-white/90 hover:border-white/25 transition-colors"
        >
          Save PNG
        </button>
      </div>

      <div className="border-t border-white/10 pt-3 flex flex-wrap gap-4 items-center">
        <Toggle label="Original colors" value={options.useColor} onChange={(v) => set('useColor', v)} />
        <Toggle label="Flicker" value={options.flicker} onChange={(v) => set('flicker', v)} />
        <Toggle label="Spin split" value={options.spin} onChange={(v) => set('spin', v)} />
        <Toggle label="CRT" value={options.crt} onChange={(v) => set('crt', v)} />
        <button
          type="button"
          onClick={onReset}
          className="ml-auto text-white/30 hover:text-white/60 transition-colors"
        >
          ← new image
        </button>
      </div>
    </div>
  )
}
