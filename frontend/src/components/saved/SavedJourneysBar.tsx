import { useState, useEffect } from 'react'
import type { SavedRoute } from '../../types'
import { formatTime12 } from '../../utils/time'
import { getSavedRoutes, deleteSavedRoute } from '../../services/api'
import { BookmarkIcon, ArrowRightIcon, TrashIcon } from '../common/Icons'

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
    <section
      aria-labelledby="saved-journeys-title"
      className="rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] shadow-xs overflow-hidden transition-all duration-300 animate-fade-in"
    >
      {/* Header Bar */}
      <header className="flex items-center justify-between border-b border-[#D8C8AA] px-4 py-3 bg-[#EEE5D6]/60">
        <div className="flex items-center gap-2">
          <BookmarkIcon className="w-4 h-4 text-[#C49A43]" />
          <h3 id="saved-journeys-title" className="font-serif text-xs sm:text-sm font-bold text-[#243B4A]">
            Saved Journeys
          </h3>
          <span className="rounded-full bg-[#EEE5D6] px-2 py-0.5 font-mono text-[10px] font-bold text-[#243B4A] border border-[#D8C8AA]">
            {routes.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#77766D] hidden sm:inline">
            1-click route recall
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            aria-expanded={isExpanded}
            aria-controls="saved-journeys-content"
            className="text-[11px] font-semibold text-[#77766D] hover:text-[#243B4A] px-2.5 py-1 rounded-lg hover:bg-[#EEE5D6] transition-colors cursor-pointer"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </header>

      {/* Content Bar */}
      {isExpanded && (
        <div id="saved-journeys-content" className="p-3.5 bg-[#FFFCF5] animate-fade-in">
          {loading && routes.length === 0 ? (
            <div className="flex items-center gap-2 py-2 px-2 text-xs text-[#77766D]" role="status">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#C49A43] border-t-transparent" />
              <span>Loading saved journeys…</span>
            </div>
          ) : routes.length === 0 ? (
            <div className="flex items-center justify-between gap-3 py-3 px-4 rounded-xl border border-dashed border-[#D8C8AA] bg-[#EEE5D6]/30 text-xs text-[#77766D]">
              <div className="flex items-center gap-2">
                <BookmarkIcon className="w-4 h-4 text-[#C49A43] shrink-0" />
                <span>No saved journeys yet. Search any corridor above and click <strong>Save Route</strong> to bookmark it for quick access.</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin" role="list">
              {routes.map(r => (
                <div
                  key={r.saved_route_id}
                  role="listitem"
                  onClick={() => onReuse(r)}
                  className="shrink-0 flex items-center justify-between gap-3 rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]/40 hover:bg-[#FFFCF5] hover:border-[#C49A43] hover:shadow-xs p-3 min-w-[240px] max-w-[280px] cursor-pointer transition-all group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#243B4A] truncate">
                      <span className="truncate">{r.origin_stop_name || r.origin_stop_id}</span>
                      <ArrowRightIcon className="w-3 h-3 text-[#77766D] shrink-0" />
                      <span className="truncate">{r.destination_stop_name || r.destination_stop_id}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[#77766D] font-mono">
                      <span>{formatTime12(r.preferred_departure_time || '08:00')}</span>
                      <span>•</span>
                      <span className="capitalize">{r.preference}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        onReuse(r)
                      }}
                      className="rounded-lg bg-[#243B4A] hover:bg-[#172D3B] px-2.5 py-1 text-[11px] font-bold text-[#FFFCF5] shadow-2xs transition-all cursor-pointer"
                      title="Reuse this route"
                      aria-label={`Search again for ${r.origin_stop_name || r.origin_stop_id} to ${r.destination_stop_name || r.destination_stop_id}`}
                    >
                      Search
                    </button>
                    {r.saved_route_id !== null && r.saved_route_id !== undefined && (
                      <button
                        type="button"
                        disabled={deletingId === r.saved_route_id}
                        onClick={e => handleDelete(r.saved_route_id as number, e)}
                        className="rounded-lg p-1.5 text-[#77766D] hover:text-[#A6533C] hover:bg-[#EEE5D6] transition-colors cursor-pointer"
                        title="Delete bookmark"
                        aria-label="Delete saved journey"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
