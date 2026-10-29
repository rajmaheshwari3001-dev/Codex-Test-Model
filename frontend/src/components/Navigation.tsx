import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getHealth } from '../services/api'

export default function Navigation() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  useEffect(() => {
    let mounted = true
    getHealth()
      .then(res => {
        if (mounted && res.status === 'ok') {
          setBackendStatus('connected')
        }
      })
      .catch(() => {
        if (mounted) {
          setBackendStatus('disconnected')
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
    }`

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" aria-hidden="true" />
            <span className="text-lg font-bold tracking-tight text-indigo-700">Aaroh-Saarthi</span>
          </div>
          <span className="text-xs text-gray-500 hidden md:inline border-l border-gray-200 pl-3">
            Public Transit Assistant & Fleet Coordination
          </span>
          <span
            className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
              backendStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : backendStatus === 'disconnected'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-gray-100 text-gray-600'
            }`}
            title={backendStatus === 'connected' ? 'FastAPI Backend Connected' : 'Checking backend connection'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'connected'
                  ? 'bg-emerald-500'
                  : backendStatus === 'disconnected'
                  ? 'bg-amber-500'
                  : 'bg-gray-400'
              }`}
              aria-hidden="true"
            />
            {backendStatus === 'connected' ? 'API Online' : backendStatus === 'disconnected' ? 'API Offline' : 'Connecting...'}
          </span>
        </div>

        <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" className={linkClass} end>
            Passenger
          </NavLink>
          <NavLink to="/fleet" className={linkClass}>
            Fleet Intelligence
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
