import { useRef, useState } from 'react'
import type { ShareableState } from '../lib/urlState'
import {
  deletePreset,
  downloadJson,
  exportPresetsJson,
  importPresetsJson,
  listPresets,
  savePreset,
  type SavedPreset,
} from '../lib/presets'

interface Props {
  state: ShareableState
  onLoad: (state: ShareableState) => void
}

export function PresetLibrary({ state, onLoad }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [presets, setPresets] = useState<SavedPreset[]>(() => listPresets())
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function refresh() {
    setPresets(listPresets())
  }

  function handleSave() {
    savePreset(name || `Look ${presets.length + 1}`, state)
    setName('')
    refresh()
    setMsg('Saved')
    setTimeout(() => setMsg(''), 1500)
  }

  function handleExport() {
    downloadJson('rgbdot-presets.json', exportPresetsJson())
  }

  function handleImportFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const n = importPresetsJson(String(reader.result))
        refresh()
        setMsg(`Imported ${n}`)
        setTimeout(() => setMsg(''), 2000)
      } catch {
        setMsg('Invalid JSON')
        setTimeout(() => setMsg(''), 2000)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="my-2 border-t border-white/10 pt-2 md:my-0 md:border-t md:pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between font-mono text-[11px] text-white/45 transition-colors hover:text-white/70 md:text-xs"
      >
        <span>Preset library</span>
        <span className="text-white/30">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex gap-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this look"
              className="min-w-0 flex-1 rounded border border-white/10 bg-black px-2 py-1.5 font-mono text-[11px] text-white/80 focus:border-white/30 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSave}
              className="shrink-0 rounded border border-white/20 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-white/50 hover:border-white/35 hover:text-white"
            >
              Save
            </button>
          </div>

          {presets.length > 0 && (
            <ul className="max-h-36 space-y-1 overflow-y-auto">
              {presets.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-1 rounded border border-white/5 px-1.5 py-1"
                >
                  <button
                    type="button"
                    onClick={() => onLoad(p.state)}
                    className="min-w-0 flex-1 truncate text-left font-mono text-[11px] text-white/65 hover:text-white"
                  >
                    {p.name}
                    <span className="ml-1 text-white/25">{p.state.mode}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deletePreset(p.id)
                      refresh()
                    }}
                    className="shrink-0 px-1 font-mono text-[10px] text-white/25 hover:text-red-300"
                    aria-label="Delete preset"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="rounded border border-white/10 px-2 py-1 font-mono text-[10px] uppercase text-white/40 hover:border-white/25 hover:text-white/70"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded border border-white/10 px-2 py-1 font-mono text-[10px] uppercase text-white/40 hover:border-white/25 hover:text-white/70"
            >
              Import JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleImportFile(f)
                e.target.value = ''
              }}
            />
            {msg && <span className="font-mono text-[10px] text-white/35">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
