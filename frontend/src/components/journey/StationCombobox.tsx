import { useState, useRef, useEffect, useMemo } from 'react'
import type { Stop } from '../../types'
import { getStationMeta } from '../../utils/transitData'
import {
  SearchIcon,
  XIcon,
  ChevronDownIcon,
  CheckIcon,
  MapPinIcon,
  TrainIcon,
  BusIcon,
  RefreshIcon,
  HospitalIcon,
} from '../common/Icons'

interface Props {
  id: string
  label: string
  pinColor: string
  value: string
  onChange: (stopId: string) => void
  stops: Stop[]
  placeholder?: string
  otherSelectedId?: string
}

function getFigmaStationName(stop: Stop): string {
  if (stop.stop_id === 'S13') return 'Dwarka Sector 21'
  if (stop.stop_id === 'S19') return 'Noida City Centre'
  return stop.stop_name
}

const POPULAR_HUBS = [
  { id: 'S13', label: 'Dwarka Sec 21', type: 'metro' },
  { id: 'S01', label: 'Rajiv Chowk', type: 'interchange' },
  { id: 'S02', label: 'Kashmere Gate', type: 'bus' },
  { id: 'S19', label: 'Noida City Centre', type: 'metro' },
  { id: 'S10', label: 'AIIMS', type: 'hospital' },
]

export default function StationCombobox({
  id,
  label,
  pinColor,
  value,
  onChange,
  stops,
  placeholder = 'Select station or hub...',
  otherSelectedId,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedStop = useMemo(
    () => stops.find(s => s.stop_id === value),
    [stops, value]
  )

  const selectedMeta = selectedStop ? getStationMeta(selectedStop.stop_id) : null

  // Filter stations based on search query
  const filteredStops = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return stops

    return stops.filter(s => {
      const name = getFigmaStationName(s).toLowerCase()
      const meta = getStationMeta(s.stop_id)
      const landmark = meta.landmark.toLowerCase()
      const badge = meta.badgeText.toLowerCase()
      const interchanges = meta.interchanges.join(' ').toLowerCase()
      const zone = `zone ${s.zone_id}`.toLowerCase()

      return (
        name.includes(q) ||
        landmark.includes(q) ||
        badge.includes(q) ||
        interchanges.includes(q) ||
        zone.includes(q)
      )
    })
  }, [stops, searchQuery])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setFocusedIndex(-1)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  const handleSelect = (stopId: string) => {
    onChange(stopId)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange('')
    setIsOpen(false)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(prev => (prev < filteredStops.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : filteredStops.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (focusedIndex >= 0 && focusedIndex < filteredStops.length) {
        handleSelect(filteredStops[focusedIndex].stop_id)
      }
    }
  }

  return (
    <div ref={containerRef} className="space-y-1 relative select-none">
      {/* Label with colored pin indicator */}
      <label
        htmlFor={id}
        className="text-[13px] font-bold text-[#142B38] flex items-center justify-between"
      >
        <span className="flex items-center gap-1.5">
          <MapPinIcon className="w-3.5 h-3.5 shrink-0" style={{ color: pinColor }} />
          <span className="font-bold text-[13px] text-[#142B38] capitalize">{label.toLowerCase()}</span>
        </span>
      </label>

      {/* Interactive Trigger Button */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        onClick={() => setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 transition-all duration-200 cursor-pointer shadow-xs text-left group ${
          isOpen
            ? 'border-[#D6A33B] ring-2 ring-[#D6A33B]/20 shadow-sm'
            : 'border-[#E5E0D8] hover:border-[#D6A33B]/60 hover:bg-[#FFFCF8]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold shrink-0 transition-transform group-hover:scale-105"
            style={{
              backgroundColor: `${pinColor}15`,
              color: pinColor,
            }}
          >
            <MapPinIcon className="w-4 h-4" />
          </span>

          {selectedStop ? (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-[#142B38] truncate tracking-normal">
                  {getFigmaStationName(selectedStop)}
                </span>
              </div>
              <p className="text-[13px] text-[#7A7269] font-normal truncate mt-0.5">
                {selectedMeta?.landmark || `Delhi Transport Stack Station #${selectedStop.stop_id}`}
              </p>
            </div>
          ) : (
            <span className="text-sm font-medium text-[#7A7269] truncate">
              {placeholder}
            </span>
          )}
        </div>

        {/* Right Action Icons: Clear & Chevron */}
        <div className="flex items-center gap-1 shrink-0">
          {selectedStop && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onChange('')
                }
              }}
              title="Clear selection"
              aria-label="Clear station"
              className="p-1 rounded-md text-[#7A7269] hover:text-[#A6533C] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
            >
              <XIcon className="w-3.5 h-3.5" />
            </span>
          )}

          <ChevronDownIcon
            className={`w-4 h-4 text-[#7A7269] transition-transform duration-200 group-hover:text-[#142B38] ${
              isOpen ? 'rotate-180 text-[#D6A33B]' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Combobox Popover */}
      {isOpen && (
        <div
          style={{ zIndex: 60 }}
          className="absolute left-0 right-0 top-full mt-2 rounded-2xl border-2 border-[#D6A33B]/50 bg-white shadow-2xl overflow-hidden animate-fade-in"
        >
          {/* Search Input Box */}
          <div className="p-2.5 border-b border-[#E5E0D8] bg-[#FFFDF9]">
            <div className="relative flex items-center">
              <SearchIcon className="absolute left-3 w-4 h-4 text-[#D6A33B]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search station, metro line, or hub..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white border border-[#E5E0D8] focus:border-[#D6A33B] focus:ring-2 focus:ring-[#D6A33B]/20 focus:outline-none text-[#142B38] placeholder:text-[#A1988B]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-0.5 text-[#7A7269] hover:text-[#142B38]"
                  aria-label="Clear search"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Popular Station Hub Chips */}
            <div className="mt-2 pt-2 border-t border-[#F2ECE1]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A1988B] block mb-1.5">
                Popular Delhi Hubs:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_HUBS.map(hub => {
                  const isCurrent = value === hub.id
                  return (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => handleSelect(hub.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#142B38] text-white shadow-xs'
                          : 'bg-[#F7F5F0] hover:bg-[#F2ECE1] text-[#142B38] border border-[#E5E0D8]'
                      }`}
                    >
                      {hub.type === 'metro' ? (
                        <TrainIcon className="w-3 h-3 text-[#D6A33B]" />
                      ) : hub.type === 'interchange' ? (
                        <RefreshIcon className="w-3 h-3 text-[#547A60]" />
                      ) : hub.type === 'hospital' ? (
                        <HospitalIcon className="w-3 h-3 text-[#0284C7]" />
                      ) : (
                        <BusIcon className="w-3 h-3 text-[#243B4A]" />
                      )}
                      <span>{hub.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Station List */}
          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-[#F5EFE6] p-1 scrollbar-thin"
          >
            {filteredStops.length === 0 ? (
              <li className="py-6 text-center text-xs sm:text-sm text-[#7A7269] font-medium">
                No stations match <span className="font-bold text-[#142B38]">"{searchQuery}"</span>
              </li>
            ) : (
              filteredStops.map((stop, index) => {
                const isSelected = value === stop.stop_id
                const isOther = otherSelectedId === stop.stop_id
                const isFocused = index === focusedIndex
                const meta = getStationMeta(stop.stop_id)

                return (
                  <li
                    key={stop.stop_id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(stop.stop_id)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#FAF4E8] text-[#142B38]'
                        : isFocused
                        ? 'bg-[#F7F5F0] text-[#142B38]'
                        : 'hover:bg-[#FFFDF9] text-[#1A202C]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Line Mode Indicator */}
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold shrink-0 ${
                          isSelected
                            ? 'bg-[#D6A33B] text-white shadow-xs'
                            : 'bg-[#F7F5F0] border border-[#E5E0D8] text-[#7A7269]'
                        }`}
                      >
                        {meta.interchanges.some(i => i.includes('Blue') || i.includes('Yellow') || i.includes('Metro')) ? (
                          <TrainIcon className="w-3.5 h-3.5 text-[#D6A33B]" />
                        ) : meta.interchanges.some(i => i.includes('Bus') || i.includes('Terminal')) ? (
                          <BusIcon className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        ) : (
                          <MapPinIcon className="w-3.5 h-3.5 text-[#7A7269]" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-[#142B38]' : 'text-[#1A202C]'}`}>
                            {getFigmaStationName(stop)}
                          </span>
                          {isOther && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F7F5F0] text-[#7A7269] border border-[#E5E0D8]">
                              Currently {label === 'FROM' ? 'Destination' : 'Origin'}
                            </span>
                          )}
                        </div>

                        {/* Interchanges / Landmark */}
                        <div className="flex items-center gap-2 text-[11px] text-[#7A7269] font-medium truncate mt-0.5">
                          <span>{meta.landmark}</span>
                          {meta.interchanges.length > 0 && (
                            <>
                              <span className="text-[#D6A33B]">•</span>
                              <span className="font-semibold text-[#142B38]">
                                {meta.interchanges.slice(0, 2).join(' / ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Zone Tag & Checkmark */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#E5E0D8] text-[#7A7269]">
                        Z{stop.zone_id}
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#176B43] text-white shadow-2xs">
                          <CheckIcon className="w-3 h-3 text-white" />
                        </span>
                      )}
                    </div>
                  </li>
                )
              })
            )}
          </ul>

          {/* Footer count indicator */}
          <div className="px-3.5 py-2 bg-[#F7F5F0] border-t border-[#E5E0D8] flex items-center justify-between text-[11px] font-bold text-[#7A7269]">
            <span>{filteredStops.length} Delhi Stations</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}
    </div>
  )
}

