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
      label: 'Fleet',
      Icon: BusIcon,
      to: '/fleet',
      active: location.pathname === '/fleet' && (!currentTab || currentTab === 'roster'),
    },
    {
      label: 'Insights',
      Icon: BarChartIcon,
      to: '/reports',
      active: location.pathname === '/reports',
    },
    {
      label: 'Disruptions',
      Icon: AlertTriangleIcon,
      to: '/fleet?tab=disruptions',
      active: location.pathname === '/fleet' && currentTab === 'disruptions',
      badgeCount: 1,
    },
  ]

  return (
    <header
      role="banner"
      className="sticky top-2 sm:top-3 z-30 w-full px-3 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300"
    >
      {/* Floating Island / Capsule Bar matching Figma prototype styling */}
      <div className="pointer-events-auto max-w-[1720px] mx-auto rounded-2xl sm:rounded-full border border-[#EDE8E1] bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(26,46,59,0.06),0_2px_6px_rgba(26,46,59,0.02)] px-4 sm:px-6 py-2.5 transition-all hover:border-[#C49A43]/40">
        <div className="flex h-12 sm:h-13 items-center justify-between gap-3">
          {/* Left: Brand Mark with Emblem & Tagline */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenMobileMenu || (() => setMobileNavOpen(prev => !prev))}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileNavOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EDE8E1] bg-[#FAF7F2] text-[#1A2E3B] hover:bg-[#F2ECE1] lg:hidden transition-colors cursor-pointer active:scale-95"
            >
              {mobileNavOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>

            <NavLink to="/" className="flex items-center gap-3 group focus:outline-none" aria-label="AAROH-SAARTHI Home">
              {/* Target Emblem: Circular Transit Icon */}
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF9EE] via-[#FAF0D9] to-[#EBD5A8] border-2 border-[#C49A43]/70 text-[#1A2E3B] shadow-sm group-hover:scale-105 transition-transform shrink-0 relative">
                <span className="text-lg">🚎</span>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#166534] border-2 border-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A2E3B] group-hover:text-[#C49A43] transition-colors leading-none">
                  AAROH<span className="text-[#C49A43] mx-1">•</span>SAARTHI
                </span>
                <span className="text-[11px] sm:text-[12px] font-medium text-[#7A7269] mt-1 hidden xs:block leading-none">
                  Move Smarter. A Greener Delhi.
                </span>
              </div>
            </NavLink>
          </div>

          {/* Center: Segmented Navigation Capsule matching target */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[#FAF7F2] border border-[#EDE8E1] shadow-2xs"
          >
            {navItems.map(item => {
              const { Icon } = item
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-200 cursor-pointer ${
                    item.active
                      ? 'bg-[#1A2E3B] text-white shadow-xs'
                      : 'text-[#6E665D] hover:text-[#1A2E3B] hover:bg-white/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-[#C49A43]' : 'text-[#7A7269]'}`} />
                  <span>{item.label}</span>
                  {item.badgeCount ? (
                    <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#E11D48] text-white text-[10px] font-mono font-bold leading-none">
                      {item.badgeCount}
                    </span>
                  ) : null}
                </NavLink>
              )
            })}

            {/* More dropdown */}
            <button
              type="button"
              onClick={() => setShowProvenanceModal(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-[13px] font-semibold text-[#6E665D] hover:text-[#1A2E3B] hover:bg-white/80 transition-colors cursor-pointer"
            >
              <span>More</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-[#7A7269]" />
            </button>
          </nav>

          {/* Right: Search Box, Dark Toggle, and User Profile (Matching Target) */}
          <div role="toolbar" aria-label="User Controls" className="flex items-center gap-2.5 shrink-0">
            {/* Search stations/routes input box */}
            <div className="hidden xl:flex items-center gap-2 bg-[#FAF7F2] border border-[#EDE8E1] rounded-full px-3.5 py-1.5 focus-within:border-[#C49A43] focus-within:ring-2 focus-within:ring-[#C49A43]/20 shadow-2xs">
              <span className="text-[#7A7269] text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search stations, routes..."
                className="bg-transparent text-xs sm:text-[13px] text-[#1A2E3B] placeholder-[#9C9488] focus:outline-none w-36 lg:w-44 font-medium"
              />
              <span className="text-[10px] font-mono font-bold text-[#A8A196] bg-white border border-[#EDE8E1] rounded px-1.5 py-0.5">
                ⌘K
              </span>
            </div>

            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              title="Toggle Dark / Light Theme"
              aria-label="Toggle Theme"
              className="flex items-center justify-center h-9 w-9 rounded-full border border-[#EDE8E1] bg-[#FAF7F2] hover:bg-[#F2ECE1] text-[#1A2E3B] transition-colors cursor-pointer shadow-2xs active:scale-95"
            >
              <span className="text-sm">🌙</span>
            </button>

            {/* User Profile Pill ("Hi, Raj ▾") */}
            <div className="flex items-center gap-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#EDE8E1] rounded-full pl-1.5 pr-3 py-1 cursor-pointer transition-colors shadow-2xs">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A338] to-[#B38728] text-white font-bold text-xs shadow-xs">
                R
              </div>
              <span className="text-xs sm:text-[13px] font-bold text-[#1A2E3B]">Hi, Raj</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-[#7A7269]" />
            </div>

            {/* Quick Action Perks Trigger (Mobile/Tablet) */}
            <button
              type="button"
              onClick={() => setShowCashbackModal(true)}
              className="flex md:hidden items-center justify-center h-9 w-9 rounded-full border border-[#EDE8E1] bg-[#FAF0D9] text-[#9A721C] transition-colors cursor-pointer shadow-2xs"
              title="Perks"
            >
              <SparklesIcon className="w-4 h-4 text-[#9A721C]" />
            </button>
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
