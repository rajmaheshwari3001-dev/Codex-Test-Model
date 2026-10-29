import { useState } from 'react'
import type { ModePreference, ServiceDay, Stop } from '../types'
import { formatTime12, parseToTime24 } from '../utils/time'

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
    if (origin === destination) return setError('Origin and destination must be different.')
    
    const parsedTime = parseToTime24(time) || (SERVICE_TIME_PATTERN.test(time) ? time : null)
    if (!parsedTime) {
      return setError('Enter a valid time like "08:00 AM", "08:30 PM", or "20:30".')
    }
    setTime(parsedTime)
    onSearch(origin, destination, parsedTime, preference, serviceDay, modePreference, maxBudget)
  }

  // Active timetable hours span morning, afternoon, evening and night: 06:00 AM (360m) to 11:35 PM (1415m)
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

  // Active timetable hours with clean AM/PM labels spanning day and night
  const activeQuickTimes = [
    { label: '08:00 AM Morning', value: '08:00' },
    { label: '01:30 PM Midday', value: '13:30' },
    { label: '05:30 PM Peak', value: '17:30' },
    { label: '08:30 PM Night', value: '20:30' },
    { label: '10:00 PM Late Night', value: '22:00' },
  ]

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all"
    >
      {/* Console Top Brand Header */}
      <div className="bg-gradient-to-r from-[#0B1020] via-[#172554] to-[#1e3a8a] p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Plan Transit Route
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Delhi Connection Scan Engine • Schedule Aware
            </p>
          </div>

          {/* Calendar Badge */}
          <button
            type="button"
            onClick={() => onServiceDayChange(serviceDay === 'weekday' ? 'weekend' : 'weekday')}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:bg-white/20"
            title="Click to toggle Weekday / Weekend timetable"
          >
            <span>{serviceDay === 'weekday' ? '🏢' : '🏖️'}</span>
            <span>{serviceDay}</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Connected Origin & Destination Station Console */}
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          {/* Vertical Connecting Transit Route Track */}
          <div className="absolute left-[27px] top-[42px] bottom-[42px] w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-rose-500 pointer-events-none" />

          {/* Origin Station */}
          <div className="relative flex items-center gap-3">
            <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-100">
              <span className="h-2 w-2 rounded-full bg-white" />
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="origin-stop" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                From Bus Stop / Station
              </label>
              <select
                id="origin-stop"
                value={origin}
                onChange={e => {
                  setOrigin(e.target.value)
                  if (error) setError('')
                }}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-2xs transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select origin stop or click on map…</option>
                {stops.map(s => (
                  <option key={s.stop_id} value={s.stop_id}>
                    {s.stop_name} (Zone {s.zone_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Central Tactile Swap Button */}
          <div className="relative flex justify-center py-2">
            <button
              type="button"
              onClick={handleSwap}
              disabled={!origin && !destination}
              aria-label="Swap origin and destination stops"
              className="z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition-all hover:scale-105 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:scale-100"
              title="Swap stops"
            >
              <span aria-hidden="true" className="text-sm font-bold">⇅</span>
            </button>
          </div>

          {/* Destination Station */}
          <div className="relative flex items-center gap-3">
            <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm ring-4 ring-rose-100">
              <span className="h-2 w-2 rounded-full bg-white" />
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="dest-stop" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                To Bus Stop / Station
              </label>
              <select
                id="dest-stop"
                value={destination}
                onChange={e => {
                  setDestination(e.target.value)
                  if (error) setError('')
                }}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-2xs transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select destination stop or click on map…</option>
                {stops.map(s => (
                  <option key={s.stop_id} value={s.stop_id}>
                    {s.stop_name} (Zone {s.zone_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Popular Active Corridor Chips */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">⚡ Popular Guaranteed Corridors:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handlePreset('S02', 'S08', '08:00')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Kashmere Gate → Saket @ 08:00 AM
            </button>
            <button
              type="button"
              onClick={() => handlePreset('S04', 'S10', '17:30')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              New Delhi Stn → AIIMS @ 05:30 PM (Peak)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('S13', 'S01', '20:00')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Dwarka → Rajiv Chowk @ 08:00 PM (Night)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('S02', 'S08', '20:30')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Kashmere Gate → Saket @ 08:30 PM (Night)
            </button>
          </div>
        </div>

        {/* Timetable Operating Windows Board */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-blue-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
              <span>🕒</span>
              <span>Daily Operating Windows</span>
            </span>
            <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs">
              06:00 AM – 11:35 PM Active Daily
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Morning Peak */}
            <button
              type="button"
              onClick={() => {
                setTime('08:00')
                if (error) setError('')
              }}
              className={`rounded-xl border p-2.5 text-left transition-all ${
                currentMinutesVal >= 360 && currentMinutesVal < 720
                  ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-300 text-emerald-950 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-emerald-50/40'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                06:00 AM – 12:00 PM
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Morning Commuter Peak</div>
            </button>

            {/* Midday & Evening */}
            <button
              type="button"
              onClick={() => {
                setTime('17:30')
                if (error) setError('')
              }}
              className={`rounded-xl border p-2.5 text-left transition-all ${
                currentMinutesVal >= 720 && currentMinutesVal <= 1200
                  ? 'border-blue-500 bg-blue-50/90 ring-2 ring-blue-300 text-blue-950 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-blue-50/40'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-800">
                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                12:00 PM – 08:00 PM
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Afternoon & Evening Peak</div>
            </button>

            {/* Night Service */}
            <button
              type="button"
              onClick={() => {
                setTime('20:30')
                if (error) setError('')
              }}
              className={`rounded-xl border p-2.5 text-left transition-all ${
                currentMinutesVal > 1200 && currentMinutesVal <= 1415
                  ? 'border-indigo-600 bg-indigo-50/90 ring-2 ring-indigo-400 text-indigo-950 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-indigo-50/40'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-900">
                <span className="h-2 w-2 rounded-full bg-indigo-600 inline-block" />
                08:00 PM – 11:35 PM
              </div>
              <div className="text-[11px] text-indigo-800/80 font-medium mt-0.5">Night & Feeder Transit</div>
            </button>
          </div>
        </div>

        {/* Real-time Out-of-Service Warning Banner */}
        {isOutOfServiceHours && (
          <div
            role="status"
            className="rounded-2xl border border-amber-300 bg-amber-50/95 p-4 text-xs sm:text-sm text-amber-950 space-y-2 shadow-xs"
          >
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <span className="text-base">🌙</span>
              <span>Selected Departure ({formatTime12(time)}) is in Overnight Maintenance</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Delhi Metro and scheduled buses complete service at <strong>11:35 PM</strong> and resume at <strong>06:00 AM</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80">
              <span className="text-xs font-bold text-amber-900">Select active service hour:</span>
              <button
                type="button"
                onClick={() => {
                  setTime('08:00')
                  if (error) setError('')
                }}
                className="rounded-lg bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 transition-colors"
              >
                08:00 AM (Morning)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTime('17:30')
                  if (error) setError('')
                }}
                className="rounded-lg bg-blue-700 px-3 py-1 text-xs font-bold text-white shadow-2xs hover:bg-blue-800 transition-colors"
              >
                05:30 PM (Evening)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTime('20:30')
                  if (error) setError('')
                }}
                className="rounded-lg bg-indigo-700 px-3 py-1 text-xs font-bold text-white shadow-2xs hover:bg-indigo-800 transition-colors"
              >
                08:30 PM (Night)
              </button>
            </div>
          </div>
        )}

        {/* Departure Time & AM / PM Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="departure-time" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Departure Time (AM / PM Supported)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                {formatTime12(time)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Time Input Field */}
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
                    ? 'border-amber-400 bg-amber-50/30'
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
                className={`flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-extrabold transition-all ${
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
                className={`flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-extrabold transition-all ${
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

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {activeQuickTimes.map(qt => (
                <button
                  key={qt.value}
                  type="button"
                  onClick={() => {
                    setTime(qt.value)
                    if (error) setError('')
                  }}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-bold transition-all ${
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Transport Mode Selection
            </label>
            <span className="text-[11px] font-semibold text-slate-500">Metro vs Bus</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5">
            <button
              type="button"
              onClick={() => setModePreference('all')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
                modePreference === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🌐</span>
              <span>All Modes</span>
            </button>
            <button
              type="button"
              onClick={() => setModePreference('metro')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
                modePreference === 'metro'
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🚇</span>
              <span>Metro Only</span>
            </button>
            <button
              type="button"
              onClick={() => setModePreference('bus')}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
                modePreference === 'bus'
                  ? 'bg-white text-amber-800 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🚌</span>
              <span>Bus Only</span>
            </button>
          </div>
        </div>

        {/* Tactical Segmented Preference Switcher */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Routing Objective
          </label>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5">
            <button
              type="button"
              onClick={() => setPreference('fastest')}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
                preference === 'fastest'
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>⚡</span>
              <span>Fastest Arrival</span>
            </button>
            <button
              type="button"
              onClick={() => setPreference('cheapest')}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
                preference === 'cheapest'
                  ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏷️</span>
              <span>Lowest Fare</span>
            </button>
          </div>
        </div>

        {/* Passenger Target Budget (Optional ₹ Price) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="max-budget" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Passenger Budget Limit (₹ Max Fare)
            </label>
            <span className="text-[11px] font-semibold text-slate-400">Optional</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
              <input
                id="max-budget"
                type="number"
                min="0"
                step="5"
                placeholder="e.g. 25"
                value={maxBudget}
                onChange={e => setMaxBudget(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-300 bg-white pl-8 pr-3.5 py-2 text-sm font-semibold text-slate-900 shadow-2xs transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex gap-1.5">
              {['20', '25', '30', '40'].map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setMaxBudget(maxBudget === b ? '' : b)}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-bold transition-all ${
                    maxBudget === b
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ₹{b}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Compare Metro vs Bus fare trade-offs and evaluate options against your target budget.
          </p>
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
              <span>Scanning Delhi Transit Network…</span>
            </>
          ) : (
            <>
              <span>Find Best Transit Journeys</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
