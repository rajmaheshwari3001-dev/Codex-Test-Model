import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getHealth } from '../../services/api'
import DataProvenanceModal from '../DataProvenanceModal'
import CashbackPerksModal from '../journey/CashbackPerksModal'
import { CANONICAL_DELHI_STOPS } from '../../utils/figmaRoutes'
import { DELHI_STATION_METADATA } from '../../utils/transitData'
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
  SearchIcon,
  TrainIcon,
} from '../common/Icons'

interface AppHeaderProps {
  onOpenMobileMenu?: () => void
}

const DELHI_REGIONS = [
  { id: 'Delhi NCR', label: 'Delhi NCR (Full)', subtitle: 'All 20 multi-modal stations' },
  { id: 'Central Delhi', label: 'Central Delhi Hub', subtitle: 'Rajiv Chowk, CP, Mandi House' },
  { id: 'South Delhi', label: 'South Delhi Zone', subtitle: 'AIIMS, Saket, Dilli Haat INA' },
  { id: 'Dwarka Hub', label: 'Dwarka & Airport Hub', subtitle: 'Dwarka Sec 21, Airport Link' },
  { id: 'Noida NCR', label: 'Noida & Trans-Yamuna', subtitle: 'Noida City Centre, Anand Vihar' },
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

  const navigate = useNavigate()
  // Global Header Transit Search State
  const [headerSearchQuery, setHeaderSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter stations based on user search query
  const filteredHeaderStops = useMemo(() => {
    const q = headerSearchQuery.trim().toLowerCase()
    if (!q) {
      // Default: Return 5 major Delhi Transit Hubs
      return CANONICAL_DELHI_STOPS.filter(s =>
        ['S01', 'S02', 'S04', 'S13', 'S19'].includes(s.stop_id)
      )
    }
    return CANONICAL_DELHI_STOPS.filter(s => {
      const meta = DELHI_STATION_METADATA[s.stop_id]
      const nameMatch = s.stop_name.toLowerCase().includes(q)
      const landmarkMatch = meta?.landmark?.toLowerCase().includes(q)
      const lineMatch = meta?.interchanges?.some(i => i.toLowerCase().includes(q))
      return nameMatch || landmarkMatch || lineMatch
    }).slice(0, 7)
  }, [headerSearchQuery])

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [searchOpen])

  // Ctrl+K / Cmd+K shortcut to focus search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        setSearchOpen(true)
      } else if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelectStation = (stopId: string, type: 'destination' | 'origin' = 'destination') => {
    setHeaderSearchQuery('')
    setSearchOpen(false)
    if (location.pathname !== '/' && location.pathname !== '/map') {
      navigate('/')
    }
    window.dispatchEvent(
      new CustomEvent('aaroh_station_select', {
        detail: { stopId, type },
      })
    )
    const stName = CANONICAL_DELHI_STOPS.find(s => s.stop_id === stopId)?.stop_name || stopId
    setAuthToast(`Route ${type === 'origin' ? 'starting from' : 'heading to'} ${stName}`)
    setTimeout(() => setAuthToast(''), 3000)
  }

  // User Authentication & Profile State
  const [user, setUser] = useState<{
    name: string
    email: string
    cardBalance: number
    isLoggedIn: boolean
  }>(() => {
    try {
      const saved = localStorage.getItem('aaroh_user')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      name: 'Raj',
      email: 'raj.commuter@delhitransit.gov.in',
      cardBalance: 240,
      isLoggedIn: true,
    }
  })
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginName, setLoginName] = useState('Raj')
  const [loginPhone, setLoginPhone] = useState('9876543210')
  const [authToast, setAuthToast] = useState('')

  // Night / Day Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('aaroh_theme')
      if (saved === 'dark' || saved === 'light') return saved
    } catch {}
    return 'light'
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem('aaroh_theme', theme)
    } catch {}
    window.dispatchEvent(new CustomEvent('aaroh_theme_change', { detail: { theme } }))
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    setAuthToast(next === 'dark' ? 'Night Mode activated (Dark Map & HUD)' : 'Day Mode activated (Sandstone Map)')
    setTimeout(() => setAuthToast(''), 2500)
  }

  const regionMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close login modal on Escape key press
  useEffect(() => {
    if (!showLoginModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLoginModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLoginModal])

  // Save user changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aaroh_user', JSON.stringify(user))
    } catch {}
  }, [user])

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const handleLogout = () => {
    setUser({
      name: 'Guest',
      email: '',
      cardBalance: 0,
      isLoggedIn: false,
    })
    setUserMenuOpen(false)
    setAuthToast('Signed out. You are now browsing as a Guest commuter.')
    setTimeout(() => setAuthToast(''), 3500)
  }

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const name = loginName.trim() || 'Raj'
    setUser({
      name,
      email: `${name.toLowerCase()}.commuter@delhitransit.gov.in`,
      cardBalance: 240,
      isLoggedIn: true,
    })
    setShowLoginModal(false)
    setUserMenuOpen(false)
    setAuthToast(`Welcome back, ${name}! Your DMRC SmartCard & Passes are active.`)
    setTimeout(() => setAuthToast(''), 3500)
  }

  const handleTopupCard = () => {
    setUser(prev => ({ ...prev, cardBalance: prev.cardBalance + 100 }))
    setAuthToast('₹100 topped up to DMRC SmartCard! New balance: ₹' + (user.cardBalance + 100))
    setTimeout(() => setAuthToast(''), 3500)
  }

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
      className="sticky top-2 sm:top-3 z-[1000] w-full px-3 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300 animate-page-slide-down"
    >
      {/* Floating Island / Capsule Bar matching Figma prototype styling */}
      <div className="pointer-events-auto max-w-[1720px] mx-auto rounded-2xl sm:rounded-full border border-[#E5E0D8] bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(26,46,59,0.06),0_2px_6px_rgba(26,46,59,0.02)] px-4 sm:px-6 py-2.5 transition-all hover:border-[#D6A33B]/40">
        <div className="flex h-12 sm:h-13 items-center justify-between gap-3">
          {/* Left: Brand Mark with Emblem & Tagline */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenMobileMenu || (() => setMobileNavOpen(prev => !prev))}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileNavOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E0D8] bg-[#F7F5F0] text-[#142B38] hover:bg-[#F2ECE1] lg:hidden transition-colors cursor-pointer active:scale-95"
            >
              {mobileNavOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>

            <NavLink to="/" className="flex items-center gap-3 group focus:outline-none" aria-label="AAROH-SAARTHI Home">
              {/* Target Emblem: Circular Transit Icon */}
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF9EE] via-[#FAF0D9] to-[#EBD5A8] border-2 border-[#D6A33B]/70 text-[#142B38] shadow-sm group-hover:scale-105 transition-transform shrink-0 relative">
                <TrainIcon className="w-5 h-5 text-[#9A721C]" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#176B43] border-2 border-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-bold text-xl sm:text-2xl font-bold tracking-tight text-[#142B38] group-hover:text-[#D6A33B] transition-colors leading-none">
                  AAROH<span className="text-[#D6A33B] mx-1">•</span>SAARTHI
                </span>
                <span className="text-[11px] sm:text-[12px] font-sans font-medium text-[#7A7269] mt-1 hidden xs:block leading-none">
                  Move Smarter. A Greener Delhi.
                </span>
              </div>
            </NavLink>
          </div>

          {/* Center: Segmented Navigation Capsule matching target */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[#F7F5F0] border border-[#E5E0D8] shadow-2xs"
          >
            {navItems.map(item => {
              const { Icon } = item
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-200 cursor-pointer ${
                    item.active
                      ? 'bg-[#142B38] text-white shadow-xs'
                      : 'text-[#6E665D] hover:text-[#142B38] hover:bg-white/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-[#D6A33B]' : 'text-[#7A7269]'}`} />
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
              className="flex items-center gap-1 px-3 py-2 rounded-full text-[13px] font-semibold text-[#6E665D] hover:text-[#142B38] hover:bg-white/80 transition-colors cursor-pointer"
            >
              <span>More</span>
              <ChevronDownIcon className="w-3.5 h-3.5 text-[#7A7269]" />
            </button>
          </nav>

          {/* Right: Search Box, Dark Toggle, and User Profile (Matching Target) */}
          <div role="toolbar" aria-label="User Controls" className="flex items-center gap-2.5 shrink-0">
            {/* Search stations/routes input box (Live Search with Autocomplete) */}
            <div ref={searchRef} className="relative hidden sm:flex items-center">
              <div
                className={`flex items-center gap-2 rounded-full border transition-all duration-300 ${
                  searchOpen
                    ? 'w-72 xl:w-84 bg-white border-[#D6A33B] ring-2 ring-[#D6A33B]/20 shadow-md'
                    : 'w-48 xl:w-60 bg-[#F7F5F0] border-[#E5E0D8] hover:border-[#D6A33B]/50 shadow-2xs'
                } px-3.5 py-1.5`}
              >
                <SearchIcon className="w-3.5 h-3.5 text-[#D6A33B] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={headerSearchQuery}
                  onChange={e => {
                    setHeaderSearchQuery(e.target.value)
                    setSearchOpen(true)
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (filteredHeaderStops.length > 0) {
                        handleSelectStation(filteredHeaderStops[0].stop_id, 'destination')
                      }
                    } else if (e.key === 'Escape') {
                      setSearchOpen(false)
                    }
                  }}
                  placeholder="Search stations, routes..."
                  aria-label="Search Delhi transit network"
                  className="bg-transparent text-xs sm:text-[13px] text-[#142B38] placeholder-[#9C9488] focus:outline-none w-full font-semibold"
                />
                {headerSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderSearchQuery('')
                      setSearchOpen(false)
                    }}
                    className="text-[#7A7269] hover:text-[#142B38] p-0.5 cursor-pointer text-xs"
                    aria-label="Clear search query"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span
                    onClick={() => {
                      searchInputRef.current?.focus()
                      setSearchOpen(true)
                    }}
                    className="text-[10px] font-mono font-bold text-[#A8A196] bg-white border border-[#E5E0D8] rounded px-1.5 py-0.5 cursor-pointer hover:border-[#D6A33B] shrink-0"
                    title="Press ⌘K or Ctrl+K to search"
                  >
                    ⌘K
                  </span>
                )}
              </div>

              {/* Autocomplete Dropdown Menu */}
              {searchOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xl p-2 z-[700] animate-fade-in divide-y divide-[#F5EFE6]">
                  <div className="px-2.5 py-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[#A1988B]">
                    <span>{headerSearchQuery ? 'Matching Stations' : 'Popular Delhi Hubs'}</span>
                    <span>{filteredHeaderStops.length} Found</span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#F5EFE6]/60 scrollbar-thin py-1">
                    {filteredHeaderStops.length > 0 ? (
                      filteredHeaderStops.map(s => {
                        const meta = DELHI_STATION_METADATA[s.stop_id]
                        const linesStr = meta?.interchanges?.slice(0, 2).join(' • ') || 'DMRC Network'

                        return (
                          <div
                            key={s.stop_id}
                            className="p-2 sm:p-2.5 rounded-xl hover:bg-[#F7F5F0] transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                            onClick={() => handleSelectStation(s.stop_id, 'destination')}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF0D9] text-[#9A721C] font-bold shrink-0 group-hover:bg-[#D6A33B] group-hover:text-white transition-colors">
                                <TrainIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs sm:text-[13px] font-bold text-[#142B38] truncate">
                                  {s.stop_name}
                                </div>
                                <div className="text-[10px] text-[#7A7269] truncate">
                                  Zone {s.zone_id} • {linesStr}
                                </div>
                              </div>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation()
                                  handleSelectStation(s.stop_id, 'origin')
                                }}
                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#FAF0D9] text-[#9A721C] hover:bg-[#F2E5C9] transition-colors cursor-pointer"
                                title="Set as Departure Origin"
                              >
                                From
                              </button>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation()
                                  handleSelectStation(s.stop_id, 'destination')
                                }}
                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#142B38] text-white hover:bg-[#253D4E] transition-colors cursor-pointer"
                                title="Set as Destination and Plan Route"
                              >
                                To →
                              </button>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="py-6 px-4 text-center text-xs text-[#7A7269] space-y-1">
                        <p className="font-bold text-[#142B38]">No stations matching "{headerSearchQuery}"</p>
                        <p className="text-[11px]">Try searching Rajiv Chowk, Kashmere Gate, Dwarka, or Hauz Khas.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Night / Day Mode Toggle (Fully Functional) */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Day Mode (Light)' : 'Switch to Night Mode (Dark)'}
              aria-label={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
              className={`flex items-center justify-center h-9 w-9 rounded-full border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                theme === 'dark'
                  ? 'bg-[#1E293B] text-[#F59E0B] border-[#F59E0B]/50 hover:bg-[#334155] shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-[#F7F5F0] hover:bg-[#F2ECE1] text-[#6E665D] hover:text-[#142B38] border-[#E5E0D8]'
              }`}
            >
              {theme === 'dark' ? (
                // Sun Icon (Day Mode)
                <svg className="w-4 h-4 text-[#F59E0B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                // Moon Icon (Night Mode)
                <svg className="w-4 h-4 text-[#6E665D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* User Profile Pill & Interactive Auth Dropdown */}
            <div ref={userMenuRef} className="relative">
              {user.isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 bg-[#F7F5F0] hover:bg-[#F2ECE1] border border-[#E5E0D8] hover:border-[#D6A33B] rounded-full pl-1.5 pr-3 py-1 cursor-pointer transition-colors shadow-2xs"
                  aria-expanded={userMenuOpen}
                  aria-label="User profile and transit account menu"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A338] to-[#B38728] text-white font-bold text-xs shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs sm:text-[13px] font-bold text-[#142B38]">Hi, {user.name}</span>
                  <ChevronDownIcon className={`w-3.5 h-3.5 text-[#7A7269] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-1.5 bg-[#FAF0D9] hover:bg-[#F2E5C9] border border-[#E8D4AE] text-[#9A721C] rounded-full px-3 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                  aria-label="Sign in to your Delhi Transit account"
                >
                  <span className="w-2 h-2 rounded-full bg-[#D6A33B]" />
                  <span>Sign In</span>
                </button>
              )}

              {/* User Profile Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-[#EBE5DC] bg-white p-4 shadow-xl z-[600] animate-fade-in space-y-3.5">
                  {/* Commuter Header */}
                  <div className="flex items-center gap-3 border-b border-[#F0EAE1] pb-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A338] to-[#B38728] text-white font-bold text-base shadow-xs shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[#142B38] truncate">{user.name} Maheshwari</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Commuter" />
                      </div>
                      <div className="text-[11px] text-[#7A7269] truncate">{user.email}</div>
                      <div className="inline-block text-[9px] font-extrabold uppercase tracking-wider text-[#D6A33B] bg-[#FAF0D9] px-1.5 py-0.5 rounded mt-1">
                        Verified Commuter • #DL-8821
                      </div>
                    </div>
                  </div>

                  {/* DMRC SmartCard Balance Card */}
                  <div className="rounded-xl border border-[#E5E0D8] bg-[#F7F5F0] p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#7A7269]">DMRC Metro SmartCard</span>
                      <span className="font-mono text-[11px] text-[#9A721C] font-extrabold">20% Off-Peak Active</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-sans font-bold text-2xl font-bold text-[#142B38] tabular-nums">
                        ₹{user.cardBalance}.00
                      </span>
                      <button
                        type="button"
                        onClick={handleTopupCard}
                        className="text-xs font-bold text-white bg-[#D6A33B] hover:bg-[#B38728] px-2.5 py-1 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-95"
                      >
                        + ₹100 Top-up
                      </button>
                    </div>
                  </div>

                  {/* Quick Concessions */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-[#F7F5F0] text-[#142B38]">
                      <span className="flex items-center gap-2 font-medium">
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>DTC Pink Pass Scheme</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Eligible</span>
                    </div>
                    <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-[#F7F5F0] text-[#142B38]">
                      <span className="flex items-center gap-2 font-medium">
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Green Carbon Saver</span>
                      </span>
                      <span className="text-[10px] font-bold text-[#D6A33B]">1.4 kg CO₂ saved</span>
                    </div>
                  </div>

                  {/* Links & Actions */}
                  <div className="border-t border-[#F0EAE1] pt-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCashbackModal(true)
                        setUserMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-[#142B38] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
                    >
                      <span>Fare Concessions & Cashback</span>
                      <span className="text-[#D6A33B]">→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProvenanceModal(true)
                        setUserMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-[#142B38] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
                    >
                      <span>Transit Data Sources & GTFS</span>
                      <span className="text-[#7A7269]">ℹ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        setShowLoginModal(true)
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-[#9A721C] hover:bg-[#FAF0D9] transition-colors cursor-pointer"
                    >
                      <span>Switch Account / Sign In</span>
                      <span>🔑</span>
                    </button>
                  </div>

                  {/* Sign Out Button */}
                  <div className="border-t border-[#F0EAE1] pt-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-[#B91C1C] hover:bg-[#FEF2F2] border border-[#FEE2E2] transition-colors cursor-pointer active:scale-95"
                    >
                      <span>Sign Out (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Perks Trigger (Mobile/Tablet) */}
            <button
              type="button"
              onClick={() => setShowCashbackModal(true)}
              className="flex md:hidden items-center justify-center h-9 w-9 rounded-full border border-[#E5E0D8] bg-[#FAF0D9] text-[#9A721C] transition-colors cursor-pointer shadow-2xs"
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
                      ? 'text-[#142B38] bg-[#FAF0D9] font-extrabold border-l-4 border-[#D6A33B]'
                      : 'text-[#7A7269] hover:text-[#142B38] hover:bg-[#F7F5F0]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.active ? 'text-[#D6A33B]' : 'text-[#7A7269]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badgeCount ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#FDE8E8] text-[#9B1C1C] text-[10px] font-bold uppercase tracking-wider">
                      {item.badgeCount}
                    </span>
                  ) : null}
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
                        ? 'bg-[#142B38] text-white'
                        : 'bg-[#F7F5F0] text-[#142B38] border border-[#EBE5DC]'
                    }`}
                  >
                    {reg.id}
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

      {/* Login Modal */}
      {showLoginModal && typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="commuter-signin-title"
            style={{ zIndex: 9999999, position: 'fixed', inset: 0 }}
            className="flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in pointer-events-auto"
            onClick={() => setShowLoginModal(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl border border-[#E5E0D8] bg-white p-6 shadow-2xl space-y-4 pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF0D9] text-[#9A721C] font-bold">
                    <TrainIcon className="w-5 h-5 text-[#D6A33B]" />
                  </div>
                  <div>
                    <h3 id="commuter-signin-title" className="font-sans font-bold text-lg font-bold text-[#142B38] leading-tight">
                      Commuter Sign In
                    </h3>
                    <p className="text-xs text-[#7A7269]">Aaroh-Saarthi Delhi Transit</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="rounded-lg p-1 text-[#7A7269] hover:bg-[#F7F5F0] hover:text-[#142B38] cursor-pointer transition-colors"
                  aria-label="Close sign in modal"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label htmlFor="commuter-name-input" className="block text-xs font-bold text-[#142B38] mb-1">
                    Commuter Name
                  </label>
                  <input
                    id="commuter-name-input"
                    type="text"
                    value={loginName}
                    onChange={e => setLoginName(e.target.value)}
                    placeholder="e.g. Raj"
                    autoFocus
                    className="w-full rounded-xl border border-[#E5E0D8] px-3.5 py-2 text-sm font-semibold text-[#142B38] focus:border-[#D6A33B] focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="commuter-card-input" className="block text-xs font-bold text-[#142B38] mb-1">
                    DMRC SmartCard or Mobile No.
                  </label>
                  <input
                    id="commuter-card-input"
                    type="tel"
                    value={loginPhone}
                    onChange={e => setLoginPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full rounded-xl border border-[#E5E0D8] px-3.5 py-2 text-sm font-semibold text-[#142B38] focus:border-[#D6A33B] focus:outline-none transition-colors"
                  />
                </div>

                <div className="pt-1 space-y-2">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-[#D4A338] to-[#B38728] hover:from-[#D6A33B] hover:to-[#A77B32] text-white font-bold py-2.5 text-sm transition-all shadow-md cursor-pointer active:scale-98"
                  >
                    Sign In as {loginName.trim() || 'Commuter'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginName('Raj')
                      setLoginPhone('9876543210')
                      setUser({
                        name: 'Raj',
                        email: 'raj.commuter@delhitransit.gov.in',
                        cardBalance: 240,
                        isLoggedIn: true,
                      })
                      setShowLoginModal(false)
                      setUserMenuOpen(false)
                      setAuthToast('Welcome back, Raj! Your DMRC SmartCard & Passes are active.')
                      setTimeout(() => setAuthToast(''), 3500)
                    }}
                    className="w-full rounded-xl border border-[#E5E0D8] bg-[#F7F5F0] hover:bg-[#F2ECE1] text-[#142B38] font-bold py-2 text-xs transition-colors cursor-pointer active:scale-98"
                  >
                    Quick 1-Click Demo Login (Raj)
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      }

      {/* Auth Notification Toast */}
      {authToast && typeof document !== 'undefined' &&
        createPortal(
          <aside
            role="status"
            aria-live="polite"
            style={{ zIndex: 9999999, position: 'fixed' }}
            className="bottom-6 right-6 flex items-center gap-2.5 rounded-2xl border border-[#E8D4AE] bg-[#FAF0D9] text-[#9A721C] px-4 py-3 text-xs font-bold shadow-xl animate-fade-in pointer-events-auto"
          >
            <CheckIcon className="w-4 h-4 text-[#D6A33B] shrink-0" />
            <span>{authToast}</span>
          </aside>,
          document.body
        )
      }
    </header>
  )
}
