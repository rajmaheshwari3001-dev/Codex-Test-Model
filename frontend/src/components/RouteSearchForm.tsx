import { useState } from 'react'
import type { ServiceDay, Stop } from '../types'

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
  onSearch: (origin?: string, destination?: string, time?: string, preference?: string, serviceDay?: ServiceDay) => void
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
    onSearch(origId, destId, presetTime, preference, serviceDay)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!origin) return setError('Please select an origin stop.')
    if (!destination) return setError('Please select a destination stop.')
    if (origin === destination) return setError('Origin and destination must be different.')
    if (!SERVICE_TIME_PATTERN.test(time)) {
      return setError('Enter a valid time from 00:00 to 47:59 in HH:MM format.')
    }
    onSearch(origin, destination, time, preference, serviceDay)
  }

  // Calculate if the entered departure time is outside active timetable operating hours (06:30 to 12:30)
  const [hours, minutes] = time.split(':').map(Number)
  const currentMinutesVal = (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes)
  const isOutOfServiceHours = currentMinutesVal < 6 * 60 + 30 || currentMinutesVal > 12 * 60 + 30

  // Active timetable hours in the sample dataset are between 06:30 and 12:30
  const activeQuickTimes = [
    { label: '07:00 Early', value: '07:00' },
    { label: '08:00 Peak AM', value: '08:00' },
    { label: '09:30 Midday', value: '09:30' },
    { label: '10:30 Regular', value: '10:30' },
    { label: '11:30 Late AM', value: '11:30' },
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
          {/* Vertical Connecting Metro Track */}
          <div className="absolute left-[27px] top-[42px] bottom-[42px] w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-rose-500 pointer-events-none" />

          {/* Origin Station */}
          <div className="relative flex items-center gap-3">
            <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-100">
              <span className="h-2 w-2 rounded-full bg-white" />
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="origin-stop" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                From Station
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
                To Station
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
              Kashmere Gate → Saket @ 08:00
            </button>
            <button
              type="button"
              onClick={() => handlePreset('S13', 'S01', '07:00')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Dwarka → Rajiv Chowk @ 07:00
            </button>
            <button
              type="button"
              onClick={() => handlePreset('S05', 'S08', '09:00')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              CP → Saket @ 09:00
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
            <span className="rounded-md border border-indigo-200 bg-white px-2 py-0.5 text-[11px] font-bold text-indigo-700 shadow-2xs">
              06:30 – 12:30 Active
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
                currentMinutesVal >= 390 && currentMinutesVal <= 570
                  ? 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-300 text-emerald-950 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-emerald-50/40'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                06:30 – 09:30
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Morning Peak (All Corridors)</div>
            </button>

            {/* Midday */}
            <button
              type="button"
              onClick={() => {
                setTime('10:30')
                if (error) setError('')
              }}
              className={`rounded-xl border p-2.5 text-left transition-all ${
                currentMinutesVal > 570 && currentMinutesVal <= 750
                  ? 'border-blue-500 bg-blue-50/90 ring-2 ring-blue-300 text-blue-950 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-blue-50/40'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-800">
                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                09:30 – 12:30
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Midday Corridor Services</div>
            </button>

            {/* Off-Service */}
            <div
              className={`rounded-xl border p-2.5 text-left transition-all ${
                isOutOfServiceHours
                  ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300 text-amber-950 shadow-xs'
                  : 'border-dashed border-slate-300 bg-slate-100/60 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                12:31 – 23:59
              </div>
              <div className="text-[11px] text-amber-800/80 font-medium mt-0.5">Off-Service (No trips)</div>
            </div>
          </div>
        </div>

        {/* Real-time Out-of-Service Warning Banner */}
        {isOutOfServiceHours && (
          <div
            role="status"
            className="rounded-2xl border border-amber-300 bg-amber-50/95 p-4 text-xs sm:text-sm text-amber-950 space-y-2 shadow-xs"
          >
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <span className="text-base">⚠️</span>
              <span>Selected Departure ({time}) is Outside Operating Hours</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              In this Delhi demo GTFS timetable, all trips conclude at <strong>12:30 PM</strong>. Searching at {time} will return zero scheduled buses.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80">
              <span className="text-xs font-bold text-amber-900">Jump to active slot:</span>
              <button
                type="button"
                onClick={() => {
                  setTime('08:00')
                  if (error) setError('')
                }}
                className="rounded-lg bg-amber-700 px-3 py-1 text-xs font-bold text-white shadow-2xs hover:bg-amber-800 transition-colors"
              >
                08:00 AM (Peak)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTime('09:30')
                  if (error) setError('')
                }}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-bold text-amber-950 hover:bg-amber-100 transition-colors"
              >
                09:30 AM
              </button>
              <button
                type="button"
                onClick={() => {
                  setTime('11:00')
                  if (error) setError('')
                }}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-bold text-amber-950 hover:bg-amber-100 transition-colors"
              >
                11:00 AM
              </button>
            </div>
          </div>
        )}

        {/* Departure Time & Quick Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="departure-time" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Departure Time (HH:MM)
            </label>
            <span className="text-xs font-mono font-medium text-slate-500">24-Hour Format</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="departure-time"
                type="text"
                placeholder="08:00"
                maxLength={5}
                value={time}
                aria-describedby="departure-time-hint"
                aria-invalid={Boolean(error && !SERVICE_TIME_PATTERN.test(time))}
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
              {isOutOfServiceHours && (
                <span className="absolute right-2.5 top-2.5 rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                  Off-Hours
                </span>
              )}
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
