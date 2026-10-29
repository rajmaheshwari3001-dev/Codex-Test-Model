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
        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20'
        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/90'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur-2xl shadow-xs">
      {/* 1. Global Live Line Health Ticker Sub-bar */}
      <div className="border-b border-slate-100 bg-[#080C16] text-white px-4 sm:px-6 py-1.5 text-[11px] font-medium overflow-x-auto no-scrollbar">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Delhi Transit Live Ticker
            </span>
            <span className="text-slate-500">|</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 shrink-0 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-2xs" />
              <strong className="text-slate-200">Blue Line:</strong>
              <span className="text-emerald-400 font-bold">Nominal (3m)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-2xs" />
              <strong className="text-slate-200">Green Line:</strong>
              <span className="text-emerald-400 font-bold">Nominal (4m)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 shadow-2xs" />
              <strong className="text-slate-200">Red Ring Bus:</strong>
              <span className="text-amber-400 font-bold">Active (+2m)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 shadow-2xs" />
              <strong className="text-slate-200">Yellow Express:</strong>
              <span className="text-emerald-400 font-bold">On Time (8m)</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-400 text-[10px]">
            <span>Active Window: 06:00 AM – 11:35 PM</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="mx-auto flex min-h-[68px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand & Identity */}
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1020] via-[#172554] to-[#1e3a8a] text-white shadow-lg shadow-slate-900/15 ring-1 ring-white/20">
            <span className="font-mono text-sm sm:text-base font-black tracking-tighter" aria-hidden="true">
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
              <span className="rounded-md bg-gradient-to-r from-blue-700 to-indigo-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xs">
                Delhi 3.0
              </span>
            </div>
            <p className="hidden text-xs font-semibold text-slate-500 sm:block">
              Public Transit Route Assistant & Intelligent Fleet Coordination
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
                ? 'Engine Online'
                : backendStatus === 'disconnected'
                ? 'Engine Offline'
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
            <span>Fleet Operations</span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
