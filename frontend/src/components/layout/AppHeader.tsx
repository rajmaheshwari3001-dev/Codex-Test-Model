import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getHealth } from '../../services/api'
import DataProvenanceModal from '../DataProvenanceModal'
import CashbackPerksModal from '../journey/CashbackPerksModal'

interface Props {
  onOpenMobileMenu?: () => void
}

export default function AppHeader({ onOpenMobileMenu }: Props) {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const currentTab = searchParams.get('tab')
  const [showProvenanceModal, setShowProvenanceModal] = useState(false)
  const [showCashbackModal, setShowCashbackModal] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Delhi NCR')
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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
    <header role="banner" className="sticky top-0 z-40 w-full border-b border-[#DAD3C6] bg-[#FBF8F1]/95 backdrop-blur-md px-3 sm:px-6 lg:px-8 shadow-xs">
      <div className="flex h-16 items-center justify-between gap-2 sm:gap-4 max-w-[1720px] mx-auto">
        {/* Left Section: Mobile Menu Button + Serif Brand Mark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileNavOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DAD3C6] bg-[#F5F0E6] text-[#29343A] hover:bg-[#EDE7DB] lg:hidden transition-colors"
          >
            <span className="text-base font-bold">{mobileNavOpen ? '✕' : '☰'}</span>
          </button>

          <NavLink to="/" className="flex flex-col group focus:outline-none" aria-label="AAROH-SAARTHI Home">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-[#172D3B]">
                AAROH<span className="text-[#C49A43]">—</span>SAARTHI
              </span>
              <span className="hidden sm:inline-block h-2 w-2 rounded-full bg-[#C49A43] animate-pulse-glow" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium tracking-wide text-[#73766F] -mt-0.5 hidden xs:block">
              Your journey. A smarter Delhi.
            </span>
          </NavLink>
        </div>

        {/* Center Section: Desktop Pill Navigation */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map(item => (
            <NavLink
              key={item.label}
              to={item.to}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                item.active
                  ? 'text-[#172D3B] font-bold bg-[#EDE7DB] shadow-2xs'
                  : 'text-[#73766F] hover:text-[#172D3B] hover:bg-[#EDE7DB]/50'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span>{item.label}</span>
              {item.active && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#C49A43] rounded-full animate-fade-in" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Section: Perks & Cashback, Data Sources, City Picker, Status Dot, Profile */}
        <div role="toolbar" aria-label="Quick Actions" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Cashback & Commuter Savings Button (Never Hidden) */}
          <button
            type="button"
            onClick={() => setShowCashbackModal(true)}
            className="flex items-center gap-1 rounded-lg border border-[#C49A43]/50 bg-[#F7F1E5] hover:bg-[#F5EBD6] px-2 sm:px-2.5 py-1.5 text-xs font-bold text-[#A97C2E] transition-all duration-200 shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            title="Delhi Transit Cashback, Metro Smart Card 10%-20% discount & Concessions"
            aria-label="Open Transit Cashback and Concessions Calculator"
          >
            <span>💰</span>
            <span className="hidden sm:inline">Cashback & Savings</span>
            <span className="sm:hidden text-[11px] font-extrabold">-20%</span>
          </button>

          {/* Data Sources Modal Trigger (Never Hidden on Mobile!) */}
          <button
            type="button"
            onClick={() => setShowProvenanceModal(true)}
            className="flex items-center gap-1 rounded-lg border border-[#DAD3C6] bg-[#F5F0E6] hover:bg-[#EDE7DB] hover:border-[#C49A43] px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-[#172D3B] transition-colors shadow-2xs"
            title="Inspect GTFS Feeds & Statutory Provenance"
            aria-label="Inspect Data Sources and Provenance"
          >
            <span>📦</span>
            <span className="hidden md:inline text-[11px]">Data Sources</span>
          </button>

          {/* Location Selector (Delhi NCR) */}
          <div className="hidden xs:flex items-center gap-1 rounded-lg border border-[#DAD3C6] bg-[#F5F0E6] px-2 py-1 text-xs font-semibold text-[#29343A]">
            <span className="text-[#C49A43] text-xs">📍</span>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#172D3B] focus:outline-none cursor-pointer"
              aria-label="Select Transit Region"
            >
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Central Delhi">Central Delhi</option>
              <option value="South Delhi">South Delhi</option>
              <option value="Dwarka Hub">Dwarka Hub</option>
            </select>
          </div>

          {/* Live Backend Health Dot */}
          <div
            className={`flex items-center justify-center h-7 w-7 rounded-lg border border-[#DAD3C6] bg-[#F5F0E6] transition-colors`}
            title={`FastAPI Backend: ${backendStatus}`}
            aria-label={`System Status: ${backendStatus}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                backendStatus === 'connected'
                  ? 'bg-[#547A60] animate-pulse-glow'
                  : backendStatus === 'disconnected'
                  ? 'bg-[#A64C42]'
                  : 'bg-amber-400'
              }`}
            />
          </div>

          {/* Commuter Profile Avatar */}
          <button
            type="button"
            onClick={() => setShowCashbackModal(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172D3B] text-white text-xs font-bold border border-[#C49A43]/60 shadow-2xs hover:ring-2 hover:ring-[#C49A43]/40 transition-all cursor-pointer"
            title="Commuter Account & Card Profile"
            aria-label="Commuter Transit Profile"
          >
            AS
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Slide-Down Navigation Shelf */}
      {mobileNavOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden border-t border-[#DAD3C6] py-3 px-2 bg-[#FBF8F1] animate-fade-in-down space-y-1.5"
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {navItems.map(item => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-all ${
                  item.active
                    ? 'bg-[#172D3B] text-white shadow-xs'
                    : 'bg-[#F5F0E6] text-[#29343A] hover:bg-[#EDE7DB]'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {/* Data Sources Modal */}
      <DataProvenanceModal
        isOpen={showProvenanceModal}
        onClose={() => setShowProvenanceModal(false)}
      />

      {/* Commuter Perks & Cashback Calculator Modal */}
      <CashbackPerksModal
        isOpen={showCashbackModal}
        onClose={() => setShowCashbackModal(false)}
      />
    </header>
  )
}
