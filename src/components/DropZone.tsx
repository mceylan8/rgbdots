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
        'flex w-full max-w-xl cursor-pointer touch-manipulation flex-col items-center justify-center gap-5 rounded-2xl border px-6 py-12 transition-all duration-200 sm:aspect-video sm:gap-4 sm:py-10',
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
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-white/35 sm:h-10 sm:w-10"
      >
        <path d="M4 16l4-4 4 4 4-6 4 6" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>

      <div className="text-center">
        <p className="text-base text-white/75 sm:text-sm">Drop an image or tap to choose</p>
        <p className="mt-2 text-xs text-white/35 sm:mt-1">PNG · JPG · WebP · GIF</p>
      </div>
    </div>
  )
}
