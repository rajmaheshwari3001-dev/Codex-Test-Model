import { useState, useEffect, useRef, useCallback } from 'react'
import { SparklesIcon } from '../common/Icons'

interface Props {
  onOpen: () => void
}

interface Position {
  x: number
  y: number
}

const STORAGE_KEY = 'aaroh_copilot_launcher_pos'

export default function MovableCopilotLauncher({ onOpen }: Props) {
  const [position, setPosition] = useState<Position | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showMoveHint, setShowMoveHint] = useState(false)

  const launcherRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{
    startX: number
    startY: number
    posX: number
    posY: number
    hasMoved: boolean
  }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    hasMoved: false,
  })

  // Measure and initialize position
  const getInitialPosition = useCallback(() => {
    const el = launcherRef.current
    const width = el?.offsetWidth || 230
    const height = el?.offsetHeight || 60
    const winW = window.innerWidth
    const winH = window.innerHeight

    // Check saved position in localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: Position = JSON.parse(saved)
        // Ensure within current viewport
        const clampedX = Math.max(12, Math.min(winW - width - 12, parsed.x))
        const clampedY = Math.max(12, Math.min(winH - height - 12, parsed.y))
        return { x: clampedX, y: clampedY }
      }
    } catch {
      // Fallback
    }

    // Default: Bottom-right corner
    return {
      x: Math.max(12, winW - width - 24),
      y: Math.max(12, winH - height - 24),
    }
  }, [])

  useEffect(() => {
    setPosition(getInitialPosition())
  }, [getInitialPosition])

  // Handle window resize so button is never trapped offscreen
  useEffect(() => {
    function handleResize() {
      setPosition(prev => {
        if (!prev) return getInitialPosition()
        const el = launcherRef.current
        const width = el?.offsetWidth || 230
        const height = el?.offsetHeight || 60
        const winW = window.innerWidth
        const winH = window.innerHeight

        return {
          x: Math.max(12, Math.min(winW - width - 12, prev.x)),
          y: Math.max(12, Math.min(winH - height - 12, prev.y)),
        }
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getInitialPosition])

  // Mouse & Touch Dragging Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return

    const currentPos = position || { x: 0, y: 0 }
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentPos.x,
      posY: currentPos.y,
      hasMoved: false,
    }

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX
      const deltaY = moveEvent.clientY - dragStartRef.current.startY

      // Threshold to distinguish click vs drag
      if (!dragStartRef.current.hasMoved && Math.hypot(deltaX, deltaY) > 5) {
        dragStartRef.current.hasMoved = true
        setIsDragging(true)
      }

      if (dragStartRef.current.hasMoved) {
        const el = launcherRef.current
        const width = el?.offsetWidth || 230
        const height = el?.offsetHeight || 60
        const winW = window.innerWidth
        const winH = window.innerHeight

        const rawX = dragStartRef.current.posX + deltaX
        const rawY = dragStartRef.current.posY + deltaY

        const clampedX = Math.max(8, Math.min(winW - width - 8, rawX))
        const clampedY = Math.max(8, Math.min(winH - height - 8, rawY))

        setPosition({ x: clampedX, y: clampedY })
      }
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)

      if (dragStartRef.current.hasMoved) {
        // Save final position
        setPosition(finalPos => {
          if (finalPos) {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPos))
            } catch {
              // Ignore
            }
          }
          return finalPos
        })
      } else {
        // Clean click without drag -> trigger open
        onOpen()
      }

      setIsDragging(false)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  return (
    <div
      ref={launcherRef}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setShowMoveHint(true)}
      onMouseLeave={() => setShowMoveHint(false)}
      style={{
        zIndex: 9999,
        position: 'fixed',
        left: position ? `${position.x}px` : undefined,
        top: position ? `${position.y}px` : undefined,
        bottom: position ? undefined : '24px',
        right: position ? undefined : '24px',
        touchAction: 'none',
      }}
      className={`select-none transition-shadow ${
        isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
      }`}
      title="Click to Open Copilot • Drag anywhere to move on screen"
      aria-label="Movable Aaroh-Saarthi AI Transit Copilot Launcher"
    >
      {/* Visual Move Hint on Hover */}
      {showMoveHint && !isDragging && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#1A2E3B]/90 backdrop-blur-sm text-[10px] font-bold text-[#FAF7F2] shadow-sm pointer-events-none animate-fade-in border border-white/20">
          <span>Click to open • Drag to move</span>
        </div>
      )}

      {/* Mobile View: Circular Tactile FAB with Glowing Badge */}
      <div className="flex md:hidden h-14 w-14 items-center justify-center rounded-full border-2 border-[#C49A43] bg-[#1A2E3B] text-white shadow-[0_8px_24px_rgba(26,46,59,0.4)] active:scale-90 transition-transform relative">
        <SparklesIcon className="w-7 h-7 text-[#C49A43]" />
        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#2E7D32] border-2 border-[#1A2E3B] animate-pulse" />
      </div>

      {/* Tablet & Desktop View: Dimensionally Responsive Movable Pill Launcher */}
      <div
        className={`hidden md:flex h-14 sm:h-15 px-4 sm:px-5 rounded-full border-2 border-[#C49A43]/50 bg-[#1A2E3B] hover:bg-[#243B4A] text-white shadow-[0_10px_30px_rgba(26,46,59,0.35)] transition-all duration-200 items-center gap-3 group ${
          isDragging
            ? 'shadow-[0_20px_45px_rgba(196,154,67,0.45)] ring-2 ring-[#C49A43] scale-105'
            : 'hover:shadow-[0_14px_36px_rgba(196,154,67,0.45)]'
        }`}
      >
        {/* Subtle Drag Grip Indicator Handle */}
        <div
          className="flex flex-col gap-0.5 text-[#C49A43]/60 group-hover:text-[#C49A43] transition-colors pr-1 cursor-grab"
          title="Drag handle"
        >
          <span className="flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-current" />
            <span className="h-1 w-1 rounded-full bg-current" />
          </span>
          <span className="flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-current" />
            <span className="h-1 w-1 rounded-full bg-current" />
          </span>
          <span className="flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-current" />
            <span className="h-1 w-1 rounded-full bg-current" />
          </span>
        </div>

        {/* Sparkle Icon */}
        <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C49A43] to-[#A77B32] text-white shadow-md group-hover:rotate-12 transition-transform shrink-0">
          <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </span>

        {/* Label */}
        <div className="flex flex-col text-left">
          <span className="text-xs sm:text-sm font-extrabold tracking-wide leading-tight text-white">
            Ask Copilot
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold text-[#EBE5DC] leading-tight">
            Multimodal Transit AI
          </span>
        </div>

        {/* Live Pulse Indicator */}
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2E7D32]/20 border border-[#2E7D32]/50 text-[#79D48A] text-[10px] font-mono font-extrabold shrink-0">
          <span className="h-2 w-2 rounded-full bg-[#2E7D32] animate-pulse" />
          <span>LIVE</span>
        </span>
      </div>
    </div>
  )
}

