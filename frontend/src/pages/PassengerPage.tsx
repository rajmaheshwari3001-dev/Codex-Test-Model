import { useState, useEffect } from 'react'
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
  isDirectionalIssue: boolean
  backendMessage?: string
}

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

  // Search form state
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [time, setTime] = useState('08:00')
  const [preference, setPreference] = useState('fastest')

  function loadInitialData() {
    setMessage('')
    Promise.all([getStops(), getRoutes()])
      .then(([s, r]) => {
        setStops(s)
        setRoutes(r)
      })
      .catch(() =>
        setMessage('Unable to connect to the transit backend. Please verify FastAPI is running at http://localhost:8000.')
      )
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  async function handleSearch(
    origId: string = origin,
    destId: string = destination,
    depTime: string = time,
    pref: string = preference,
    selectedServiceDay: ServiceDay = serviceDay
  ) {
    if (!origId || !destId) return
    setOrigin(origId)
    setDestination(destId)
    setTime(depTime)
    setPreference(pref)
    setServiceDay(selectedServiceDay)
    setLoading(true)
    setMessage('')
    setNoResultContext(null)
    setSaveToast('')
    setOptions([])
    setSelected(null)

    try {
      const res = await searchJourneys({
        origin_stop_id: origId,
        destination_stop_id: destId,
        departure_time: depTime,
        preference: pref,
        service_day: selectedServiceDay,
      })
      setOptions(res.options)
      if (res.options.length > 0) {
        setSelected(res.options[0])
      } else {
        const [hours, minutes] = depTime.split(':').map(Number)
        const totalMinutes = (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes)
        const isOutOfHours = totalMinutes < 6 * 60 + 30 || totalMinutes > 12 * 60 + 30
        const isDirectionalIssue = origId === 'S06' && ['S01', 'S02', 'S03', 'S04', 'S05'].includes(destId)

        setNoResultContext({
          origin: origId,
          destination: destId,
          time: depTime,
          isOutOfHours,
          isDirectionalIssue,
          backendMessage: res.message,
        })
      }
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(opt: JourneyOption) {
    const originStop = stops.find(s => s.stop_id === opt.legs[0]?.board_stop_id)
    const destStop = stops.find(s => s.stop_id === opt.legs[opt.legs.length - 1]?.alight_stop_id)
    try {
      await createSavedRoute({
        label: `${originStop?.stop_name || 'Origin'} → ${destStop?.stop_name || 'Destination'}`,
        origin_stop_id: opt.legs[0]?.board_stop_id || '',
        origin_stop_name: originStop?.stop_name || '',
        destination_stop_id: opt.legs[opt.legs.length - 1]?.alight_stop_id || '',
        destination_stop_name: destStop?.stop_name || '',
        preferred_departure_time: opt.departure_time,
        preference: opt.label.toLowerCase(),
        service_day: serviceDay,
      })
      setSavedOptionIds(prev => new Set(prev).add(opt.option_id))
      setSaveToast(`Route saved to bookmarks (${opt.label} • ₹${opt.total_fare ?? 'N/A'})`)
      setSavedRefresh(prev => prev + 1)
      setTimeout(() => setSaveToast(''), 4000)
    } catch {
      setSaveToast('Could not save route. Please try again.')
      setTimeout(() => setSaveToast(''), 4000)
    }
  }

  function handleReuse(route: SavedRoute) {
    setOrigin(route.origin_stop_id)
    setDestination(route.destination_stop_id)
    setTime(route.preferred_departure_time || '08:00')
    setPreference(route.preference)
    setServiceDay(route.service_day)
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
    setSaveToast(`📍 Set origin: ${stops.find(s => s.stop_id === stopId)?.stop_name || stopId}`)
    setTimeout(() => setSaveToast(''), 3000)
  }

  function handleSelectDestinationFromMap(stopId: string) {
    setDestination(stopId)
    setSaveToast(`🎯 Set destination: ${stops.find(s => s.stop_id === stopId)?.stop_name || stopId}`)
    setTimeout(() => setSaveToast(''), 3000)
  }

  // Calculate comparison highlights when multiple options are present
  const fastestOpt = options.find(o => o.label.toLowerCase() === 'fastest')
  const cheapestOpt = options.find(o => o.label.toLowerCase() === 'cheapest')
  const hasDistinctComparison =
    fastestOpt &&
    cheapestOpt &&
    fastestOpt.option_id !== cheapestOpt.option_id &&
    (fastestOpt.total_duration_minutes !== cheapestOpt.total_duration_minutes ||
      fastestOpt.total_fare !== cheapestOpt.total_fare)

  const originName = stops.find(s => s.stop_id === origin)?.stop_name || origin || 'Origin'
  const destName = stops.find(s => s.stop_id === destination)?.stop_name || destination || 'Destination'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Search Form, Results & Saved Routes */}
      <div className="lg:col-span-1 space-y-4">
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

        {/* Global Connection Alert / Error banner */}
        {message && (
          <div
            role="alert"
            className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 flex items-start gap-2 shadow-xs"
          >
            <span aria-hidden="true" className="text-base">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold mb-0.5">Connection Notice</div>
              <div>{message}</div>
              {stops.length === 0 && (
                <button
                  type="button"
                  onClick={loadInitialData}
                  className="mt-2 text-xs font-semibold text-indigo-700 underline hover:text-indigo-900"
                >
                  Retry connecting to backend
                </button>
              )}
            </div>
          </div>
        )}

        {/* Save confirmation toast */}
        {saveToast && (
          <div
            role="status"
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-medium flex items-center gap-2 shadow-xs animate-fade-in"
          >
            <span aria-hidden="true">✓</span>
            <span>{saveToast}</span>
          </div>
        )}

        {/* DEDICATED SCHEDULE DIAGNOSTIC & SMART RECOVERY CARD (When 0 results are returned) */}
        {noResultContext && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 space-y-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <span className="text-xl leading-none">🕒</span>
              <div className="flex-1">
                <div className="text-sm font-bold text-amber-950">
                  {noResultContext.isOutOfHours
                    ? `No Schedules at ${noResultContext.time} (Outside Operating Hours)`
                    : noResultContext.isDirectionalIssue
                    ? `Route Direction Constraint (Southbound Loop)`
                    : `No Direct or Connecting Schedule Found`}
                </div>
                <div className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                  {noResultContext.isOutOfHours ? (
                    <>
                      In this Delhi demo GTFS timetable, all catalogued trips operate between{' '}
                      <strong>06:30 AM and 12:30 PM</strong>. Trips for <strong>{noResultContext.time}</strong> are not
                      scheduled in this dataset.
                    </>
                  ) : noResultContext.isDirectionalIssue ? (
                    <>
                      Route R03 (Red Line) runs southbound from <strong>Connaught Place → India Gate → Lajpat Nagar → Saket</strong>.
                      Northbound return trips toward Kashmere Gate / Rajiv Chowk are not part of this loop in the sample timetable.
                    </>
                  ) : (
                    noResultContext.backendMessage ||
                    `No active connecting schedule was found between ${originName} and ${destName} at ${noResultContext.time}.`
                  )}
                </div>
              </div>
            </div>

            {/* Smart 1-Click Recovery Actions */}
            <div className="pt-2 border-t border-amber-200/80 space-y-2">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                Suggested Recovery Actions:
              </div>

              {noResultContext.isOutOfHours && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTime('08:00')
                      handleSearch(origin, destination, '08:00', preference, serviceDay)
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <span>☀️</span>
                    <span>Re-search at 08:00 AM (Peak)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTime('09:30')
                      handleSearch(origin, destination, '09:30', preference, serviceDay)
                    }}
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-950 hover:bg-amber-100 rounded-lg font-medium text-xs transition-colors"
                  >
                    Re-search at 09:30 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTime('11:00')
                      handleSearch(origin, destination, '11:00', preference, serviceDay)
                    }}
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-950 hover:bg-amber-100 rounded-lg font-medium text-xs transition-colors"
                  >
                    Re-search at 11:00 AM
                  </button>
                </div>
              )}

              {noResultContext.isDirectionalIssue && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin('S05')
                      handleSearch('S05', destination, '08:00', preference, serviceDay)
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-2xs transition-colors"
                  >
                    📍 Start from Connaught Place (S05) @ 08:00
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDestination('S08')
                      handleSearch(origin, 'S08', '08:00', preference, serviceDay)
                    }}
                    className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium text-xs transition-colors"
                  >
                    🎯 Travel to Saket (S08) @ 08:00
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const prevOrig = origin
                      const prevDest = destination
                      setOrigin(prevDest)
                      setDestination(prevOrig)
                      handleSearch(prevDest, prevOrig, '08:00', preference, serviceDay)
                    }}
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg font-medium text-xs transition-colors"
                  >
                    ⇅ Reverse Direction @ 08:00
                  </button>
                </div>
              )}

              {!noResultContext.isOutOfHours && !noResultContext.isDirectionalIssue && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin('S02')
                      setDestination('S08')
                      setTime('08:00')
                      handleSearch('S02', 'S08', '08:00', preference, serviceDay)
                    }}
                    className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded font-medium text-xs transition-colors"
                  >
                    Try Kashmere Gate → Saket @ 08:00
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrigin('S13')
                      setDestination('S01')
                      setTime('07:00')
                      handleSearch('S13', 'S01', '07:00', preference, serviceDay)
                    }}
                    className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded font-medium text-xs transition-colors"
                  >
                    Try Dwarka → Rajiv Chowk @ 07:00
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison Summary Banner when multiple alternative options exist */}
        {hasDistinctComparison && (
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200/80 rounded-xl p-3.5 shadow-xs text-xs">
            <div className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
              <span>⚖️ Alternative Route Comparison</span>
            </div>
            <div className="space-y-1 text-gray-700">
              {fastestOpt.total_duration_minutes < cheapestOpt.total_duration_minutes && (
                <div>
                  • <span className="font-semibold text-blue-700">Fastest</span> arrives{' '}
                  <span className="font-bold text-gray-900">
                    {cheapestOpt.total_duration_minutes - fastestOpt.total_duration_minutes} min earlier
                  </span>{' '}
                  ({fastestOpt.total_duration_minutes} min total).
                </div>
              )}
              {cheapestOpt.total_fare !== null &&
                fastestOpt.total_fare !== null &&
                cheapestOpt.total_fare < fastestOpt.total_fare && (
                  <div>
                    • <span className="font-semibold text-emerald-700">Cheapest</span> saves{' '}
                    <span className="font-bold text-gray-900">
                      ₹{fastestOpt.total_fare - cheapestOpt.total_fare}
                    </span>{' '}
                    (₹{cheapestOpt.total_fare} vs ₹{fastestOpt.total_fare}).
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Results List */}
        {options.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span className="font-semibold text-gray-800">
                Found {options.length} {options.length === 1 ? 'Journey Option' : 'Journey Options'}
              </span>
              <span>Sorted by {options[0]?.label}</span>
            </div>
            {options.map(opt => (
              <RouteResultCard
                key={opt.option_id}
                option={opt}
                selected={selected?.option_id === opt.option_id}
                onSelect={() => setSelected(opt)}
                onSave={() => handleSave(opt)}
                isSaved={savedOptionIds.has(opt.option_id)}
              />
            ))}
          </div>
        )}

        {/* Saved Routes Panel */}
        <SavedRoutesPanel onReuse={handleReuse} refreshTrigger={savedRefresh} />
      </div>

      {/* Right Column: GIS Leaflet Map & Conversational Assistant */}
      <div className="lg:col-span-2 space-y-4">
        <TransportMap
          stops={stops}
          routes={routes}
          selectedJourney={selected}
          originStopId={origin}
          destinationStopId={destination}
          onSelectOrigin={handleSelectOriginFromMap}
          onSelectDestination={handleSelectDestinationFromMap}
        />
        <ChatAssistant serviceDay={serviceDay} />
      </div>
    </div>
  )
}
