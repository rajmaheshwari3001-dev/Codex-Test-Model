import { useState, useEffect } from 'react'
import type { SavedRoute } from '../../types'
import { formatTime12 } from '../../utils/time'
import { getSavedRoutes, deleteSavedRoute } from '../../services/api'

interface Props {
  onReuse: (route: SavedRoute) => void
  refreshTrigger: number
}

export default function SavedJourneysBar({ onReuse, refreshTrigger }: Props) {
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

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
    } catch {}
    finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-[#DAD3C6] bg-[#FBF8F1] shadow-xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#DAD3C6] px-4 py-2.5 bg-[#F5F0E6]">
        <div className="flex items-center gap-2">
          <span className="text-[#C49A43] text-sm">★</span>
          <h3 className="font-serif text-xs sm:text-sm font-bold text-[#172D3B]">
            Saved Journeys
          </h3>
          <span className="rounded-full bg-[#EDE7DB] border border-[#DAD3C6] px-2 py-0.2 font-mono text-[10px] font-bold text-[#29343A]">
            {routes.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#73766F] hidden sm:inline">
            1-click route recall
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className="text-[11px] font-bold text-[#73766F] hover:text-[#172D3B] px-2 py-0.5 rounded hover:bg-[#EDE7DB] transition-colors"
          >
            {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
          </button>
        </div>
      </div>

      {/* Content Bar */}
      {isExpanded && (
        <div className="p-3 bg-[#FBF8F1]">
          {loading && routes.length === 0 ? (
            <div className="flex items-center gap-2 py-3 px-2 text-xs text-[#73766F]">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#C49A43] border-t-transparent" />
              <span>Loading saved journeys…</span>
            </div>
          ) : routes.length === 0 ? (
            <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-dashed border-[#DAD3C6] bg-[#FFFFFF] text-xs text-[#73766F]">
              <div className="flex items-center gap-2">
                <span>📌</span>
                <span>No saved journeys yet. Search any route and click <strong>Save</strong> to keep it here for 1-click access.</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
              {routes.map(r => (
                <div
                  key={r.saved_route_id}
                  onClick={() => onReuse(r)}
                  className="flex-shrink-0 flex items-center justify-between gap-3 rounded-lg border border-[#DAD3C6] bg-[#FFFFFF] hover:border-[#C49A43] hover:shadow-2xs p-2.5 min-w-[240px] max-w-[280px] cursor-pointer transition-all group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#172D3B] truncate">
                      <span className="truncate">{r.origin_stop_name || r.origin_stop_id}</span>
                      <span className="text-[#C49A43] shrink-0">➔</span>
                      <span className="truncate">{r.destination_stop_name || r.destination_stop_id}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[#73766F]">
                      <span className="font-mono font-semibold">
                        {formatTime12(r.preferred_departure_time || '08:00')}
                      </span>
                      <span>•</span>
                      <span className="capitalize font-medium">
                        {r.preference}
                      </span>
                      <span>•</span>
                      <span className="capitalize font-medium">
                        {r.service_day}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        onReuse(r)
                      }}
                      className="rounded bg-[#C49A43] hover:bg-[#A97C2E] px-2 py-1 text-[10px] font-bold text-white shadow-2xs transition-all"
                      title="Reuse this route"
                    >
                      Reuse
                    </button>
                    {r.saved_route_id !== null && r.saved_route_id !== undefined && (
                      <button
                        type="button"
                        disabled={deletingId === r.saved_route_id}
                        onClick={e => handleDelete(r.saved_route_id as number, e)}
                        className="rounded p-1 text-[11px] text-[#73766F] hover:text-[#A64C42] hover:bg-[#F9EBEA] transition-colors"
                        title="Delete bookmark"
                      >
                        {deletingId === r.saved_route_id ? '…' : '✕'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
