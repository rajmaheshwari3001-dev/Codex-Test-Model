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

  useEffect(() => {
    setLoading(true)
    getSavedRoutes()
      .then(setRoutes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [refreshTrigger])

  async function handleDelete(id: number) {
    await deleteSavedRoute(id)
    setRoutes(prev => prev.filter(r => r.saved_route_id !== id))
  }

  if (loading) return <div className="text-sm text-gray-400">Loading saved routes...</div>
  if (routes.length === 0) return <div className="text-sm text-gray-400">No saved routes yet.</div>

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Saved Routes</h3>
      <div className="space-y-2">
        {routes.map(r => (
          <div key={r.saved_route_id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
            <div>
              <div className="font-medium text-gray-800">{r.label}</div>
              <div className="text-xs text-gray-500">{r.origin_stop_name} → {r.destination_stop_name}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onReuse(r)}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
              >
                Search
              </button>
              <button
                onClick={() => r.saved_route_id !== null && handleDelete(r.saved_route_id)}
                className="text-red-500 hover:text-red-700 text-xs font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
