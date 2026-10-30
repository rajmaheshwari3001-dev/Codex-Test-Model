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
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-slate-800 space-y-4 animate-fade-in"
    >
      {/* Title & Subtitle */}
      <header className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <h2 id="journey-planner-heading" className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
            Plan Your Journey
          </h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Live GTFS
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Find the best route across Delhi Metro, DTC buses, and Poochh-O feeders
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* FROM INPUT */}
        <div className="space-y-1.5">
          <label htmlFor="journey-origin" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <MapPinIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>From (Origin)</span>
          </label>
          <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs transition-colors focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <select
              id="journey-origin"
              value={origin}
              onChange={e => {
                setOrigin(e.target.value)
                if (error) setError('')
              }}
              className="w-full bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer text-xs"
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
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
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
            className="group flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300 shadow-sm transition-all duration-300 text-slate-600 hover:text-blue-600 cursor-pointer"
          >
            <span className={`inline-block transition-transform duration-300 ${isSwapping ? 'rotate-180' : ''}`}>
              <ArrowUpDownIcon className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* TO INPUT */}
        <div className="space-y-1.5">
          <label htmlFor="journey-destination" className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <NavigationIcon className="w-3.5 h-3.5 text-rose-600" />
            <span>To (Destination)</span>
          </label>
          <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs transition-colors focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
            <select
              id="journey-destination"
              value={destination}
              onChange={e => {
                setDestination(e.target.value)
                if (error) setError('')
              }}
              className="w-full bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer text-xs"
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
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
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
          <span className="text-[11px] font-medium text-slate-500">
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
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* DEPART AT */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <span>Depart At</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg" role="group" aria-label="Departure timing mode">
              <button
                type="button"
                onClick={handleSelectNow}
                aria-pressed={departMode === 'now'}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  departMode === 'now'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
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
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
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
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={serviceDay}
              onChange={e => onServiceDayChange(e.target.value as ServiceDay)}
              aria-label="Service Day Timetable"
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="weekday">Weekday Schedule</option>
              <option value="weekend">Weekend Schedule</option>
            </select>
          </div>
        </div>

        {/* TRAVEL PREFERENCE */}
        <fieldset className="space-y-1.5 pt-1 border-0 p-0 m-0">
          <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Travel Priority
          </legend>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPreference('fastest')}
              aria-pressed={preference === 'fastest'}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 font-bold transition-all cursor-pointer ${
                preference === 'fastest'
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
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
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span>Lowest Cost</span>
            </button>
          </div>
        </fieldset>

        {/* TRANSPORT MODE PILLS */}
        <fieldset className="space-y-1.5 pt-1 border-0 p-0 m-0">
          <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Transit Modes
          </legend>
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setModePreference('all')}
              aria-pressed={modePreference === 'all'}
              className={`rounded-xl py-2 font-bold border transition-all cursor-pointer text-center ${
                modePreference === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="PoochhO (DIMTS) Auto-Rickshaw & Taxi"
            >
              <AutoRickshawIcon className="w-3.5 h-3.5" />
              <span>Auto</span>
            </button>
          </div>
        </fieldset>

        {/* ERROR NOTIFICATION */}
        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 animate-fade-in">
            {error}
          </div>
        )}

        {/* PRIMARY SEARCH BUTTON */}
        <button
          type="submit"
          id="btn-search-journey"
          disabled={loading}
          aria-label="Search Multimodal Delhi Transit Routes"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
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
            className="w-full flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-left hover:bg-amber-100/70 transition-colors group cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Metro Smart Card saves 10%–20% on this route</span>
            </span>
            <span className="text-[10px] font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View Cashback</span>
              <ArrowRightIcon className="w-3 h-3" />
            </span>
          </button>
        )}
      </form>
    </section>
  )
}
