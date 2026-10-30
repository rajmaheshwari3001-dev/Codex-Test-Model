import { useState, useEffect } from 'react'
import type { SavedRoute } from '../../types'
import { formatTime12 } from '../../utils/time'
import { getSavedRoutes, deleteSavedRoute } from '../../services/api'
import {
  BookmarkIcon,
  ArrowRightIcon,
  TrashIcon,
  HomeIcon,
  BriefcaseIcon,
  PlaneIcon,
} from '../common/Icons'

interface Props {
  onReuse: (route: SavedRoute) => void
  refreshTrigger: number
}

// 3 Default Figma Shortcuts
const FIGMA_SHORTCUTS: SavedRoute[] = [
  {
    saved_route_id: -1,
    label: 'Home → College',
    origin_stop_id: 'S13',
    origin_stop_name: 'Dwarka Sector 21',
    destination_stop_id: 'S19',
    destination_stop_name: 'Noida City Centre',
    preferred_departure_time: '08:00',
    preference: 'fastest',
    service_day: 'weekday',
  },
  {
    saved_route_id: -2,
    label: 'Office → Home',
    origin_stop_id: 'S02',
    origin_stop_name: 'Kashmere Gate',
    destination_stop_id: 'S13',
    destination_stop_name: 'Dwarka Sector 21',
    preferred_departure_time: '18:00',
    preference: 'fastest',
    service_day: 'weekday',
  },
  {
    saved_route_id: -3,
    label: 'Rajiv Chowk → Airport',
    origin_stop_id: 'S01',
    origin_stop_name: 'Rajiv Chowk',
    destination_stop_id: 'S13',
    destination_stop_name: 'Dwarka Sector 21',
    preferred_departure_time: '09:15',
    preference: 'fastest',
    service_day: 'weekday',
  },
]

export default function SavedJourneysBar({ onReuse, refreshTrigger }: Props) {
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
    } catch {}
    finally {
      setDeletingId(null)
    }
  }

  // Combine default shortcuts with user saved routes
  const displayRoutes = [...FIGMA_SHORTCUTS, ...routes]

  return (
    <section
      aria-labelledby="saved-journeys-title"
      className="rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] p-5 sm:p-6 shadow-xs space-y-4 animate-fade-in"
    >
      {/* Header Matching Figma */}
      <header className="flex items-center justify-between border-b border-[#D8C8AA]/70 pb-3">
        <div className="space-y-0.5">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#C49A43]">
            YOUR SHORTCUTS
          </div>
          <h3 id="saved-journeys-title" className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#243B4A]">
            Saved journeys
          </h3>
        </div>

        <button
          type="button"
          className="text-xs font-bold text-[#C49A43] hover:text-[#A77B32] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>View all</span>
          <span>→</span>
        </button>
      </header>

      {/* Cards Row Matching Figma */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" role="list">
        {displayRoutes.map((r, i) => {
          const isPreset = r.saved_route_id && r.saved_route_id < 0
          const ShortcutIcon = i === 0 ? HomeIcon : i === 1 ? BriefcaseIcon : PlaneIcon
          return (
            <div
              key={r.saved_route_id ?? i}
              role="listitem"
              onClick={() => onReuse(r)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] hover:bg-[#EEE5D6]/40 hover:border-[#C49A43] p-4 cursor-pointer transition-all shadow-2xs hover:shadow-xs group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEE5D6] text-[#C49A43] group-hover:bg-[#C49A43] group-hover:text-white transition-colors">
                  <ShortcutIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-bold text-[#243B4A] truncate">
                    {r.label || `${r.origin_stop_name} → ${r.destination_stop_name}`}
                  </div>
                  <div className="text-[11px] text-[#77766D] truncate">
                    {r.origin_stop_name?.split(' ')[0]} → {r.destination_stop_name?.split(' ')[0]}
                  </div>
                </div>
              </div>

              {!isPreset && (
                <button
                  type="button"
                  disabled={deletingId === r.saved_route_id}
                  onClick={e => handleDelete(r.saved_route_id as number, e)}
                  className="rounded-lg p-1.5 text-[#77766D] hover:text-[#A6533C] hover:bg-[#EEE5D6] transition-colors cursor-pointer shrink-0"
                  title="Delete bookmark"
                  aria-label="Delete saved journey"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
