import { useState } from 'react'
import type { ModePreference, ServiceDay, Stop } from '../../types'
import { parseToTime24, formatTime12, toTime24 } from '../../utils/time'
import StationCombobox from './StationCombobox'
import {
  ArrowUpDownIcon,
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

/**
 * Evaluates whether a given 24h departure time falls within Delhi Metro's
 * statutory 20% SmartCard off-peak discount window.
 * Off-Peak: 06:00–08:00 AM, 12:00–05:00 PM (12:00–17:00), 09:00 PM onwards (21:00+)
 */
function getDelhiFareTier(time24: string): {
  isOffPeak: boolean
  badge: string
  tagline: string
  savings: string
} {
  const [hStr, mStr] = (time24 || '08:40').split(':')
  const h = parseInt(hStr, 10) || 8
  const m = parseInt(mStr, 10) || 0
  const totalMins = h * 60 + m

  const isMorningOffPeak = totalMins >= 360 && totalMins < 480 // 06:00 to 08:00
  const isAfternoonOffPeak = totalMins >= 720 && totalMins < 1020 // 12:00 to 17:00
  const isNightOffPeak = totalMins >= 1260 && totalMins <= 1439 // 21:00 to 23:59

  if (isMorningOffPeak || isAfternoonOffPeak || isNightOffPeak) {
    return {
      isOffPeak: true,
      badge: '💳 20% Off-Peak Active',
      tagline: 'DMRC SmartCard 20% statutory fare discount applies for this departure slot.',
      savings: 'Save ₹4–₹12 on Metro leg',
    }
  }

  return {
    isOffPeak: false,
    badge: '⚡ Peak Transit Rush',
    tagline: 'Statutory standard fares apply with high-frequency metro trains every 2.5 mins.',
    savings: 'Maximum train frequency',
  }
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
  setModePreference: _setModePreference,
  maxBudget,
  setMaxBudget: _setMaxBudget,
  onSearch,
  loading,
  onOpenCashbackModal: _onOpenCashbackModal,
}: Props) {
  const [error, setError] = useState('')
  const [, setDepartMode] = useState<'now' | 'later'>('now')
  const [tripType, setTripType] = useState<'oneway' | 'round' | 'explore'>('oneway')
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
  const fareTier = getDelhiFareTier(time24)
  const currentTotalMins = hour24 * 60 + minute

  // Stepper: Increment or Decrement Hour (1 to 12)
  const stepHour = (delta: number) => {
    let nextH12 = hour12 + delta
    if (nextH12 > 12) nextH12 = 1
    if (nextH12 < 1) nextH12 = 12
    const updated = toTime24(nextH12, minute, currentPeriod)
    setTime(updated)
    if (error) setError('')
  }

  // Stepper: Increment or Decrement Minute in 5-minute intervals
  const stepMinute = (delta: number) => {
    let nextM = Math.round(minute / 5) * 5 + delta
    let nextH24 = hour24
    if (nextM >= 60) {
      nextM = 0
      nextH24 = (nextH24 + 1) % 24
    } else if (nextM < 0) {
      nextM = 55
      nextH24 = (nextH24 - 1 + 24) % 24
    }
    const updated = `${String(nextH24).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`
    setTime(updated)
    if (error) setError('')
  }

  // Rapid Shifter: Shift departure time by arbitrary minutes (+/- 15m, 30m, 60m)
  const shiftMinutes = (deltaMins: number) => {
    let newTotal = currentTotalMins + deltaMins
    if (newTotal < 0) newTotal += 24 * 60
    newTotal = newTotal % (24 * 60)
    const nh = Math.floor(newTotal / 60)
    const nm = newTotal % 60
    const updated = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
    setTime(updated)
    if (error) setError('')
  }

  // Interactive Slider: Scrubber through Delhi service day (06:00 to 23:30)
  const handleSliderScrub = (mins: number) => {
    const nh = Math.floor(mins / 60)
    const nm = mins % 60
    const updated = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
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
      className="rounded-3xl border border-[#EDE8E1] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(26,46,59,0.05)] text-[#1A202C] space-y-5 animate-fade-in"
    >
      {/* Title & Subtitle Matching Target: PLAN FOR A DELHI DAY */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#C49A43] select-none">
          <span>📍</span>
          <span>PLAN FOR A DELHI DAY</span>
        </div>
        <h2 id="journey-planner-heading" className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A2E3B] leading-tight">
          Where would you <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A338] via-[#C49A43] to-[#B38728]">like to go?</span>
        </h2>
        <p className="text-[14px] font-medium text-[#6E665D] leading-relaxed">
          Compare metro, bus and multimodal routes across Delhi
        </p>
      </header>

      {/* Trip Type Segmented Bar (One Way / Round Trip / Explore) */}
      <div className="flex items-center bg-[#FAF7F2] p-1 rounded-full border border-[#EDE8E1] w-full" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tripType === 'oneway'}
          onClick={() => setTripType('oneway')}
          className={`flex-1 py-1.5 px-3 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
            tripType === 'oneway'
              ? 'bg-[#1A2E3B] text-white shadow-xs'
              : 'text-[#7A7269] hover:text-[#1A2E3B]'
          }`}
        >
          One Way
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tripType === 'round'}
          onClick={() => setTripType('round')}
          className={`flex-1 py-1.5 px-3 rounded-full text-[13px] font-medium transition-all cursor-pointer ${
            tripType === 'round'
              ? 'bg-[#1A2E3B] text-white shadow-xs font-bold'
              : 'text-[#7A7269] hover:text-[#1A2E3B]'
          }`}
        >
          Round Trip
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tripType === 'explore'}
          onClick={() => setTripType('explore')}
          className={`flex-1 py-1.5 px-3 rounded-full text-[13px] font-medium transition-all cursor-pointer ${
            tripType === 'explore'
              ? 'bg-[#1A2E3B] text-white shadow-xs font-bold'
              : 'text-[#7A7269] hover:text-[#1A2E3B]'
          }`}
        >
          Explore
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* FROM & TO CONTAINER WITH FLOATING SWAP BUTTON */}
        <div className="relative space-y-3">
          {/* FROM INPUT (Interactive Station Combobox) */}
          <StationCombobox
            id="journey-origin"
            label="From"
            pinColor="#C49A43"
            value={origin}
            onChange={newId => {
              setOrigin(newId)
              if (error) setError('')
            }}
            stops={stops}
            placeholder="Select origin station..."
            otherSelectedId={destination}
          />

          {/* Floating Swap Button on the right connecting the fields */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap origin and destination endpoints"
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-[#EDE8E1] bg-white hover:bg-[#FAF7F2] hover:border-[#C49A43] shadow-md hover:shadow-lg active:scale-90 transition-all duration-200 text-[#1A2E3B] hover:text-[#C49A43] cursor-pointer"
            >
              <span className={`inline-block transition-transform duration-300 ${isSwapping ? 'rotate-180' : ''}`}>
                <ArrowUpDownIcon className="w-4 h-4" />
              </span>
            </button>
          </div>

          {/* TO INPUT (Interactive Station Combobox) */}
          <StationCombobox
            id="journey-destination"
            label="To"
            pinColor="#A6533C"
            value={destination}
            onChange={newId => {
              setDestination(newId)
              if (error) setError('')
            }}
            stops={stops}
            placeholder="Select destination station..."
            otherSelectedId={origin}
          />
        </div>

        {/* DEPARTURE (With interactive Customize Time & Clock Option) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#7A7269] flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-[#C49A43]" />
              <span>DEPARTURE</span>
            </label>
            <div className="flex items-center gap-2">
              {fareTier.isOffPeak ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#2E7D32] bg-[#EAF5EC] px-2 py-0.5 rounded-full border border-[#C5E5CC]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32]" />
                  <span>20% Off-Peak</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#9A721C] bg-[#FAF0D9] px-2 py-0.5 rounded-full border border-[#EFE0C2]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C49A43]" />
                  <span>Peak Hours</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowClockCustomizer(prev => !prev)}
                className="text-[11px] font-bold text-[#C49A43] hover:text-[#A77B32] transition-colors cursor-pointer"
              >
                {showClockCustomizer ? 'Hide Clock ▲' : 'Customize Clock ▼'}
              </button>
            </div>
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
            <div className="rounded-2xl border border-[#C49A43]/40 bg-[#FAF7F2] p-3.5 space-y-3.5 animate-fade-in shadow-sm mt-2">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#EBE5DC] pb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C49A43] flex items-center gap-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-[#C49A43]" />
                  <span>TRANSIT CLOCK & FARE CONSOLE</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-extrabold text-[#1A2E3B] bg-white px-2 py-0.5 rounded-md border border-[#EBE5DC] shadow-2xs">
                    {formattedDisplay}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowClockCustomizer(false)}
                    className="text-xs font-bold text-[#C49A43] hover:underline cursor-pointer"
                  >
                    Done ✓
                  </button>
                </div>
              </div>

              {/* 1. Large Digital Transit Flip Stepper Console */}
              <div className="flex items-center justify-center gap-3 bg-white p-3 rounded-xl border border-[#EBE5DC] shadow-2xs">
                {/* Hour Stepper */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => stepHour(1)}
                    className="h-6 w-12 flex items-center justify-center rounded-t-md bg-[#FAF7F2] hover:bg-[#FAF0D9] text-[#1A2E3B] text-xs font-bold transition-colors cursor-pointer border border-[#EBE5DC] active:bg-[#F2E5C9]"
                    title="Increment Hour"
                  >
                    ▲
                  </button>
                  <div className="w-12 h-11 flex items-center justify-center bg-[#1A2E3B] text-white font-mono text-2xl font-black rounded-none shadow-inner select-none">
                    {String(hour12).padStart(2, '0')}
                  </div>
                  <button
                    type="button"
                    onClick={() => stepHour(-1)}
                    className="h-6 w-12 flex items-center justify-center rounded-b-md bg-[#FAF7F2] hover:bg-[#FAF0D9] text-[#1A2E3B] text-xs font-bold transition-colors cursor-pointer border border-[#EBE5DC] active:bg-[#F2E5C9]"
                    title="Decrement Hour"
                  >
                    ▼
                  </button>
                  <span className="text-[9px] font-bold text-[#7A7269] mt-1 tracking-wider">
                    HOUR
                  </span>
                </div>

                {/* Colon */}
                <div className="font-mono text-2xl font-black text-[#C49A43] animate-pulse pb-4 select-none">
                  :
                </div>

                {/* Minute Stepper */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => stepMinute(5)}
                    className="h-6 w-12 flex items-center justify-center rounded-t-md bg-[#FAF7F2] hover:bg-[#FAF0D9] text-[#1A2E3B] text-xs font-bold transition-colors cursor-pointer border border-[#EBE5DC] active:bg-[#F2E5C9]"
                    title="Advance +5 Minutes"
                  >
                    ▲
                  </button>
                  <div className="w-12 h-11 flex items-center justify-center bg-[#1A2E3B] text-white font-mono text-2xl font-black rounded-none shadow-inner select-none">
                    {String(minute).padStart(2, '0')}
                  </div>
                  <button
                    type="button"
                    onClick={() => stepMinute(-5)}
                    className="h-6 w-12 flex items-center justify-center rounded-b-md bg-[#FAF7F2] hover:bg-[#FAF0D9] text-[#1A2E3B] text-xs font-bold transition-colors cursor-pointer border border-[#EBE5DC] active:bg-[#F2E5C9]"
                    title="Rewind -5 Minutes"
                  >
                    ▼
                  </button>
                  <span className="text-[9px] font-bold text-[#7A7269] mt-1 tracking-wider">
                    MIN (5m)
                  </span>
                </div>

                {/* AM / PM Toggle */}
                <div className="flex flex-col items-center pl-2">
                  <div className="flex flex-col rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => handlePeriodChange('AM')}
                      className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                        currentPeriod === 'AM'
                          ? 'bg-[#1A2E3B] text-white shadow-xs'
                          : 'text-[#7A7269] hover:text-[#1A2E3B] bg-transparent'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePeriodChange('PM')}
                      className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                        currentPeriod === 'PM'
                          ? 'bg-[#1A2E3B] text-white shadow-xs'
                          : 'text-[#7A7269] hover:text-[#1A2E3B] bg-transparent'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                  <span className="text-[9px] font-bold text-[#7A7269] mt-1 tracking-wider">
                    PERIOD
                  </span>
                </div>
              </div>

              {/* 2. 1-Tap Rapid Time Shifter Pills */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#7A7269]">
                  <span>Quick Time Shifters</span>
                  <span className="text-[#C49A43]">1-Tap Adjust</span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[
                    { label: '−30m', delta: -30 },
                    { label: '−15m', delta: -15 },
                    { label: '⏱️ NOW', delta: 0, isNow: true },
                    { label: '+15m', delta: 15 },
                    { label: '+30m', delta: 30 },
                    { label: '+1h', delta: 60 },
                  ].map(shifter => (
                    <button
                      key={shifter.label}
                      type="button"
                      onClick={() => {
                        if (shifter.isNow) {
                          handleSelectNow()
                        } else {
                          shiftMinutes(shifter.delta)
                        }
                      }}
                      className="py-1.5 px-1 rounded-lg border border-[#EBE5DC] bg-white hover:border-[#C49A43] hover:bg-[#FAF0D9]/50 text-[11px] font-bold text-[#1A2E3B] transition-all cursor-pointer text-center active:scale-95 shadow-2xs truncate"
                      title={shifter.isNow ? 'Sync with live Delhi local time' : `Shift departure time by ${shifter.label}`}
                    >
                      {shifter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. DMRC 20% SmartCard Savings Banner */}
              <div
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs transition-colors ${
                  fareTier.isOffPeak
                    ? 'bg-[#EAF5EC] border-[#C5E5CC] text-[#22702E]'
                    : 'bg-[#FAF0D9] border-[#EFE0C2] text-[#9A721C]'
                }`}
              >
                <span className="text-base leading-none">
                  {fareTier.isOffPeak ? '💳' : '⚡'}
                </span>
                <div className="space-y-0.5 leading-tight">
                  <div className="font-extrabold flex items-center gap-1.5">
                    <span>{fareTier.badge}</span>
                    <span className="text-[10px] font-semibold opacity-80">
                      • {fareTier.savings}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90">
                    {fareTier.tagline}
                  </p>
                </div>
              </div>

              {/* 4. Interactive Time Scrubber Dial (06:00 to 23:30) */}
              <div className="space-y-1.5 pt-1 border-t border-[#EBE5DC]">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#7A7269]">
                  <span>Delhi Transit Timeline Scrubber</span>
                  <span className="font-mono text-[#1A2E3B]">{time24}</span>
                </div>
                <input
                  type="range"
                  min={360}
                  max={1410}
                  step={5}
                  value={Math.max(360, Math.min(1410, currentTotalMins))}
                  onChange={e => handleSliderScrub(Number(e.target.value))}
                  className="w-full h-2 bg-[#EBE5DC] rounded-lg appearance-none cursor-pointer accent-[#C49A43]"
                  aria-label="Departure time slider from 6 AM to 11:30 PM"
                />
                <div className="flex justify-between text-[9px] text-[#7A7269] font-medium px-0.5">
                  <span>06:00 AM (Start)</span>
                  <span>12:00 PM (Off-Peak)</span>
                  <span>06:00 PM (Peak)</span>
                  <span>11:30 PM (Close)</span>
                </div>
              </div>

              {/* 5. Commuter Rush Presets */}
              <div className="space-y-1.5 pt-1 border-t border-[#EBE5DC]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A7269]">
                  Commuter Rush Presets
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: '🌅 08:30 AM Morning Peak', value: '08:30', tag: 'High Frequency' },
                    { label: '☀️ 01:00 PM Midday Off-Peak', value: '13:00', tag: '💳 20% Off' },
                    { label: '🌆 06:00 PM Evening Peak', value: '18:00', tag: '2.5m Headway' },
                    { label: '🌙 09:30 PM Night Feeder', value: '21:30', tag: '💳 20% Off' },
                  ].map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setTime(preset.value)
                        setShowClockCustomizer(false)
                        if (error) setError('')
                      }}
                      className={`flex flex-col p-2 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
                        time === preset.value
                          ? 'border-[#C49A43] bg-[#FAF0D9] text-[#9A721C] font-bold'
                          : 'border-[#EBE5DC] bg-white text-[#1A2E3B] hover:border-[#C49A43]'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{preset.label}</div>
                      <div className="text-[9px] text-[#7A7269] font-semibold mt-0.5">
                        {preset.tag}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. System Clock & Weekday / Weekend Category */}
              <div className="flex items-center justify-between pt-1 border-t border-[#EBE5DC] text-[11px] gap-2">
                <label className="flex items-center gap-1.5 font-bold text-[#7A7269]">
                  <span>System:</span>
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

                <div className="flex rounded-lg border border-[#EBE5DC] bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => onServiceDayChange('weekday')}
                    className={`px-2 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                      serviceDay === 'weekday'
                        ? 'bg-[#1A2E3B] text-white shadow-2xs'
                        : 'text-[#7A7269] hover:text-[#1A2E3B]'
                    }`}
                  >
                    Weekday
                  </button>
                  <button
                    type="button"
                    onClick={() => onServiceDayChange('weekend')}
                    className={`px-2 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                      serviceDay === 'weekend'
                        ? 'bg-[#1A2E3B] text-white shadow-2xs'
                        : 'text-[#7A7269] hover:text-[#1A2E3B]'
                    }`}
                  >
                    Weekend
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TRAVEL PREFERENCE (Fastest & Cheapest) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-[#1A2E3B]">
              Travel Preference
            </label>
            <button
              type="button"
              onClick={() => setShowClockCustomizer(prev => !prev)}
              className="text-[12px] font-semibold text-[#6E665D] hover:text-[#1A2E3B] flex items-center gap-1 cursor-pointer"
            >
              <span>Customize Clock</span>
              <span>↗</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 1. Fastest (Deep Forest Green when active) */}
            <button
              type="button"
              onClick={() => setPreference('fastest')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-[14px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                preference === 'fastest'
                  ? 'bg-[#166534] text-white shadow-sm ring-1 ring-[#166534]'
                  : 'bg-white text-[#1A2E3B] border border-[#EDE8E1] hover:bg-[#FAF7F2]'
              }`}
            >
              <span>⚡</span>
              <span>Fastest</span>
            </button>

            {/* 2. Cheapest */}
            <button
              type="button"
              onClick={() => setPreference('cheapest')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-[14px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                preference === 'cheapest'
                  ? 'bg-[#166534] text-white shadow-sm ring-1 ring-[#166534]'
                  : 'bg-white text-[#1A2E3B] border border-[#EDE8E1] hover:bg-[#FAF7F2]'
              }`}
            >
              <span>🏷️</span>
              <span>Cheapest</span>
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON Matching Target: Find My Route -> */}
        <button
          type="submit"
          id="btn-search-journey"
          disabled={loading}
          aria-label="Find My Route"
          className="group w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#D4A338] via-[#C49A43] to-[#B38728] hover:from-[#C49A43] hover:to-[#A77B32] text-white font-bold py-4 px-5 text-[15px] tracking-normal shadow-[0_4px_16px_rgba(196,154,67,0.35)] hover:shadow-[0_6px_22px_rgba(196,154,67,0.45)] active:scale-[0.985] transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="font-semibold">Finding Routes...</span>
            </>
          ) : (
            <>
              <span>Find My Route</span>
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
