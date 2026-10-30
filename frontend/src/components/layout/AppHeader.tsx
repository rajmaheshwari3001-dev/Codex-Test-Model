import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getHealth } from '../../services/api'
import DataProvenanceModal from '../DataProvenanceModal'
import CashbackPerksModal from '../journey/CashbackPerksModal'
import {
  CompassIcon,
  MapIcon,
  BusIcon,
  AlertTriangleIcon,
  BarChartIcon,
  SparklesIcon,
  DatabaseIcon,
  MapPinIcon,
  MenuIcon,
  XIcon,
} from '../common/Icons'

interface AppHeaderProps {
  onOpenMobileMenu?: () => void
}

export default function AppHeader({ onOpenMobileMenu }: AppHeaderProps) {
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
      Icon: CompassIcon,
      to: '/',
      active: location.pathname === '/' && (!currentTab || currentTab === 'planner'),
    },
    {
      label: 'Live Map',
      Icon: MapIcon,
      to: '/map',
      active: location.pathname === '/map' || (location.pathname === '/' && currentTab === 'map'),
    },
    {
      label: 'Fleet Operations',
      Icon: BusIcon,
      to: '/fleet',
      active: location.pathname === '/fleet' && (!currentTab || currentTab === 'roster'),
    },
    {
      label: 'Disruptions',
      Icon: AlertTriangleIcon,
      to: '/fleet?tab=disruptions',
      active: location.pathname === '/fleet' && currentTab === 'disruptions',
    },
    {
      label: 'Analytics',
      Icon: BarChartIcon,
      to: '/reports',
      active: location.pathname === '/reports',
    },
  ]

  return (
    <header role="banner" className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 shadow-xs">
      <div className="flex h-16 items-center justify-between gap-3 max-w-[1720px] mx-auto">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileMenu || (() => setMobileNavOpen(prev => !prev))}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileNavOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 lg:hidden transition-colors"
          >
            {mobileNavOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>

          <NavLink to="/" className="flex flex-col group focus:outline-none" aria-label="AAROH-SAARTHI Home">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                AAROH<span className="text-blue-600">—</span>SAARTHI
              </span>
              <span className="hidden sm:inline-block h-2 w-2 rounded-full bg-blue-600 animate-pulse-glow" />
            </div>
            <span className="text-[11px] font-medium tracking-wide text-slate-500 -mt-0.5 hidden xs:block">
              Intelligent Delhi Transit & Fleet Platform
            </span>
          </NavLink>
        </div>

        {/* Center: Desktop Navigation Tabs with crisp SVG icons */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map(item => {
            const { Icon } = item
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  item.active
                    ? 'text-blue-700 bg-blue-50/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.active ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-blue-600 rounded-full animate-fade-in" />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Right: Quick Action Controls */}
        <div role="toolbar" aria-label="Quick Actions" className="flex items-center gap-2 shrink-0">
          {/* Cashback & Savings Button */}
          <button
            type="button"
            onClick={() => setShowCashbackModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            title="Delhi Transit Cashback, Metro Smart Card 10%-20% discount & Concessions"
            aria-label="Open Transit Cashback and Concessions Calculator"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Cashback & Savings</span>
            <span className="sm:hidden text-[11px] font-extrabold">-20%</span>
          </button>

          {/* Data Sources Button (Never Hidden) */}
          <button
            type="button"
            onClick={() => setShowProvenanceModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
            title="Inspect GTFS Feeds & Statutory Provenance"
            aria-label="Inspect Data Sources and Provenance"
          >
            <DatabaseIcon className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline text-xs">Data Sources</span>
          </button>

          {/* Location Selector */}
          <div className="hidden xs:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">
            <MapPinIcon className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              aria-label="Select Transit Region"
            >
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Central Delhi">Central Delhi</option>
              <option value="South Delhi">South Delhi</option>
              <option value="Dwarka Hub">Dwarka Hub</option>
            </select>
          </div>

          {/* Backend Status Pulse */}
          <div
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-slate-50"
            title={`FastAPI Backend: ${backendStatus}`}
            aria-label={`System Status: ${backendStatus}`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                backendStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse-glow'
                  : backendStatus === 'disconnected'
                  ? 'bg-red-500'
                  : 'bg-amber-400'
              }`}
            />
          </div>

          {/* Commuter Profile Badge */}
          <button
            type="button"
            onClick={() => setShowCashbackModal(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold border border-slate-700 shadow-2xs hover:ring-2 hover:ring-blue-500/30 transition-all cursor-pointer"
            title="Commuter Account & Card Profile"
            aria-label="Commuter Transit Profile"
          >
            AS
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Navigation */}
      {mobileNavOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden border-t border-slate-200 py-3 px-2 bg-white animate-fade-in-down space-y-1.5"
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {navItems.map(item => {
              const { Icon } = item
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-bold transition-all ${
                    item.active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      )}

      {/* Data Sources Modal */}
      <DataProvenanceModal
        isOpen={showProvenanceModal}
        onClose={() => setShowProvenanceModal(false)}
      />

      {/* Cashback Calculator Modal */}
      <CashbackPerksModal
        isOpen={showCashbackModal}
        onClose={() => setShowCashbackModal(false)}
      />
    </header>
  )
}
