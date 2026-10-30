import { useState } from 'react'
import type { ModePreference, ServiceDay, Stop } from '../../types'
import { formatTime12, parseToTime24 } from '../../utils/time'
import { getStationMeta } from '../../utils/transitData'

interface Props {
  stops: Stop[]
  origin: string
  setOrigin: (origin: string) => void
  destination: string
  setDestination: (destination: string) => void
  time: string
  setTime: (time: string) => void
  preference: string
  setPreference: (preference: string) => void
  serviceDay: ServiceDay
  onServiceDayChange: (day: ServiceDay) => void
  modePreference: ModePreference
  setModePreference: (mode: ModePreference) => void
  maxBudget: string
  setMaxBudget: (budget: string) => void
  onSearch: (
    origin?: string,
    destination?: string,
    time?: string,
    preference?: string,
    serviceDay?: ServiceDay,
    modePreference?: ModePreference,
    maxBudget?: string
  ) => void
  loading: boolean
}

// Popular locations in Delhi matching reference
const POPULAR_STOPS = [
  { id: 'S13', label: 'Dwarka' },
  { id: 'S01', label: 'Rajiv Chowk' },
  { id: 'S02', label: 'Kashmere Gate' },
  { id: 'S04', label: 'New Delhi' },
  { id: 'S10', label: 'AIIMS' },
]

export default function JourneyPlanner({
  stops,
  origin,
  setOrigin,
  destination,
  setDestination,
  time,
  setTime,
  preference,
  setPreference,
  serviceDay,
  onServiceDayChange,
  modePreference,
  setModePreference,
  maxBudget,
  setMaxBudget,
  onSearch,
  loading,
}: Props) {
  const [error, setError] = useState('')
  const [departMode, setDepartMode] = useState<'now' | 'later'>('now')

  function handleSwap() {
    const prevOrigin = origin
    setOrigin(destination)
    setDestination(prevOrigin)
  }

  function handleSelectNow() {
    setDepartMode('now')
    const now = new Date()
    const hh = now.getHours().toString().padStart(2, '0')
    const mm = now.getMinutes().toString().padStart(2, '0')
    const nowTime = `${hh}:${mm}`
    setTime(nowTime)
  }

  function handleSelectLater() {
    setDepartMode('later')
    if (!time) {
      setTime('08:00')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!origin) return setError('Please select an origin station or stop.')
    if (!destination) return setError('Please select a destination station or stop.')
    if (origin === destination) return setError('Origin and destination must be different.')

    const parsedTime = parseToTime24(time) || (time.includes(':') ? time : '08:00')
    setTime(parsedTime)
    onSearch(origin, destination, parsedTime, preference, serviceDay, modePreference, maxBudget)
  }

  const originMeta = getStationMeta(origin)
  const destMeta = getStationMeta(destination)

  return (
    <div className="rounded-xl border border-[#DAD3C6] bg-[#FBF8F1] p-5 shadow-xs text-[#29343A] space-y-4">
      {/* Title & Subtitle */}
      <div className="border-b border-[#DAD3C6] pb-3">
        <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#172D3B]">
          Plan Your Journey
        </h2>
        <p className="text-xs text-[#73766F] mt-0.5">
          Find the best route across metro, bus, auto and more
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* FROM INPUT */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#73766F]">
            From
          </label>
          <div className="relative flex items-center rounded-lg border border-[#DAD3C6] bg-[#FFFFFF] px-3 py-2 text-xs transition-colors focus-within:border-[#C49A43] focus-within:ring-1 focus-within:ring-[#C49A43]">
            <span className="text-sm mr-2 text-[#C49A43]">📍</span>
            <select
              value={origin}
              onChange={e => {
                setOrigin(e.target.value)
                if (error) setError('')
              }}
              className="w-full bg-transparent font-semibold text-[#29343A] focus:outline-none cursor-pointer"
            >
              <option value="">Select origin stop...</option>
              {stops.map(s => (
                <option key={s.stop_id} value={s.stop_id}>
                  {s.stop_name} (Zone {s.zone_id})
                </option>
              ))}
            </select>
            {origin && (
              <button
                type="button"
                onClick={() => setOrigin('')}
                className="text-[#73766F] hover:text-[#29343A] text-xs px-1"
                title="Clear origin"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* SWAP BUTTON (Centered subtle circle) */}
        <div className="flex justify-end -my-1 pr-4">
          <button
            type="button"
            onClick={handleSwap}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#DAD3C6] bg-[#FBF8F1] text-[#172D3B] hover:bg-[#EDE7DB] hover:border-[#C49A43] shadow-2xs transition-all text-xs"
            title="Swap Origin and Destination"
          >
            ⇅
          </button>
        </div>

        {/* TO INPUT */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#73766F]">
            To
          </label>
          <div className="relative flex items-center rounded-lg border border-[#DAD3C6] bg-[#FFFFFF] px-3 py-2 text-xs transition-colors focus-within:border-[#C49A43] focus-within:ring-1 focus-within:ring-[#C49A43]">
            <span className="text-sm mr-2 text-[#A64C42]">🎯</span>
            <select
              value={destination}
              onChange={e => {
                setDestination(e.target.value)
                if (error) setError('')
              }}
              className="w-full bg-transparent font-semibold text-[#29343A] focus:outline-none cursor-pointer"
            >
              <option value="">Select destination...</option>
              {stops.map(s => (
                <option key={s.stop_id} value={s.stop_id}>
                  {s.stop_name} (Zone {s.zone_id})
                </option>
              ))}
            </select>
            {destination && (
              <button
                type="button"
                onClick={() => setDestination('')}
                className="text-[#73766F] hover:text-[#29343A] text-xs px-1"
                title="Clear destination"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* POPULAR SUGGESTIONS */}
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-[#73766F]">
            Popular hubs:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_STOPS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (!origin) setOrigin(p.id)
                  else setDestination(p.id)
                }}
                className={`rounded px-2 py-0.5 text-[11px] font-medium border border-[#DAD3C6] bg-[#F5F0E6] text-[#29343A] hover:bg-[#EDE7DB] transition-colors ${
                  origin === p.id || destination === p.id
                    ? 'border-[#C49A43] bg-[#F7F1E5] text-[#172D3B] font-bold'
                    : ''
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* DEPART AT (Now / Later & Time Selector) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#73766F]">
            <span>Depart At</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSelectNow}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  departMode === 'now'
                    ? 'bg-[#172D3B] text-white'
                    : 'bg-[#EDE7DB] text-[#73766F] hover:text-[#29343A]'
                }`}
              >
                Now
              </button>
              <button
                type="button"
                onClick={handleSelectLater}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  departMode === 'later'
                    ? 'bg-[#172D3B] text-white'
                    : 'bg-[#EDE7DB] text-[#73766F] hover:text-[#29343A]'
                }`}
              >
                Later
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={time}
              onChange={e => setTime(e.target.value)}
              placeholder="e.g. 08:00 AM"
              className="w-full rounded-lg border border-[#DAD3C6] bg-[#FFFFFF] px-3 py-1.5 text-xs font-mono font-bold text-[#29343A] focus:outline-none focus:border-[#C49A43]"
            />
            {/* Weekday / Weekend Schedule Picker */}
            <select
              value={serviceDay}
              onChange={e => onServiceDayChange(e.target.value as ServiceDay)}
              className="rounded-lg border border-[#DAD3C6] bg-[#FFFFFF] px-2 py-1.5 text-xs font-semibold text-[#172D3B] focus:outline-none"
            >
              <option value="weekday">Weekday</option>
              <option value="weekend">Weekend</option>
            </select>
          </div>
        </div>

        {/* TRAVEL PREFERENCE (Fastest vs Lowest Cost with Muted Gold Highlight) */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#73766F]">
            Travel Preference
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPreference('fastest')}
              className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 font-bold transition-all ${
                preference === 'fastest'
                  ? 'border-[#A97C2E] bg-[#C49A43] text-white shadow-xs'
                  : 'border-[#DAD3C6] bg-[#FFFFFF] text-[#29343A] hover:bg-[#EDE7DB]'
              }`}
            >
              <span>⚡</span>
              <span>Fastest</span>
            </button>

            <button
              type="button"
              onClick={() => setPreference('cheapest')}
              className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 font-bold transition-all ${
                preference === 'cheapest'
                  ? 'border-[#547A60] bg-[#547A60] text-white shadow-xs'
                  : 'border-[#DAD3C6] bg-[#FFFFFF] text-[#29343A] hover:bg-[#EDE7DB]'
              }`}
            >
              <span>💰</span>
              <span>Cheapest</span>
            </button>
          </div>
        </div>

        {/* MODE PREFERENCE PILLS (All, Metro, Bus, Auto) */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#73766F]">
            Transport Mode
          </label>
          <div className="grid grid-cols-4 gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setModePreference('all')}
              className={`rounded-md py-1 font-bold border transition-all ${
                modePreference === 'all'
                  ? 'bg-[#172D3B] text-white border-[#172D3B]'
                  : 'bg-[#FFFFFF] text-[#73766F] border-[#DAD3C6] hover:bg-[#EDE7DB]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setModePreference('metro')}
              className={`rounded-md py-1 font-bold border transition-all ${
                modePreference === 'metro'
                  ? 'bg-[#C49A43] text-white border-[#A97C2E]'
                  : 'bg-[#FFFFFF] text-[#73766F] border-[#DAD3C6] hover:bg-[#EDE7DB]'
              }`}
            >
              🚇 Metro
            </button>
            <button
              type="button"
              onClick={() => setModePreference('bus')}
              className={`rounded-md py-1 font-bold border transition-all ${
                modePreference === 'bus'
                  ? 'bg-[#172D3B] text-white border-[#0F1E28]'
                  : 'bg-[#FFFFFF] text-[#73766F] border-[#DAD3C6] hover:bg-[#EDE7DB]'
              }`}
            >
              🚍 Bus
            </button>
            <button
              type="button"
              onClick={() => setModePreference('auto')}
              className={`rounded-md py-1 font-bold border transition-all ${
                modePreference === 'auto'
                  ? 'bg-[#C49A43] text-white border-[#A97C2E]'
                  : 'bg-[#FFFFFF] text-[#73766F] border-[#DAD3C6] hover:bg-[#EDE7DB]'
              }`}
              title="PoochhO (DIMTS) Auto-Rickshaw & Taxi"
            >
              🛺 Auto
            </button>
          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {error && (
          <div className="rounded-lg border border-[#A64C42]/30 bg-[#F9EBEA] p-2.5 text-xs font-bold text-[#A64C42]">
            {error}
          </div>
        )}

        {/* FULL-WIDTH GOLD PRIMARY SEARCH BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C49A43] hover:bg-[#A97C2E] py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Searching Network…</span>
            </>
          ) : (
            <>
              <span>Search Journey</span>
              <span className="text-sm font-black">➔</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
