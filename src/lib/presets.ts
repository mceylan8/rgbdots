import type { ShareableState } from './urlState'
import { DEFAULT_STATE } from './urlState'

const STORAGE_KEY = 'rgbdot.presets.v1'

export interface SavedPreset {
  id: string
  name: string
  createdAt: number
  state: ShareableState
}

function readAll(): SavedPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedPreset[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(list: SavedPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function listPresets(): SavedPreset[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt)
}

export function savePreset(name: string, state: ShareableState): SavedPreset {
  const list = readAll()
  const preset: SavedPreset = {
    id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || 'Untitled',
    createdAt: Date.now(),
    state: structuredClone(state),
  }
  list.push(preset)
  writeAll(list)
  return preset
}

export function deletePreset(id: string) {
  writeAll(readAll().filter((p) => p.id !== id))
}

export function exportPresetsJson(presets?: SavedPreset[]): string {
  return JSON.stringify(presets ?? listPresets(), null, 2)
}

export function importPresetsJson(json: string): number {
  const parsed = JSON.parse(json) as unknown
  const items = Array.isArray(parsed) ? parsed : [parsed]
  const list = readAll()
  let added = 0
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Partial<SavedPreset>
    if (!rec.state || typeof rec.state !== 'object') continue
    const state: ShareableState = {
      ...DEFAULT_STATE,
      ...rec.state,
      options: { ...DEFAULT_STATE.options, ...(rec.state.options || {}) },
      flowOptions: { ...DEFAULT_STATE.flowOptions, ...(rec.state.flowOptions || {}) },
      halftone: { ...DEFAULT_STATE.halftone, ...(rec.state.halftone || {}) },
      ascii: { ...DEFAULT_STATE.ascii, ...(rec.state.ascii || {}) },
    }
    list.push({
      id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      name: typeof rec.name === 'string' ? rec.name : 'Imported',
      createdAt: Date.now(),
      state,
    })
    added++
  }
  writeAll(list)
  return added
}

export function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
