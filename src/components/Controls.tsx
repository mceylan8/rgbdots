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
    <div className="flex min-h-[44px] items-center gap-2 sm:gap-3">
      <span className="w-20 shrink-0 text-[11px] text-white/45 sm:w-24 sm:text-xs">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-white sm:h-0.5"
      />
      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-white/55 sm:w-8 sm:text-xs">
        {step < 1 ? Number(value).toFixed(2) : value}
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
      <span className="w-20 shrink-0 text-[11px] text-white/45 sm:text-xs">{label}</span>
      <button
        type="button"
        aria-label={`${label} wählen`}
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
    <div className="flex w-full max-w-xl touch-manipulation flex-col gap-4 bg-transparent p-4 pb-5 text-[13px] sm:text-xs sm:rounded-xl sm:border sm:border-white/10 sm:bg-black sm:p-4 sm:pb-4">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Toggle label="Halftone poster" value={halftonePoster} onChange={onHalftonePoster} />
        <button
          type="button"
          onClick={onSavePng}
          className="min-h-11 w-full rounded border border-white/15 px-4 text-[12px] text-white/70 transition-colors active:bg-white/10 hover:border-white/30 hover:text-white sm:min-h-0 sm:w-auto sm:px-3 sm:py-1.5 sm:text-xs"
        >
          Save PNG
        </button>
      </div>

      {halftonePoster ? (
        <div className="flex flex-col gap-3">
          <Slider label="Grid px" min={4} max={18} value={halftone.gridSize} onChange={(v) => setHt('gridSize', v)} />
          <Slider label="Contrast" min={0.5} max={3} step={0.1} value={halftone.contrast} onChange={(v) => setHt('contrast', v)} />
          <Slider label="Min dot" min={0} max={0.5} step={0.01} value={halftone.minDot} onChange={(v) => setHt('minDot', v)} />
          <Slider label="Angle °" min={-45} max={45} value={halftone.angleDeg} onChange={(v) => setHt('angleDeg', v)} />
          <Slider label="Dot scale" min={0.5} max={1.4} step={0.05} value={halftone.dotScale} onChange={(v) => setHt('dotScale', v)} />
          <Slider label="Title px" min={28} max={80} value={halftone.titleSize} onChange={(v) => setHt('titleSize', v)} />
          <Slider label="Sub px" min={12} max={32} value={halftone.subtitleSize} onChange={(v) => setHt('subtitleSize', v)} />
          <Slider label="Date px" min={10} max={24} value={halftone.dateSize} onChange={(v) => setHt('dateSize', v)} />
          <Slider label="Noise" min={0} max={0.12} step={0.005} value={halftone.noiseOpacity} onChange={(v) => setHt('noiseOpacity', v)} />

          <div className="flex flex-wrap gap-4 pt-1 border-t border-white/10">
            <Toggle label="Invert dots" value={halftone.invert} onChange={(v) => setHt('invert', v)} />
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <ColorSwatch label="Paper" value={halftone.paperColor} onChange={(v) => setHt('paperColor', v)} />
            <ColorSwatch label="Ink" value={halftone.inkColor} onChange={(v) => setHt('inkColor', v)} />
            <ColorSwatch label="Text" value={halftone.textColor} onChange={(v) => setHt('textColor', v)} />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            <span className="text-white/30 w-full shrink-0 text-[10px] uppercase tracking-wide">Print styles</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                title="Manga"
                onClick={() =>
                  onHalftoneChange({
                    ...halftone,
                    paperColor: '#000000',
                    inkColor: '#f5e642',
                    textColor: '#f5e642',
                    invert: true,
                  })
                }
                className="min-h-10 rounded border border-white/10 px-3 py-2 text-[11px] text-white/55 transition-colors active:bg-white/10 hover:border-white/25 hover:text-white/90 sm:min-h-0 sm:px-2 sm:py-1 sm:text-[10px]"
              >
                Manga
              </button>
              <button
                type="button"
                title="Risograph"
                onClick={() =>
                  onHalftoneChange({
                    ...halftone,
                    paperColor: '#1a0a2e',
                    inkColor: '#ff6b35',
                    textColor: '#ff6b35',
                    invert: false,
                  })
                }
                className="min-h-10 rounded border border-white/10 px-3 py-2 text-[11px] text-white/55 transition-colors active:bg-white/10 hover:border-white/25 hover:text-white/90 sm:min-h-0 sm:px-2 sm:py-1 sm:text-[10px]"
              >
                Riso
              </button>
              <button
                type="button"
                title="Soviet"
                onClick={() =>
                  onHalftoneChange({
                    ...halftone,
                    paperColor: '#cc0000',
                    inkColor: '#f5f0e8',
                    textColor: '#f5f0e8',
                    invert: false,
                  })
                }
                className="min-h-10 rounded border border-white/10 px-3 py-2 text-[11px] text-white/55 transition-colors active:bg-white/10 hover:border-white/25 hover:text-white/90 sm:min-h-0 sm:px-2 sm:py-1 sm:text-[10px]"
              >
                Soviet
              </button>
              <button
                type="button"
                title="Zine"
                onClick={() =>
                  onHalftoneChange({
                    ...halftone,
                    paperColor: '#f0e6d3',
                    inkColor: '#1a1a2e',
                    textColor: '#1a1a2e',
                    invert: false,
                  })
                }
                className="min-h-10 rounded border border-white/10 px-3 py-2 text-[11px] text-white/55 transition-colors active:bg-white/10 hover:border-white/25 hover:text-white/90 sm:min-h-0 sm:px-2 sm:py-1 sm:text-[10px]"
              >
                Zine
              </button>
              <button
                type="button"
                title="Ghost"
                onClick={() =>
                  onHalftoneChange({
                    ...halftone,
                    paperColor: '#e8e8e8',
                    inkColor: '#1a1a1a',
                    textColor: '#1a1a1a',
                    invert: false,
                  })
                }
                className="min-h-10 rounded border border-white/10 px-3 py-2 text-[11px] text-white/55 transition-colors active:bg-white/10 hover:border-white/25 hover:text-white/90 sm:min-h-0 sm:px-2 sm:py-1 sm:text-[10px]"
              >
                Ghost
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white/40 text-[10px] uppercase tracking-wide">Title</label>
            <input
              value={halftone.title}
              onChange={(e) => setHt('title', e.target.value)}
              className="min-h-12 rounded border border-white/10 bg-black px-3 py-3 text-[15px] text-white/85 focus:border-white/30 focus:outline-none sm:min-h-0 sm:py-2 sm:text-sm"
            />
            <label className="text-white/40 text-[10px] uppercase tracking-wide">Subtitle</label>
            <input
              value={halftone.subtitle}
              onChange={(e) => setHt('subtitle', e.target.value)}
              className="min-h-12 rounded border border-white/10 bg-black px-3 py-3 text-[15px] text-white/85 focus:border-white/30 focus:outline-none sm:min-h-0 sm:py-2 sm:text-sm"
            />
            <label className="text-white/40 text-[10px] uppercase tracking-wide">Date</label>
            <input
              value={halftone.dateLine}
              onChange={(e) => setHt('dateLine', e.target.value)}
              className="min-h-12 rounded border border-white/10 bg-black px-3 py-3 text-[15px] text-white/85 focus:border-white/30 focus:outline-none sm:min-h-0 sm:py-2 sm:text-sm"
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
                  contrast: 1.4,
                  angleDeg: 12,
                  minDot: 0.18,
                  invert: false,
                })
              }
              className="min-h-11 rounded border border-white/10 px-4 text-[11px] text-white/55 transition-colors active:bg-white/10 hover:border-white/25 hover:text-white/85 sm:min-h-0 sm:px-2 sm:py-1 sm:text-[10px]"
            >
              Vintage paper
            </button>
            <button type="button" onClick={onReset} className="ml-auto flex min-h-11 items-center text-[12px] text-white/35 transition-colors active:text-white/50 hover:text-white/60 sm:min-h-0 sm:text-xs">
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
                    'min-h-10 rounded border px-3 py-2 text-[11px] uppercase tracking-wide transition-colors active:bg-white/10 sm:min-h-0 sm:px-2 sm:py-1 sm:text-[10px]',
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
              className="min-h-11 w-full max-w-[12rem] rounded border border-white/10 bg-black px-3 py-2 text-[13px] text-white/75 cursor-pointer hover:border-white/25 focus:outline-none focus:border-white/35 sm:min-h-0 sm:w-auto sm:px-2 sm:py-1 sm:text-xs"
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
            <button type="button" onClick={onReset} className="ml-auto flex min-h-11 items-center text-[12px] text-white/35 transition-colors active:text-white/50 hover:text-white/60 sm:min-h-0 sm:text-xs">
              ← new image
            </button>
          </div>
        </>
      )}
    </div>
  )
}
