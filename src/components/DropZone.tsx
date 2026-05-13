import { useRef, useState, DragEvent, ChangeEvent } from 'react'

interface Props {
  onImage: (src: string) => void
}

export function DropZone({ onImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function read(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => onImage(e.target!.result as string)
    reader.readAsDataURL(file)
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) read(file)
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) read(file)
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={[
        'flex w-full max-w-xl cursor-pointer touch-manipulation flex-col items-center justify-center gap-3 rounded-xl border px-4 py-6 transition-all duration-200 aspect-[3/2] md:aspect-video md:gap-4 md:rounded-2xl md:px-6 md:py-10',
        dragging
          ? 'border-white/50 bg-white/[0.07]'
          : 'border-white/20 bg-white/[0.02] active:bg-white/[0.04] hover:border-white/35 hover:bg-white/[0.04]',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />

      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-8 w-8 text-white/35 md:h-10 md:w-10"
      >
        <path d="M4 16l4-4 4 4 4-6 4 6" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>

      <div className="text-center">
        <p className="text-sm text-white/75 md:text-sm">Drop an image or tap to choose</p>
        <p className="mt-1 font-mono text-[11px] text-white/30 md:mt-1 md:text-xs">PNG · JPG · WebP · GIF</p>
      </div>
    </div>
  )
}
