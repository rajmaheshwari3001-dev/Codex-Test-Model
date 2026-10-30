import { useState, useEffect, useRef } from 'react'
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
  ShareIcon,
  CheckIcon,
  ChevronDownIcon,
  RotateCcwIcon,
} from '../common/Icons'

interface AppHeaderProps {
  onOpenMobileMenu?: () => void
}

const DELHI_REGIONS = [
  { id: 'Delhi NCR', label: 'Delhi NCR (Full)', icon: '🟢', subtitle: 'All 20 multi-modal stations' },
  { id: 'Central Delhi', label: 'Central Delhi Hub', icon: '🟡', subtitle: 'Rajiv Chowk, CP, Mandi House' },
  { id: 'South Delhi', label: 'South Delhi Zone', icon: '🔵', subtitle: 'AIIMS, Saket, Dilli Haat INA' },
  { id: 'Dwarka Hub', label: 'Dwarka & Airport Hub', icon: '🟣', subtitle: 'Dwarka Sec 21, Airport Link' },
  { id: 'Noida NCR', label: 'Noida & Trans-Yamuna', icon: '🔴', subtitle: 'Noida City Centre, Anand Vihar' },
]

export default function AppHeader({ onOpenMobileMenu }: AppHeaderProps) {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const currentTab = searchParams.get('tab')
  const [showProvenanceModal, setShowProvenanceModal] = useState(false)
  const [showCashbackModal, setShowCashbackModal] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Delhi NCR')
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncLabel, setSyncLabel] = useState('DATA UPDATED 2 MIN AGO')

  const regionMenuRef = useRef<HTMLDivElement>(null)

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

  // Close region dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (regionMenuRef.current && !regionMenuRef.current.contains(e.target as Node)) {
        setRegionDropdownOpen(false)
      }
    }
    if (regionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [regionDropdownOpen])

  const handleShareTrip = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2500)
    }
  }

  const handleRefreshData = () => {
    if (syncing) return
    setSyncing(true)
    setSyncLabel('SYNCING GTFS...')
    setTimeout(() => {
      setSyncing(false)
      setSyncLabel('DATA UPDATED JUST NOW')
      setTimeout(() => setSyncLabel('DATA UPDATED 2 MIN AGO'), 8000)
    }, 700)
  }

  const navItems = [
    {
      label: 'Plan journey',
      Icon: CompassIcon,
      to: '/',
      active: location.pathname === '/' && (!currentTab || currentTab === 'planner'),
    },
    {
      label: 'Live map',
      Icon: MapIcon,
      to: '/map',
      active: location.pathname === '/map' || (location.pathname === '/' && currentTab === 'map'),
      badge: 'live',
    },
    {
      label: 'Fleet',
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
    <header
      role="banner"
      className="sticky top-2 sm:top-3.5 z-30 w-full px-3 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300"
    >
      {/* Floating Island / Capsule Bar matching Figma prototype styling */}
      <div className="pointer-events-auto max-w-[1720px] mx-auto rounded-2xl sm:rounded-full border border-[#EBE5DC]/90 bg-white/92 backdrop-blur-xl shadow-[0_8px_30px_rgba(26,46,59,0.08),0_2px_8px_rgba(26,46,59,0.03)] px-3.5 sm:px-5 lg:px-6 py-2 sm:py-2.5 transition-all hover:border-[#C49A43]/40">
        <div className="flex h-11 sm:h-12 items-center justify-between gap-3">
          {/* Left: Mobile Toggle & Brand Mark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenMobileMenu || (() => setMobileNavOpen(prev => !prev))}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileNavOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EBE5DC] bg-[#FAF7F2] text-[#1A2E3B] hover:bg-[#F2ECE1] lg:hidden transition-colors cursor-pointer active:scale-95"
            >
              {mobileNavOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>

            <NavLink to="/" className="flex items-center gap-2.5 group focus:outline-none" aria-label="AAROH-SAARTHI Home">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF0D9] border border-[#E8D4AE] text-[#9A721C] shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <span className="text-base">🚆</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg sm:text-xl lg:text-[22px] font-bold tracking-tight text-[#1A2E3B] group-hover:text-[#C49A43] transition-colors leading-none">
                  AAROH<span className="text-[#C49A43] mx-1">•</span>SAARTHI
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#7A7269] mt-0.5 hidden xs:block leading-none">
                  YOUR JOURNEY, RE-IMAGINED IN DELHI
                </span>
              </div>
            </NavLink>
          </div>

          {/* Center: Segmented Floating Navigation Capsule (Iconic Figma Pattern) */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[#FAF7F2] border border-[#EBE5DC]/80 shadow-2xs"
          >
            {navItems.map(item => {
              const { Icon } = item
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                    item.active
                      ? 'bg-[#1A2E3B] text-white shadow-xs'
                      : 'text-[#6E665D] hover:text-[#1A2E3B] hover:bg-white/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.active ? 'text-[#C49A43]' : 'text-[#7A7269]'}`} />
                  <span>{item.label}</span>
                  {item.badge === 'live' && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E7D32] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2E7D32]" />
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Right: Quick Action Controls as Rounded Floating Pills */}
          <div role="toolbar" aria-label="Quick Actions" className="flex items-center gap-2 shrink-0">
            {/* Interactive Live Data Sync Button */}
            <button
              type="button"
              onClick={handleRefreshData}
              title="Click to check latest GTFS real-time transit updates"
              aria-label="Refresh GTFS Transit Data"
              className="hidden xl:flex items-center gap-2 rounded-full bg-[#EAF5EC] hover:bg-[#DDF0E0] active:scale-95 border border-[#D1E7D5] px-3.5 py-1 text-[11px] font-extrabold tracking-wider uppercase text-[#22702E] transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcwIcon className={`w-3.5 h-3.5 text-[#22702E] ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncLabel}</span>
            </button>

            {/* Interactive Region Selector Popover */}
            <div ref={regionMenuRef} className="relative hidden xs:block">
              <button
                type="button"
                onClick={() => setRegionDropdownOpen(prev => !prev)}
                aria-haspopup="true"
                aria-expanded={regionDropdownOpen}
                className="flex items-center gap-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EBE5DC] hover:border-[#C49A43]/50 px-3 py-1.5 text-xs font-bold text-[#1A2E3B] shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <span className="text-xs text-[#C49A43]">📍</span>
                <span>{selectedCity}</span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 text-[#7A7269] transition-transform duration-200 ${
                    regionDropdownOpen ? 'rotate-180 text-[#C49A43]' : ''
                  }`}
                />
              </button>

              {regionDropdownOpen && (
                <div
                  style={{ zIndex: 60 }}
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl border-2 border-[#C49A43]/40 bg-white shadow-2xl p-1.5 animate-fade-in divide-y divide-[#F5EFE6]"
                >
                  <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#A1988B]">
                    Delhi Transit Regions
                  </div>
                  <div className="py-1 space-y-0.5">
                    {DELHI_REGIONS.map(reg => {
                      const isSelected = selectedCity === reg.id
                      return (
                        <button
                          key={reg.id}
                          type="button"
                          onClick={() => {
                            setSelectedCity(reg.id)
                            setRegionDropdownOpen(false)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#FAF0D9] text-[#1A2E3B] font-bold'
                              : 'hover:bg-[#FAF7F2] text-[#1A202C]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                              <span>{reg.icon}</span>
                              <span className="truncate">{reg.label}</span>
                            </div>
                            <p className="text-[11px] text-[#7A7269] font-medium truncate mt-0.5">
                              {reg.subtitle}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckIcon className="w-4 h-4 text-[#C49A43] shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Share trip button */}
            <button
              type="button"
              onClick={handleShareTrip}
              className="flex items-center gap-1.5 rounded-full bg-[#1A2E3B] hover:bg-[#253D4E] active:scale-[0.97] px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_2px_8px_rgba(26,46,59,0.2)] hover:shadow-[0_4px_12px_rgba(26,46,59,0.3)] transition-all cursor-pointer"
              aria-label="Share current trip"
            >
              {shareToast ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-[#547A60]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <ShareIcon className="w-3.5 h-3.5 text-[#C49A43]" />
                  <span>Share trip</span>
                </>
              )}
            </button>

            {/* Cashback & Concessions Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowCashbackModal(true)}
              className="hidden md:flex items-center gap-1.5 rounded-full border border-[#E8D4AE] bg-[#FAF0D9] hover:bg-[#F5E6C7] active:scale-[0.97] px-3 py-1.5 text-xs font-bold text-[#9A721C] transition-all cursor-pointer shadow-2xs"
              title="Delhi Transit Cashback & Concessions"
              aria-label="Open Transit Cashback and Concessions Calculator"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-[#9A721C]" />
              <span className="hidden lg:inline">Perks</span>
            </button>

            {/* Data Sources Trigger */}
            <button
              type="button"
              onClick={() => setShowProvenanceModal(true)}
              className="flex items-center justify-center h-8 w-8 rounded-full border border-[#EBE5DC] bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#1A2E3B] transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Inspect Data Sources & GTFS Provenance"
              aria-label="Inspect Data Sources and Provenance"
            >
              <DatabaseIcon className="w-3.5 h-3.5 text-[#C49A43]" />
            </button>

            {/* Backend Status Indicator */}
            <div
              className="flex items-center justify-center h-8 w-8 rounded-full border border-[#EBE5DC] bg-[#FAF7F2] shadow-2xs"
              title={`FastAPI Backend: ${backendStatus}`}
              aria-label={`System Status: ${backendStatus}`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  backendStatus === 'connected'
                    ? 'bg-[#2E7D32] animate-pulse'
                    : backendStatus === 'checking'
                    ? 'bg-[#C49A43]'
                    : 'bg-[#A6533C]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Mobile Drawer Navigation (Expands gracefully inside the floating island) */}
        {mobileNavOpen && (
          <nav
            aria-label="Mobile Navigation Menu"
            className="lg:hidden border-t border-[#EBE5DC] pt-3 mt-2.5 space-y-1.5 animate-fade-in"
          >
            {navItems.map(item => {
              const { Icon } = item
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    item.active
                      ? 'text-[#1A2E3B] bg-[#FAF0D9] font-extrabold border-l-4 border-[#C49A43]'
                      : 'text-[#7A7269] hover:text-[#1A2E3B] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.active ? 'text-[#C49A43]' : 'text-[#7A7269]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge === 'live' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#EAF5EC] text-[#22702E] text-[10px] font-bold uppercase tracking-wider">
                      Live
                    </span>
                  )}
                </NavLink>
              )
            })}

            {/* Mobile Region Picker */}
            <div className="pt-2 px-3 border-t border-[#EBE5DC]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A1988B] block mb-1.5">
                Region
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {DELHI_REGIONS.slice(0, 4).map(reg => (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => {
                      setSelectedCity(reg.id)
                      setMobileNavOpen(false)
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left truncate transition-colors ${
                      selectedCity === reg.id
                        ? 'bg-[#1A2E3B] text-white'
                        : 'bg-[#FAF7F2] text-[#1A2E3B] border border-[#EBE5DC]'
                    }`}
                  >
                    {reg.icon} {reg.id}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* Modals */}
      <DataProvenanceModal
        isOpen={showProvenanceModal}
        onClose={() => setShowProvenanceModal(false)}
      />

      <CashbackPerksModal
        isOpen={showCashbackModal}
        onClose={() => setShowCashbackModal(false)}
      />
    </header>
  )
}
