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
    <section className="rounded-[1.75rem] border border-[#d8d3c7] bg-[#fffdf7] p-5 shadow-[0_18px_50px_-36px_rgba(27,39,35,0.5)]">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#e7e3d9] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#1c2925]">Saved journeys</span>
          <span className="rounded-full bg-[#e9edcf] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#47572d]">
            {routes.length}
          </span>
        </div>
        <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#858d81]">Bookmarks</span>
      </div>

      {loading && routes.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-6 text-center text-xs text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span>Loading saved journeys…</span>
        </div>
      ) : routes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d8d3c7] bg-[#f8f6f0] px-4 py-6 text-center text-slate-600">
          <div className="mb-1.5 text-lg" aria-hidden="true">🔖</div>
          <div className="text-sm font-semibold text-slate-800">No saved journeys yet</div>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
            Search for a route above and save it for one-click access.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {routes.map(r => (
            <div
              key={r.saved_route_id}
              className="group flex items-center justify-between gap-3 rounded-xl border border-[#e2ded3] bg-[#f8f6f0] p-3.5 transition-all hover:border-[#9aab59] hover:bg-white hover:shadow-xs"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
                  <span>{r.label}</span>
                  <span className="rounded-md border border-[#d8dfb4] bg-[#f1f4df] px-2 py-0.5 text-xs font-semibold uppercase text-[#47572d]">
                    {r.preference}
                  </span>
                </div>
                <div className="truncate text-xs font-medium text-slate-600">
                  {r.origin_stop_name} → {r.destination_stop_name}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Dep: <strong className="font-mono text-slate-700">{r.preferred_departure_time}</strong></span>
                  <span>•</span>
                  <span>{r.service_day === 'weekend' ? 'Weekend Timetable' : 'Weekday Timetable'}</span>
                </div>
              </div>

              <div className="ml-2 flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onReuse(r)}
                  className="rounded-lg border border-[#9aab59] bg-[#f1f4df] px-3 py-1.5 text-xs font-semibold text-[#3d4c32] transition-colors hover:bg-[#e7edc7] focus:outline-none focus:ring-2 focus:ring-[#9aab59]"
                  title="Search this route now"
                >
                  Search
                </button>
                <button
                  type="button"
                  disabled={deletingId === r.saved_route_id}
                  onClick={e => r.saved_route_id !== null && handleDelete(r.saved_route_id, e)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  title="Remove saved route"
                  aria-label={`Delete ${r.label}`}
                >
                  {deletingId === r.saved_route_id ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
