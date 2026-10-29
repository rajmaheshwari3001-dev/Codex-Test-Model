import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Stop, Route, JourneyOption, SavedRoute, ServiceDay, ModePreference } from '../types'
import { getStops, getRoutes, searchJourneys, createSavedRoute } from '../services/api'
import { formatTime12, parseToTime24 } from '../utils/time'
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

// 4 Primary Delhi Bus Corridors for 1-Tap Search
const FEATURED_CORRIDORS = [
  {
    routeId: 'R01',
    lineName: 'Blue Line',
    color: '#2196F3',
    originId: 'S13',
    originName: 'Dwarka Sec-21',
    destId: 'S18',
    destName: 'Anand Vihar ISBT',
    departure: '08:00',
    type: 'Bus Line • East-West Link',
  },
  {
    routeId: 'R02',
    lineName: 'Green Line',
    color: '#16A34A',
    originId: 'S02',
    originName: 'Kashmere Gate',
    destId: 'S16',
    destName: 'Dilli Haat - INA',
    departure: '13:30',
    type: 'Bus Line • North-South Link',
  },
  {
    routeId: 'R03',
    lineName: 'Red Ring',
    color: '#DC2626',
    originId: 'S05',
    originName: 'Connaught Place',
    destId: 'S20',
    destName: 'Sarai Kale Khan ISBT',
    departure: '17:30',
    type: 'Ring Bus • Evening Hub Link',
  },
  {
    routeId: 'R04',
    lineName: 'Yellow Express',
    color: '#D97706',
    originId: 'S04',
    originName: 'New Delhi Stn',
    destId: 'S17',
    destName: 'Mandi House',
    departure: '20:30',
    type: 'Express Bus • Cultural Link',
  },
]

const ACTIVE_SERVICE_HOURS = ['08:00', '13:30', '17:30', '20:30', '22:00']

interface PassengerPageProps {
  defaultTab?: 'planner' | 'map' | 'saved' | 'chat'
}

export default function PassengerPage({ defaultTab }: PassengerPageProps) {
  const [searchParams] = useSearchParams()
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
  const [modePreference, setModePreference] = useState<ModePreference>('all')
  const [maxBudget, setMaxBudget] = useState<string>('')

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

  // Hook top-bar quick stop search parameter into origin selection
  useEffect(() => {
    const originParam = searchParams.get('origin')
    if (originParam && stops.some(s => s.stop_id === originParam)) {
      setOrigin(originParam)
    }
  }, [searchParams, stops])

  async function handleSearch(
    originId: string = origin,
    destinationId: string = destination,
    departureTime: string = time,
    selectedPreference: string = preference,
    selectedServiceDay: ServiceDay = serviceDay,
    selectedModePreference: ModePreference = modePreference,
    selectedMaxBudget: string = maxBudget
  ) {
    if (!originId || !destinationId) return

    setOrigin(originId)
    setDestination(destinationId)
    setTime(departureTime)
    setPreference(selectedPreference)
    setServiceDay(selectedServiceDay)
    setModePreference(selectedModePreference)
    setMaxBudget(selectedMaxBudget)
    setLoading(true)
    setMessage('')
    setNoResultContext(null)
    setSaveToast('')
    setOptions([])
    setSelected(null)

    const parsedBudget = selectedMaxBudget.trim() ? parseFloat(selectedMaxBudget.trim()) : null

    try {
      const response = await searchJourneys({
        origin_stop_id: originId,
        destination_stop_id: destinationId,
        departure_time: departureTime,
        preference: selectedPreference,
        service_day: selectedServiceDay,
        mode_preference: selectedModePreference,
        max_budget: parsedBudget && !isNaN(parsedBudget) ? parsedBudget : undefined,
      })
      setOptions(response.options)
      if (response.options.length > 0) {
        setSelected(response.options[0])
      } else {
        const canonical24 = parseToTime24(departureTime) || departureTime
        const [hours, minutes] = canonical24.split(':').map(Number)
        const totalMinutes = (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes)
        setNoResultContext({
          origin: originId,
          destination: destinationId,
          time: departureTime,
          isOutOfHours: totalMinutes < 360 || totalMinutes > 1415,
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
      setSaveToast(`Journey saved • ${option.label} • ₹${option.total_fare ?? 'N/A'}`)
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Hero Deck */}
      <section className="rounded-xl border border-[#E8DFCE] bg-[#173B32] p-6 text-white shadow-xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#FAF7F2]/10 border border-[#FAF7F2]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#F5F0E6]">
                Delhi Transit Assistant
              </span>
              <span className="rounded-md bg-[#B88A43]/20 border border-[#B88A43]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#F4EBD9]">
                20 Stations • 4 Corridors
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#FFFFFF]">
              Passenger Route Assistant
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-[#E8DFCE]">
              Find optimal routes, inspect intermediate stops, view transfers, and compare calculated fares using Delhi GTFS schedule data.
            </p>
          </div>

          {/* Operating Window Badge */}
          <div className="flex shrink-0 flex-col rounded-lg border border-[#FAF7F2]/20 bg-[#FAF7F2]/10 p-4 text-xs sm:min-w-[260px]">
            <div className="flex items-center justify-between border-b border-[#FAF7F2]/15 pb-2">
              <span className="font-bold text-[#E8DFCE]">Timetable Hours</span>
              <span className="rounded bg-[#236B56] px-2 py-0.5 text-[10px] font-bold text-white">
                Active
              </span>
            </div>
            <div className="py-2">
              <div className="font-mono text-xl font-extrabold text-[#FFFFFF]">
                06:00 AM — 11:35 PM
              </div>
              <p className="mt-0.5 text-[11px] text-[#E8DFCE]/80">
                64 trips across weekday and weekend timetables. Fares are sample data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Corridor Presets (Clean White Cards) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#53645F]">
          <span className="font-bold uppercase tracking-wider text-[#25312D]">
            Primary Delhi Bus Corridors
          </span>
          <span>Click any corridor to run search</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_CORRIDORS.map(corridor => {
            const isMatch = origin === corridor.originId && destination === corridor.destId
            return (
              <button
                key={corridor.routeId}
                type="button"
                onClick={() => handleCorridorClick(corridor)}
                className={`relative flex flex-col justify-between overflow-hidden rounded-lg border p-3.5 text-left transition-all ${
                  isMatch
                    ? 'border-[#173B32] bg-[#FFFFFF] ring-2 ring-[#173B32]/10 shadow-xs'
                    : 'border-[#E8DFCE] bg-[#FFFFFF] hover:border-[#173B32]/50 hover:bg-[#FAF7F2]'
                }`}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: corridor.color }}
                />
                <div className="pl-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#25312D]">
                      {corridor.routeId} • {corridor.lineName}
                    </span>
                    <span className="font-mono text-[#53645F] font-semibold">
                      {formatTime12(corridor.departure)}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#25312D]">
                    {corridor.originName} <span className="text-[#B88A43]">➔</span> {corridor.destName}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-[#E8DFCE] pl-2 pt-1.5 text-[11px] text-[#53645F]">
                  <span>{corridor.type}</span>
                  <span className="font-bold text-[#173B32]">Search ➔</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* 3. Main Split Grid (Planner + Results vs Map + Copilot) */}
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
            modePreference={modePreference}
            setModePreference={setModePreference}
            maxBudget={maxBudget}
            setMaxBudget={setMaxBudget}
            onSearch={handleSearch}
            loading={loading}
          />

          {message && (
            <div role="alert" className="rounded-lg border border-[#A44735]/30 bg-[#F8ECE9] p-4 text-xs font-semibold text-[#A44735]">
              <div className="font-bold">⚠️ Transit service unavailable</div>
              <p className="mt-1">{message}</p>
            </div>
          )}

          {saveToast && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-[#236B56]/30 bg-[#EBF4F0] p-3 text-xs font-bold text-[#236B56]"
            >
              <span>✓</span>
              <span>{saveToast}</span>
            </div>
          )}

          {/* Timetable Schedule Notice */}
          {noResultContext && (
            <section
              role="status"
              className="rounded-lg border border-[#B88A43]/40 bg-[#F4EBD9]/60 p-4 text-xs text-[#25312D] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#B88A43] uppercase tracking-wider text-[11px]">
                  Timetable Notice
                </span>
                <span className="font-mono font-bold text-[#25312D]">
                  {formatTime12(noResultContext.time)}
                </span>
              </div>
              <p className="leading-relaxed text-[#53645F]">
                {noResultContext.isOutOfHours ? (
                  <>
                    The Delhi timetable operates between <strong>06:00 AM and 11:35 PM</strong>. No trips run at{' '}
                    <strong>{formatTime12(noResultContext.time)}</strong> for <strong>{originName}</strong> ➔ <strong>{destinationName}</strong>.
                  </>
                ) : (
                  <>
                    No direct or connected trips found between <strong>{originName}</strong> and <strong>{destinationName}</strong> at{' '}
                    <strong>{formatTime12(noResultContext.time)}</strong> on the {serviceDay} timetable.
                  </>
                )}
              </p>

              <div className="pt-2 border-t border-[#B88A43]/20 space-y-1.5">
                <div className="text-[11px] font-bold text-[#25312D]">
                  Try active service hours:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVE_SERVICE_HOURS.filter(t => t !== noResultContext.time).map(retryTime => (
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
                      className="rounded border border-[#B88A43]/40 bg-white px-2 py-1 text-[11px] font-bold text-[#25312D] hover:bg-[#FAF7F2]"
                    >
                      {formatTime12(retryTime)}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Route Comparison Insight */}
          {hasDistinctComparison && fastestOption && cheapestOption && (
            <section className="rounded-lg border border-[#E8DFCE] bg-[#FFFFFF] p-4 text-xs text-[#25312D] space-y-1.5 shadow-xs">
              <div className="font-bold text-[#173B32]">
                📊 Journey Comparison Insight
              </div>
              <div className="space-y-1 text-[#53645F]">
                {fastestOption.total_duration_minutes < cheapestOption.total_duration_minutes && (
                  <p>
                    • <strong>Fastest Route</strong> saves{' '}
                    <strong className="text-[#25312D]">
                      {cheapestOption.total_duration_minutes - fastestOption.total_duration_minutes} minutes
                    </strong>{' '}
                    of travel time.
                  </p>
                )}
                {cheapestOption.total_fare !== null &&
                  fastestOption.total_fare !== null &&
                  cheapestOption.total_fare < fastestOption.total_fare && (
                    <p>
                      • <strong>Lowest Cost</strong> saves{' '}
                      <strong className="text-[#236B56] font-bold">
                        ₹{fastestOption.total_fare - cheapestOption.total_fare}
                      </strong>{' '}
                      in calculated fare.
                    </p>
                  )}
              </div>
            </section>
          )}

          {/* Search Result Cards */}
          {options.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[#25312D]">
                  {options.length} {options.length === 1 ? 'Route Found' : 'Routes Found'}
                </span>
                <span className="font-mono text-[#53645F] text-[11px]">
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

          {/* Saved Journeys Console */}
          <SavedRoutesPanel onReuse={handleReuse} refreshTrigger={savedRefresh} />
        </div>

        {/* Right Column (7 cols): Map & Transit Copilot */}
        <div className="space-y-6 lg:col-span-7">
          {/* Interactive Bus Transit Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#53645F]">
              <span className="font-bold uppercase tracking-wider text-[#25312D]">
                Interactive Transit Map
              </span>
              <span>Click any stop to route</span>
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

          {/* Transit Copilot Assistant */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#53645F]">
              <span className="font-bold uppercase tracking-wider text-[#25312D]">
                Transit Copilot
              </span>
              <span>Grounded in GTFS schedules</span>
            </div>

            <ChatAssistant serviceDay={serviceDay} />
          </div>
        </div>
      </div>
    </div>
  )
}
