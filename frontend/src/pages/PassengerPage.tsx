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
    <div className="space-y-6">
      <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative min-h-[220px] overflow-hidden rounded-[2rem] bg-[#172421] px-6 py-6 text-[#f4f1e7] sm:px-8 sm:py-8">
          <div aria-hidden="true" className="absolute -right-7 -top-20 select-none font-black leading-none text-white/[0.035] text-[19rem]">
            D
          </div>
          <p className="relative text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#c0ce9b]">
            Delhi / Public transit / Field guide
          </p>
          <h1 className="relative mt-5 text-4xl font-black leading-[0.96] tracking-[-0.055em] sm:text-5xl">
            Find your way
            <br />
            <span className="text-[#d9ed55]">across the city.</span>
          </h1>
          <div className="relative mt-4 flex flex-wrap items-end justify-between gap-3">
            <p className="max-w-md text-xs leading-relaxed text-[#c7d0c5] sm:text-sm">
              Plan a journey with the sample timetable, then follow your selected line on the map.
            </p>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#a7b3a5]">
              Issue 01 &nbsp;·&nbsp; Sample network
            </span>
          </div>
        </div>

        <aside className="flex min-h-[220px] flex-col justify-between rounded-[2rem] bg-[#d9ed55] p-6 text-[#172421] sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#5b6738]">The timetable</p>
              <p className="mt-1 text-sm font-bold">Service window</p>
            </div>
            <span className="rounded-full border border-[#758544]/30 bg-white/40 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider">
              Demo data
            </span>
          </div>
          <div className="py-3">
            <div className="font-mono text-3xl font-black tracking-[-0.06em] sm:text-4xl">
              06:30 <span className="font-normal text-[#758544]">—</span> 12:30
            </div>
            <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-[#172421]" />
              <span className="h-1 flex-1 rounded-full bg-[#758544]/40" />
              <span className="h-2 w-2 rounded-full border-2 border-[#172421] bg-[#d9ed55]" />
              <span className="h-1 flex-1 rounded-full bg-[#758544]/40" />
              <span className="h-2 w-2 rounded-full bg-[#172421]" />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] font-bold text-[#5b6738]">
              <span>START</span>
              <span>PEAK</span>
              <span>LAST SAMPLE</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[#71803e]/25 pt-3 text-[10px] font-bold uppercase tracking-wider text-[#475435]">
            <span>{stops.length} stops mapped</span>
            <span>{routes.length} sample lines</span>
            <span>Weekday / weekend</span>
          </div>
        </aside>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(340px,0.86fr)_minmax(0,1.14fr)]">
      <div className="space-y-5">
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
            className="flex items-start gap-3 rounded-2xl border border-[#e3b8b2] bg-[#fff1ee] p-4 text-xs text-[#853c35] shadow-xs sm:text-sm"
          >
            <span aria-hidden="true" className="text-xl">⚠️</span>
            <div className="flex-1">
              <div className="font-bold text-sm mb-0.5">Connection Notice</div>
              <div>{message}</div>
              {stops.length === 0 && (
                <button
                  type="button"
                  onClick={loadInitialData}
                  className="mt-2 text-xs font-bold text-[#3e5831] underline hover:text-[#172421]"
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
            className="flex items-center gap-2.5 rounded-2xl border border-[#9fae65] bg-[#f1f5db] p-3.5 text-xs font-semibold text-[#35452f] shadow-xs sm:text-sm"
          >
            <span aria-hidden="true" className="text-base text-emerald-600">✓</span>
            <span>{saveToast}</span>
          </div>
        )}

        {/* DEDICATED SCHEDULE DIAGNOSTIC & SMART RECOVERY CARD */}
        {noResultContext && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/95 p-5 space-y-3.5 shadow-xs">
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">🕒</span>
              <div className="flex-1">
                <div className="text-base font-bold text-amber-950">
                  {noResultContext.isOutOfHours
                    ? `No Schedules at ${noResultContext.time} (Outside Operating Window)`
                    : noResultContext.isDirectionalIssue
                    ? `Route Direction Constraint (Southbound Corridor)`
                    : `No Direct or Connecting Schedule Found`}
                </div>
                <div className="text-xs sm:text-sm text-amber-900/90 mt-1.5 leading-relaxed">
                  {noResultContext.isOutOfHours ? (
                    <>
                      In this Delhi demo GTFS timetable, all catalogued trips operate between{' '}
                      <strong>06:30 AM and 12:30 PM</strong>. Trips departing at <strong>{noResultContext.time}</strong> are not
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
            <div className="pt-3 border-t border-amber-200 space-y-2.5">
              <div className="text-xs font-bold text-amber-950 uppercase tracking-wide">
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
                    className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
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
                    className="px-3.5 py-2 bg-white border border-amber-300 text-amber-950 hover:bg-amber-100 rounded-xl font-bold text-xs transition-colors"
                  >
                    Re-search at 09:30 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTime('11:00')
                      handleSearch(origin, destination, '11:00', preference, serviceDay)
                    }}
                    className="px-3.5 py-2 bg-white border border-amber-300 text-amber-950 hover:bg-amber-100 rounded-xl font-bold text-xs transition-colors"
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
                    className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors"
                  >
                    📍 Start from Connaught Place (S05) @ 08:00
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDestination('S08')
                      handleSearch(origin, 'S08', '08:00', preference, serviceDay)
                    }}
                    className="px-3.5 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-xs transition-colors"
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
                    className="px-3.5 py-2 bg-white border border-amber-300 text-amber-950 hover:bg-amber-100 rounded-xl font-bold text-xs transition-colors"
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
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg font-bold text-xs transition-colors"
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
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg font-bold text-xs transition-colors"
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
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-2xl p-4.5 shadow-xs text-xs sm:text-sm">
            <div className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="text-base">⚖️</span>
              <span className="text-sm sm:text-base">Alternative Route Comparison</span>
            </div>
            <div className="space-y-1.5 text-slate-700">
              {fastestOpt.total_duration_minutes < cheapestOpt.total_duration_minutes && (
                <div>
                  • <span className="font-bold text-blue-800">Fastest Option</span> arrives{' '}
                  <span className="font-extrabold text-slate-950">
                    {cheapestOpt.total_duration_minutes - fastestOpt.total_duration_minutes} min earlier
                  </span>{' '}
                  ({fastestOpt.total_duration_minutes} min total transit time).
                </div>
              )}
              {cheapestOpt.total_fare !== null &&
                fastestOpt.total_fare !== null &&
                cheapestOpt.total_fare < fastestOpt.total_fare && (
                  <div>
                    • <span className="font-bold text-emerald-800">Cheapest Option</span> saves{' '}
                    <span className="font-extrabold text-slate-950">
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
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 px-1">
              <span className="font-bold text-slate-900">
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

      <div className="space-y-5">
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
    </div>
  )
}
