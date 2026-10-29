import { useState } from 'react'
import type { ModePreference, ServiceDay, Stop } from '../types'
import { formatTime12, parseToTime24 } from '../utils/time'
import { getStationMeta } from '../utils/transitData'

const SERVICE_TIME_PATTERN = /^(?:[0-3]\d|4[0-7]):[0-5]\d$/

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

export default function RouteSearchForm({
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

  function handleSwap() {
    const prevOrigin = origin
    setOrigin(destination)
    setDestination(prevOrigin)
  }

  function handlePreset(origId: string, destId: string, presetTime: string) {
    setOrigin(origId)
    setDestination(destId)
    setTime(presetTime)
    setError('')
    onSearch(origId, destId, presetTime, preference, serviceDay, modePreference, maxBudget)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!origin) return setError('Please select an origin stop.')
    if (!destination) return setError('Please select a destination stop.')
    if (origin === destination) return setError('Origin and destination stops must be different.')

    const parsedTime = parseToTime24(time) || (SERVICE_TIME_PATTERN.test(time) ? time : null)
    if (!parsedTime) {
      return setError('Enter a valid time like "08:00 AM", "05:30 PM", or "20:30".')
    }
    setTime(parsedTime)
    onSearch(origin, destination, parsedTime, preference, serviceDay, modePreference, maxBudget)
  }

  const [hours, minutes] = time.split(':').map(Number)
  const isPM = (isNaN(hours) ? 0 : hours) >= 12

  function togglePeriod(targetPeriod: 'AM' | 'PM') {
    let h = isNaN(hours) ? 8 : hours
    const m = isNaN(minutes) ? 0 : minutes
    if (targetPeriod === 'PM' && h < 12) {
      h += 12
    } else if (targetPeriod === 'AM' && h >= 12) {
      h -= 12
    }
    const newTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    setTime(newTime)
    if (error) setError('')
  }

  const activeQuickTimes = [
    { label: '08:00 AM Morning', value: '08:00' },
    { label: '01:30 PM Midday', value: '13:30' },
    { label: '05:30 PM Peak', value: '17:30' },
    { label: '08:30 PM Night', value: '20:30' },
  ]

  const originMeta = getStationMeta(origin)
  const destMeta = getStationMeta(destination)

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[#E8DFCE] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs"
    >
      <div className="space-y-4">
        {/* Card Header & Schedule Category */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8DFCE] pb-3.5">
          <div>
            <h2 className="text-base font-bold text-[#25312D]">
              Journey Planner
            </h2>
            <p className="text-xs text-[#53645F]">
              Search schedule-aware routes across Delhi transit corridors
            </p>
          </div>

          {/* Schedule Category Toggle (Weekday / Weekend) */}
          <div className="flex rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onServiceDayChange('weekday')}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                serviceDay === 'weekday'
                  ? 'bg-[#173B32] text-white shadow-xs'
                  : 'text-[#53645F] hover:text-[#25312D]'
              }`}
            >
              Weekday
            </button>
            <button
              type="button"
              onClick={() => onServiceDayChange('weekend')}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                serviceDay === 'weekend'
                  ? 'bg-[#173B32] text-white shadow-xs'
                  : 'text-[#53645F] hover:text-[#25312D]'
              }`}
            >
              Weekend
            </button>
          </div>
        </div>

        {/* Popular Route Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#53645F] uppercase tracking-wider">
            <span>Frequent Corridors</span>
            <span>1-click search</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handlePreset('S13', 'S01', '08:00')}
              className="rounded-md border border-[#E8DFCE] bg-[#FAF7F2] px-2.5 py-1 text-xs text-[#25312D] hover:border-[#173B32] hover:bg-[#FFFFFF] transition-colors"
            >
              Dwarka ➔ Rajiv Chowk (08:00 AM)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('S02', 'S08', '08:00')}
              className="rounded-md border border-[#E8DFCE] bg-[#FAF7F2] px-2.5 py-1 text-xs text-[#25312D] hover:border-[#173B32] hover:bg-[#FFFFFF] transition-colors"
            >
              Kashmere Gate ➔ Saket (08:00 AM)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('S04', 'S10', '17:30')}
              className="rounded-md border border-[#E8DFCE] bg-[#FAF7F2] px-2.5 py-1 text-xs text-[#25312D] hover:border-[#173B32] hover:bg-[#FFFFFF] transition-colors"
            >
              New Delhi Stn ➔ AIIMS (05:30 PM)
            </button>
          </div>
        </div>

        {/* Origin & Destination Section */}
        <div className="relative space-y-2.5">
          {/* Origin Stop */}
          <div className="rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] p-3 transition-colors focus-within:border-[#173B32] focus-within:bg-[#FFFFFF] focus-within:ring-1 focus-within:ring-[#173B32]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#53645F] mb-1">
              <span className="flex items-center gap-1.5 text-[#173B32] font-bold">
                <span className="h-2 w-2 rounded-full bg-[#173B32]" />
                From (Origin Stop)
              </span>
              <span className="font-mono text-[10px] text-[#53645F]">
                Zone {stops.find(s => s.stop_id === origin)?.zone_id || '1'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0" aria-hidden="true">{originMeta.icon}</span>
              <select
                id="origin-select"
                value={origin}
                onChange={e => {
                  setOrigin(e.target.value)
                  if (error) setError('')
                }}
                className="w-full bg-transparent text-sm font-bold text-[#25312D] focus:outline-none cursor-pointer"
              >
                <option value="">Select origin stop…</option>
                {stops.map(s => {
                  const meta = getStationMeta(s.stop_id)
                  return (
                    <option key={s.stop_id} value={s.stop_id}>
                      {s.stop_name} (Zone {s.zone_id}) — {meta.landmark}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Swap Button (Clean, Centered) */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              type="button"
              onClick={handleSwap}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8DFCE] bg-[#FFFFFF] text-[#173B32] shadow-xs hover:border-[#173B32] hover:bg-[#FAF7F2] transition-all"
              title="Swap origin and destination"
            >
              <span className="text-xs font-bold">⇅</span>
            </button>
          </div>

          {/* Destination Stop */}
          <div className="rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] p-3 transition-colors focus-within:border-[#B88A43] focus-within:bg-[#FFFFFF] focus-within:ring-1 focus-within:ring-[#B88A43]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#53645F] mb-1">
              <span className="flex items-center gap-1.5 text-[#B88A43] font-bold">
                <span className="h-2 w-2 rounded-full bg-[#B88A43]" />
                To (Destination Stop)
              </span>
              <span className="font-mono text-[10px] text-[#53645F]">
                Zone {stops.find(s => s.stop_id === destination)?.zone_id || '2'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0" aria-hidden="true">{destMeta.icon}</span>
              <select
                id="destination-select"
                value={destination}
                onChange={e => {
                  setDestination(e.target.value)
                  if (error) setError('')
                }}
                className="w-full bg-transparent text-sm font-bold text-[#25312D] focus:outline-none cursor-pointer"
              >
                <option value="">Select destination stop…</option>
                {stops.map(s => {
                  const meta = getStationMeta(s.stop_id)
                  return (
                    <option key={s.stop_id} value={s.stop_id}>
                      {s.stop_name} (Zone {s.zone_id}) — {meta.landmark}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Departure Time & AM / PM Dial */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#25312D]">
            <label htmlFor="departure-time" className="uppercase tracking-wider text-[11px] text-[#53645F]">
              Departure Time
            </label>
            <span className="font-mono text-xs font-bold text-[#173B32]">
              {formatTime12(time)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="departure-time"
                type="text"
                placeholder="e.g. 08:30 PM or 20:30"
                value={time}
                onChange={e => {
                  setTime(e.target.value)
                  if (error) setError('')
                }}
                className="w-full rounded-lg border border-[#E8DFCE] bg-[#FFFFFF] px-3 py-2 font-mono text-sm font-medium text-[#25312D] focus:border-[#173B32] focus:outline-none focus:ring-1 focus:ring-[#173B32]"
              />
            </div>

            {/* AM / PM Toggle */}
            <div className="flex rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] p-0.5 shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => togglePeriod('AM')}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  !isPM
                    ? 'bg-[#173B32] text-white shadow-xs'
                    : 'text-[#53645F] hover:text-[#25312D]'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => togglePeriod('PM')}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  isPM
                    ? 'bg-[#173B32] text-white shadow-xs'
                    : 'text-[#53645F] hover:text-[#25312D]'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Quick Time Slots */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {activeQuickTimes.map(qt => (
              <button
                key={qt.value}
                type="button"
                onClick={() => {
                  setTime(qt.value)
                  if (error) setError('')
                }}
                className={`rounded-md border px-2 py-1 text-xs transition-all ${
                  time === qt.value
                    ? 'border-[#173B32] bg-[#173B32] text-white font-bold'
                    : 'border-[#E8DFCE] bg-[#FAF7F2] text-[#53645F] hover:bg-[#FFFFFF] hover:text-[#25312D]'
                }`}
              >
                {qt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Routing Preference (Fastest vs Lowest Cost) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#53645F]">
            Journey Optimization
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPreference('fastest')}
              className={`rounded-lg border py-2 text-xs font-bold transition-all ${
                preference === 'fastest'
                  ? 'border-[#173B32] bg-[#173B32] text-white shadow-xs'
                  : 'border-[#E8DFCE] bg-[#FAF7F2] text-[#53645F] hover:bg-[#FFFFFF] hover:text-[#25312D]'
              }`}
            >
              ⚡ Fastest Route
            </button>
            <button
              type="button"
              onClick={() => setPreference('cheapest')}
              className={`rounded-lg border py-2 text-xs font-bold transition-all ${
                preference === 'cheapest'
                  ? 'border-[#173B32] bg-[#173B32] text-white shadow-xs'
                  : 'border-[#E8DFCE] bg-[#FAF7F2] text-[#53645F] hover:bg-[#FFFFFF] hover:text-[#25312D]'
              }`}
            >
              💰 Lowest Cost
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[#A44735]/30 bg-[#F8ECE9] p-3 text-xs font-bold text-[#A44735]"
          >
            {error}
          </div>
        )}

        {/* Primary Action Button (Solid Forest Green) */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#173B32] py-3 text-sm font-bold text-[#FFFFFF] shadow-xs hover:bg-[#1f4d42] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Calculating Routes…</span>
            </>
          ) : (
            <>
              <span>Find Routes</span>
              <span>➔</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
