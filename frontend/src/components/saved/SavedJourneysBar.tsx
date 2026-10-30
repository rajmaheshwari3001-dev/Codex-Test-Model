import { useState, useEffect } from 'react'
import type { SavedRoute, Stop } from '../../types'
import { formatTime12 } from '../../utils/time'
import { getSavedRoutes, deleteSavedRoute, createSavedRoute } from '../../services/api'
import AllSavedJourneysModal from './AllSavedJourneysModal'
import {
  BookmarkIcon,
  ArrowRightIcon,
  TrashIcon,
  HomeIcon,
  BriefcaseIcon,
  PlaneIcon,
  CheckIcon,
} from '../common/Icons'

interface Props {
  onReuse: (route: SavedRoute) => void
  refreshTrigger: number
  stops?: Stop[]
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

export default function SavedJourneysBar({ onReuse, refreshTrigger, stops = [] }: Props) {
  const [routes, setRoutes] = useState<SavedRoute[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showAllModal, setShowAllModal] = useState(false)
  const [deleteToast, setDeleteToast] = useState('')

  const [deletedPresetIds, setDeletedPresetIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('aaroh_deleted_presets')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

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

  async function handleDelete(id: number, e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    setDeletingId(id)

    if (id < 0) {
      // It's a preset shortcut
      const updated = [...deletedPresetIds, id]
      setDeletedPresetIds(updated)
      try {
        localStorage.setItem('aaroh_deleted_presets', JSON.stringify(updated))
      } catch {}
      setDeleteToast('Shortcut removed')
      setTimeout(() => setDeleteToast(''), 3000)
      setDeletingId(null)
      return
    }

    try {
      await deleteSavedRoute(id)
      setRoutes(prev => prev.filter(r => r.saved_route_id !== id))
      setDeleteToast('Shortcut removed')
      setTimeout(() => setDeleteToast(''), 3000)
    } catch {
      setDeleteToast('Could not delete shortcut')
      setTimeout(() => setDeleteToast(''), 3000)
    } finally {
      setDeletingId(null)
    }
  }

  function handleRestoreDefaults() {
    setDeletedPresetIds([])
    try {
      localStorage.removeItem('aaroh_deleted_presets')
    } catch {}
    setDeleteToast('Default shortcuts restored')
    setTimeout(() => setDeleteToast(''), 3000)
  }

  async function handleAddRoute(newRoute: Omit<SavedRoute, 'saved_route_id'>) {
    const created = await createSavedRoute(newRoute)
    setRoutes(prev => [created, ...prev])
  }

  // Combine active non-deleted default shortcuts with user saved routes
  const activePresets = FIGMA_SHORTCUTS.filter(
    p => !deletedPresetIds.includes(p.saved_route_id as number)
  )
  const displayRoutes = [...activePresets, ...routes]

  return (
    <section
      aria-labelledby="saved-journeys-title"
      className="relative rounded-2xl border border-[#EBE5DC] bg-white p-5 sm:p-6 shadow-xs space-y-4 animate-fade-in"
    >
      {/* Toast Feedback */}
      {deleteToast && (
        <aside
          role="status"
          aria-live="polite"
          className="absolute -top-12 right-4 z-50 flex items-center gap-2 rounded-xl border border-[#D1E7D5] bg-[#EAF5EC] px-3.5 py-1.5 text-xs font-bold text-[#2E7D32] shadow-md animate-fade-in"
        >
          <CheckIcon className="w-3.5 h-3.5 text-[#2E7D32]" />
          <span>{deleteToast}</span>
        </aside>
      )}

      {/* Header Matching Figma */}
      <header className="flex items-center justify-between border-b border-[#EBE5DC] pb-3">
        <div className="space-y-0.5 sm:space-y-1">
          <div className="text-xs sm:text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#C49A43] select-none">
            YOUR SHORTCUTS
          </div>
          <h3 id="saved-journeys-title" className="font-serif text-xl sm:text-2xl lg:text-[26px] font-normal tracking-tight text-[#1A2E3B] leading-tight">
            Saved journeys
          </h3>
          <p className="text-xs sm:text-sm font-normal text-[#7A7269] leading-relaxed">
            1-tap routes with live data and alerts
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAllModal(true)}
          className="text-xs sm:text-sm font-bold text-[#C49A43] hover:text-[#A77B32] transition-colors flex items-center gap-1.5 cursor-pointer group px-2 py-1 rounded-lg hover:bg-[#FAF7F2]"
          aria-label="View all saved journeys and manage shortcuts"
        >
          <span>View all ({displayRoutes.length})</span>
          <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
        </button>
      </header>

      {/* Cards Row Matching Figma */}
      {displayRoutes.length === 0 ? (
        <div className="py-8 text-center text-xs sm:text-sm text-[#7A7269] space-y-2">
          <p>No saved shortcuts currently active.</p>
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="text-xs font-bold text-[#C49A43] hover:underline cursor-pointer"
          >
            ↺ Restore default shortcuts
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" role="list">
          {displayRoutes.map((r, i) => {
            const isPreset = r.saved_route_id && r.saved_route_id < 0
            const ShortcutIcon = i === 0 ? HomeIcon : i === 1 ? BriefcaseIcon : PlaneIcon
            const iconBg = i === 2 ? 'bg-[#E8EDF1] text-[#1A2E3B]' : 'bg-[#FAF0D9] text-[#A67C1E]'
            return (
              <div
                key={r.saved_route_id ?? i}
                role="listitem"
                onClick={() => onReuse(r)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#EBE5DC] bg-white hover:bg-[#FFFCF8] hover:border-[#C49A43]/60 hover:shadow-md p-4 cursor-pointer transition-all duration-200 shadow-2xs group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} transition-colors shadow-2xs`}>
                    <ShortcutIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-[#1A2E3B] group-hover:text-[#C49A43] transition-colors truncate">
                      {r.label || `${r.origin_stop_name} → ${r.destination_stop_name}`}
                    </div>
                    <div className="text-xs sm:text-[13px] font-normal text-[#7A7269] truncate">
                      {r.origin_stop_name} → {r.destination_stop_name}
                    </div>
                  </div>
                </div>

                {/* Always-visible, distinct delete button */}
                <button
                  type="button"
                  disabled={deletingId === r.saved_route_id}
                  onClick={e => handleDelete(r.saved_route_id as number, e)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent hover:border-[#F8B4B4] bg-[#FAF7F2] hover:bg-[#FDE8E8] text-[#7A7269] hover:text-[#9B1C1C] transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs"
                  title="Delete shortcut"
                  aria-label={`Delete ${r.label}`}
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* All Saved Journeys Full Management Modal */}
      <AllSavedJourneysModal
        isOpen={showAllModal}
        onClose={() => setShowAllModal(false)}
        routes={displayRoutes}
        stops={stops}
        onReuse={onReuse}
        onDelete={handleDelete}
        onAddRoute={handleAddRoute}
        onRestoreDefaults={handleRestoreDefaults}
        hasDeletedPresets={deletedPresetIds.length > 0}
      />
    </section>
  )
}

