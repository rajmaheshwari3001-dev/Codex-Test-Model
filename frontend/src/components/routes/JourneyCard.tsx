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
        {/* Card Header */}
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8C8AA]/70 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                isFastest
                  ? 'bg-[#C49A43]/15 text-[#C49A43] border border-[#C49A43]/30'
                  : isCheapest
                  ? 'bg-[#547A60]/15 text-[#547A60] border border-[#547A60]/30'
                  : 'bg-[#EEE5D6] text-[#243B4A] border border-[#D8C8AA]'
              }`}
            >
              {isFastest ? (
                <>
                  <ZapIcon className="w-3.5 h-3.5 text-[#C49A43]" />
                  <span>FASTEST</span>
                </>
              ) : isCheapest ? (
                <>
                  <TagIcon className="w-3.5 h-3.5 text-[#547A60]" />
                  <span>LOWEST FARE</span>
                </>
              ) : (
                <span>{option.label.toUpperCase()}</span>
              )}
            </span>

            <span className="inline-flex items-center gap-1 rounded-lg border border-[#D8C8AA] bg-[#EEE5D6] px-2 py-0.5 text-[11px] font-semibold text-[#243B4A]">
              {option.primary_mode === 'metro' ? (
                <>
                  <TrainIcon className="w-3.5 h-3.5 text-[#C49A43]" />
                  <span>Metro Rail</span>
                </>
              ) : option.primary_mode === 'multimodal' ? (
                <>
                  <ArrowUpDownIcon className="w-3.5 h-3.5 text-[#243B4A]" />
                  <span>Bus + Metro</span>
                </>
              ) : option.primary_mode === 'auto' ? (
                <>
                  <AutoRickshawIcon className="w-3.5 h-3.5 text-[#547A60]" />
                  <span>Poochh-O Auto</span>
                </>
              ) : (
                <>
                  <BusIcon className="w-3.5 h-3.5 text-[#243B4A]" />
                  <span>Bus Transit</span>
                </>
              )}
            </span>

            {option.transfers.length === 0 ? (
              <span className="rounded-lg border border-[#547A60]/30 bg-[#547A60]/10 px-2 py-0.5 text-[11px] font-bold text-[#547A60]">
                Direct
              </span>
            ) : (
              <span className="rounded-lg border border-[#C49A43]/30 bg-[#C49A43]/10 px-2 py-0.5 text-[11px] font-bold text-[#243B4A]">
                {option.transfers.length} {option.transfers.length === 1 ? 'Transfer' : 'Transfers'}
              </span>
            )}
          </div>

          {/* Fare & Duration Telemetry */}
          <div className="flex items-center gap-3">
            {option.fare_available && option.total_fare !== null ? (
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1.5">
                  <span className="text-base font-extrabold text-[#243B4A]">
                    ₹{option.total_fare}
                  </span>
                  {smartCardFare !== null && smartCardFare < option.total_fare && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        onOpenCashbackModal?.()
                      }}
                      className="text-[10px] font-bold text-[#547A60] bg-[#EEE5D6] border border-[#547A60]/30 px-1.5 py-0.5 rounded hover:bg-[#F4EBDD] cursor-pointer"
                      title="Metro Smart Card gives 10%-20% cashback on this fare"
                    >
                      ₹{smartCardFare} Card
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-[#77766D] font-bold uppercase tracking-wider">
                  Total Fare
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-xs font-bold text-[#77766D]">N/A</div>
                <div className="text-[10px] text-[#77766D]/70">Fare missing</div>
              </div>
            )}

            <div className="rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]/50 px-3 py-1 text-center min-w-[54px]">
              <div className="text-base font-black text-[#243B4A] leading-tight">
                {option.total_duration_minutes}
                <span className="text-[10px] font-medium text-[#77766D] ml-0.5">min</span>
              </div>
              <div className="text-[9px] text-[#77766D] uppercase font-bold tracking-wider">
                Travel Time
              </div>
            </div>
          </div>
        </header>

        {/* Departure & Arrival Time Overview */}
        <div className="flex items-center justify-between text-xs font-semibold text-[#29343A] bg-[#EEE5D6]/40 p-2.5 rounded-xl border border-[#D8C8AA]/70">
          <div className="flex items-center gap-1.5">
            <span className="text-[#77766D] text-[11px]">Depart:</span>
            <time className="font-mono font-bold text-[#243B4A]">{formatTime12(option.departure_time)}</time>
          </div>
          <ArrowRightIcon className="w-3.5 h-3.5 text-[#D8C8AA]" />
          <div className="flex items-center gap-1.5">
            <span className="text-[#77766D] text-[11px]">Arrive:</span>
            <time className="font-mono font-bold text-[#243B4A]">{formatTime12(option.arrival_time)}</time>
          </div>
          {option.total_distance_km && (
            <span className="text-[11px] font-mono text-[#77766D]">
              {option.total_distance_km} km
            </span>
          )}
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
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full inline-block shrink-0 shadow-xs"
                        style={{ backgroundColor: isMetroLeg ? '#C49A43' : (leg.route_color || '#243B4A') }}
                        aria-hidden="true"
                      />
                      <span className="font-bold text-[#243B4A]">
                        {leg.route_name}
                      </span>
                      <span className="rounded-md bg-[#EEE5D6] border border-[#D8C8AA] px-1.5 py-0.5 text-[10px] font-semibold text-[#243B4A]">
                        {isAutoLeg ? 'Auto Feeder' : isMetroLeg ? 'Metro Rail' : 'DTC Bus'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      {leg.distance_km !== null && leg.distance_km !== undefined && (
                        <span className="text-[#77766D] font-mono">
                          {leg.distance_km} km
                        </span>
                      )}
                      {leg.fare !== null && leg.fare !== undefined && (
                        <span className="font-mono font-bold text-[#243B4A]">
                          ₹{leg.fare}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stop Points */}
                  <div className="pl-3.5 space-y-1.5 border-l-2 border-[#D8C8AA] ml-1 text-xs">
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
