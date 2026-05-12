import { RgbDotOptions } from '../hooks/useRgbDot'

interface Props {
  options: RgbDotOptions
  onChange: (o: RgbDotOptions) => void
  onReset: () => void
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
      <span className="text-white/40 text-xs w-20 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-white h-0.5 bg-white/20 rounded cursor-pointer"
      />
      <span className="text-white/60 text-xs w-6 text-right">{value}</span>
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

export function Controls({ options, onChange, onReset }: Props) {
  function set<K extends keyof RgbDotOptions>(key: K, val: RgbDotOptions[K]) {
    onChange({ ...options, [key]: val })
  }

  return (
    <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Slider label="Dot grid" min={3} max={10} value={options.grid} onChange={(v) => set('grid', v)} />
        <Slider label="RGB split" min={0} max={14} step={0.5} value={options.split} onChange={(v) => set('split', v)} />
      </div>

      <div className="border-t border-white/10 pt-3 flex flex-wrap gap-4">
        <Toggle label="Original colors" value={options.useColor} onChange={(v) => set('useColor', v)} />
        <Toggle label="Flicker" value={options.flicker} onChange={(v) => set('flicker', v)} />
        <Toggle label="Spin split" value={options.spin} onChange={(v) => set('spin', v)} />
        <button
          onClick={onReset}
          className="ml-auto text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          ← new image
        </button>
      </div>
    </div>
  )
}
