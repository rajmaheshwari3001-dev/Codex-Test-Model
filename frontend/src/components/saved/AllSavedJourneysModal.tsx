import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { SavedRoute, Stop } from '../../types'
import {
  BookmarkIcon,
  XIcon,
  TrashIcon,
  ArrowRightIcon,
  PlusIcon,
  HomeIcon,
  BriefcaseIcon,
  PlaneIcon,
  CheckIcon,
  ZapIcon,
  TagIcon,
} from '../common/Icons'

interface Props {
  isOpen: boolean
  onClose: () => void
  routes: SavedRoute[]
  stops: Stop[]
  onReuse: (route: SavedRoute) => void
  onDelete: (id: number) => void
  onAddRoute: (route: Omit<SavedRoute, 'saved_route_id'>) => Promise<void>
  onRestoreDefaults: () => void
  hasDeletedPresets: boolean
}

export default function AllSavedJourneysModal({
  isOpen,
  onClose,
  routes,
  stops,
  onReuse,
  onDelete,
  onAddRoute,
  onRestoreDefaults,
  hasDeletedPresets,
}: Props) {
  const [filterQuery, setFilterQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [label, setLabel] = useState('')
  const [originId, setOriginId] = useState(stops[0]?.stop_id || 'S13')
  const [destId, setDestId] = useState(stops[1]?.stop_id || 'S19')
  const [prefTime, setPrefTime] = useState('08:30')
  const [preference, setPreference] = useState('fastest')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const filteredRoutes = routes.filter(r => {
    const q = filterQuery.toLowerCase()
    return (
      (r.label && r.label.toLowerCase().includes(q)) ||
      (r.origin_stop_name && r.origin_stop_name.toLowerCase().includes(q)) ||
      (r.destination_stop_name && r.destination_stop_name.toLowerCase().includes(q))
    )
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!originId || !destId) {
      setError('Please select both origin and destination stops.')
      return
    }
    if (originId === destId) {
      setError('Origin and destination cannot be the same stop.')
      return
    }

    const originName = stops.find(s => s.stop_id === originId)?.stop_name || originId
    const destName = stops.find(s => s.stop_id === destId)?.stop_name || destId
    const finalLabel = label.trim() || `${originName} → ${destName}`

    setSaving(true)
    setError('')
    try {
      await onAddRoute({
        label: finalLabel,
        origin_stop_id: originId,
        origin_stop_name: originName,
        destination_stop_id: destId,
        destination_stop_name: destName,
        preferred_departure_time: prefTime,
        preference: preference,
        service_day: 'weekday',
      })
      setToast(`Shortcut "${finalLabel}" saved successfully!`)
      setLabel('')
      setShowAddForm(false)
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save shortcut.')
    } finally {
      setSaving(false)
    }
  }

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="all-saved-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#1A2E3B]/70 p-3 sm:p-4 backdrop-blur-sm pointer-events-auto overflow-y-auto animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#EBE5DC] bg-white shadow-2xl p-6 sm:p-7 text-[#1A202C] animate-fade-in pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EBE5DC] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FAF0D9] text-[#C49A43] shadow-2xs">
                <BookmarkIcon className="w-4 h-4" />
              </span>
              <span className="text-xs sm:text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#C49A43]">
                SHORTCUT REPOSITORY
              </span>
            </div>
            <h2 id="all-saved-title" className="font-serif text-2xl sm:text-3xl font-normal text-[#1A2E3B] leading-tight">
              All Saved Journeys
            </h2>
            <p className="text-xs sm:text-sm text-[#7A7269]">
              1-tap access to your daily commute routes, corridor preferences, and custom shortcuts.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] text-[#7A7269] hover:text-[#1A2E3B] hover:bg-[#F2ECE1] transition-colors cursor-pointer"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#EAF5EC] border border-[#D1E7D5] p-3 text-xs font-bold text-[#2E7D32] animate-fade-in">
            <CheckIcon className="w-4 h-4 text-[#2E7D32]" />
            <span>{toast}</span>
          </div>
        )}

        {/* Toolbar: Search & Add Button */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter shortcuts by name or station..."
              className="w-full text-xs sm:text-sm rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] px-3.5 py-2.5 text-[#1A202C] placeholder-[#7A7269] focus:outline-none focus:border-[#C49A43] transition-colors"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-xs text-[#7A7269] hover:text-[#1A2E3B] cursor-pointer"
                aria-label="Clear filter"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(prev => !prev)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#C49A43] hover:bg-[#A77B32] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'New Shortcut'}</span>
          </button>
        </div>

        {/* Add Shortcut Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="mt-4 rounded-2xl border border-[#EBE5DC] bg-[#FAF7F2] p-4 sm:p-5 space-y-3.5 animate-fade-in"
          >
            <div className="text-xs sm:text-sm font-bold text-[#1A2E3B] flex items-center justify-between">
              <span>Create New Commute Shortcut</span>
              <span className="text-[11px] font-normal text-[#7A7269]">Saves to your local profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#7A7269] mb-1">Shortcut Name</label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Morning College, Daily Office"
                  className="w-full text-xs sm:text-sm rounded-xl border border-[#EBE5DC] bg-white px-3 py-2 text-[#1A202C] focus:outline-none focus:border-[#C49A43]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A7269] mb-1">Preferred Time</label>
                <input
                  type="text"
                  value={prefTime}
                  onChange={e => setPrefTime(e.target.value)}
                  placeholder="08:30"
                  className="w-full text-xs sm:text-sm rounded-xl border border-[#EBE5DC] bg-white px-3 py-2 font-mono text-[#1A202C] focus:outline-none focus:border-[#C49A43]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#7A7269] mb-1">Origin Station</label>
                <select
                  value={originId}
                  onChange={e => setOriginId(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-[#EBE5DC] bg-white px-3 py-2 text-[#1A202C] focus:outline-none focus:border-[#C49A43] cursor-pointer"
                >
                  {stops.map(s => (
                    <option key={s.stop_id} value={s.stop_id}>
                      {s.stop_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7A7269] mb-1">Destination Station</label>
                <select
                  value={destId}
                  onChange={e => setDestId(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-[#EBE5DC] bg-white px-3 py-2 text-[#1A202C] focus:outline-none focus:border-[#C49A43] cursor-pointer"
                >
                  {stops.map(s => (
                    <option key={s.stop_id} value={s.stop_id}>
                      {s.stop_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreference('fastest')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    preference === 'fastest'
                      ? 'bg-[#166534] text-white shadow-2xs'
                      : 'bg-white text-[#7A7269] border border-[#EBE5DC]'
                  }`}
                >
                  <ZapIcon className="w-3 h-3" />
                  <span>Fastest</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreference('cheapest')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    preference === 'cheapest'
                      ? 'bg-[#166534] text-white shadow-2xs'
                      : 'bg-white text-[#7A7269] border border-[#EBE5DC]'
                  }`}
                >
                  <TagIcon className="w-3 h-3" />
                  <span>Cheapest</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl bg-[#1A2E3B] hover:bg-[#253D4E] text-white px-4 py-2 text-xs font-bold shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Shortcut'}
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-[#F8B4B4] bg-[#FDE8E8] p-2.5 text-xs text-[#9B1C1C]">
                {error}
              </div>
            )}
          </form>
        )}

        {/* List of Saved Routes */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {filteredRoutes.length === 0 ? (
            <div className="py-12 text-center text-xs sm:text-sm text-[#7A7269]">
              No saved shortcuts found matching "{filterQuery}".
            </div>
          ) : (
            filteredRoutes.map((r, i) => {
              const isPreset = r.saved_route_id && r.saved_route_id < 0
              const ShortcutIcon = i % 3 === 0 ? HomeIcon : i % 3 === 1 ? BriefcaseIcon : PlaneIcon
              const iconBg =
                i % 3 === 2
                  ? 'bg-[#E8EDF1] text-[#1A2E3B]'
                  : 'bg-[#FAF0D9] text-[#A67C1E]'

              return (
                <div
                  key={r.saved_route_id ?? i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#EBE5DC] bg-white hover:bg-[#FAF7F2] p-4 transition-all shadow-2xs hover:shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} shadow-2xs`}>
                      <ShortcutIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-[#1A2E3B] truncate">
                          {r.label || `${r.origin_stop_name} → ${r.destination_stop_name}`}
                        </span>
                        {isPreset && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.2 rounded-full bg-[#E8EDF1] text-[#1A2E3B]">
                            Preset
                          </span>
                        )}
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-[#FAF7F2] border border-[#EBE5DC] text-[#7A7269]">
                          {r.preferred_departure_time || '08:00'}
                        </span>
                      </div>
                      <div className="text-xs sm:text-[13px] text-[#7A7269] truncate">
                        {r.origin_stop_name} → {r.destination_stop_name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        onReuse(r)
                        onClose()
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-[#FAF0D9] hover:bg-[#C49A43] hover:text-white text-[#9A721C] border border-[#F3E2BD] px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                    >
                      <span>Plan Route</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(r.saved_route_id as number)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EBE5DC] bg-white hover:bg-[#FDE8E8] text-[#7A7269] hover:text-[#9B1C1C] hover:border-[#F8B4B4] transition-colors cursor-pointer shadow-2xs active:scale-95"
                      title="Delete this shortcut"
                      aria-label={`Delete ${r.label}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer with Reset Defaults */}
        <div className="mt-4 pt-3 border-t border-[#EBE5DC] flex items-center justify-between text-xs text-[#7A7269]">
          <span>{routes.length} shortcuts registered</span>
          {hasDeletedPresets && (
            <button
              type="button"
              onClick={onRestoreDefaults}
              className="text-xs font-bold text-[#C49A43] hover:underline cursor-pointer"
            >
              ↺ Restore default shortcuts
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent
}

