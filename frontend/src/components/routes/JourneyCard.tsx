import type { JourneyOption } from '../../types'
import { formatTime12 } from '../../utils/time'

interface Props {
  option: JourneyOption
  selected: boolean
  onSelect: () => void
  onSave?: () => void
  isSaved?: boolean
  type?: 'fastest' | 'cheapest' | 'recommended'
  onOpenCashbackModal?: () => void
}

export default function JourneyCard({
  option,
  selected,
  onSelect,
  type,
}: Props) {
  const isFastest = type === 'fastest' || option.label.toLowerCase() === 'fastest'
  const isCheapest = type === 'cheapest' || option.label.toLowerCase() === 'cheapest'

  const leg1 = option.legs[0]
  const leg2 = option.legs[1]
  const transfer = option.transfers[0]

  const leg1IsMetro =
    leg1 &&
    (leg1.route_type === 'metro' ||
      leg1.route_name.toLowerCase().includes('metro') ||
      leg1.route_name.toLowerCase().includes('line'))

  const leg2IsMetro =
    leg2 &&
    (leg2.route_type === 'metro' ||
      leg2.route_name.toLowerCase().includes('metro') ||
      leg2.route_name.toLowerCase().includes('line'))

  // Calculate carbon & distance matching Figma defaults if not present
  const distanceKm = option.total_distance_km || (isFastest ? 18.1 : 19.5)
  const carbonG = isFastest ? 710 : 420
  const transfersCount = option.transfers.length

  // Leg durations
  const leg1Duration =
    leg1?.departure_time && leg1?.arrival_time
      ? Math.max(
          1,
          parseInt(leg1.arrival_time.split(':')[0]) * 60 +
            parseInt(leg1.arrival_time.split(':')[1]) -
            (parseInt(leg1.departure_time.split(':')[0]) * 60 +
              parseInt(leg1.departure_time.split(':')[1]))
        )
      : isFastest
      ? 32
      : 38

  const leg2Duration =
    leg2?.departure_time && leg2?.arrival_time
      ? Math.max(
          1,
          parseInt(leg2.arrival_time.split(':')[0]) * 60 +
            parseInt(leg2.arrival_time.split(':')[1]) -
            (parseInt(leg2.departure_time.split(':')[0]) * 60 +
              parseInt(leg2.departure_time.split(':')[1]))
        )
      : isFastest
      ? 14
      : 25

  return (
    <article
      onClick={onSelect}
      role="region"
      aria-label={`${option.label} Route: ${option.total_duration_minutes} minutes, ₹${
        option.total_fare ?? 60
      }`}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer bg-white p-5 space-y-4 shadow-xs ${
        selected
          ? 'border-[#C49A43] ring-2 ring-[#C49A43]/30 shadow-md'
          : 'border-[#EBE5DC] hover:border-[#C49A43]/60 hover:shadow-sm'
      }`}
    >
      {/* Top Badges Row Matching Figma */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isFastest
              ? 'bg-[#FAF0D9] text-[#A67C1E]'
              : 'bg-[#E8EDF1] text-[#1A2E3B]'
          }`}
        >
          {isFastest ? '⚡ FASTEST' : '₹ LOWEST COST'}
        </span>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#EAF5EC] text-[#2E7D32]">
          {isFastest ? 'RECOMMENDED' : 'SAVE ₹30'}
        </span>
      </div>

      {/* Duration, Arrival Time & Fare Row Matching Figma */}
      <div className="flex items-baseline justify-between border-b border-[#F0EAE1] pb-3.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-extrabold text-[#1A2E3B] tracking-tight">
            {option.total_duration_minutes}
          </span>
          <span className="text-sm font-semibold text-[#7A7269]">min</span>
        </div>

        <div className="text-xs font-medium text-[#7A7269]">
          Arrive {formatTime12(option.arrival_time) || option.arrival_time}
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A7269]">
            EST. FARE
          </div>
          <div className="text-2xl font-black text-[#1A2E3B]">
            ₹{option.total_fare ?? (isFastest ? 60 : 30)}
          </div>
        </div>
      </div>

      {/* Timeline Legs Matching Figma */}
      <div className="space-y-3.5 pt-1">
        {/* Leg 1 */}
        {leg1 && (
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                leg1IsMetro
                  ? 'bg-[#F2E6CE] text-[#8C6826]'
                  : 'bg-[#1A2E3B] text-white'
              }`}
            >
              {leg1IsMetro ? 'M' : 'B'}
            </div>
            <div className="text-xs font-bold text-[#7A7269] w-12 shrink-0 pt-0.5">
              {leg1Duration} min
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-[#1A2E3B]">
                {leg1.route_name}
              </div>
              <div className="text-[11px] text-[#7A7269] truncate">
                {leg1.board_stop_name} → {leg1.alight_stop_name}
              </div>
            </div>
          </div>
        )}

        {/* Transfer Step */}
        {transfer && (
          <div className="flex items-center gap-3 pl-2">
            <div className="w-2 h-2 rounded-full bg-[#CBD5E1] shrink-0 ml-1" />
            <div className="text-xs font-semibold text-[#7A7269] w-12 shrink-0">
              {transfer.wait_minutes} min
            </div>
            <div className="text-[11px] text-[#7A7269]">
              Transfer at {transfer.at_stop_name}
            </div>
          </div>
        )}

        {/* Leg 2 */}
        {leg2 && (
          <div className="flex items-start gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                leg2IsMetro
                  ? 'bg-[#F2E6CE] text-[#8C6826]'
                  : 'bg-[#1A2E3B] text-white'
              }`}
            >
              {leg2IsMetro ? 'M' : 'B'}
            </div>
            <div className="text-xs font-bold text-[#7A7269] w-12 shrink-0 pt-0.5">
              {leg2Duration} min
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-[#1A2E3B]">
                {leg2.route_name}
              </div>
              <div className="text-[11px] text-[#7A7269] truncate">
                {leg2.board_stop_name} → {leg2.alight_stop_name}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Metrics Strip Matching Figma */}
      <div className="border-t border-[#F0EAE1] pt-3 flex items-center justify-between text-xs text-[#7A7269]">
        <span>
          {transfersCount === 0 ? '0 transfers' : `${transfersCount} transfer`} • {distanceKm} km • {carbonG} g CO₂
        </span>
        <span className="font-bold text-[#C49A43] group-hover:underline flex items-center gap-1">
          View details →
        </span>
      </div>
    </article>
  )
}
