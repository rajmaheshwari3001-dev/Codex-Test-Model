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
      className="rounded-2xl border border-[#EBE5DC] bg-white p-5 sm:p-6 shadow-xs text-[#1A202C] space-y-4 animate-fade-in"
    >
      {/* Title & Subtitle Matching Figma: PLAN FOR A DELHI DAY */}
      <header className="space-y-1">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#C49A43]">
          PLAN FOR A DELHI DAY
        </div>
        <h2 id="journey-planner-heading" className="font-serif text-2xl font-bold tracking-tight text-[#1A2E3B]">
          Where would you like to go?
        </h2>
        <p className="text-xs text-[#7A7269]">
          Compare metro, bus and multimodal routes
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* FROM INPUT (Origin Pin Gold Circle) */}
        <div className="space-y-1.5">
          <label htmlFor="journey-origin" className="text-[10px] font-extrabold uppercase tracking-wider text-[#7A7269] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#C49A43]" />
            <span>FROM</span>
          </label>
          <div className="relative flex items-center rounded-xl border border-[#EBE5DC] bg-white px-3.5 py-2.5 text-xs transition-colors shadow-2xs focus-within:border-[#C49A43] focus-within:ring-2 focus-within:ring-[#C49A43]/20">
            <select
              id="journey-origin"
              value={origin}
              onChange={e => {
                setOrigin(e.target.value)
                if (error) setError('')
              }}
              className="w-full bg-transparent font-semibold text-[#1A202C] focus:outline-none cursor-pointer text-xs"
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
                className="text-[#7A7269] hover:text-[#1A202C] p-1 rounded-md cursor-pointer"
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
            className="group flex h-8 w-8 items-center justify-center rounded-full border border-[#EBE5DC] bg-white hover:bg-[#FAF7F2] hover:border-[#C49A43] shadow-xs transition-all duration-300 text-[#1A2E3B] hover:text-[#C49A43] cursor-pointer"
          >
            <span className={`inline-block transition-transform duration-300 ${isSwapping ? 'rotate-180' : ''}`}>
              <ArrowUpDownIcon className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* TO INPUT (Destination Pin Terracotta Circle) */}
        <div className="space-y-1.5">
          <label htmlFor="journey-destination" className="text-[10px] font-extrabold uppercase tracking-wider text-[#7A7269] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#A6533C]" />
            <span>TO</span>
          </label>
          <div className="relative flex items-center rounded-xl border border-[#EBE5DC] bg-white px-3.5 py-2.5 text-xs transition-colors shadow-2xs focus-within:border-[#C49A43] focus-within:ring-2 focus-within:ring-[#C49A43]/20">
            <select
              id="journey-destination"
              value={destination}
              onChange={e => {
                setDestination(e.target.value)
                if (error) setError('')
              }}
              className="w-full bg-transparent font-semibold text-[#1A202C] focus:outline-none cursor-pointer text-xs"
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
                className="text-[#7A7269] hover:text-[#1A202C] p-1 rounded-md cursor-pointer"
                title="Clear destination"
                aria-label="Clear destination station"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* DEPARTURE (With quick NOW badge matching Figma: Today, 08:40 AM) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#7A7269]">
            DEPARTURE
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center rounded-xl border border-[#EBE5DC] bg-white px-3 py-2 text-xs shadow-2xs focus-within:border-[#C49A43] focus-within:ring-2 focus-within:ring-[#C49A43]/20">
              <span className="text-xs mr-1.5">📅</span>
              <input
                type="text"
                value={time ? `Today, ${time}` : 'Today, 08:40 AM'}
                onChange={e => {
                  const val = e.target.value.replace('Today, ', '').trim()
                  setTime(val)
                }}
                placeholder="Today, 08:40 AM"
                aria-label="Departure Time"
                className="w-full bg-transparent font-medium text-[#1A202C] focus:outline-none text-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleSelectNow}
              className="flex items-center justify-center rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] hover:bg-[#F2ECE1] px-3 py-2 text-xs font-bold text-[#1A2E3B] transition-colors cursor-pointer shadow-2xs"
            >
              NOW • {time || '08:40'}
            </button>
          </div>
        </div>

        {/* TRAVEL PREFERENCE (Fastest vs Cheapest Toggle Matching Figma) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#7A7269]">
            TRAVEL PREFERENCE
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPreference('fastest')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preference === 'fastest'
                  ? 'bg-[#C49A43] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#7A7269] border border-[#EBE5DC] hover:bg-[#F2ECE1]'
              }`}
            >
              <ZapIcon className="w-3.5 h-3.5" />
              <span>Fastest</span>
            </button>

            <button
              type="button"
              onClick={() => setPreference('cheapest')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preference === 'cheapest'
                  ? 'bg-[#C49A43] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#7A7269] border border-[#EBE5DC] hover:bg-[#F2ECE1]'
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
          aria-label="Search Multimodal Delhi Transit Routes"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C49A43] hover:bg-[#A77B32] text-[#FFFCF5] font-bold py-3.5 px-4 text-xs tracking-wide shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Finding Optimal Routes...</span>
            </>
          ) : (
            <>
              <span>Find my route</span>
              <ArrowRightIcon className="w-4 h-4" />
            </>
          )}
        </button>

        {/* POPULAR DELHI HUBS (Quick 1-Tap Autofill) */}
        <div className="pt-2 border-t border-[#D8C8AA]/60 space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#77766D]">
            POPULAR HUBS:
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

        {/* MODE PREFERENCE TOGGLES */}
        <div className="space-y-1.5 pt-1 border-t border-[#D8C8AA]/60">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#77766D]">
            MODE FILTER
          </label>
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setModePreference('all')}
              aria-pressed={modePreference === 'all'}
              className={`rounded-xl py-1.5 font-bold border transition-all cursor-pointer text-center text-xs ${
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
              className={`rounded-xl py-1.5 font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer text-xs ${
                modePreference === 'metro'
                  ? 'bg-[#C49A43] text-white border-[#C49A43] shadow-xs'
                  : 'bg-[#FFFCF5] text-[#29343A] border-[#D8C8AA] hover:bg-[#EEE5D6]'
              }`}
            >
              <TrainIcon className="w-3 h-3" />
              <span>Metro</span>
            </button>
            <button
              type="button"
              onClick={() => setModePreference('bus')}
              aria-pressed={modePreference === 'bus'}
              className={`rounded-xl py-1.5 font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer text-xs ${
                modePreference === 'bus'
                  ? 'bg-[#243B4A] text-white border-[#243B4A] shadow-xs'
                  : 'bg-[#FFFCF5] text-[#29343A] border-[#D8C8AA] hover:bg-[#EEE5D6]'
              }`}
            >
              <BusIcon className="w-3 h-3" />
              <span>Bus</span>
            </button>
            <button
              type="button"
              onClick={() => setModePreference('auto')}
              aria-pressed={modePreference === 'auto'}
              className={`rounded-xl py-1.5 font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer text-xs ${
                modePreference === 'auto'
                  ? 'bg-[#547A60] text-white border-[#547A60] shadow-xs'
                  : 'bg-[#FFFCF5] text-[#29343A] border-[#D8C8AA] hover:bg-[#EEE5D6]'
              }`}
              title="PoochhO (DIMTS) Auto-Rickshaw & Taxi"
            >
              <AutoRickshawIcon className="w-3 h-3" />
              <span>Auto</span>
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-[#A6533C]/40 bg-[#FFFCF5] p-3 text-xs font-semibold text-[#A6533C] animate-fade-in shadow-xs">
            {error}
          </div>
        )}

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
