import { useState } from 'react'
import type { ModePreference, ServiceDay, Stop } from '../../types'
import { parseToTime24, formatTime12, toTime24 } from '../../utils/time'
import {
  ArrowUpDownIcon,
  XIcon,
  ZapIcon,
  TagIcon,
  ArrowRightIcon,
  ClockIcon,
} from '../common/Icons'

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
  onOpenCashbackModal?: () => void
}

// Popular locations in Delhi matching reference
const POPULAR_STOPS = [
  { id: 'S13', label: 'Dwarka' },
  { id: 'S01', label: 'Rajiv Chowk' },
  { id: 'S02', label: 'Kashmere Gate' },
  { id: 'S04', label: 'New Delhi' },
  { id: 'S10', label: 'AIIMS' },
]

function getFigmaStationName(stop: Stop): string {
  if (stop.stop_id === 'S13') return 'Dwarka Sector 21'
  if (stop.stop_id === 'S19') return 'Noida City Centre'
  return stop.stop_name
}

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
  setMaxBudget: _setMaxBudget,
  onSearch,
  loading,
  onOpenCashbackModal,
}: Props) {
  const [error, setError] = useState('')
  const [departMode, setDepartMode] = useState<'now' | 'later'>('now')
  const [showClockCustomizer, setShowClockCustomizer] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)

  // Derived 12-hour and 24-hour clock values for interactive customizer
  const time24 = parseToTime24(time) || '08:40'
  const [hStr, mStr] = time24.split(':')
  const hour24 = parseInt(hStr, 10) || 8
  const minute = parseInt(mStr, 10) || 0
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const currentPeriod: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM'
  const formattedDisplay = formatTime12(time24)

  const handleHourChange = (newHour12: number) => {
    const updated = toTime24(newHour12, minute, currentPeriod)
    setTime(updated)
    if (error) setError('')
  }

  const handleMinuteChange = (newMinute: number) => {
    const updated = toTime24(hour12, newMinute, currentPeriod)
    setTime(updated)
    if (error) setError('')
  }

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    const updated = toTime24(hour12, minute, newPeriod)
    setTime(updated)
    if (error) setError('')
  }

  const handleSwap = () => {
    setIsSwapping(true)
    const temp = origin
    setOrigin(destination)
    setDestination(temp)
    if (error) setError('')
    setTimeout(() => setIsSwapping(false), 300)
  }

  const handleSelectNow = () => {
    setDepartMode('now')
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    setTime(`${hh}:${mm}`)
  }

  const handleSelectLater = () => {
    setDepartMode('later')
    setTime('09:00')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !destination) {
      setError('Please select both origin and destination stops.')
      return
    }
    if (origin === destination) {
      setError('Origin and destination cannot be the same stop.')
      return
    }

    const parsedTime = parseToTime24(time)
    if (!parsedTime) {
      setError('Invalid departure time format. Try "08:30 AM" or "14:15".')
      return
    }

    setError('')
    onSearch(origin, destination, parsedTime, preference, serviceDay, modePreference, maxBudget)
  }

  return (
    <section
      aria-labelledby="journey-planner-heading"
      className="rounded-2xl border border-[#EBE5DC] bg-white p-5 sm:p-6 shadow-xs text-[#1A202C] space-y-4 animate-fade-in"
    >
      {/* Title & Subtitle Matching Figma: PLAN FOR A DELHI DAY */}
      <header className="space-y-1 sm:space-y-1.5">
        <div className="text-xs sm:text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#C49A43] select-none">
          PLAN FOR A DELHI DAY
        </div>
        <h2 id="journey-planner-heading" className="font-serif text-2xl sm:text-2xl lg:text-[26px] font-normal tracking-tight text-[#1A2E3B] leading-tight">
          Where would you like to go?
        </h2>
        <p className="text-xs sm:text-sm font-normal text-[#7A7269] leading-relaxed">
          Compare metro, bus and multimodal routes
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* FROM INPUT (Origin Pin Gold Circle) */}
        <div className="space-y-1.5">
          <label htmlFor="journey-origin" className="text-xs font-bold uppercase tracking-[0.1em] text-[#7A7269] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#C49A43]" />
            <span>FROM</span>
          </label>
          <div className="relative flex items-center rounded-xl border border-[#EBE5DC] bg-white px-3.5 py-2.5 sm:py-3 transition-all shadow-2xs hover:border-[#D8CFBF] focus-within:border-[#C49A43] focus-within:ring-2 focus-within:ring-[#C49A43]/20">
            <select
              id="journey-origin"
              value={origin}
              onChange={e => {
                setOrigin(e.target.value)
                if (error) setError('')
              }}
              className="w-full bg-transparent font-semibold text-[#1A202C] focus:outline-none cursor-pointer text-xs sm:text-sm"
            >
              <option value="">Select origin station or hub...</option>
              {stops.map(s => (
                <option key={s.stop_id} value={s.stop_id}>
                  {getFigmaStationName(s)}
                </option>
              ))}
            </select>
            {origin && (
              <button
                type="button"
                onClick={() => setOrigin('')}
                className="text-[#7A7269] hover:text-[#1A202C] p-1 rounded-md cursor-pointer transition-colors"
                title="Clear origin"
                aria-label="Clear origin station"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* SWAP BUTTON */}
        <div className="flex items-center justify-center -my-2 relative z-10">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Swap origin and destination endpoints"
            className="group flex h-8 w-8 items-center justify-center rounded-full border border-[#EBE5DC] bg-white hover:bg-[#FAF7F2] hover:border-[#C49A43] shadow-xs hover:shadow-sm active:scale-90 transition-all duration-200 text-[#7A7269] hover:text-[#C49A43] cursor-pointer"
          >
            <span className={`inline-block transition-transform duration-300 ${isSwapping ? 'rotate-180' : ''}`}>
              <ArrowUpDownIcon className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* TO INPUT (Destination Pin Terracotta Circle) */}
        <div className="space-y-1.5">
          <label htmlFor="journey-destination" className="text-xs font-bold uppercase tracking-[0.1em] text-[#7A7269] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#A6533C]" />
            <span>TO</span>
          </label>
          <div className="relative flex items-center rounded-xl border border-[#EBE5DC] bg-white px-3.5 py-2.5 sm:py-3 transition-all shadow-2xs hover:border-[#D8CFBF] focus-within:border-[#C49A43] focus-within:ring-2 focus-within:ring-[#C49A43]/20">
            <select
              id="journey-destination"
              value={destination}
              onChange={e => {
                setDestination(e.target.value)
                if (error) setError('')
              }}
              className="w-full bg-transparent font-semibold text-[#1A202C] focus:outline-none cursor-pointer text-xs sm:text-sm"
            >
              <option value="">Select destination station...</option>
              {stops.map(s => (
                <option key={s.stop_id} value={s.stop_id}>
                  {getFigmaStationName(s)}
                </option>
              ))}
            </select>
            {destination && (
              <button
                type="button"
                onClick={() => setDestination('')}
                className="text-[#7A7269] hover:text-[#1A202C] p-1 rounded-md cursor-pointer transition-colors"
                title="Clear destination"
                aria-label="Clear destination station"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* DEPARTURE (With interactive Customize Time & Clock Option) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#7A7269] flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-[#C49A43]" />
              <span>DEPARTURE</span>
            </label>
            <button
              type="button"
              onClick={() => setShowClockCustomizer(prev => !prev)}
              className="text-[11px] font-bold text-[#C49A43] hover:text-[#A77B32] transition-colors cursor-pointer"
            >
              {showClockCustomizer ? 'Hide Clock ▲' : 'Customize Clock ▼'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Left Button: Custom Time / Clock Opener */}
            <button
              type="button"
              onClick={() => setShowClockCustomizer(prev => !prev)}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 sm:py-2.5 transition-all shadow-2xs cursor-pointer group active:scale-[0.99] ${
                showClockCustomizer
                  ? 'border-[#C49A43] bg-[#FAF0D9]/70 text-[#1A2E3B] ring-2 ring-[#C49A43]/20'
                  : 'border-[#EBE5DC] bg-white hover:border-[#D8CFBF] text-[#1A2E3B]'
              }`}
              title="Click to customize departure time & clock"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">🕐</span>
                <span className="font-bold text-xs sm:text-sm truncate">
                  Today, {formattedDisplay}
                </span>
              </div>
              <span className="text-[10px] uppercase font-extrabold text-[#C49A43] bg-white/90 px-1.5 py-0.5 rounded-md border border-[#EBE5DC] shrink-0">
                Clock
              </span>
            </button>

            {/* Right Button: Live NOW Button */}
            <button
              type="button"
              onClick={handleSelectNow}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] hover:bg-[#F2ECE1] hover:border-[#C49A43]/40 px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#1A2E3B] transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
              title="Set departure to current Delhi clock"
            >
              <span className="h-2 w-2 rounded-full bg-[#2E7D32] animate-pulse" />
              <span>NOW • {time || '08:40'}</span>
            </button>
          </div>

          {/* Interactive Customize Time & Clock Console */}
          {showClockCustomizer && (
            <div className="rounded-2xl border border-[#C49A43]/40 bg-[#FAF7F2] p-3.5 space-y-3 animate-fade-in shadow-xs mt-2">
              <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C49A43] flex items-center gap-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-[#C49A43]" />
                  <span>CUSTOMIZE DEPARTURE CLOCK</span>
                </span>
                <span className="text-xs font-extrabold text-[#1A2E3B] bg-white px-2 py-0.5 rounded-md border border-[#EBE5DC]">
                  {formattedDisplay}
                </span>
              </div>

              {/* 1. Interactive Dial Steppers: Hour, Minute, AM/PM */}
              <div className="grid grid-cols-12 gap-2 items-center">
                {/* Hour */}
                <div className="col-span-4">
                  <label htmlFor="clock-hour" className="text-[10px] font-bold text-[#7A7269] block mb-1">
                    HOUR (1–12)
                  </label>
                  <select
                    id="clock-hour"
                    value={hour12}
                    onChange={e => handleHourChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#EBE5DC] bg-white px-2.5 py-1.5 text-xs font-bold text-[#1A2E3B] focus:outline-none focus:border-[#C49A43] cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minute */}
                <div className="col-span-4">
                  <label htmlFor="clock-minute" className="text-[10px] font-bold text-[#7A7269] block mb-1">
                    MINUTE (0–55)
                  </label>
                  <select
                    id="clock-minute"
                    value={minute - (minute % 5)}
                    onChange={e => handleMinuteChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#EBE5DC] bg-white px-2.5 py-1.5 text-xs font-bold text-[#1A2E3B] focus:outline-none focus:border-[#C49A43] cursor-pointer"
                  >
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Period */}
                <div className="col-span-4">
                  <span className="text-[10px] font-bold text-[#7A7269] block mb-1">
                    PERIOD
                  </span>
                  <div className="flex rounded-xl border border-[#EBE5DC] bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => handlePeriodChange('AM')}
                      className={`flex-1 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                        currentPeriod === 'AM'
                          ? 'bg-[#1A2E3B] text-white shadow-xs'
                          : 'text-[#7A7269] hover:text-[#1A2E3B]'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePeriodChange('PM')}
                      className={`flex-1 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                        currentPeriod === 'PM'
                          ? 'bg-[#1A2E3B] text-white shadow-xs'
                          : 'text-[#7A7269] hover:text-[#1A2E3B]'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Native System Clock Wheel Input */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#EBE5DC]">
                <label className="flex items-center gap-2 text-[11px] font-bold text-[#7A7269]">
                  <span>System Clock:</span>
                  <input
                    type="time"
                    value={time24}
                    onChange={e => {
                      if (e.target.value) {
                        setTime(e.target.value)
                        if (error) setError('')
                      }
                    }}
                    className="rounded-lg border border-[#EBE5DC] bg-white px-2 py-0.5 text-xs font-bold text-[#1A2E3B] focus:outline-none focus:border-[#C49A43] cursor-pointer"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowClockCustomizer(false)}
                  className="text-xs font-bold text-[#C49A43] hover:underline cursor-pointer"
                >
                  Done ✓
                </button>
              </div>

              {/* 3. Quick Commute Slot Presets */}
              <div className="space-y-1.5 pt-1 border-t border-[#EBE5DC]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A7269]">
                  Commuter Rush Presets
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: '🌅 08:30 AM Morning Peak', value: '08:30' },
                    { label: '☀️ 01:00 PM Midday', value: '13:00' },
                    { label: '🌆 06:00 PM Evening Peak', value: '18:00' },
                    { label: '🌙 09:30 PM Night Feeder', value: '21:30' },
                  ].map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setTime(preset.value)
                        setShowClockCustomizer(false)
                        if (error) setError('')
                      }}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-semibold text-left transition-all cursor-pointer ${
                        time === preset.value
                          ? 'border-[#C49A43] bg-[#FAF0D9] text-[#9A721C] font-bold shadow-2xs'
                          : 'border-[#EBE5DC] bg-white text-[#1A2E3B] hover:border-[#C49A43]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Schedule Day Category (Weekday vs Weekend) */}
              <div className="flex items-center justify-between pt-1 border-t border-[#EBE5DC] text-[11px]">
                <span className="font-bold text-[#7A7269]">Timetable Category:</span>
                <div className="flex rounded-lg border border-[#EBE5DC] bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => onServiceDayChange('weekday')}
                    className={`px-2.5 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                      serviceDay === 'weekday'
                        ? 'bg-[#1A2E3B] text-white shadow-2xs'
                        : 'text-[#7A7269] hover:text-[#1A2E3B]'
                    }`}
                  >
                    Weekday (Mon–Fri)
                  </button>
                  <button
                    type="button"
                    onClick={() => onServiceDayChange('weekend')}
                    className={`px-2.5 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                      serviceDay === 'weekend'
                        ? 'bg-[#1A2E3B] text-white shadow-2xs'
                        : 'text-[#7A7269] hover:text-[#1A2E3B]'
                    }`}
                  >
                    Weekend (Sat–Sun)
                  </button>
                </div>
              </div>

              {/* Timetable Operating Range Notice */}
              <div className="text-[10px] text-[#7A7269] bg-white/70 rounded-lg p-1.5 border border-[#EBE5DC]/60 text-center font-medium">
                Active Delhi Service Window: 06:00 AM – 11:35 PM Daily
              </div>
            </div>
          )}
        </div>

        {/* TRAVEL PREFERENCE (Fastest vs Cheapest Toggle Matching Figma) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#7A7269]">
            TRAVEL PREFERENCE
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPreference('fastest')}
              className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                preference === 'fastest'
                  ? 'bg-[#C49A43] text-white shadow-[0_2px_8px_rgba(196,154,67,0.3)] ring-1 ring-[#C49A43]'
                  : 'bg-[#FAF7F2] text-[#6E665D] border border-[#EBE5DC] hover:bg-[#F4EFE6] hover:text-[#1A2E3B] hover:border-[#D8CFBF]'
              }`}
            >
              <ZapIcon className="w-3.5 h-3.5" />
              <span>Fastest</span>
            </button>

            <button
              type="button"
              onClick={() => setPreference('cheapest')}
              className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                preference === 'cheapest'
                  ? 'bg-[#C49A43] text-white shadow-[0_2px_8px_rgba(196,154,67,0.3)] ring-1 ring-[#C49A43]'
                  : 'bg-[#FAF7F2] text-[#6E665D] border border-[#EBE5DC] hover:bg-[#F4EFE6] hover:text-[#1A2E3B] hover:border-[#D8CFBF]'
              }`}
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span>Cheapest</span>
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON Matching Figma: Find my route -> */}
        <button
          type="submit"
          id="btn-search-journey"
          disabled={loading}
          aria-label="Find my route"
          className="group w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C49A43] via-[#BA8F39] to-[#AF842F] hover:from-[#B88E3B] hover:via-[#AF842F] hover:to-[#A17528] text-white font-bold py-3.5 sm:py-4 px-4 text-xs sm:text-sm tracking-wide shadow-[0_4px_14px_rgba(196,154,67,0.32)] hover:shadow-[0_6px_20px_rgba(196,154,67,0.42)] active:scale-[0.985] transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="font-semibold">Finding Routes...</span>
            </>
          ) : (
            <>
              <span className="font-bold tracking-wide">Find my route</span>
              <ArrowRightIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </button>

        {error && (
          <div role="alert" className="rounded-xl border border-[#A6533C]/40 bg-white p-3 text-xs font-semibold text-[#A6533C] animate-fade-in shadow-xs">
            {error}
          </div>
        )}
      </form>
    </section>
  )
}
