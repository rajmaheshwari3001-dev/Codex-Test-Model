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
  ShareIcon,
  CheckIcon,
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
  const [shareToast, setShareToast] = useState(false)

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

  const handleShareTrip = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2500)
    }
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
    <header role="banner" className="sticky top-0 z-40 w-full border-b border-[#EBE5DC] bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 shadow-xs">
      <div className="flex h-16 items-center justify-between gap-3 max-w-[1720px] mx-auto">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileMenu || (() => setMobileNavOpen(prev => !prev))}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileNavOpen}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] text-[#1A2E3B] hover:bg-[#F2ECE1] lg:hidden transition-colors cursor-pointer"
          >
            {mobileNavOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>

          <NavLink to="/" className="flex flex-col group focus:outline-none" aria-label="AAROH-SAARTHI Home">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1A2E3B]">
                AAROH<span className="text-[#C49A43] mx-1.5">•</span>SAARTHI
              </span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#7A7269] -mt-0.5 hidden xs:block">
              YOUR JOURNEY, RE-IMAGINED IN DELHI
            </span>
          </NavLink>
        </div>

        {/* Center: Desktop Navigation Tabs with clean gold underline */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-6 xl:gap-8 h-full">
          {navItems.map(item => {
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={`relative flex items-center h-full text-xs transition-colors duration-200 cursor-pointer ${
                  item.active
                    ? 'text-[#1A2E3B] font-extrabold'
                    : 'text-[#7A7269] hover:text-[#1A2E3B] font-medium'
                }`}
              >
                <span>{item.label}</span>
                {item.active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C49A43] rounded-full animate-fade-in" />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Right: Quick Action Controls */}
        <div role="toolbar" aria-label="Quick Actions" className="flex items-center gap-3 shrink-0">
          {/* Live Data Badge */}
          <div className="hidden xl:flex items-center gap-1.5 rounded-full bg-[#EAF5EC] border border-[#D1E7D5] px-3 py-1 text-[11px] font-semibold text-[#2E7D32]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
            <span>DATA UPDATED 2 MIN AGO</span>
          </div>

          {/* Location Selector */}
          <div className="hidden xs:flex items-center gap-1.5 rounded-full bg-[#FAF7F2] border border-[#EBE5DC] px-3 py-1 text-xs font-medium text-[#1A2E3B]">
            <span className="text-xs text-[#C49A43]">📍</span>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#1A2E3B] focus:outline-none cursor-pointer"
              aria-label="Select Transit Region"
            >
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Central Delhi">Central Delhi</option>
              <option value="South Delhi">South Delhi</option>
              <option value="Dwarka Hub">Dwarka Hub</option>
            </select>
          </div>

          {/* Share trip button */}
          <button
            type="button"
            onClick={handleShareTrip}
            className="flex items-center gap-1.5 rounded-lg bg-[#1A2E3B] hover:bg-[#243B4A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
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
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-[#C49A43]/50 bg-[#EEE5D6] hover:bg-[#F4EBDD] px-2.5 py-1.5 text-xs font-bold text-[#243B4A] transition-all cursor-pointer"
            title="Delhi Transit Cashback & Concessions"
            aria-label="Open Transit Cashback and Concessions Calculator"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-[#C49A43]" />
            <span className="hidden lg:inline">Perks</span>
          </button>

          {/* Data Sources Trigger */}
          <button
            type="button"
            onClick={() => setShowProvenanceModal(true)}
            className="flex items-center justify-center h-8 w-8 rounded-xl border border-[#D8C8AA] bg-[#FFFCF5] hover:bg-[#EEE5D6] text-[#243B4A] transition-colors cursor-pointer"
            title="Inspect Data Sources & GTFS Provenance"
            aria-label="Inspect Data Sources and Provenance"
          >
            <DatabaseIcon className="w-3.5 h-3.5 text-[#C49A43]" />
          </button>

          {/* Backend Status Indicator */}
          <div
            className="flex items-center justify-center h-8 w-8 rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]"
            title={`FastAPI Backend: ${backendStatus}`}
            aria-label={`System Status: ${backendStatus}`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                backendStatus === 'connected'
                  ? 'bg-[#547A60] animate-pulse'
                  : backendStatus === 'checking'
                  ? 'bg-[#C49A43]'
                  : 'bg-[#A6533C]'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileNavOpen && (
        <nav
          aria-label="Mobile Navigation Menu"
          className="lg:hidden border-t border-[#D8C8AA] py-3 space-y-1 animate-fade-in"
        >
          {navItems.map(item => {
            const { Icon } = item
            return (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  item.active
                    ? 'text-[#243B4A] bg-[#EEE5D6] font-extrabold'
                    : 'text-[#77766D] hover:text-[#243B4A] hover:bg-[#EEE5D6]/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.active ? 'text-[#C49A43]' : 'text-[#77766D]'}`} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      )}

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
