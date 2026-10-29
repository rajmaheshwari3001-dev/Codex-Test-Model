import { useState } from 'react'
import type { JourneyOption } from '../types'
import { formatTime12 } from '../utils/time'
import { getStationMeta } from '../utils/transitData'

interface Props {
  option: JourneyOption
  selected: boolean
  onSelect: () => void
  onSave: () => void
  isSaved?: boolean
}

export default function RouteResultCard({ option, selected, onSelect, onSave, isSaved }: Props) {
  const [expandedLegs, setExpandedLegs] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState(false)

  function toggleLeg(idx: number, e: React.MouseEvent) {
    e.stopPropagation()
    setExpandedLegs(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  function handleCopyItinerary(e: React.MouseEvent) {
    e.stopPropagation()
    const summaryLines = [
      `Aaroh-Saarthi Journey Summary`,
      `• Preference: ${option.label} (${option.total_duration_minutes} min, ₹${option.total_fare ?? 'N/A'})`,
      `• Departure: ${formatTime12(option.departure_time)} | Arrival: ${formatTime12(option.arrival_time)}`,
      `• Transfers: ${option.transfers.length === 0 ? 'Direct route' : `${option.transfers.length} transfer(s)`}`,
      ``,
      ...option.legs.map((leg, i) => {
        const transfer = option.transfers[i]
        const legText = [
          `Leg ${i + 1}: ${leg.route_name} (Trip ${leg.trip_id})`,
          `  • Board: ${leg.board_stop_name} at ${formatTime12(leg.departure_time)} (Fare: ₹${leg.fare ?? 'N/A'})`,
          `  • Alight: ${leg.alight_stop_name} at ${formatTime12(leg.arrival_time)}`,
        ]
        if (transfer) {
          legText.push(`  ↳ Transfer: ${transfer.wait_minutes} min wait at ${transfer.at_stop_name}`)
        }
        return legText.join('\n')
      }),
    ]

    navigator.clipboard
      .writeText(summaryLines.join('\n'))
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
      .catch(() => setCopied(false))
  }

  const isFastest = option.label.toLowerCase() === 'fastest'
  const isCheapest = option.label.toLowerCase() === 'cheapest'
  const primaryRouteColor = option.legs[0]?.route_color || '#173B32'

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={`group relative overflow-hidden rounded-xl border bg-[#FFFFFF] text-left transition-all cursor-pointer ${
        selected
          ? 'border-[#173B32] ring-2 ring-[#173B32]/15 shadow-sm'
          : 'border-[#E8DFCE] hover:border-[#173B32]/40 shadow-xs'
      }`}
    >
      {/* Route Color Accent Strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2"
        style={{ backgroundColor: primaryRouteColor }}
      />

      <div className="pl-5 pr-5 py-4 space-y-3.5">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8DFCE] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                isFastest
                  ? 'bg-[#EBF4F0] text-[#173B32] border border-[#236B56]/30'
                  : isCheapest
                  ? 'bg-[#F4EBD9] text-[#B88A43] border border-[#B88A43]/40'
                  : 'bg-[#FAF7F2] text-[#25312D] border border-[#E8DFCE]'
              }`}
            >
              {isFastest ? '⚡ ' : isCheapest ? '💰 ' : ''}
              {isFastest ? 'Fastest Route' : isCheapest ? 'Lowest Cost' : option.label}
            </span>

            <span className="rounded-md border border-[#E8DFCE] bg-[#FAF7F2] px-2 py-0.5 text-xs font-medium text-[#53645F]">
              Bus Transit
            </span>

            {option.transfers.length === 0 ? (
              <span className="rounded-md border border-[#236B56]/20 bg-[#EBF4F0] px-2 py-0.5 text-xs font-medium text-[#236B56]">
                Direct Service
              </span>
            ) : (
              <span className="rounded-md border border-[#B88A43]/30 bg-[#F4EBD9] px-2 py-0.5 text-xs font-medium text-[#B88A43]">
                {option.transfers.length} {option.transfers.length === 1 ? 'Transfer' : 'Transfers'}
              </span>
            )}
          </div>

          {/* Fare & Duration Telemetry */}
          <div className="flex items-center gap-3">
            {option.fare_available && option.total_fare !== null ? (
              <div className="text-right">
                <div className="text-base font-extrabold text-[#25312D]">
                  ₹{option.total_fare}
                </div>
                <div className="text-[10px] text-[#53645F] font-semibold uppercase">
                  Calculated Fare
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-xs font-bold text-[#53645F]">N/A</div>
                <div className="text-[10px] text-[#53645F]">Fare missing</div>
              </div>
            )}

            <div className="rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] px-3 py-1 text-center">
              <div className="text-base font-black text-[#173B32]">
                {option.total_duration_minutes}
                <span className="text-xs font-medium text-[#53645F] ml-0.5">m</span>
              </div>
              <div className="text-[10px] text-[#53645F] uppercase font-semibold">
                Duration
              </div>
            </div>
          </div>
        </div>

        {/* Departure & Arrival Time Overview */}
        <div className="flex items-center justify-between text-xs font-semibold text-[#25312D] bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E8DFCE]">
          <div className="flex items-center gap-2">
            <span className="text-[#173B32]">Depart:</span>
            <span className="font-mono font-bold">{formatTime12(option.departure_time)}</span>
          </div>
          <span className="text-[#53645F]">➔</span>
          <div className="flex items-center gap-2">
            <span className="text-[#173B32]">Arrive:</span>
            <span className="font-mono font-bold">{formatTime12(option.arrival_time)}</span>
          </div>
        </div>

        {/* Legs Breakdown */}
        <div className="space-y-2 pt-1">
          {option.legs.map((leg, idx) => {
            const transfer = option.transfers[idx]
            const isExpanded = expandedLegs[idx] || false
            const boardMeta = getStationMeta(leg.board_stop_id)
            const alightMeta = getStationMeta(leg.alight_stop_id)

            return (
              <div key={`${leg.trip_id}-${idx}`} className="space-y-2">
                <div className="rounded-lg border border-[#E8DFCE] bg-[#FFFFFF] p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full inline-block"
                        style={{ backgroundColor: leg.route_color || '#173B32' }}
                      />
                      <span className="font-bold text-[#25312D]">
                        Leg {idx + 1}: {leg.route_name}
                      </span>
                      <span className="text-[#53645F] font-mono text-[11px]">
                        (Trip {leg.trip_id})
                      </span>
                    </div>

                    {leg.fare !== null && leg.fare !== undefined && (
                      <span className="font-mono font-bold text-[#25312D]">
                        ₹{leg.fare}
                      </span>
                    )}
                  </div>

                  {/* Stop Points */}
                  <div className="pl-4 space-y-1.5 border-l-2 border-[#E8DFCE] ml-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#25312D]">
                        {boardMeta.icon} {leg.board_stop_name}
                      </span>
                      <span className="font-mono text-[#53645F] text-[11px]">
                        {formatTime12(leg.departure_time)}
                      </span>
                    </div>

                    {/* Intermediate stops toggle */}
                    {leg.intermediate_stops && leg.intermediate_stops.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={e => toggleLeg(idx, e)}
                          className="text-[11px] font-semibold text-[#173B32] hover:underline"
                        >
                          {isExpanded ? 'Hide' : 'Show'} {leg.intermediate_stops.length} intermediate stops
                        </button>
                        {isExpanded && (
                          <div className="mt-1 pl-2 space-y-1 border-l border-dashed border-[#E8DFCE] text-[11px] text-[#53645F]">
                            {leg.intermediate_stops.map((stopName, sIdx) => (
                              <div key={`${stopName}-${sIdx}`} className="py-0.5">
                                • {stopName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#25312D]">
                        {alightMeta.icon} {leg.alight_stop_name}
                      </span>
                      <span className="font-mono text-[#53645F] text-[11px]">
                        {formatTime12(leg.arrival_time)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transfer node if applicable */}
                {transfer && (
                  <div className="flex items-center gap-2 rounded-md border border-[#B88A43]/30 bg-[#F4EBD9]/60 px-3 py-1.5 text-xs text-[#25312D]">
                    <span className="text-sm">🔄</span>
                    <span className="font-medium">
                      Transfer at <strong>{transfer.at_stop_name}</strong> •{' '}
                      <strong>{transfer.wait_minutes} min wait</strong> for connection
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-[#E8DFCE] pt-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onSave()
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold transition-colors ${
                isSaved
                  ? 'border-[#236B56] bg-[#EBF4F0] text-[#236B56]'
                  : 'border-[#E8DFCE] bg-[#FAF7F2] text-[#25312D] hover:bg-[#FFFFFF]'
              }`}
            >
              <span>{isSaved ? '★' : '☆'}</span>
              <span>{isSaved ? 'Bookmarked' : 'Save Route'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyItinerary}
              className="flex items-center gap-1.5 rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] px-3 py-1.5 font-semibold text-[#53645F] hover:bg-[#FFFFFF] hover:text-[#25312D] transition-colors"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onSelect()
            }}
            className={`rounded-lg px-3 py-1.5 font-bold transition-colors ${
              selected
                ? 'bg-[#173B32] text-white'
                : 'border border-[#173B32] text-[#173B32] hover:bg-[#173B32] hover:text-white'
            }`}
          >
            {selected ? 'Active on Map' : 'View on Map'}
          </button>
        </div>
      </div>
    </div>
  )
}
