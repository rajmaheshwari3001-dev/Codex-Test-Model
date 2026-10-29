import { useEffect, useState } from 'react'
import type { Stop, Route, JourneyOption, SavedRoute, ServiceDay } from '../types'
import { getStops, getRoutes, searchJourneys, createSavedRoute } from '../services/api'
import RouteSearchForm from '../components/RouteSearchForm'
import RouteResultCard from '../components/RouteResultCard'
import TransportMap from '../components/TransportMap'
import ChatAssistant from '../components/ChatAssistant'
import SavedRoutesPanel from '../components/SavedRoutes'

interface NoResultContext {
  origin: string
  destination: string
  time: string
  isOutOfHours: boolean
}

// Primary Delhi Bus Corridor Presets for 1-Tap Search
const FEATURED_CORRIDORS = [
  {
    routeId: 'R01',
    lineName: 'Blue Line',
    color: '#2196F3',
    badgeBg: 'bg-blue-500/10 text-blue-700 border-blue-300/40',
    originId: 'S13',
    originName: 'Dwarka Sec-21',
    destId: 'S01',
    destName: 'Rajiv Chowk',
    departure: '08:00',
    type: 'Direct • 4 Stops',
  },
  {
    routeId: 'R02',
    lineName: 'Green Line',
    color: '#16A34A',
    badgeBg: 'bg-emerald-500/10 text-emerald-800 border-emerald-300/40',
    originId: 'S02',
    originName: 'Kashmere Gate',
    destId: 'S09',
    destName: 'Hauz Khas',
    departure: '08:00',
    type: 'Direct • 5 Stops',
  },
  {
    routeId: 'R03',
    lineName: 'Red Ring',
    color: '#DC2626',
    badgeBg: 'bg-rose-500/10 text-rose-800 border-rose-300/40',
    originId: 'S05',
    originName: 'Connaught Place',
    destId: 'S08',
    destName: 'Saket',
    departure: '08:00',
    type: 'Direct • 5 Stops',
  },
  {
    routeId: 'R04',
    lineName: 'Yellow Express',
    color: '#D97706',
    badgeBg: 'bg-amber-500/10 text-amber-900 border-amber-300/40',
    originId: 'S04',
    originName: 'New Delhi Stn',
    destId: 'S08',
    destName: 'Saket Express',
    departure: '08:30',
    type: 'Express • 4 Stops',
  },
]

const ACTIVE_MORNING_HOURS = ['07:00', '08:00', '09:30', '11:30']

export default function PassengerPage() {
  const [stops, setStops] = useState<Stop[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [options, setOptions] = useState<JourneyOption[]>([])
  const [selected, setSelected] = useState<JourneyOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [noResultContext, setNoResultContext] = useState<NoResultContext | null>(null)
  const [saveToast, setSaveToast] = useState('')
  const [savedRefresh, setSavedRefresh] = useState(0)
  const [savedOptionIds, setSavedOptionIds] = useState<Set<string>>(new Set())
  const [serviceDay, setServiceDay] = useState<ServiceDay>('weekday')
  const [origin, setOrigin] = useState('S13') // Default Dwarka Sec-21
  const [destination, setDestination] = useState('S01') // Default Rajiv Chowk
  const [time, setTime] = useState('08:00')
  const [preference, setPreference] = useState('fastest')

  function loadInitialData() {
    setMessage('')
    Promise.all([getStops(), getRoutes()])
      .then(([nextStops, nextRoutes]) => {
        setStops(nextStops)
        setRoutes(nextRoutes)
      })
      .catch(error => {
        setMessage(
          error instanceof Error
            ? `Unable to load transit data: ${error.message}`
            : 'Unable to load transit data.'
        )
      })
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  async function handleSearch(
    originId: string = origin,
    destinationId: string = destination,
    departureTime: string = time,
    selectedPreference: string = preference,
    selectedServiceDay: ServiceDay = serviceDay
  ) {
    if (!originId || !destinationId) return

    setOrigin(originId)
    setDestination(destinationId)
    setTime(departureTime)
    setPreference(selectedPreference)
    setServiceDay(selectedServiceDay)
    setLoading(true)
    setMessage('')
    setNoResultContext(null)
    setSaveToast('')
    setOptions([])
    setSelected(null)

    try {
      const response = await searchJourneys({
        origin_stop_id: originId,
        destination_stop_id: destinationId,
        departure_time: departureTime,
        preference: selectedPreference,
        service_day: selectedServiceDay,
      })
      setOptions(response.options)
      if (response.options.length > 0) {
        setSelected(response.options[0])
      } else {
        const [hours, minutes] = departureTime.split(':').map(Number)
        const totalMinutes = (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes)
        setNoResultContext({
          origin: originId,
          destination: destinationId,
          time: departureTime,
          isOutOfHours: totalMinutes < 390 || totalMinutes > 750,
        })
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Journey search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(option: JourneyOption) {
    const firstLeg = option.legs[0]
    const finalLeg = option.legs[option.legs.length - 1]
    const originStop = stops.find(stop => stop.stop_id === firstLeg?.board_stop_id)
    const destinationStop = stops.find(stop => stop.stop_id === finalLeg?.alight_stop_id)

    try {
      await createSavedRoute({
        label: `${originStop?.stop_name || 'Origin'} → ${destinationStop?.stop_name || 'Destination'}`,
        origin_stop_id: firstLeg?.board_stop_id || '',
        origin_stop_name: originStop?.stop_name || '',
        destination_stop_id: finalLeg?.alight_stop_id || '',
        destination_stop_name: destinationStop?.stop_name || '',
        preferred_departure_time: option.departure_time,
        preference: option.label.toLowerCase(),
        service_day: serviceDay,
      })
      setSavedOptionIds(previous => new Set(previous).add(option.option_id))
      setSaveToast(`Journey bookmarked • ${option.label} • ₹${option.total_fare ?? 'N/A'}`)
      setSavedRefresh(previous => previous + 1)
      window.setTimeout(() => setSaveToast(''), 4000)
    } catch {
      setSaveToast('Could not save this journey. Please try again.')
      window.setTimeout(() => setSaveToast(''), 4000)
    }
  }

  function handleReuse(route: SavedRoute) {
    handleSearch(
      route.origin_stop_id,
      route.destination_stop_id,
      route.preferred_departure_time || '08:00',
      route.preference,
      route.service_day
    )
  }

  function handleSelectOriginFromMap(stopId: string) {
    setOrigin(stopId)
    const stopName = stops.find(s => s.stop_id === stopId)?.stop_name || stopId
    setSaveToast(`Origin set to ${stopName}`)
    window.setTimeout(() => setSaveToast(''), 3000)
  }

  function handleSelectDestinationFromMap(stopId: string) {
    setDestination(stopId)
    const stopName = stops.find(s => s.stop_id === stopId)?.stop_name || stopId
    setSaveToast(`Destination set to ${stopName}`)
    window.setTimeout(() => setSaveToast(''), 3000)
  }

  function handleCorridorClick(corridor: (typeof FEATURED_CORRIDORS)[number]) {
    setOrigin(corridor.originId)
    setDestination(corridor.destId)
    setTime(corridor.departure)
    handleSearch(corridor.originId, corridor.destId, corridor.departure, preference, serviceDay)
  }

  const fastestOption = options.find(option => option.label.toLowerCase() === 'fastest')
  const cheapestOption = options.find(option => option.label.toLowerCase() === 'cheapest')
  const hasDistinctComparison =
    fastestOption !== undefined &&
    cheapestOption !== undefined &&
    fastestOption.option_id !== cheapestOption.option_id &&
    (fastestOption.total_duration_minutes !== cheapestOption.total_duration_minutes ||
      fastestOption.total_fare !== cheapestOption.total_fare)

  const originName = stops.find(stop => stop.stop_id === origin)?.stop_name || origin || 'Origin'
  const destinationName = stops.find(stop => stop.stop_id === destination)?.stop_name || destination || 'Destination'

  return (
    <div className="space-y-6">
      {/* 1. Cinematic Delhi Transit Command Bar */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-r from-[#0B1020] via-[#172554] to-[#1e3a8a] p-6 text-white shadow-xl shadow-slate-900/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.25),_transparent_60%)]" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 font-mono text-xs font-bold text-emerald-300 backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                DELHI BUS TRANSIT NETWORK
              </span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 font-mono text-xs font-medium text-slate-300 backdrop-blur-md">
                Sample Schedule
              </span>
              <span className="rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 font-mono text-xs font-semibold text-blue-200">
                15 Mapped Stops • 4 Bus Corridors
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
              Passenger Transit Assistant
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300">
              Discover optimal bus routes, compare schedules, inspect real-time stop paths, and consult the Delhi Transit Copilot.
            </p>
          </div>

          {/* Timetable Operating Window Indicator */}
          <div className="flex shrink-0 flex-col justify-between rounded-2xl border border-white/15 bg-white/10 p-4.5 backdrop-blur-md sm:min-w-[280px]">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Timetable Operating Window</span>
              <span className="rounded-md bg-emerald-500/30 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                Active
              </span>
            </div>
            <div className="py-2.5">
              <div className="font-mono text-2xl font-extrabold tabular-nums tracking-tight text-white">
                06:30 <span className="font-light text-slate-400">—</span> 12:30 <span className="text-xs font-semibold text-emerald-400">AM</span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                19 demo timetable services across 4 bus corridors. Fares are synthetic demonstration data (Zone 1–3 model).
              </p>
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Synthetic zone fares (₹10–₹30) are sample data only.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. One-Tap Delhi Bus Corridor Quick Launch Bar */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
              ⚡
            </span>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
              1-Tap Primary Delhi Bus Corridors
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">Click any corridor to run instant route search</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_CORRIDORS.map(corridor => {
            const isCurrentMatch = origin === corridor.originId && destination === corridor.destId
            return (
              <button
                key={corridor.routeId}
                type="button"
                onClick={() => handleCorridorClick(corridor)}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isCurrentMatch
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/30'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
                  style={{ backgroundColor: corridor.color }}
                />

                <div className="pl-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-black uppercase ${corridor.badgeBg}`}>
                      {corridor.routeId} • {corridor.lineName}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">@{corridor.departure}</span>
                  </div>
                  <div className="pt-1.5 text-sm font-extrabold text-slate-900">
                    {corridor.originName} <span className="text-slate-400">➔</span> {corridor.destName}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pl-2 pt-2 text-xs font-semibold text-slate-500">
                  <span>{corridor.type}</span>
                  <span className="font-bold text-blue-600 transition-transform group-hover:translate-x-1">Launch ➔</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* 3. Main Workspace: Asymmetric 5/7 Grid */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column (5 cols): Journey Planner, Results & Saved Bookmarks */}
        <div className="space-y-6 lg:col-span-5">
          <RouteSearchForm
            stops={stops}
            origin={origin}
            setOrigin={setOrigin}
            destination={destination}
            setDestination={setDestination}
            time={time}
            setTime={setTime}
            preference={preference}
            setPreference={setPreference}
            serviceDay={serviceDay}
            onServiceDayChange={setServiceDay}
            onSearch={handleSearch}
            loading={loading}
          />

          {message && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4.5 text-sm text-rose-950 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <span className="text-base">⚠️</span>
                <span>Transit service unavailable</span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-rose-800">{message}</p>
              {stops.length === 0 && (
                <button
                  type="button"
                  onClick={loadInitialData}
                  className="mt-2.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-900 hover:bg-rose-100"
                >
                  Retry Loading Transit Network
                </button>
              )}
            </div>
          )}

          {saveToast && (
            <div
              role="status"
              className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs sm:text-sm font-bold text-emerald-950 shadow-md animate-in fade-in slide-in-from-top-2"
            >
              <span className="text-lg">✨</span>
              <span>{saveToast}</span>
            </div>
          )}

          {/* Intelligent Timetable Shift Recovery Console (Fixes user screenshot zero-schedule confusion) */}
          {noResultContext && (
            <section
              role="status"
              className="overflow-hidden rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/40 p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-xl font-bold text-amber-900">
                  ⏱️
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black uppercase tracking-wider text-amber-950">
                      Timetable Schedule Notice
                    </span>
                    <span className="rounded-full bg-amber-200/80 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-900">
                      {noResultContext.time}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-amber-900">
                    {noResultContext.isOutOfHours ? (
                      <>
                        The Delhi sample timetable operates between <strong>06:30 and 12:30</strong>. No trips run at{' '}
                        <strong>{noResultContext.time}</strong> for <strong>{originName}</strong> ➔ <strong>{destinationName}</strong>.
                      </>
                    ) : (
                      <>
                        No direct or connected trips found between <strong>{originName}</strong> and <strong>{destinationName}</strong> at{' '}
                        <strong>{noResultContext.time}</strong> on the {serviceDay} timetable.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Instant 1-Click Morning Peak Recovery */}
              <div className="mt-4 border-t border-amber-200/80 pt-3.5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  ⚡ Jump to Active Scheduled Departures for this pair:
                </p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVE_MORNING_HOURS.filter(retryTime => retryTime !== noResultContext.time).map(retryTime => (
                    <button
                      key={retryTime}
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        handleSearch(
                          noResultContext.origin,
                          noResultContext.destination,
                          retryTime,
                          preference,
                          serviceDay
                        )
                      }
                      className="group flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-extrabold text-amber-950 shadow-xs transition-all hover:bg-amber-100 hover:border-amber-400 active:scale-95 disabled:opacity-50"
                    >
                      <span>Check</span>
                      <span className="font-mono">{retryTime}</span>
                      <span className="transition-transform group-hover:translate-x-0.5">➔</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Comparative Advantage Analysis */}
          {hasDistinctComparison && fastestOption && cheapestOption && (
            <section className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4 text-xs sm:text-sm text-blue-950 shadow-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-blue-900">
                <span className="text-base">📊</span>
                <span>Journey Comparison Insight</span>
              </div>
              <div className="space-y-1 pl-6 text-xs text-blue-900/90 font-medium">
                {fastestOption.total_duration_minutes < cheapestOption.total_duration_minutes && (
                  <p>
                    • <strong>Fastest Option</strong> arrives{' '}
                    <strong className="text-blue-950 underline decoration-blue-400">
                      {cheapestOption.total_duration_minutes - fastestOption.total_duration_minutes} minutes earlier
                    </strong>
                    .
                  </p>
                )}
                {cheapestOption.total_fare !== null &&
                  fastestOption.total_fare !== null &&
                  cheapestOption.total_fare < fastestOption.total_fare && (
                    <p>
                      • <strong>Lowest Fare Option</strong> saves{' '}
                      <strong className="text-emerald-900 font-bold">
                        ₹{fastestOption.total_fare - cheapestOption.total_fare}
                      </strong>{' '}
                      in transit tariffs.
                    </p>
                  )}
              </div>
            </section>
          )}

          {/* Search Result Cards (Digital Boarding Passes) */}
          {options.length > 0 && (
            <section className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                    ✓
                  </span>
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
                    {options.length} {options.length === 1 ? 'Optimal Journey Found' : 'Optimal Journeys Found'}
                  </h2>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600">
                  Ranked by {options[0]?.label}
                </span>
              </div>

              {options.map(option => (
                <RouteResultCard
                  key={option.option_id}
                  option={option}
                  selected={selected?.option_id === option.option_id}
                  onSelect={() => setSelected(option)}
                  onSave={() => handleSave(option)}
                  isSaved={savedOptionIds.has(option.option_id)}
                />
              ))}
            </section>
          )}

          {/* Saved Journeys Bookmarks Console */}
          <SavedRoutesPanel onReuse={handleReuse} refreshTrigger={savedRefresh} />
        </div>

        {/* Right Column (7 cols): Map & Transit Copilot AI */}
        <div className="space-y-6 lg:col-span-7">
          {/* Interactive Bus Transit Map Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
                  🗺️
                </span>
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
                  Delhi Bus Network & Interactive Stop GIS
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Click any stop to set origin / destination
              </span>
            </div>

            <TransportMap
              stops={stops}
              routes={routes}
              selectedJourney={selected}
              originStopId={origin}
              destinationStopId={destination}
              onSelectOrigin={handleSelectOriginFromMap}
              onSelectDestination={handleSelectDestinationFromMap}
            />
          </div>

          {/* Transit Copilot AI Assistant */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
                  💬
                </span>
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
                  Delhi Transit Copilot
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Natural-language Q&A grounded in GTFS data
              </span>
            </div>

            <ChatAssistant serviceDay={serviceDay} />
          </div>
        </div>
      </div>
    </div>
  )
}
