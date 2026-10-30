import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { TrainIcon, BusIcon, AutoRickshawIcon, CheckIcon } from './Icons'

interface PageLoadTransitionProps {
  onComplete?: () => void
  durationMs?: number
}

export default function PageLoadTransition({
  onComplete,
  durationMs = 800,
}: PageLoadTransitionProps) {
  const [phase, setPhase] = useState<'loading' | 'finishing' | 'done'>('loading')
  const [progress, setProgress] = useState(15)
  const [statusText, setStatusText] = useState('Synchronizing DMRC & DTC GTFS Feeds...')

  useEffect(() => {
    // Smooth progress increment timer
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        const step = Math.floor(Math.random() * 20) + 15
        const next = prev + step
        return next > 100 ? 100 : next
      })
    }, 110)

    const t1 = setTimeout(() => {
      setStatusText('Connecting 20 Multimodal Delhi Hubs...')
    }, 240)

    const t2 = setTimeout(() => {
      setStatusText('Optimizing Fares, Carbon Metrics & SmartCards...')
    }, 480)

    const t3 = setTimeout(() => {
      setStatusText('Transit Network Ready.')
      setPhase('finishing')
    }, durationMs - 220)

    const t4 = setTimeout(() => {
      setPhase('done')
      if (onComplete) onComplete()
    }, durationMs + 280)

    return () => {
      clearInterval(interval)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [durationMs, onComplete])

  if (phase === 'done' || typeof document === 'undefined') return null

  return createPortal(
    <div
      aria-hidden="true"
      style={{ zIndex: 99999999, position: 'fixed', inset: 0 }}
      className={`flex flex-col items-center justify-center bg-[#FAF7F2]/95 backdrop-blur-md transition-all duration-500 ease-out select-none ${
        phase === 'finishing'
          ? 'opacity-0 scale-102 pointer-events-none'
          : 'opacity-100 scale-100 pointer-events-auto'
      }`}
    >
      {/* Top High-Speed Transit Progress Glow Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#EDE8E1] overflow-hidden z-50">
        <div
          className="h-full bg-gradient-to-r from-[#D4A338] via-[#166534] to-[#C49A43] shadow-[0_0_14px_rgba(196,154,67,0.8)] transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col items-center max-w-sm px-6 text-center animate-fade-in">
        {/* Animated Central Transit Badge with Dual Concentric Pulse Rings */}
        <div className="relative flex items-center justify-center w-24 h-24 mb-5">
          {/* Outer Pulsing Aura */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#C49A43]/20 via-[#166534]/15 to-transparent animate-pulse-glow" />

          {/* Dashed Orbital Ring */}
          <div className="absolute -inset-2 rounded-full border-2 border-dashed border-[#C49A43]/40 animate-spin [animation-duration:12s]" />

          {/* Golden Badge Core */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#FFF9EE] via-[#FAF0D9] to-[#EBD5A8] border-2 border-[#C49A43] shadow-[0_10px_25px_rgba(196,154,67,0.25)]">
            <TrainIcon className="w-8 h-8 text-[#9A721C]" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#166534] border-2 border-white shadow-xs">
              <CheckIcon className="w-2.5 h-2.5 text-white" />
            </span>
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A2E3B] leading-none mb-1">
          AAROH<span className="text-[#C49A43] mx-1.5">•</span>SAARTHI
        </h1>
        <p className="font-ubuntu text-xs font-semibold tracking-wide uppercase text-[#7A7269] mb-5">
          Delhi Multimodal Transit System
        </p>

        {/* Multi-Modal Node Track (Metro - Bus - Auto Rickshaw) */}
        <div className="w-full bg-white/85 rounded-2xl border border-[#EDE8E1] p-3.5 mb-5 shadow-sm">
          <div className="relative flex items-center justify-between px-3">
            {/* Connecting Track Line */}
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-[#EDE8E1] rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#C49A43] to-transparent animate-pulseTrack" />
            </div>

            {/* Node 1: Metro */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-[#FAF0D9] border border-[#C49A43] flex items-center justify-center text-[#9A721C] shadow-xs">
                <TrainIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-[#1A2E3B]">Metro</span>
            </div>

            {/* Node 2: DTC Bus */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-[#EBF6EE] border border-[#166534] flex items-center justify-center text-[#166534] shadow-xs">
                <BusIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-[#166534]">DTC Bus</span>
            </div>

            {/* Node 3: Poochh-O Auto */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-[#FDF0EC] border border-[#A6533C] flex items-center justify-center text-[#A6533C] shadow-xs">
                <AutoRickshawIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-[#A6533C]">Auto</span>
            </div>
          </div>
        </div>

        {/* Real-time Status and Percent */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#7A7269]">
            <span className="truncate max-w-[240px] text-left">{statusText}</span>
            <span className="font-mono text-[#C49A43] font-extrabold">{progress}%</span>
          </div>

          {/* Track Bar */}
          <div className="w-full h-1.5 bg-[#EDE8E1] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C49A43] to-[#166534] rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
