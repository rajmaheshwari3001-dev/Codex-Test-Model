import { useState, useEffect } from 'react'
import type { SavedRoute } from '../types'
import { formatTime12 } from '../utils/time'
import { getSavedRoutes, deleteSavedRoute } from '../services/api'

interface Props {
  onReuse: (route: SavedRoute) => void
  refreshTrigger: number
}

export default function SavedRoutes({ onReuse, refreshTrigger }: Props) {
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [reloadTrigger, setReloadTrigger] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getSavedRoutes()
      .then(data => {
        if (active) setRoutes(data)
      })
      .catch(loadError => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load saved journeys.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refreshTrigger, reloadTrigger])

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await deleteSavedRoute(id)
      setRoutes(prev => prev.filter(r => r.saved_route_id !== id))
      setError('')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to remove this saved journey.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="rounded-xl border border-[#E8DFCE] bg-[#FFFFFF] p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between border-b border-[#E8DFCE] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FAF7F2] text-xs font-bold text-[#173B32] border border-[#E8DFCE]">
            🔖
          </span>
          <h2 className="text-sm font-bold text-[#25312D]">
            Saved Journeys
          </h2>
          <span className="rounded-full bg-[#FAF7F2] border border-[#E8DFCE] px-2 py-0.5 font-mono text-[10px] font-bold text-[#53645F]">
            {routes.length}
          </span>
        </div>
        <span className="text-[11px] text-[#53645F]">Saved to SQLite</span>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-[#A44735]/30 bg-[#F8ECE9] p-3 text-xs font-semibold text-[#A44735]">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setReloadTrigger(previous => previous + 1)}
            className="mt-1 font-bold underline"
          >
            Retry Loading
          </button>
        </div>
      )}

      {loading && routes.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-8 text-center text-xs text-[#53645F]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#173B32] border-t-transparent" />
          <span>Loading saved journeys…</span>
        </div>
      ) : routes.length === 0 && !error ? (
        <div className="rounded-lg border border-dashed border-[#E8DFCE] bg-[#FAF7F2] p-6 text-center">
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFFFFF] border border-[#E8DFCE] text-sm">
            📌
          </div>
          <div className="mt-2 text-xs font-bold text-[#25312D]">
            Your saved journeys will appear here
          </div>
          <p className="mx-auto mt-1 max-w-xs text-[11px] text-[#53645F]">
            Search for any transit path above and click <strong>Save Route</strong> to bookmark it for instant access.
          </p>
        </div>
      ) : routes.length > 0 ? (
        <div className="space-y-2">
          {routes.map(r => (
            <div
              key={r.saved_route_id}
              role="button"
              tabIndex={0}
              onClick={() => onReuse(r)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onReuse(r)
                }
              }}
              className="group flex items-center justify-between rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] p-3 text-left transition-all hover:bg-[#FFFFFF] hover:border-[#173B32] hover:shadow-xs cursor-pointer"
            >
              <div className="min-w-0 pr-2 space-y-1">
                <div className="text-xs font-bold text-[#25312D] truncate">
                  {r.origin_stop_name || r.origin_stop_id} <span className="text-[#B88A43]">➔</span> {r.destination_stop_name || r.destination_stop_id}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#53645F]">
                  <span className="capitalize">{r.preference}</span>
                  <span>•</span>
                  <span>{r.service_day}</span>
                  {r.preferred_departure_time && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{formatTime12(r.preferred_departure_time)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="hidden sm:inline-block rounded-md bg-[#173B32] px-2 py-1 text-[11px] font-semibold text-white group-hover:bg-[#1f4d42]">
                  Load ➔
                </span>
                {r.saved_route_id !== null && r.saved_route_id !== undefined && (
                  <button
                    type="button"
                    disabled={deletingId === r.saved_route_id}
                    onClick={e => r.saved_route_id && handleDelete(r.saved_route_id, e)}
                    className="rounded-md p-1.5 text-[#53645F] hover:bg-[#F8ECE9] hover:text-[#A44735] transition-colors"
                    title="Remove saved journey"
                  >
                    {deletingId === r.saved_route_id ? '…' : '🗑️'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
