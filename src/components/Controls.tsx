import { useRef, type CSSProperties } from 'react'
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
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-0.5 w-full cursor-pointer accent-white md:bg-white/20"
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
  shortLabel,
  value,
  onChange,
}: {
  label: string
  shortLabel?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 gap-x-3 gap-y-2 md:min-h-[44px]">
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
      <span className="font-mono text-[11px] text-white/50 md:text-xs">
        <span className="md:hidden">{shortLabel ?? label}</span>
        <span className="hidden md:inline">{label}</span>
      </span>
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
      <span className="w-16 shrink-0 font-mono text-[11px] text-white/45 md:w-20 md:text-xs">{label}</span>
      <button
        type="button"
        aria-label={`${label} wählen`}
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

const PRESET_LABELS: { id: RgbDotPreset; label: string }[] = [
  { id: 'rgb', label: 'RGB' },
  { id: 'cmyk', label: 'CMYK' },
  { id: 'neon', label: 'Neon' },
  { id: 'mono', label: 'Mono' },
]

function HalftoneStyleButton({
  title,
  onClick,
  style,
  children,
}: {
  title: string
  onClick: () => void
  style: CSSProperties
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      style={style}
      className="h-8 w-8 shrink-0 rounded border border-white/15 md:h-auto md:min-h-10 md:w-auto md:border-white/10 md:px-3 md:py-2"
    >
      <span className="hidden md:inline md:text-[10px] md:text-white/55 md:hover:text-white/90">{children}</span>
    </button>
  )
}

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

  const sec = 'my-2 border-t border-white/10 pt-2 md:my-0 md:border-t md:pt-3'

  return (
    <div className="touch-manipulation px-3 pb-2 pt-2 md:flex md:w-full md:max-w-xl md:flex-col md:gap-4 md:rounded-xl md:border md:border-white/10 md:bg-black md:p-4 md:pb-4">
      <div className="mb-1 flex flex-col gap-2 border-b border-white/10 pb-2 md:mb-0 md:flex-row md:items-center md:justify-between md:gap-3 md:border-b md:pb-3">
        <Toggle
          label="Halftone poster"
          shortLabel="Poster"
          value={halftonePoster}
          onChange={onHalftonePoster}
        />
        <div className="flex items-center justify-end gap-2 md:justify-start">
          <button
            type="button"
            onClick={onSavePng}
            className="rounded border border-white/20 px-3 py-1 font-mono text-[11px] text-white/40 transition-colors hover:border-white/35 hover:text-white md:text-xs md:text-white/60 md:hover:border-white/25 md:hover:text-white/90"
          >
            Save PNG
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded border border-white/20 px-3 py-1 font-mono text-[11px] text-white/40 transition-colors hover:border-white/35 hover:text-white md:hidden"
          >
            New
          </button>
        </div>
      </div>

      {halftonePoster ? (
        <div className="flex flex-col gap-4 md:gap-3">
          <Slider label="Grid px" min={4} max={18} value={halftone.gridSize} onChange={(v) => setHt('gridSize', v)} />
          <Slider label="Contrast" min={0.5} max={3} step={0.1} value={halftone.contrast} onChange={(v) => setHt('contrast', v)} />
          <Slider label="Min dot" min={0} max={0.5} step={0.01} value={halftone.minDot} onChange={(v) => setHt('minDot', v)} />
          <Slider label="Angle °" min={-45} max={45} value={halftone.angleDeg} onChange={(v) => setHt('angleDeg', v)} />
          <Slider label="Dot scale" min={0.5} max={1.4} step={0.05} value={halftone.dotScale} onChange={(v) => setHt('dotScale', v)} />
          <Slider label="Title px" min={28} max={80} value={halftone.titleSize} onChange={(v) => setHt('titleSize', v)} />
          <Slider label="Sub px" min={12} max={32} value={halftone.subtitleSize} onChange={(v) => setHt('subtitleSize', v)} />
          <Slider label="Date px" min={10} max={24} value={halftone.dateSize} onChange={(v) => setHt('dateSize', v)} />
          <Slider label="Noise" min={0} max={0.12} step={0.005} value={halftone.noiseOpacity} onChange={(v) => setHt('noiseOpacity', v)} />

          <div className={`${sec} flex flex-wrap gap-x-3 gap-y-2`}>
            <Toggle label="Invert dots" shortLabel="Invert" value={halftone.invert} onChange={(v) => setHt('invert', v)} />
          </div>

          <div className={`${sec} flex flex-wrap gap-3`}>
            <ColorSwatch label="Paper" value={halftone.paperColor} onChange={(v) => setHt('paperColor', v)} />
            <ColorSwatch label="Ink" value={halftone.inkColor} onChange={(v) => setHt('inkColor', v)} />
            <ColorSwatch label="Text" value={halftone.textColor} onChange={(v) => setHt('textColor', v)} />
          </div>

          <div className={sec}>
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-white/30 md:mb-0 md:inline md:w-full">
              Print styles
            </span>
            <div className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto pb-1 md:mx-0 md:flex-wrap md:overflow-visible">
              <HalftoneStyleButton
                title="Manga"
                style={{ background: 'linear-gradient(135deg,#000000 50%,#f5e642 50%)' }}
                onClick={() =>
                  onHalftoneChange({
                    ...halftone,
                    paperColor: '#000000',
                    inkColor: '#f5e642',
                    textColor: '#f5e642',
                    invert: true,
                  })
                }
              >
                Manga
              </HalftoneStyleButton>
              <HalftoneStyleButton
                title="Risograph"
                style={{ background: 'linear-gradient(135deg,#1a0a2e 50%,#ff6b35 50%)' }}
                onClick={() =>
                  onHalftoneChange({
                    ...halftone,
                    paperColor: '#1a0a2e',
                    inkColor: '#ff6b35',
                    textColor: '#ff6b35',
                    invert: false,
                  })
                }
              >
                Riso
              </HalftoneStyleButton>
              <HalftoneStyleButton
                title="Soviet"
                style={{ background: 'linear-gradient(135deg,#cc0000 50%,#f5f0e8 50%)' }}
                onClick={() =>
                  onHalftoneChange({
                    ...halftone,
                    paperColor: '#cc0000',
                    inkColor: '#f5f0e8',
                    textColor: '#f5f0e8',
                    invert: false,
                  })
                }
              >
                Soviet
              </HalftoneStyleButton>
              <HalftoneStyleButton
                title="Zine"
                style={{ background: 'linear-gradient(135deg,#f0e6d3 50%,#1a1a2e 50%)' }}
                onClick={() =>
                  onHalftoneChange({
                    ...halftone,
                    paperColor: '#f0e6d3',
                    inkColor: '#1a1a2e',
                    textColor: '#1a1a2e',
                    invert: false,
                  })
                }
              >
                Zine
              </HalftoneStyleButton>
              <HalftoneStyleButton
                title="Ghost"
                style={{ background: 'linear-gradient(135deg,#e8e8e8 50%,#1a1a1a 50%)' }}
                onClick={() =>
                  onHalftoneChange({
                    ...halftone,
                    paperColor: '#e8e8e8',
                    inkColor: '#1a1a1a',
                    textColor: '#1a1a1a',
                    invert: false,
                  })
                }
              >
                Ghost
              </HalftoneStyleButton>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-wide text-white/40">Title</label>
            <input
              value={halftone.title}
              onChange={(e) => setHt('title', e.target.value)}
              className="rounded border border-white/10 bg-black px-2 py-2 text-sm text-white/85 focus:border-white/30 focus:outline-none md:py-2 md:text-sm"
            />
            <label className="font-mono text-[10px] uppercase tracking-wide text-white/40">Subtitle</label>
            <input
              value={halftone.subtitle}
              onChange={(e) => setHt('subtitle', e.target.value)}
              className="rounded border border-white/10 bg-black px-2 py-2 text-sm text-white/85 focus:border-white/30 focus:outline-none md:py-2 md:text-sm"
            />
            <label className="font-mono text-[10px] uppercase tracking-wide text-white/40">Date</label>
            <input
              value={halftone.dateLine}
              onChange={(e) => setHt('dateLine', e.target.value)}
              className="rounded border border-white/10 bg-black px-2 py-2 text-sm text-white/85 focus:border-white/30 focus:outline-none md:py-2 md:text-sm"
            />
          </div>

          <div className={`${sec} flex flex-wrap items-center gap-2`}>
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
              className="rounded border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-white/50 transition-colors hover:border-white/25 hover:text-white/85 md:px-2 md:py-1"
            >
              Vintage paper
            </button>
            <button
              type="button"
              onClick={onReset}
              className="ml-auto hidden font-mono text-xs text-white/35 transition-colors hover:text-white/60 md:flex"
            >
              ← new image
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 md:gap-3">
            <Slider label="Dot grid" min={3} max={10} value={options.grid} onChange={(v) => set('grid', v)} />
            <Slider label="RGB split" min={0} max={14} step={0.5} value={options.split} onChange={(v) => set('split', v)} />
            <Slider label="Threshold" min={0} max={100} value={options.threshold} onChange={(v) => set('threshold', v)} />
            <Slider label="Contrast" min={0.5} max={2.5} step={0.05} value={options.contrast} onChange={(v) => set('contrast', v)} />
            <Slider label="Farbverstärker" min={0.5} max={2} step={0.05} value={options.colorBoost} onChange={(v) => set('colorBoost', v)} />
          </div>

          <div className={sec}>
            <span className="mb-1.5 block text-[11px] text-white/30 md:mb-0 md:inline md:w-auto">Presets</span>
            <div className="-mx-1 flex flex-nowrap gap-1.5 overflow-x-auto pb-1 md:mx-0 md:flex-wrap md:overflow-visible">
              {PRESET_LABELS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  title={label}
                  onClick={() => applyPreset(id)}
                  className={[
                    'flex-shrink-0 rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors md:min-h-10 md:px-3 md:py-2 md:text-[11px]',
                    !options.useColor && options.preset === id
                      ? 'border-white/50 bg-white/10 text-white/90'
                      : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={`${sec} flex flex-wrap items-center gap-2`}>
            <span className="font-mono text-[11px] text-white/30 md:text-xs">Shape</span>
            <select
              value={options.shape}
              onChange={(e) => set('shape', e.target.value as RgbDotShape)}
              className="w-auto min-w-[120px] rounded border border-white/10 bg-black py-1 pl-2 pr-6 font-mono text-xs text-white/75 focus:border-white/35 focus:outline-none md:min-h-0 md:px-2 md:py-1"
            >
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="diamond">Diamond</option>
            </select>
          </div>

          <div className={`${sec} flex flex-wrap gap-x-3 gap-y-2`}>
            <Toggle label="Original colors" shortLabel="Color" value={options.useColor} onChange={(v) => set('useColor', v)} />
            <Toggle label="Flicker" value={options.flicker} onChange={(v) => set('flicker', v)} />
            <Toggle label="Spin split" shortLabel="Spin" value={options.spin} onChange={(v) => set('spin', v)} />
            <Toggle label="CRT" value={options.crt} onChange={(v) => set('crt', v)} />
            <button
              type="button"
              onClick={onReset}
              className="ml-auto hidden font-mono text-xs text-white/35 transition-colors hover:text-white/60 md:inline"
            >
              ← new image
            </button>
          </div>
        </>
      )}
    </div>
  )
}
