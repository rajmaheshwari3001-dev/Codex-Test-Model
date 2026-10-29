import { useState, useEffect } from 'react'
import type { SavedRoute } from '../types'
import { getSavedRoutes, deleteSavedRoute } from '../services/api'

interface Props {
  onReuse: (route: SavedRoute) => void
  refreshTrigger: number
}

export default function SavedRoutes({ onReuse, refreshTrigger }: Props) {
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    getSavedRoutes()
      .then(data => {
        if (active) setRoutes(data)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refreshTrigger])

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await deleteSavedRoute(id)
      setRoutes(prev => prev.filter(r => r.saved_route_id !== id))
    } catch {
      // Keep on error
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4.5">
      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Saved Routes</span>
          <span className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
            {routes.length}
          </span>
        </div>
        <span className="text-[11px] text-gray-400">Stored locally in SQLite</span>
      </div>

      {loading && routes.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading bookmarked routes...</span>
        </div>
      ) : routes.length === 0 ? (
        <div className="py-6 px-3 text-center rounded-lg bg-gray-50 border border-dashed border-gray-200 text-gray-500">
          <div className="text-base mb-1">🔖</div>
          <div className="text-xs font-medium text-gray-700">No saved journeys yet</div>
          <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
            Search for any transit path above and click <span className="font-semibold text-indigo-600">Save Route</span> to pin it for one-click re-searching.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {routes.map(r => (
            <div
              key={r.saved_route_id}
              className="group flex items-center justify-between p-2.5 rounded-lg border border-gray-150 bg-gray-50/60 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <span>{r.label}</span>
                  <span className="text-[10px] font-normal text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 uppercase">
                    {r.preference}
                  </span>
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {r.origin_stop_name} → {r.destination_stop_name}
                </div>
                <div className="text-[10px] text-gray-400 flex items-center gap-2">
                  <span>Preferred: <span className="font-mono text-gray-600">{r.preferred_departure_time}</span></span>
                  <span>•</span>
                  <span>{r.service_day === 'weekend' ? 'Weekend Schedule' : 'Weekday Schedule'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  onClick={() => onReuse(r)}
                  className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors focus:outline-none"
                  title="Search this route now"
                >
                  Search
                </button>
                <button
                  type="button"
                  disabled={deletingId === r.saved_route_id}
                  onClick={e => r.saved_route_id !== null && handleDelete(r.saved_route_id, e)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors focus:outline-none"
                  title="Remove saved route"
                  aria-label={`Delete ${r.label}`}
                >
                  {deletingId === r.saved_route_id ? '...' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
