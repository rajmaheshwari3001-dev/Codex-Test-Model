import { useState, useEffect } from 'react'
import type { Stop, Route, JourneyOption, SavedRoute } from '../types'
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
  const [savedRefresh, setSavedRefresh] = useState(0)

  useEffect(() => {
    Promise.all([getStops(), getRoutes()])
      .then(([s, r]) => { setStops(s); setRoutes(r) })
      .catch(() => setMessage('Failed to load transport data. Is the backend running?'))
  }, [])

  async function handleSearch(origin: string, destination: string, time: string, preference: string) {
    setLoading(true)
    setMessage('')
    setOptions([])
    setSelected(null)
    try {
      const res = await searchJourneys({
        origin_stop_id: origin,
        destination_stop_id: destination,
        departure_time: time,
        preference,
      })
      setOptions(res.options)
      if (res.options.length > 0) {
        setSelected(res.options[0])
      } else {
        setMessage(res.message || 'No routes found for this search.')
      }
    } catch (e: any) {
      setMessage(e.message || 'Search failed.')
    }
    setLoading(false)
  }

  async function handleSave(opt: JourneyOption) {
    const originStop = stops.find(s => s.stop_id === opt.legs[0].board_stop_id)
    const destStop = stops.find(s => s.stop_id === opt.legs[opt.legs.length - 1].alight_stop_id)
    try {
      await createSavedRoute({
        label: `${originStop?.stop_name || '?'} → ${destStop?.stop_name || '?'}`,
        origin_stop_id: opt.legs[0].board_stop_id,
        origin_stop_name: originStop?.stop_name || '',
        destination_stop_id: opt.legs[opt.legs.length - 1].alight_stop_id,
        destination_stop_name: destStop?.stop_name || '',
        preferred_departure_time: opt.departure_time,
        preference: opt.label.toLowerCase(),
      })
      setSavedRefresh(prev => prev + 1)
    } catch {}
  }

  function handleReuse(route: SavedRoute) {
    handleSearch(
      route.origin_stop_id,
      route.destination_stop_id,
      route.preferred_departure_time || '08:00',
      route.preference,
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: search + results + saved */}
      <div className="lg:col-span-1 space-y-4">
        <RouteSearchForm stops={stops} onSearch={handleSearch} loading={loading} />

        {message && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            {message}
          </div>
        )}

        {options.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-600">
              {options.length} route option{options.length > 1 ? 's' : ''} found
            </h3>
            {options.map(opt => (
              <RouteResultCard
                key={opt.option_id}
                option={opt}
                selected={selected?.option_id === opt.option_id}
                onSelect={() => setSelected(opt)}
                onSave={() => handleSave(opt)}
              />
            ))}
          </div>
        )}

        <SavedRoutesPanel onReuse={handleReuse} refreshTrigger={savedRefresh} />
      </div>

      {/* Right column: map + chat */}
      <div className="lg:col-span-2 space-y-4">
        <TransportMap stops={stops} routes={routes} selectedJourney={selected} />
        <ChatAssistant />
      </div>
    </div>
  )
}
