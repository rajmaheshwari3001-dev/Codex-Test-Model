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
    <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-800">
            🔖
          </span>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
            Bookmarked Journeys
          </h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600">
            {routes.length}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">1-Click Fast Re-Search</span>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-900">
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
        <div className="flex items-center justify-center gap-2 py-8 text-center text-xs font-bold text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span>Retrieving pinned journeys…</span>
        </div>
      ) : routes.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-200/60 text-lg">
            📌
          </div>
          <div className="mt-2 text-xs sm:text-sm font-bold text-slate-700">No bookmarked journeys yet</div>
          <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
            Search for any transit path above and tap <strong className="text-blue-600">Save</strong> to pin it here for instant one-click re-searching.
          </p>
        </div>
      ) : routes.length > 0 ? (
        <div className="space-y-2.5">
          {routes.map(r => (
            <div
              key={r.saved_route_id}
              className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all hover:border-blue-400 hover:shadow-md"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-black text-slate-900">
                  <span>{r.label}</span>
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                    {r.preference}
                  </span>
                </div>
                <div className="truncate text-xs font-semibold text-slate-600">
                  {r.origin_stop_name} <span className="text-slate-400">➔</span> {r.destination_stop_name}
                </div>
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                  <span>Dep: <strong className="font-mono font-bold text-slate-700">{formatTime12(r.preferred_departure_time)}</strong></span>
                  <span>•</span>
                  <span>{r.service_day === 'weekend' ? 'Weekend' : 'Weekday'}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onReuse(r)}
                  className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition-all hover:opacity-95 active:scale-95"
                  title="Search this route now"
                >
                  <span>Search</span>
                  <span aria-hidden="true">➔</span>
                </button>
                <button
                  type="button"
                  disabled={deletingId === r.saved_route_id}
                  onClick={e => r.saved_route_id !== null && handleDelete(r.saved_route_id, e)}
                  className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none"
                  title="Remove saved route"
                  aria-label={`Delete ${r.label}`}
                >
                  {deletingId === r.saved_route_id ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
