import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getHealth } from '../../services/api'
import DataProvenanceModal from '../DataProvenanceModal'

interface Props {
  onOpenMobileMenu?: () => void
}

export default function AppHeader({ onOpenMobileMenu }: Props) {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const currentTab = searchParams.get('tab')
  const [showProvenanceModal, setShowProvenanceModal] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Delhi NCR')
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

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

  const navItems = [
    {
      label: 'Plan Journey',
      icon: '🧭',
      to: '/',
      active: location.pathname === '/' && (!currentTab || currentTab === 'planner'),
    },
    {
      label: 'Live Map',
      icon: '🗺️',
      to: '/map',
      active: location.pathname === '/map' || (location.pathname === '/' && currentTab === 'map'),
    },
    {
      label: 'Fleet',
      icon: '🚍',
      to: '/fleet',
      active: location.pathname === '/fleet' && (!currentTab || currentTab === 'roster'),
    },
    {
      label: 'Disruptions',
      icon: '⚠️',
      to: '/fleet?tab=disruptions',
      active: location.pathname === '/fleet' && currentTab === 'disruptions',
    },
    {
      label: 'Analytics',
      icon: '📋',
      to: '/reports',
      active: location.pathname === '/reports',
    },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#DAD3C6] bg-[#FBF8F1] px-4 sm:px-6 lg:px-8 shadow-xs">
      <div className="flex h-16 items-center justify-between gap-4 max-w-[1720px] mx-auto">
        {/* Left Side: Brand Wordmark with Serif Typography */}
        <div className="flex items-center gap-3 shrink-0">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="rounded-lg p-1.5 text-[#29343A] hover:bg-[#EDE7DB] lg:hidden"
              aria-label="Toggle menu"
            >
              <span className="text-xl">☰</span>
            </button>
          )}

          <NavLink to="/" className="flex flex-col group">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#172D3B]">
                AAROH<span className="text-[#C49A43]">—</span>SAARTHI
              </span>
              <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-[#C49A43]" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium tracking-wide text-[#73766F] -mt-0.5">
              Your journey. A smarter Delhi.
            </span>
          </NavLink>
        </div>

        {/* Center / Navigation Links with Restrained Gold Active State */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map(item => (
            <NavLink
              key={item.label}
              to={item.to}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                item.active
                  ? 'text-[#172D3B] font-bold bg-[#EDE7DB]'
                  : 'text-[#73766F] hover:text-[#29343A] hover:bg-[#EDE7DB]/50'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
              {item.active && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#C49A43] rounded-full" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Side: City Selector, Data Sources, and Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Data Sources Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowProvenanceModal(true)}
            className="hidden sm:flex items-center gap-1 rounded-md border border-[#DAD3C6] bg-[#F5F0E6] px-2.5 py-1 text-xs font-semibold text-[#172D3B] hover:bg-[#EDE7DB] hover:border-[#C49A43] transition-colors"
            title="Inspect Data Sources & Provenance"
          >
            <span className="text-xs">📦</span>
            <span className="text-[11px]">Data Sources</span>
          </button>

          {/* Location Selector (Delhi NCR) */}
          <div className="flex items-center gap-1.5 rounded-md border border-[#DAD3C6] bg-[#F5F0E6] px-2.5 py-1 text-xs font-semibold text-[#29343A]">
            <span className="text-[#C49A43] text-xs">📍</span>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#172D3B] focus:outline-none cursor-pointer"
            >
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Central Delhi">Central Delhi</option>
              <option value="South Delhi">South Delhi</option>
              <option value="Dwarka Hub">Dwarka Hub</option>
            </select>
            {/* Backend Health Dot */}
            <span
              className={`h-2 w-2 rounded-full ml-1 ${
                backendStatus === 'connected'
                  ? 'bg-[#547A60]'
                  : backendStatus === 'disconnected'
                  ? 'bg-[#A64C42]'
                  : 'bg-amber-400'
              }`}
              title={`FastAPI Backend: ${backendStatus}`}
            />
          </div>

          {/* Profile Avatar */}
          <div className="flex items-center gap-2 pl-1">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172D3B] text-white text-xs font-bold border border-[#C49A43]/50 shadow-xs cursor-pointer hover:ring-2 hover:ring-[#C49A43]/30 transition-all"
              title="Commuter Profile: Delhi Transit Account"
            >
              AS
            </div>
          </div>
        </div>
      </div>

      <DataProvenanceModal
        isOpen={showProvenanceModal}
        onClose={() => setShowProvenanceModal(false)}
      />
    </header>
  )
}
