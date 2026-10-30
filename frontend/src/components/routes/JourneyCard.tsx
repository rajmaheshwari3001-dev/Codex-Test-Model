import { useState } from 'react'
import type { JourneyOption } from '../../types'
import { formatTime12 } from '../../utils/time'
import { getStationMeta } from '../../utils/transitData'
import {
  ZapIcon,
  TagIcon,
  TrainIcon,
  BusIcon,
  AutoRickshawIcon,
  ArrowRightIcon,
  ArrowUpDownIcon,
  RotateCcwIcon,
  BookmarkIcon,
  CopyIcon,
  CheckIcon,
} from '../common/Icons'

interface Props {
  option: JourneyOption
  selected: boolean
  onSelect: () => void
  onSave: () => void
  isSaved: boolean
  type?: 'fastest' | 'cheapest' | 'recommended'
  onOpenCashbackModal?: () => void
}

export default function JourneyCard({
  option,
  selected,
  onSelect,
  onSave,
  isSaved,
  type,
  onOpenCashbackModal,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [expandedLegs, setExpandedLegs] = useState<Record<number, boolean>>({})

  const isFastest = type === 'fastest' || option.label.toLowerCase() === 'fastest'
  const isCheapest = type === 'cheapest' || option.label.toLowerCase() === 'cheapest'

  const toggleLeg = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedLegs(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const handleCopyItinerary = (e: React.MouseEvent) => {
    e.stopPropagation()
    const legsText = option.legs
      .map(
        (l, i) =>
          `Leg ${i + 1}: ${l.route_name} (${l.board_stop_name} -> ${l.alight_stop_name}, dep ${formatTime12(
            l.departure_time
          )})`
      )
      .join('\n')
    const summary = `AAROH-SAARTHI Delhi Transit Itinerary:
Option: ${option.label} (${option.total_duration_minutes} min, ₹${option.total_fare ?? 'N/A'})
${legsText}`

    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate Smart Card 10% discount if metro leg present
  const hasMetroLeg = option.legs.some(
    l =>
      l.route_type === 'metro' ||
      l.route_name.toLowerCase().includes('line') ||
      l.route_name.toLowerCase().includes('metro')
  )
  const smartCardFare =
    hasMetroLeg && option.total_fare !== null ? Math.round(option.total_fare * 0.9) : null

  return (
    <article
      onClick={onSelect}
      role="region"
      aria-label={`${option.label} Route: ${option.total_duration_minutes} minutes, ₹${
        option.total_fare ?? 'N/A'
      }`}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer bg-[#FFFCF5] ${
        selected
          ? 'border-[#C49A43] ring-2 ring-[#C49A43]/20 shadow-md'
          : 'border-[#D8C8AA] hover:border-[#C49A43]/60 hover:shadow-xs'
      }`}
    >
      {/* Visual Accent Bar */}
      <div
        className={`h-1.5 w-full ${
          isFastest
            ? 'bg-[#C49A43]'
            : isCheapest
            ? 'bg-[#547A60]'
            : selected
            ? 'bg-[#243B4A]'
            : 'bg-[#D8C8AA]/50 group-hover:bg-[#C49A43]/50'
        }`}
      />

      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Card Header with Badges Matching Figma */}
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8C8AA]/70 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                isFastest
                  ? 'bg-[#C49A43] text-white shadow-2xs'
                  : isCheapest
                  ? 'bg-[#EEE5D6] text-[#243B4A] border border-[#D8C8AA]'
                  : 'bg-[#EEE5D6] text-[#243B4A] border border-[#D8C8AA]'
              }`}
            >
              {isFastest ? (
                <>
                  <ZapIcon className="w-3 h-3 text-white" />
                  <span>FASTEST</span>
                </>
              ) : isCheapest ? (
                <>
                  <TagIcon className="w-3 h-3 text-[#547A60]" />
                  <span>LOWEST COST</span>
                </>
              ) : (
                <span>{option.label.toUpperCase()}</span>
              )}
            </span>

            {isFastest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#547A60]/15 border border-[#547A60]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#547A60]">
                RECOMMENDED
              </span>
            )}

            {isCheapest && !isFastest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#547A60]/15 border border-[#547A60]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#547A60]">
                SAVE ₹10-₹30
              </span>
            )}
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#77766D]">
              EST. FARE
            </div>
            <div className="text-xl font-black text-[#243B4A]">
              {option.fare_available && option.total_fare !== null ? `₹${option.total_fare}` : 'N/A'}
            </div>
          </div>
        </header>

        {/* Big Duration & Arrival Stat Bar Matching Figma */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-[#243B4A]">
              {option.total_duration_minutes}
            </span>
            <span className="text-sm font-bold text-[#77766D]">min</span>
          </div>

          <div className="text-xs font-semibold text-[#77766D]">
            Arrive <span className="font-mono font-bold text-[#243B4A]">{formatTime12(option.arrival_time)}</span>
          </div>
        </div>

        {/* Legs Breakdown */}
        <div className="space-y-2 pt-0.5">
          {option.legs.map((leg, idx) => {
            const transfer = option.transfers[idx]
            const isExpanded = expandedLegs[idx] || false
            const boardMeta = getStationMeta(leg.board_stop_id)
            const alightMeta = getStationMeta(leg.alight_stop_id)
            const isAutoLeg = leg.route_type === 'auto' || leg.route_id === 'POOCHHO_AUTO'
            const isMetroLeg =
              !isAutoLeg &&
              (leg.route_name.toLowerCase().includes('line') ||
                leg.route_name.toLowerCase().includes('metro') ||
                leg.route_id.startsWith('M') ||
                leg.route_type === 'metro')

            return (
              <div key={`${leg.trip_id}-${idx}`} className="space-y-2">
                <div className="rounded-xl border border-[#D8C8AA] bg-[#FFFCF5] p-3 text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar Mode Circle matching Figma (M for Metro, B for Bus) */}
                      <span
                        className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0 shadow-2xs ${
                          isMetroLeg ? 'bg-[#C49A43]' : isAutoLeg ? 'bg-[#547A60]' : 'bg-[#243B4A]'
                        }`}
                        aria-hidden="true"
                      >
                        {isMetroLeg ? 'M' : isAutoLeg ? 'A' : 'B'}
                      </span>
                      <div>
                        <div className="font-bold text-[#243B4A] flex items-center gap-1.5">
                          <span>{leg.route_name}</span>
                          <span className="text-[10px] font-medium text-[#77766D]">
                            • {isAutoLeg ? 'Auto' : isMetroLeg ? 'Metro' : 'Bus'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#77766D]">
                          {leg.board_stop_name.split(' ')[0]} → {leg.alight_stop_name.split(' ')[0]}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      {leg.fare !== null && leg.fare !== undefined && (
                        <span className="font-mono font-bold text-[#243B4A]">
                          ₹{leg.fare}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stop Points */}
                  <div className="pl-3.5 space-y-1.5 border-l-2 border-[#D8C8AA] ml-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium text-[#29343A]">
                        <span>{leg.board_stop_name}</span>
                        {boardMeta.badgeText && (
                          <span className="text-[9px] font-semibold text-[#243B4A] bg-[#EEE5D6] px-1.5 py-0.2 rounded border border-[#D8C8AA]">
                            {boardMeta.badgeText}
                          </span>
                        )}
                      </div>
                      <time className="font-mono text-[#77766D] text-[11px]">
                        {formatTime12(leg.departure_time)}
                      </time>
                    </div>

                    {/* Intermediate stops toggle */}
                    {leg.intermediate_stops && leg.intermediate_stops.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={e => toggleLeg(idx, e)}
                          aria-expanded={isExpanded}
                          className="text-[10px] font-semibold text-[#C49A43] hover:text-[#A77B32] cursor-pointer"
                        >
                          {isExpanded ? 'Hide' : 'Show'} {leg.intermediate_stops.length} stops
                        </button>
                        {isExpanded && (
                          <div className="mt-1 pl-2.5 space-y-1 border-l border-dashed border-[#D8C8AA] text-[11px] text-[#77766D] animate-fade-in">
                            {leg.intermediate_stops.map((stopName, sIdx) => (
                              <div key={`${stopName}-${sIdx}`} className="flex items-center gap-1.5">
                                <span className="h-1 w-1 rounded-full bg-[#D8C8AA]" />
                                <span>{stopName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium text-[#29343A]">
                        <span>{leg.alight_stop_name}</span>
                        {alightMeta.badgeText && (
                          <span className="text-[9px] font-semibold text-[#A6533C] bg-[#FFFCF5] px-1.5 py-0.2 rounded border border-[#A6533C]/40">
                            {alightMeta.badgeText}
                          </span>
                        )}
                      </div>
                      <time className="font-mono text-[#77766D] text-[11px]">
                        {formatTime12(leg.arrival_time)}
                      </time>
                    </div>
                  </div>
                </div>

                {/* Multimodal or Standard Transfer Node */}
                {transfer && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]/70 px-3 py-2 text-xs text-[#243B4A]">
                    <RotateCcwIcon className="w-3.5 h-3.5 text-[#C49A43] shrink-0" />
                    <span className="text-[11px] font-medium">
                      {transfer.transfer_description ? (
                        transfer.transfer_description
                      ) : (
                        <>
                          Interchange at <strong>{transfer.at_stop_name}</strong> •{' '}
                          <strong>{transfer.wait_minutes} min connection</strong>
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Metrics Strip matching Figma: transfers • distance • calories */}
        <div className="flex items-center justify-between text-[11px] font-medium text-[#77766D] pt-1">
          <span>
            {option.transfers.length === 0 ? '0 transfers' : `${option.transfers.length} ${option.transfers.length === 1 ? 'transfer' : 'transfers'}`} • {option.total_distance_km ? `${option.total_distance_km} km` : '18.1 km'} • {Math.round((option.total_duration_minutes || 45) * 3.2)} kcal
          </span>
          <span className="font-bold text-[#C49A43] group-hover:underline text-[11px] flex items-center gap-0.5">
            <span>View details</span>
            <span>→</span>
          </span>
        </div>

        {/* Action Controls & Cashback CTA */}
        <footer className="flex items-center justify-between border-t border-[#D8C8AA]/70 pt-3 text-xs gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onSave()
              }}
              aria-label={isSaved ? 'Route bookmarked' : 'Bookmark route'}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isSaved
                  ? 'border-[#547A60] bg-[#547A60]/10 text-[#547A60]'
                  : 'border-[#D8C8AA] bg-[#FFFCF5] text-[#29343A] hover:bg-[#EEE5D6]'
              }`}
            >
              <BookmarkIcon className={`w-3.5 h-3.5 ${isSaved ? 'text-[#547A60] fill-[#547A60]' : 'text-[#77766D]'}`} />
              <span>{isSaved ? 'Saved' : 'Save Route'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyItinerary}
              aria-label="Copy journey itinerary to clipboard"
              className="flex items-center gap-1.5 rounded-xl border border-[#D8C8AA] bg-[#FFFCF5] px-3 py-1.5 text-xs font-semibold text-[#77766D] hover:bg-[#EEE5D6] hover:text-[#243B4A] transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-[#547A60]" />
                  <span className="text-[#547A60]">Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3.5 h-3.5 text-[#77766D]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onSelect()
            }}
            aria-label={selected ? 'Active on map' : 'View on map'}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              selected
                ? 'bg-[#243B4A] text-white shadow-xs'
                : 'border border-[#243B4A] bg-[#FFFCF5] text-[#243B4A] hover:bg-[#EEE5D6]'
            }`}
          >
            {selected ? 'Active on Map' : 'View on Map'}
          </button>
        </footer>
      </div>
    </article>
  )
}
