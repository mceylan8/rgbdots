import { useState } from 'react'
import { exportGif, exportWebM } from '../lib/exportAnimation'

interface Props {
  getCanvas: () => HTMLCanvasElement | null
  onSavePng: () => void
}

export function ExportMenu({ getCanvas, onSavePng }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState('')

  async function run(kind: 'webm' | 'gif') {
    const cv = getCanvas()
    if (!cv) return
    setErr('')
    setBusy(kind)
    try {
      if (kind === 'webm') await exportWebM(cv, 3, 30, 'rgbdot.webm')
      else await exportGif(cv, 2.5, 10, 'rgbdot.gif')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={onSavePng}
        className="rounded border border-white/20 px-2.5 py-1 font-mono text-[11px] text-white/40 transition-colors hover:border-white/35 hover:text-white md:text-xs md:text-white/60"
      >
        PNG
      </button>
      <button
        type="button"
        disabled={!!busy}
        onClick={() => void run('webm')}
        className="rounded border border-white/20 px-2.5 py-1 font-mono text-[11px] text-white/40 transition-colors hover:border-white/35 hover:text-white disabled:opacity-40 md:text-xs md:text-white/60"
      >
        {busy === 'webm' ? '…' : 'WebM'}
      </button>
      <button
        type="button"
        disabled={!!busy}
        onClick={() => void run('gif')}
        className="rounded border border-white/20 px-2.5 py-1 font-mono text-[11px] text-white/40 transition-colors hover:border-white/35 hover:text-white disabled:opacity-40 md:text-xs md:text-white/60"
      >
        {busy === 'gif' ? '…' : 'GIF'}
      </button>
      {err && <span className="w-full font-mono text-[10px] text-red-300/80">{err}</span>}
    </div>
  )
}
