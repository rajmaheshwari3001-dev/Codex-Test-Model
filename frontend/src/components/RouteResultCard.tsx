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
      `🚇 Aaroh-Saarthi Delhi Transit Itinerary`,
      `• Preference: ${option.label} (${option.total_duration_minutes} min, ₹${option.total_fare ?? 'N/A'})`,
      `• Departure: ${formatTime12(option.departure_time)} | Arrival: ${formatTime12(option.arrival_time)}`,
      `• Primary Mode: ${option.primary_mode?.toUpperCase() || 'MULTIMODAL'}`,
      `• Transfers: ${option.transfers.length === 0 ? 'Direct journey' : `${option.transfers.length} interchange(s)`}`,
      ``,
      ...option.legs.map((leg, i) => {
        const transfer = option.transfers[i]
        const legText = [
          `Leg ${i + 1}: ${leg.route_name} (${leg.route_type?.toUpperCase() || 'BUS'}, Trip ${leg.trip_id})`,
          `  • Board: ${leg.board_stop_name} @ ${formatTime12(leg.departure_time)} (Fare: ₹${leg.fare ?? 'N/A'})`,
          `  • Alight: ${leg.alight_stop_name} @ ${formatTime12(leg.arrival_time)}`,
        ]
        if (transfer) {
          legText.push(`  ↳ Interchange: ${transfer.wait_minutes} min connection at ${transfer.at_stop_name}`)
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
      .catch(() => {
        setCopied(false)
      })
  }

  const isFastest = option.label.toLowerCase() === 'fastest'
  const isCheapest = option.label.toLowerCase() === 'cheapest'
  const primaryRouteColor = option.legs[0]?.route_color || '#2563eb'

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
      className={`group relative overflow-hidden rounded-3xl border-2 bg-white text-left transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
        selected
          ? 'border-blue-600 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/10'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Primary Corridor Color Indicator Stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2.5 transition-all group-hover:w-3"
        style={{ backgroundColor: primaryRouteColor }}
      />

      <div className="pl-6 pr-5 py-5 sm:pl-7 sm:pr-6 space-y-4">
        {/* Pass Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                isFastest
                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                  : isCheapest
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
              }`}
            >
              {isFastest ? '⚡ ' : isCheapest ? '💰 ' : ''}
              {option.label}
            </span>

            {/* Mode Indicator Badge */}
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-black uppercase ${
                option.primary_mode === 'metro'
                  ? 'border-blue-300 bg-blue-50 text-blue-900'
                  : option.primary_mode === 'bus'
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-purple-300 bg-purple-50 text-purple-900'
              }`}
            >
              {option.primary_mode === 'metro'
                ? '🚇 Delhi Metro'
                : option.primary_mode === 'bus'
                ? '🚌 DTC Bus'
                : '🌐 Multimodal'}
            </span>

            {option.transfers.length === 0 ? (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                Direct Line
              </span>
            ) : (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900">
                {option.transfers.length} {option.transfers.length === 1 ? 'Interchange' : 'Interchanges'}
              </span>
            )}

            {/* Target Budget Status Pill */}
            {option.budget_status && (
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-bold ${
                  option.budget_status.includes('Within')
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-amber-300 bg-amber-50 text-amber-900'
                }`}
                title={option.budget_status}
              >
                {option.budget_status.includes('Within') ? '✅ Within Budget' : '⚠️ Over Budget'}
              </span>
            )}
          </div>

          {/* Total Fare Badge */}
          {option.fare_available && option.total_fare !== null ? (
            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-900 shadow-2xs">
                <span className="text-lg font-black">₹{option.total_fare}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Fare</span>
              </div>
              <span className="mt-0.5 text-[10px] font-semibold text-slate-400">
                Synthetic Zone Tariff
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Fare not specified</span>
          )}
        </div>

        {/* Departure -> Arrival Times & Total Duration */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                {formatTime12(option.departure_time)}
              </span>
              <span className="text-slate-400 text-lg font-bold">➔</span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                {formatTime12(option.arrival_time)}
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Scheduled departure from <strong className="text-slate-700">{option.legs[0]?.board_stop_name}</strong>
            </div>
          </div>

          {/* Duration Pill */}
          <div className="text-right">
            <div className="inline-flex items-baseline gap-1 rounded-2xl bg-slate-100 px-4 py-2 text-slate-900 shadow-inner">
              <span className="text-2xl font-black">{option.total_duration_minutes}</span>
              <span className="text-xs font-extrabold uppercase text-slate-500">min</span>
            </div>
          </div>
        </div>

        {/* Metro vs Bus Fare Comparison & Budget Analysis Banner */}
        {option.fare_comparison_note && (
          <div className="rounded-2xl border border-indigo-200/90 bg-indigo-50/70 p-3.5 text-xs text-indigo-950 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-extrabold text-indigo-900">
              <span>💡</span>
              <span>Metro vs Bus Comparative Trade-Off</span>
            </div>
            <p className="text-xs text-indigo-950/90 font-medium leading-relaxed">
              {option.fare_comparison_note}
            </p>
            {option.budget_status && (
              <div className="pt-1 border-t border-indigo-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                <span>Budget Check:</span>
                <span className={option.budget_status.includes('Within') ? 'text-emerald-800 font-extrabold' : 'text-amber-800 font-extrabold'}>
                  {option.budget_status}
                </span>
              </div>
            )}
          </div>
        )}

        {/* The Metro Tube Strip Timeline */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Itinerary Traversal Timeline
          </div>

          {option.legs.map((leg, legIdx) => {
            const isExpanded = Boolean(expandedLegs[legIdx])
            const intermediateCount = leg.intermediate_stops?.length || 0
            const boardMeta = getStationMeta(leg.board_stop_id)
            const alightMeta = getStationMeta(leg.alight_stop_id)

            return (
              <div
                key={leg.leg_index}
                className="relative rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3 transition-colors hover:bg-slate-50"
              >
                {/* Leg Corridor Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs ring-2 ring-white"
                      style={{ backgroundColor: leg.route_color || '#2563eb' }}
                    />
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900">{leg.route_name}</span>
                    <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-black uppercase text-slate-700">
                      {leg.route_type === 'subway' || leg.route_type === 'metro' ? '🚇 Metro' : '🚌 DTC Bus'}
                    </span>
                    <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                      Trip {leg.trip_id}
                    </span>
                    {leg.fare !== null && (
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-black text-emerald-800">
                        ₹{leg.fare}
                      </span>
                    )}
                  </div>

                  {/* Crowding badge */}
                  {leg.boarding_crowding_level && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        leg.boarding_crowding_level === 'high'
                          ? 'border border-rose-200 bg-rose-100 text-rose-900'
                          : leg.boarding_crowding_level === 'medium'
                          ? 'border border-amber-200 bg-amber-100 text-amber-900'
                          : 'border border-emerald-200 bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {leg.boarding_crowding_level === 'unknown'
                        ? 'Crowd: N/A'
                        : `Crowd: ${leg.boarding_crowding_level.toUpperCase()}`}
                    </span>
                  )}
                </div>

                {/* Vertical Tube Track Layout */}
                <div className="relative pl-6 space-y-3">
                  {/* Vertical Track Line connecting nodes */}
                  <div
                    className="absolute left-[7px] top-2 bottom-2 w-1 rounded-full"
                    style={{ backgroundColor: leg.route_color || '#2563eb' }}
                  />

                  {/* Boarding Station Node */}
                  <div className="relative flex items-start justify-between">
                    <span
                      className="absolute -left-[23px] top-1 h-4 w-4 rounded-full border-2 border-white shadow-2xs ring-1 ring-slate-300"
                      style={{ backgroundColor: leg.route_color || '#2563eb' }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-950 text-sm">
                        <span>{boardMeta.icon}</span>
                        <span>{leg.board_stop_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Boarding station • {boardMeta.landmark}
                      </div>
                    </div>
                    <span className="font-mono text-xs sm:text-sm font-black text-slate-800">
                      {formatTime12(leg.departure_time)}
                    </span>
                  </div>

                  {/* Intermediate Stops Collapsible Accordion */}
                  {intermediateCount > 0 && (
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={e => toggleLeg(legIdx, e)}
                        className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 shadow-2xs transition-colors"
                      >
                        <span>{isExpanded ? '▼ Hide' : '▶ Show'} {intermediateCount} stops in between</span>
                      </button>
                      {isExpanded && (
                        <div className="my-2.5 ml-2 border-l-2 border-dashed border-slate-300 pl-3 space-y-1.5 text-xs text-slate-600 animate-in fade-in">
                          {leg.intermediate_stops.map((stopName, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-slate-300" />
                              <span className="font-medium text-slate-700">{stopName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alighting Station Node */}
                  <div className="relative flex items-start justify-between">
                    <span
                      className="absolute -left-[23px] top-1 h-4 w-4 rounded-full border-2 border-white shadow-2xs ring-1 ring-slate-300 bg-slate-900"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-950 text-sm">
                        <span>{alightMeta.icon}</span>
                        <span>{leg.alight_stop_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Alight here • {alightMeta.landmark}
                      </div>
                    </div>
                    <span className="font-mono text-xs sm:text-sm font-black text-slate-800">
                      {formatTime12(leg.arrival_time)}
                    </span>
                  </div>
                </div>

                {/* Transfer interchange wait node */}
                {legIdx < option.legs.length - 1 && option.transfers[legIdx] && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50/95 p-3 text-xs font-bold text-amber-950 shadow-2xs">
                    <span className="text-lg" aria-hidden="true">🔄</span>
                    <div>
                      <span>Interchange at </span>
                      <span className="underline decoration-amber-500 font-black">{option.transfers[legIdx].at_stop_name}</span>
                      <span>: Wait <strong>{option.transfers[legIdx].wait_minutes} min</strong> for connecting service</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Delay Warnings */}
        {option.delay_warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
            {option.delay_warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 font-medium">
                <span aria-hidden="true">⚠️</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Card Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-400">
            {selected ? '✓ Previewing route on interactive map' : 'Click card to focus path on map'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyItinerary}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors shadow-2xs"
            >
              {copied ? '✓ Copied' : '📋 Copy Plan'}
            </button>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onSave()
              }}
              disabled={isSaved}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs ${
                isSaved
                  ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-default'
                  : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {isSaved ? '★ Saved' : '★ Save Bookmark'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
