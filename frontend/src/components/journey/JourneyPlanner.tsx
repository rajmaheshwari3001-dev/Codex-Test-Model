import { useState } from 'react'
import type { ModePreference, ServiceDay, Stop } from '../../types'
import { parseToTime24 } from '../../utils/time'
import {
  MapPinIcon,
  NavigationIcon,
  ArrowUpDownIcon,
  XIcon,
  ZapIcon,
  TagIcon,
  TrainIcon,
  BusIcon,
  AutoRickshawIcon,
  ArrowRightIcon,
  SparklesIcon,
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
  const [isSwapping, setIsSwapping] = useState(false)

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
      className="rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] p-5 shadow-xs text-[#29343A] space-y-4 animate-fade-in"
    >
      {/* Title & Subtitle */}
      <header className="border-b border-[#D8C8AA] pb-3">
        <div className="flex items-center justify-between">
          <h2 id="journey-planner-heading" className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#243B4A]">
            Plan Your Journey
          </h2>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEE5D6] text-[#243B4A] border border-[#D8C8AA]">
            Live GTFS
          </span>
        </div>
        <p className="text-xs text-[#77766D] mt-1">
          Find optimal routes across Delhi Metro, DTC buses, and Poochh-O feeders
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* FROM INPUT (Origin Pin Gold) */}
        <div className="space-y-1.5">
          <label htmlFor="journey-origin" className="text-[11px] font-bold uppercase tracking-wider text-[#77766D] flex items-center gap-1.5">
            <MapPinIcon className="w-3.5 h-3.5 text-[#C49A43]" />
            <span>From (Origin)</span>
          </label>
          <div className="relative flex items-center rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]/40 px-3 py-2 text-xs transition-colors focus-within:border-[#C49A43] focus-within:bg-[#FFFCF5] focus-within:ring-2 focus-within:ring-[#C49A43]/20">
            <select
              id="journey-origin"
              value={origin}
              onChange={e => {
                setOrigin(e.target.value)
                if (error) setError('')
              }}
              className="w-full bg-transparent font-semibold text-[#29343A] focus:outline-none cursor-pointer text-xs"
            >
              <option value="">Select origin stop or station...</option>
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
                className="text-[#77766D] hover:text-[#29343A] p-1 rounded-md"
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
            className="group flex h-8 w-8 items-center justify-center rounded-full border border-[#D8C8AA] bg-[#FFFCF5] hover:bg-[#EEE5D6] hover:border-[#C49A43] shadow-xs transition-all duration-300 text-[#243B4A] hover:text-[#C49A43] cursor-pointer"
          >
            <span className={`inline-block transition-transform duration-300 ${isSwapping ? 'rotate-180' : ''}`}>
              <ArrowUpDownIcon className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* TO INPUT (Destination Pin Terracotta #A6533C) */}
        <div className="space-y-1.5">
          <label htmlFor="journey-destination" className="text-[11px] font-bold uppercase tracking-wider text-[#77766D] flex items-center gap-1.5">
            <NavigationIcon className="w-3.5 h-3.5 text-[#A6533C]" />
            <span>To (Destination)</span>
          </label>
          <div className="relative flex items-center rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]/40 px-3 py-2 text-xs transition-colors focus-within:border-[#C49A43] focus-within:bg-[#FFFCF5] focus-within:ring-2 focus-within:ring-[#C49A43]/20">
            <select
              id="journey-destination"
              value={destination}
              onChange={e => {
                setDestination(e.target.value)
                if (error) setError('')
              }}
              className="w-full bg-transparent font-semibold text-[#29343A] focus:outline-none cursor-pointer text-xs"
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
                className="text-[#77766D] hover:text-[#29343A] p-1 rounded-md"
                title="Clear destination"
                aria-label="Clear destination station"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* POPULAR SUGGESTIONS */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-[#77766D]">
            Popular Delhi Hubs:
          </span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Popular hub stations">
            {POPULAR_STOPS.map(p => {
              const isSelected = origin === p.id || destination === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (!origin) setOrigin(p.id)
                    else setDestination(p.id)
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#C49A43] bg-[#C49A43]/15 text-[#243B4A] shadow-2xs'
                      : 'border-[#D8C8AA] bg-[#EEE5D6]/60 text-[#29343A] hover:bg-[#EEE5D6]'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* DEPART AT */}
        <div className="space-y-1.5 pt-1 border-t border-[#D8C8AA]/60">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#77766D]">
            <span>Depart At</span>
            <div className="flex items-center gap-1 bg-[#EEE5D6] p-0.5 rounded-lg" role="group" aria-label="Departure timing mode">
              <button
                type="button"
                onClick={handleSelectNow}
                aria-pressed={departMode === 'now'}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  departMode === 'now'
                    ? 'bg-[#FFFCF5] text-[#243B4A] shadow-2xs'
                    : 'text-[#77766D] hover:text-[#243B4A]'
                }`}
              >
                Now
              </button>
              <button
                type="button"
                onClick={handleSelectLater}
                aria-pressed={departMode === 'later'}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  departMode === 'later'
                    ? 'bg-[#FFFCF5] text-[#243B4A] shadow-2xs'
                    : 'text-[#77766D] hover:text-[#243B4A]'
                }`}
              >
                Later
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={time}
              onChange={e => setTime(e.target.value)}
              placeholder="e.g. 08:30 AM"
              aria-label="Departure Time in 12-hour or 24-hour format"
              className="rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]/40 px-3 py-2 text-xs font-mono font-bold text-[#29343A] focus:outline-none focus:border-[#C49A43] focus:bg-[#FFFCF5] focus:ring-2 focus:ring-[#C49A43]/20"
            />
            <select
              value={serviceDay}
              onChange={e => onServiceDayChange(e.target.value as ServiceDay)}
              aria-label="Service Day Timetable"
              className="rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]/40 px-3 py-2 text-xs font-semibold text-[#29343A] focus:outline-none focus:border-[#C49A43] focus:bg-[#FFFCF5] focus:ring-2 focus:ring-[#C49A43]/20 cursor-pointer"
            >
              <option value="weekday">Weekday Schedule</option>
              <option value="weekend">Weekend Schedule</option>
            </select>
          </div>
        </div>

        {/* TRAVEL PREFERENCE (Fastest Heritage Gold vs Lowest Cost Botanical Green) */}
        <fieldset className="space-y-1.5 pt-1 border-0 p-0 m-0">
          <legend className="text-[11px] font-bold uppercase tracking-wider text-[#77766D] block">
            Travel Priority
          </legend>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPreference('fastest')}
              aria-pressed={preference === 'fastest'}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 font-bold transition-all cursor-pointer ${
                preference === 'fastest'
                  ? 'border-[#C49A43] bg-[#C49A43] hover:bg-[#A77B32] text-white shadow-xs'
                  : 'border-[#D8C8AA] bg-[#EEE5D6]/40 text-[#29343A] hover:bg-[#EEE5D6]'
              }`}
            >
              <ZapIcon className="w-3.5 h-3.5" />
              <span>Fastest Route</span>
            </button>

            <button
              type="button"
              onClick={() => setPreference('cheapest')}
              aria-pressed={preference === 'cheapest'}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 font-bold transition-all cursor-pointer ${
                preference === 'cheapest'
                  ? 'border-[#547A60] bg-[#547A60] text-white shadow-xs'
                  : 'border-[#D8C8AA] bg-[#EEE5D6]/40 text-[#29343A] hover:bg-[#EEE5D6]'
              }`}
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span>Lowest Cost</span>
            </button>
          </div>
        </fieldset>

        {/* TRANSPORT MODE PILLS (Metro Gold #C49A43, Bus Navy #243B4A) */}
        <fieldset className="space-y-1.5 pt-1 border-0 p-0 m-0">
          <legend className="text-[11px] font-bold uppercase tracking-wider text-[#77766D] block">
            Transit Modes
          </legend>
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setModePreference('all')}
              aria-pressed={modePreference === 'all'}
              className={`rounded-xl py-2 font-bold border transition-all cursor-pointer text-center ${
                modePreference === 'all'
                  ? 'bg-[#243B4A] text-white border-[#243B4A] shadow-xs'
                  : 'bg-[#FFFCF5] text-[#29343A] border-[#D8C8AA] hover:bg-[#EEE5D6]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setModePreference('metro')}
              aria-pressed={modePreference === 'metro'}
              className={`rounded-xl py-2 font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                modePreference === 'metro'
                  ? 'bg-[#C49A43] text-white border-[#C49A43] shadow-xs'
                  : 'bg-[#FFFCF5] text-[#29343A] border-[#D8C8AA] hover:bg-[#EEE5D6]'
              }`}
            >
              <TrainIcon className="w-3.5 h-3.5" />
              <span>Metro</span>
            </button>
            <button
              type="button"
              onClick={() => setModePreference('bus')}
              aria-pressed={modePreference === 'bus'}
              className={`rounded-xl py-2 font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                modePreference === 'bus'
                  ? 'bg-[#243B4A] text-white border-[#243B4A] shadow-xs'
                  : 'bg-[#FFFCF5] text-[#29343A] border-[#D8C8AA] hover:bg-[#EEE5D6]'
              }`}
            >
              <BusIcon className="w-3.5 h-3.5" />
              <span>Bus</span>
            </button>
            <button
              type="button"
              onClick={() => setModePreference('auto')}
              aria-pressed={modePreference === 'auto'}
              className={`rounded-xl py-2 font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                modePreference === 'auto'
                  ? 'bg-[#547A60] text-white border-[#547A60] shadow-xs'
                  : 'bg-[#FFFCF5] text-[#29343A] border-[#D8C8AA] hover:bg-[#EEE5D6]'
              }`}
              title="PoochhO (DIMTS) Auto-Rickshaw & Taxi"
            >
              <AutoRickshawIcon className="w-3.5 h-3.5" />
              <span>Auto</span>
            </button>
          </div>
        </fieldset>

        {/* ERROR NOTIFICATION (Terracotta Meaningful Alert) */}
        {error && (
          <div role="alert" className="rounded-xl border border-[#A6533C]/40 bg-[#FFFCF5] p-3 text-xs font-semibold text-[#A6533C] animate-fade-in shadow-xs">
            {error}
          </div>
        )}

        {/* PRIMARY SEARCH BUTTON (Heritage Gold #C49A43 -> Hover #A77B32) */}
        <button
          type="submit"
          id="btn-search-journey"
          disabled={loading}
          aria-label="Search Multimodal Delhi Transit Routes"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C49A43] hover:bg-[#A77B32] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Searching Delhi Network…</span>
            </>
          ) : (
            <>
              <span>Find Best Routes</span>
              <ArrowRightIcon className="w-4 h-4" />
            </>
          )}
        </button>

        {/* SMART COMMUTER CASHBACK TIP */}
        {onOpenCashbackModal && (
          <button
            type="button"
            onClick={onOpenCashbackModal}
            className="w-full flex items-center justify-between rounded-xl border border-[#C49A43]/40 bg-[#EEE5D6]/60 p-2.5 text-left hover:bg-[#EEE5D6] transition-colors group cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-[#243B4A] flex items-center gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5 text-[#C49A43] shrink-0" />
              <span>Metro Smart Card saves 10%–20% on this route</span>
            </span>
            <span className="text-[10px] font-bold text-[#C49A43] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View Cashback</span>
              <ArrowRightIcon className="w-3 h-3" />
            </span>
          </button>
        )}
      </form>
    </section>
  )
}
