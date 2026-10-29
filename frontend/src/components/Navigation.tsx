import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getHealth } from '../services/api'

export default function Navigation() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  useEffect(() => {
    let mounted = true
    getHealth()
      .then(res => {
        if (mounted) setBackendStatus(res.status === 'ok' ? 'connected' : 'disconnected')
      })
      .catch(() => {
        if (mounted) setBackendStatus('disconnected')
      })
    return () => {
      mounted = false
    }
  }, [])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/80'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-xs">
      <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand & Identity */}
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1020] to-[#172554] text-white shadow-md shadow-slate-900/10 ring-1 ring-white/20">
            <span className="font-mono text-sm font-black tracking-tighter" aria-hidden="true">
              AS
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg sm:text-xl font-black tracking-tight text-slate-950">
                Aaroh<span className="text-blue-600">—</span>Saarthi
              </h1>
              <span className="hidden sm:inline-block rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white">
                2.0
              </span>
            </div>
            <p className="hidden text-xs font-semibold text-slate-500 sm:block">
              Intelligent Public Transit Assistant & Fleet Coordination
            </p>
          </div>

          {/* Backend Status Pill */}
          <span
            className={`hidden md:inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
              backendStatus === 'connected'
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900 shadow-2xs'
                : backendStatus === 'disconnected'
                ? 'border-rose-200 bg-rose-50 text-rose-900 shadow-2xs'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
            title={
              backendStatus === 'connected'
                ? 'FastAPI Engine connected at http://localhost:8000'
                : 'Backend API offline'
            }
            aria-live="polite"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                backendStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : backendStatus === 'disconnected'
                  ? 'bg-rose-500'
                  : 'bg-slate-400'
              }`}
              aria-hidden="true"
            />
            <span>
              {backendStatus === 'connected'
                ? 'API Online'
                : backendStatus === 'disconnected'
                ? 'API Offline'
                : 'Connecting…'}
            </span>
          </span>
        </div>

        {/* Mode Navigation Switcher */}
        <nav
          aria-label="Experience switcher"
          className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-slate-100/90 p-1.5 shadow-inner"
        >
          <NavLink to="/" className={linkClass} end>
            <span className="text-base" aria-hidden="true">🗺️</span>
            <span>Passenger Navigator</span>
          </NavLink>
          <NavLink to="/fleet" className={linkClass}>
            <span className="text-base" aria-hidden="true">⚡</span>
            <span className="hidden sm:inline">Fleet Intelligence</span>
            <span className="sm:hidden">Fleet</span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
