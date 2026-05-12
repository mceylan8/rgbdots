import { useRef } from 'react'
import { RgbDotOptions, RgbDotPreset, RgbDotShape } from '../hooks/useRgbDot'
import { HalftoneOptions } from '../hooks/useHalftone'

interface Props {
  options: RgbDotOptions
  onChange: (o: RgbDotOptions) => void
  halftonePoster: boolean
  onHalftonePoster: (v: boolean) => void
  halftone: HalftoneOptions
  onHalftoneChange: (h: HalftoneOptions) => void
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
      <span className="text-white/40 text-xs w-20 shrink-0">{label}</span>
      <button
        type="button"
        aria-label={`${label} wählen`}
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

const PRESET_LABELS: { id: RgbDotPreset; label: string }[] = [
  { id: 'rgb', label: 'RGB' },
  { id: 'cmyk', label: 'CMYK' },
  { id: 'neon', label: 'Neon' },
  { id: 'mono', label: 'Mono' },
]

export function Controls({
  options,
  onChange,
  halftonePoster,
  onHalftonePoster,
  halftone,
  onHalftoneChange,
  onReset,
  onSavePng,
}: Props) {
  function set<K extends keyof RgbDotOptions>(key: K, val: RgbDotOptions[K]) {
    onChange({ ...options, [key]: val })
  }

  function setHt<K extends keyof HalftoneOptions>(key: K, val: HalftoneOptions[K]) {
    onHalftoneChange({ ...halftone, [key]: val })
  }

  function applyPreset(p: RgbDotPreset) {
    onChange({ ...options, useColor: false, preset: p })
  }

  return (
    <div className="w-full max-w-xl bg-black border border-white/10 rounded-xl p-4 flex flex-col gap-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <Toggle label="Halftone poster" value={halftonePoster} onChange={onHalftonePoster} />
        <button
          type="button"
          onClick={onSavePng}
          className="px-3 py-1 rounded border border-white/10 text-white/60 hover:text-white/90 hover:border-white/25 transition-colors"
        >
          Save PNG
        </button>
      </div>

      {halftonePoster ? (
        <div className="flex flex-col gap-3">
          <Slider label="Grid px" min={4} max={18} value={halftone.gridSize} onChange={(v) => setHt('gridSize', v)} />
          <Slider label="Contrast" min={0.8} max={2.2} step={0.05} value={halftone.contrast} onChange={(v) => setHt('contrast', v)} />
          <Slider label="Angle °" min={-45} max={45} value={halftone.angleDeg} onChange={(v) => setHt('angleDeg', v)} />
          <Slider label="Dot scale" min={0.5} max={1.4} step={0.05} value={halftone.dotScale} onChange={(v) => setHt('dotScale', v)} />
          <Slider label="Title px" min={28} max={80} value={halftone.titleSize} onChange={(v) => setHt('titleSize', v)} />
          <Slider label="Sub px" min={12} max={32} value={halftone.subtitleSize} onChange={(v) => setHt('subtitleSize', v)} />
          <Slider label="Date px" min={10} max={24} value={halftone.dateSize} onChange={(v) => setHt('dateSize', v)} />
          <Slider label="Noise" min={0} max={0.12} step={0.005} value={halftone.noiseOpacity} onChange={(v) => setHt('noiseOpacity', v)} />

          <div className="flex flex-wrap gap-4 pt-1">
            <ColorSwatch label="Paper" value={halftone.paperColor} onChange={(v) => setHt('paperColor', v)} />
            <ColorSwatch label="Ink" value={halftone.inkColor} onChange={(v) => setHt('inkColor', v)} />
            <ColorSwatch label="Text" value={halftone.textColor} onChange={(v) => setHt('textColor', v)} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white/40 text-[10px] uppercase tracking-wide">Title</label>
            <input
              value={halftone.title}
              onChange={(e) => setHt('title', e.target.value)}
              className="bg-black border border-white/10 px-2 py-1.5 text-white/80 focus:outline-none focus:border-white/25"
            />
            <label className="text-white/40 text-[10px] uppercase tracking-wide">Subtitle</label>
            <input
              value={halftone.subtitle}
              onChange={(e) => setHt('subtitle', e.target.value)}
              className="bg-black border border-white/10 px-2 py-1.5 text-white/80 focus:outline-none focus:border-white/25"
            />
            <label className="text-white/40 text-[10px] uppercase tracking-wide">Date</label>
            <input
              value={halftone.dateLine}
              onChange={(e) => setHt('dateLine', e.target.value)}
              className="bg-black border border-white/10 px-2 py-1.5 text-white/80 focus:outline-none focus:border-white/25"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() =>
                onHalftoneChange({
                  ...halftone,
                  paperColor: '#e8dcc8',
                  inkColor: '#1a0a06',
                  textColor: '#1a0a06',
                  contrast: 1.25,
                  angleDeg: 12,
                })
              }
              className="px-2 py-1 border border-white/10 text-white/50 hover:text-white/80 hover:border-white/25 text-[10px] uppercase tracking-wide"
            >
              Vintage paper
            </button>
            <button type="button" onClick={onReset} className="ml-auto text-white/30 hover:text-white/60 transition-colors">
              ← new image
            </button>
          </div>
        </div>
      ) : (
        <>
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
          </div>

          <div className="border-t border-white/10 pt-3 flex flex-wrap gap-4 items-center">
            <Toggle label="Original colors" value={options.useColor} onChange={(v) => set('useColor', v)} />
            <Toggle label="Flicker" value={options.flicker} onChange={(v) => set('flicker', v)} />
            <Toggle label="Spin split" value={options.spin} onChange={(v) => set('spin', v)} />
            <Toggle label="CRT" value={options.crt} onChange={(v) => set('crt', v)} />
            <button type="button" onClick={onReset} className="ml-auto text-white/30 hover:text-white/60 transition-colors">
              ← new image
            </button>
          </div>
        </>
      )}
    </div>
  )
}
