import { useState, useEffect } from 'react'
import type { Stop, Route, JourneyOption, SavedRoute, ServiceDay } from '../types'
import { getStops, getRoutes, searchJourneys, createSavedRoute } from '../services/api'
import RouteSearchForm from '../components/RouteSearchForm'
import RouteResultCard from '../components/RouteResultCard'
import TransportMap from '../components/TransportMap'
import ChatAssistant from '../components/ChatAssistant'
import SavedRoutesPanel from '../components/SavedRoutes'

export default function PassengerPage() {
  const [stops, setStops] = useState<Stop[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [options, setOptions] = useState<JourneyOption[]>([])
  const [selected, setSelected] = useState<JourneyOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [saveToast, setSaveToast] = useState('')
  const [savedRefresh, setSavedRefresh] = useState(0)
  const [savedOptionIds, setSavedOptionIds] = useState<Set<string>>(new Set())
  const [serviceDay, setServiceDay] = useState<ServiceDay>('weekday')

  function loadInitialData() {
    setMessage('')
    Promise.all([getStops(), getRoutes()])
      .then(([s, r]) => {
        setStops(s)
        setRoutes(r)
      })
      .catch(() => setMessage('Unable to connect to the transit backend. Please verify FastAPI is running at http://localhost:8000.'))
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  async function handleSearch(
    origin: string,
    destination: string,
    time: string,
    preference: string,
    selectedServiceDay: ServiceDay,
  ) {
    setLoading(true)
    setMessage('')
    setSaveToast('')
    setOptions([])
    setSelected(null)
    try {
      const res = await searchJourneys({
        origin_stop_id: origin,
        destination_stop_id: destination,
        departure_time: time,
        preference,
        service_day: selectedServiceDay,
      })
      setOptions(res.options)
      if (res.options.length > 0) {
        setSelected(res.options[0])
      } else {
        setMessage(res.message || 'No connecting transit route was found for this departure time. Try searching an earlier or later time.')
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
    setServiceDay(route.service_day)
    handleSearch(
      route.origin_stop_id,
      route.destination_stop_id,
      route.preferred_departure_time || '08:00',
      route.preference,
      route.service_day,
    )
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Search Form, Results & Saved Routes */}
      <div className="lg:col-span-1 space-y-4">
        <RouteSearchForm
          stops={stops}
          serviceDay={serviceDay}
          onServiceDayChange={setServiceDay}
          onSearch={handleSearch}
          loading={loading}
        />

        {/* Global Alert / Error banner */}
        {message && (
          <div
            role="alert"
            className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2 shadow-xs"
          >
            <span aria-hidden="true" className="text-base">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold mb-0.5">Notice</div>
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
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-medium flex items-center gap-2 shadow-xs"
          >
            <span aria-hidden="true">✓</span>
            <span>{saveToast}</span>
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
              {cheapestOpt.total_fare !== null && fastestOpt.total_fare !== null && cheapestOpt.total_fare < fastestOpt.total_fare && (
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
        <TransportMap stops={stops} routes={routes} selectedJourney={selected} />
        <ChatAssistant serviceDay={serviceDay} />
      </div>
    </div>
  )
}
