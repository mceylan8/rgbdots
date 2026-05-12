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
        'w-full max-w-xl aspect-video flex flex-col items-center justify-center gap-4',
        'border rounded-xl cursor-pointer transition-all duration-200',
        dragging
          ? 'border-white/60 bg-white/5'
          : 'border-white/20 hover:border-white/40 hover:bg-white/5',
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
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-white/30"
      >
        <path d="M4 16l4-4 4 4 4-6 4 6" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>

      <div className="text-center">
        <p className="text-white/70 text-sm">Drop an image or click to pick one</p>
        <p className="text-white/30 text-xs mt-1">PNG · JPG · WebP · GIF</p>
      </div>
    </div>
  )
}
