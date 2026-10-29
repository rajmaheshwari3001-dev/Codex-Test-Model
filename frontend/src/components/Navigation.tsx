import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getHealth } from '../services/api'

export default function Navigation() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  useEffect(() => {
    let mounted = true
    getHealth()
      .then(res => {
        if (mounted && res.status === 'ok') setBackendStatus('connected')
      })
      .catch(() => {
        if (mounted) setBackendStatus('disconnected')
      })
    return () => {
      mounted = false
    }
  }, [])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-3 py-2 text-xs font-bold transition-colors focus:outline-none focus:ring-4 focus:ring-[#d9ed55]/25 sm:px-4 sm:text-sm ${
      isActive
        ? 'bg-[#d9ed55] text-[#172421]'
        : 'text-[#d1d8ce] hover:bg-[#293a35] hover:text-white'
    }`

  const statusLabel =
    backendStatus === 'connected'
      ? 'API online'
      : backendStatus === 'disconnected'
        ? 'API offline'
        : 'Connecting'

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#172421] text-[#f6f2e7] shadow-[0_8px_28px_-20px_rgba(12,21,18,0.8)]">
      <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#d9ed55] text-[#172421]">
            <span className="font-mono text-xs font-black tracking-tighter" aria-hidden="true">AS/</span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-black tracking-tight text-white sm:text-lg">
              Aaroh<span className="text-[#d9ed55]">—</span>Saarthi
            </div>
            <div className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-[#aeb9af] sm:block">
              Delhi transit field guide
            </div>
          </div>
          <span
            className={`hidden shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold sm:inline-flex ${
              backendStatus === 'connected'
                ? 'border-[#6f8851]/50 bg-[#293a35] text-[#d9ed55]'
                : backendStatus === 'disconnected'
                  ? 'border-[#a66e54]/50 bg-[#3b2e2a] text-[#ffd4b8]'
                  : 'border-white/15 bg-white/5 text-[#c8d0c8]'
            }`}
            title={backendStatus === 'connected' ? 'FastAPI backend connected' : 'Backend connection status'}
            aria-live="polite"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                backendStatus === 'connected'
                  ? 'bg-[#d9ed55]'
                  : backendStatus === 'disconnected'
                    ? 'bg-[#f0a77e]'
                    : 'bg-[#aeb9af]'
              }`}
              aria-hidden="true"
            />
            {statusLabel}
          </span>
        </div>

        <nav aria-label="Main navigation" className="flex shrink-0 items-center gap-1 rounded-2xl bg-[#25342f] p-1">
          <NavLink to="/" className={linkClass} end>
            Passenger
          </NavLink>
          <NavLink to="/fleet" className={linkClass}>
            <span className="hidden sm:inline">Fleet desk</span>
            <span className="sm:hidden">Fleet</span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
