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
    if (!origin) return setError('Please select an origin station.')
    if (!destination) return setError('Please select a destination station.')
    if (origin === destination) return setError('Origin and destination stations must be different.')

    const parsedTime = parseToTime24(time) || (SERVICE_TIME_PATTERN.test(time) ? time : null)
    if (!parsedTime) {
      return setError('Enter a valid time like "08:00 AM", "08:30 PM", or "20:30".')
    }
    setTime(parsedTime)
    onSearch(origin, destination, parsedTime, preference, serviceDay, modePreference, maxBudget)
  }

  const [hours, minutes] = time.split(':').map(Number)
  const currentMinutesVal = (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes)
  const isOutOfServiceHours = currentMinutesVal < 360 || currentMinutesVal > 1415
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
    { label: '10:00 PM Late Night', value: '22:00' },
  ]

  const originMeta = getStationMeta(origin)
  const destMeta = getStationMeta(destination)

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-md shadow-slate-900/5 transition-all"
    >
      {/* Decorative subtle ambient backdrop glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Card Header & Schedule Category */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700 font-bold text-sm">
              🧭
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-950">
                Delhi Transit Journey Planner
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                Schedule-aware multimodal optimization
              </p>
            </div>
          </div>

          {/* Schedule Category Toggle (Weekday / Weekend) */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => onServiceDayChange('weekday')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                serviceDay === 'weekday'
                  ? 'bg-white text-slate-950 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekday
            </button>
            <button
              type="button"
              onClick={() => onServiceDayChange('weekend')}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                serviceDay === 'weekend'
                  ? 'bg-white text-slate-950 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekend
            </button>
          </div>
        </div>

        {/* 1-Click Commuter Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <span>⚡ Popular Commuter Corridors</span>
            <span className="text-slate-400 font-normal">1-tap instant route</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handlePreset('S13', 'S01', '08:00')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Dwarka ➔ Rajiv Chowk @ 08:00 AM
            </button>
            <button
              type="button"
              onClick={() => handlePreset('S02', 'S08', '08:00')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Kashmere Gate ➔ Saket @ 08:00 AM
            </button>
            <button
              type="button"
              onClick={() => handlePreset('S04', 'S10', '17:30')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              New Delhi Stn ➔ AIIMS @ 05:30 PM
            </button>
            <button
              type="button"
              onClick={() => handlePreset('S02', 'S08', '20:30')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Kashmere Gate ➔ Saket @ 08:30 PM (Night)
            </button>
          </div>
        </div>

        {/* Origin & Destination Interactive Deck */}
        <div className="relative space-y-2">
          {/* Origin Station */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Boarding Station (Origin)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Zone {stops.find(s => s.stop_id === origin)?.zone_id || '1'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl shrink-0" aria-hidden="true">{originMeta.icon}</span>
              <select
                id="origin-select"
                value={origin}
                onChange={e => {
                  setOrigin(e.target.value)
                  if (error) setError('')
                }}
                className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-950 focus:outline-none cursor-pointer"
              >
                <option value="">Choose origin station…</option>
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
            {origin && (
              <p className="mt-1 text-[11px] text-slate-500 pl-8 truncate">
                {originMeta.landmark} • {originMeta.interchanges.join(', ')}
              </p>
            )}
          </div>

          {/* Swap Button (Floating between cards) */}
          <div className="absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 z-20">
            <button
              type="button"
              onClick={handleSwap}
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md text-slate-600 transition-all hover:scale-110 hover:border-blue-400 hover:text-blue-600 active:scale-95"
              title="Reverse origin and destination"
            >
              <span className="text-sm font-bold transition-transform group-hover:rotate-180 duration-300">
                ⇅
              </span>
            </button>
          </div>

          {/* Destination Station */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all focus-within:border-rose-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-500/20">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
              <span className="flex items-center gap-1.5 text-rose-800">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Alighting Station (Destination)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Zone {stops.find(s => s.stop_id === destination)?.zone_id || '2'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl shrink-0" aria-hidden="true">{destMeta.icon}</span>
              <select
                id="destination-select"
                value={destination}
                onChange={e => {
                  setDestination(e.target.value)
                  if (error) setError('')
                }}
                className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-950 focus:outline-none cursor-pointer"
              >
                <option value="">Choose destination station…</option>
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
            {destination && (
              <p className="mt-1 text-[11px] text-slate-500 pl-8 truncate">
                {destMeta.landmark} • {destMeta.interchanges.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Departure Time & Tactile AM / PM Switcher */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <label htmlFor="departure-time" className="uppercase tracking-wider">
              Departure Time (AM / PM Supported)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                {formatTime12(time)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                id="departure-time"
                type="text"
                placeholder="e.g. 08:30 PM or 20:30"
                value={time}
                aria-describedby="departure-time-hint"
                onChange={e => {
                  setTime(e.target.value)
                  if (error) setError('')
                }}
                className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2 font-mono text-sm font-bold text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  isOutOfServiceHours
                    ? 'border-amber-400 bg-amber-50/40'
                    : 'border-slate-300 bg-white focus:border-blue-500'
                }`}
              />
              <span className="absolute right-2.5 top-2.5 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-200">
                {formatTime12(time)}
              </span>
            </div>

            {/* Tactile AM / PM Switcher Button */}
            <div className="flex rounded-xl border border-slate-300 bg-slate-100 p-1 shrink-0">
              <button
                type="button"
                onClick={() => togglePeriod('AM')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold transition-all ${
                  !isPM
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>☀️</span>
                <span>AM</span>
              </button>
              <button
                type="button"
                onClick={() => togglePeriod('PM')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold transition-all ${
                  isPM
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🌙</span>
                <span>PM</span>
              </button>
            </div>
          </div>

          {/* Quick Time Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeQuickTimes.map(qt => (
              <button
                key={qt.value}
                type="button"
                onClick={() => {
                  setTime(qt.value)
                  if (error) setError('')
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
                  time === qt.value
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {qt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transport Mode Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="uppercase tracking-wider">Transport Mode Preference</span>
            <span className="text-[11px] font-semibold text-slate-500">Metro vs Bus filter</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/90 p-1.5">
            <button
              type="button"
              onClick={() => setModePreference('all')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl py-2 px-1 text-xs sm:text-sm font-bold transition-all ${
                modePreference === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🌐</span>
              <span>All Modes</span>
            </button>
            <button
              type="button"
              onClick={() => setModePreference('metro')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl py-2 px-1 text-xs sm:text-sm font-bold transition-all ${
                modePreference === 'metro'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🚇</span>
              <span>Metro Only</span>
            </button>
            <button
              type="button"
              onClick={() => setModePreference('bus')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl py-2 px-1 text-xs sm:text-sm font-bold transition-all ${
                modePreference === 'bus'
                  ? 'bg-amber-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🚌</span>
              <span>Bus Only</span>
            </button>
          </div>
        </div>

        {/* Optimization Preference & Budget Ceiling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Optimization Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Routing Priority
            </label>
            <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setPreference('fastest')}
                className={`rounded-lg py-2 text-xs font-bold transition-all ${
                  preference === 'fastest'
                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚡ Fastest
              </button>
              <button
                type="button"
                onClick={() => setPreference('cheapest')}
                className={`rounded-lg py-2 text-xs font-bold transition-all ${
                  preference === 'cheapest'
                    ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💰 Cheapest
              </button>
            </div>
          </div>

          {/* Passenger Budget Target */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="max-budget" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Budget Ceiling (₹)
              </label>
              {maxBudget && (
                <button
                  type="button"
                  onClick={() => setMaxBudget('')}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-1.5">
              {['20', '30', '40', '50'].map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setMaxBudget(maxBudget === b ? '' : b)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${
                    maxBudget === b
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs font-black'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ₹{b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm font-bold text-rose-800 shadow-2xs"
          >
            {error}
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 py-4 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Scanning Delhi Multimodal Network…</span>
            </>
          ) : (
            <>
              <span>Discover Optimal Transit Itineraries</span>
              <span className="transition-transform group-hover:translate-x-1">➔</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
