import { useState } from 'react'
import type { JourneyOption } from '../../types'
import { formatTime12 } from '../../utils/time'
import { getStationMeta } from '../../utils/transitData'

interface Props {
  option: JourneyOption
  selected: boolean
  onSelect: () => void
  onSave: () => void
  isSaved?: boolean
  type?: 'fastest' | 'cheapest' | 'standard'
}

export default function JourneyCard({
  option,
  selected,
  onSelect,
  onSave,
  isSaved,
  type = 'standard',
}: Props) {
  const [expandedLegs, setExpandedLegs] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState(false)

  function toggleLeg(idx: number, e: React.MouseEvent) {
    e.stopPropagation()
    setExpandedLegs(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  function handleCopyItinerary(e: React.MouseEvent) {
    e.stopPropagation()
    const summaryLines = [
      `Aaroh-Saarthi Delhi Transit Itinerary`,
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

  const isFastest = type === 'fastest' || option.label.toLowerCase() === 'fastest'
  const isCheapest = type === 'cheapest' || option.label.toLowerCase() === 'cheapest'
  const primaryRouteColor = isFastest ? '#C49A43' : isCheapest ? '#547A60' : '#172D3B'

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
      className={`group relative overflow-hidden rounded-xl border bg-[#FBF8F1] text-left transition-all cursor-pointer ${
        selected
          ? 'border-[#C49A43] ring-2 ring-[#C49A43]/20 shadow-sm'
          : 'border-[#DAD3C6] hover:border-[#172D3B]/40 shadow-2xs'
      }`}
    >
      {/* Route Color Accent Strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2"
        style={{ backgroundColor: primaryRouteColor }}
      />

      <div className="pl-4 pr-4 py-3.5 space-y-3">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DAD3C6] pb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                isFastest
                  ? 'bg-[#C49A43] text-white'
                  : isCheapest
                  ? 'bg-[#547A60] text-white'
                  : 'bg-[#EDE7DB] text-[#29343A]'
              }`}
            >
              {isFastest ? '⚡ FASTEST ROUTE' : isCheapest ? '💰 LOWEST COST' : option.label}
            </span>

            <span
              className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
                option.primary_mode === 'metro'
                  ? 'border-[#C49A43]/30 bg-[#F5F0E6] text-[#A97C2E]'
                  : option.primary_mode === 'multimodal'
                  ? 'border-[#7C3AED]/30 bg-[#F5F3FF] text-[#6D28D9]'
                  : option.primary_mode === 'auto'
                  ? 'border-[#C49A43]/40 bg-[#FBF8F1] text-[#C49A43]'
                  : 'border-[#DAD3C6] bg-[#EDE7DB] text-[#29343A]'
              }`}
            >
              {option.primary_mode === 'metro'
                ? '🚇 Metro Rail'
                : option.primary_mode === 'multimodal'
                ? '🔄 Bus + Metro'
                : option.primary_mode === 'auto'
                ? '🛺 PoochhO Auto'
                : '🚍 Bus Transit'}
            </span>

            {option.transfers.length === 0 ? (
              <span className="rounded-md border border-[#547A60]/30 bg-[#EBF4F0] px-1.5 py-0.5 text-[11px] font-medium text-[#547A60]">
                Direct
              </span>
            ) : (
              <span className="rounded-md border border-[#C49A43]/30 bg-[#F5F0E6] px-1.5 py-0.5 text-[11px] font-medium text-[#A97C2E]">
                {option.transfers.length} {option.transfers.length === 1 ? 'Transfer' : 'Transfers'}
              </span>
            )}
          </div>

          {/* Fare & Duration Telemetry */}
          <div className="flex items-center gap-3">
            {option.fare_available && option.total_fare !== null ? (
              <div className="text-right">
                <div className="text-sm font-extrabold text-[#172D3B]">
                  ₹{option.total_fare}
                </div>
                <div className="text-[9px] text-[#73766F] font-bold uppercase tracking-wider">
                  Total Fare
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-xs font-bold text-[#73766F]">N/A</div>
                <div className="text-[9px] text-[#73766F]">Fare missing</div>
              </div>
            )}

            <div className="rounded-lg border border-[#DAD3C6] bg-[#FFFFFF] px-2.5 py-0.5 text-center">
              <div className="text-sm font-black text-[#172D3B]">
                {option.total_duration_minutes}
                <span className="text-[10px] font-medium text-[#73766F] ml-0.5">m</span>
              </div>
              <div className="text-[9px] text-[#73766F] uppercase font-bold tracking-wider">
                Duration
              </div>
            </div>
          </div>
        </div>

        {/* Departure & Arrival Time Overview */}
        <div className="flex items-center justify-between text-xs font-semibold text-[#29343A] bg-[#FFFFFF] p-2 rounded-lg border border-[#DAD3C6]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#73766F] text-[11px]">Depart:</span>
            <span className="font-mono font-bold text-[#172D3B]">{formatTime12(option.departure_time)}</span>
          </div>
          <span className="text-[#C49A43]">➔</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[#73766F] text-[11px]">Arrive:</span>
            <span className="font-mono font-bold text-[#172D3B]">{formatTime12(option.arrival_time)}</span>
          </div>
          {option.total_distance_km && (
            <span className="text-[11px] font-mono text-[#73766F]">
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
              <div key={`${leg.trip_id}-${idx}`} className="space-y-1.5">
                <div className="rounded-lg border border-[#DAD3C6] bg-[#FFFFFF] p-2.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full inline-block"
                        style={{ backgroundColor: leg.route_color || '#172D3B' }}
                      />
                      <span className="font-bold text-[#172D3B]">
                        {leg.route_name}
                      </span>
                      <span className="rounded bg-[#EDE7DB] border border-[#DAD3C6] px-1 py-0.2 text-[9px] font-semibold text-[#73766F]">
                        {isAutoLeg ? '🛺 Auto' : isMetroLeg ? '🚇 Metro' : '🚍 Bus'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      {leg.distance_km !== null && leg.distance_km !== undefined && (
                        <span className="text-[#73766F] font-mono">
                          {leg.distance_km} km
                        </span>
                      )}
                      {leg.fare !== null && leg.fare !== undefined && (
                        <span className="font-mono font-bold text-[#172D3B]">
                          ₹{leg.fare}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stop Points */}
                  <div className="pl-3 space-y-1 border-l-2 border-[#EDE7DB] ml-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#29343A]">
                        {boardMeta.icon} {leg.board_stop_name}
                      </span>
                      <span className="font-mono text-[#73766F] text-[10px]">
                        {formatTime12(leg.departure_time)}
                      </span>
                    </div>

                    {/* Intermediate stops toggle */}
                    {leg.intermediate_stops && leg.intermediate_stops.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={e => toggleLeg(idx, e)}
                          className="text-[10px] font-semibold text-[#A97C2E] hover:underline"
                        >
                          {isExpanded ? 'Hide' : 'Show'} {leg.intermediate_stops.length} intermediate stops
                        </button>
                        {isExpanded && (
                          <div className="mt-1 pl-2 space-y-0.5 border-l border-dashed border-[#DAD3C6] text-[10px] text-[#73766F]">
                            {leg.intermediate_stops.map((stopName, sIdx) => (
                              <div key={`${stopName}-${sIdx}`}>
                                • {stopName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#29343A]">
                        {alightMeta.icon} {leg.alight_stop_name}
                      </span>
                      <span className="font-mono text-[#73766F] text-[10px]">
                        {formatTime12(leg.arrival_time)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Multimodal or Standard Transfer Node */}
                {transfer && (
                  <div className="flex items-center gap-2 rounded-md border border-[#C49A43]/30 bg-[#F5F0E6] px-2.5 py-1 text-xs text-[#29343A]">
                    <span className="text-xs">🔄</span>
                    <span className="text-[11px] font-medium">
                      {transfer.transfer_description ? (
                        transfer.transfer_description
                      ) : (
                        <>
                          Transfer at <strong>{transfer.at_stop_name}</strong> •{' '}
                          <strong>{transfer.wait_minutes} min wait</strong>
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-[#DAD3C6] pt-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onSave()
              }}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                isSaved
                  ? 'border-[#547A60] bg-[#EBF4F0] text-[#547A60]'
                  : 'border-[#DAD3C6] bg-[#FFFFFF] text-[#29343A] hover:bg-[#EDE7DB]'
              }`}
            >
              <span>{isSaved ? '★' : '☆'}</span>
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyItinerary}
              className="flex items-center gap-1 rounded-md border border-[#DAD3C6] bg-[#FFFFFF] px-2 py-1 text-[11px] font-semibold text-[#73766F] hover:bg-[#EDE7DB] hover:text-[#29343A] transition-colors"
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
            className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
              selected
                ? 'bg-[#172D3B] text-white shadow-2xs'
                : 'border border-[#172D3B] text-[#172D3B] hover:bg-[#172D3B] hover:text-white'
            }`}
          >
            {selected ? 'Active on Map' : 'View on Map'}
          </button>
        </div>
      </div>
    </div>
  )
}
