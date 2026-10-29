import { useEffect, useState, useRef } from 'react'
import type { Stop } from '../types'
import { getHealth, getStops } from '../services/api'
import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  onOpenMobile: () => void
}

export default function TopBar({ onOpenMobile }: TopBarProps) {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [stops, setStops] = useState<Stop[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    getHealth()
      .then(res => {
        if (mounted) setBackendStatus(res.status === 'ok' ? 'connected' : 'disconnected')
      })
      .catch(() => {
        if (mounted) setBackendStatus('disconnected')
      })

    getStops()
      .then(res => {
        if (mounted) setStops(res)
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredStops = searchQuery.trim()
    ? stops.filter(s =>
        s.stop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.stop_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  function handleSelectStop(stopId: string) {
    setShowDropdown(false)
    setSearchQuery('')
    navigate(`/?origin=${stopId}`)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E8DFCE] bg-[#FFFFFF] px-4 sm:px-6 lg:px-8 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-[#25312D] hover:bg-[#F5F0E6] lg:hidden"
          aria-label="Open sidebar"
        >
          <span className="text-xl">☰</span>
        </button>

        {/* Quick Stop Search Input */}
        <div ref={dropdownRef} className="relative w-64 sm:w-80">
          <div className="flex items-center rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#25312D] focus-within:border-[#173B32] focus-within:bg-[#FFFFFF] focus-within:ring-1 focus-within:ring-[#173B32]">
            <span className="text-[#53645F] mr-2">🔍</span>
            <input
              type="text"
              placeholder="Quick search stops (e.g. Rajiv Chowk)..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full bg-transparent focus:outline-none placeholder:text-[#53645F]/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#53645F] hover:text-[#25312D]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showDropdown && filteredStops.length > 0 && (
            <div className="absolute top-full left-0 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[#E8DFCE] bg-[#FFFFFF] p-1 shadow-md z-50">
              {filteredStops.slice(0, 8).map(s => (
                <button
                  key={s.stop_id}
                  type="button"
                  onClick={() => handleSelectStop(s.stop_id)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs hover:bg-[#F5F0E6]"
                >
                  <span className="font-medium text-[#25312D]">{s.stop_name}</span>
                  <span className="font-mono text-[10px] text-[#53645F]">
                    Zone {s.zone_id} • {s.stop_id}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Telemetry & Status Badges */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Service Hours Badge */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#53645F]">
          <span className="font-semibold text-[#25312D]">Service:</span>
          <span className="font-mono text-[11px]">06:00 AM — 11:35 PM</span>
        </div>

        {/* Backend Connectivity Status */}
        <div
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
            backendStatus === 'connected'
              ? 'border-[#236B56]/30 bg-[#EBF4F0] text-[#236B56]'
              : backendStatus === 'disconnected'
              ? 'border-[#A44735]/30 bg-[#F8ECE9] text-[#A44735]'
              : 'border-[#E8DFCE] bg-[#FAF7F2] text-[#53645F]'
          }`}
          title={
            backendStatus === 'connected'
              ? 'FastAPI routing and fleet simulator online'
              : 'Connecting to backend'
          }
        >
          <span
            className={`h-2 w-2 rounded-full ${
              backendStatus === 'connected'
                ? 'bg-[#236B56]'
                : backendStatus === 'disconnected'
                ? 'bg-[#A44735]'
                : 'bg-amber-400'
            }`}
          />
          <span className="capitalize">{backendStatus}</span>
        </div>
      </div>
    </header>
  )
}

