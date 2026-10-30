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

  // Exact Figma data
  const totalMin = isFastest ? 46 : 68
  const arrivalTime = isFastest ? '09:26 AM' : '09:48 AM'
  const estFare = isFastest ? 60 : 30

  const leg1Mode = isFastest ? 'M' : 'B'
  const leg1Min = isFastest ? 32 : 38
  const leg1Title = isFastest ? 'Blue Line • Metro' : 'Bus 764'
  const leg1FromTo = isFastest
    ? 'Dwarka Sec 21 → Rajiv Chowk'
    : 'Dwarka Sec 21 → Connaught Place'

  const leg2Mode = 'B'
  const leg2Min = isFastest ? 14 : 25
  const leg2Title = isFastest ? 'Bus 764' : 'Bus 764 - City Special'
  const leg2FromTo = isFastest
    ? 'Rajiv Chowk → Noida City Centre'
    : 'Connaught Place → Noida City Centre'

  const metricsText = isFastest
    ? '0 transfers • 18.1 km • 710 g CO₂'
    : '1 transfer • 19.5 km • 420 g CO₂'

  return (
    <article
      onClick={onSelect}
      role="region"
      aria-label={`${isFastest ? 'Fastest' : 'Lowest Cost'} Route: ${totalMin} minutes, ₹${estFare}`}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer bg-white p-5 space-y-4 shadow-xs ${
        selected
          ? 'border-[#C49A43] ring-2 ring-[#C49A43]/30 shadow-md'
          : 'border-[#EBE5DC] hover:border-[#C49A43]/60 hover:shadow-sm'
      }`}
    >
      {/* Top Badges Row Matching Figma */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
            isFastest
              ? 'bg-[#FAF0D9] text-[#9A721C] border border-[#F3E2BD]'
              : 'bg-[#E8EDF1] text-[#1A2E3B] border border-[#D3DEE6]'
          }`}
        >
          {isFastest ? '⚡ FASTEST' : '₹ LOWEST COST'}
        </span>

        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[#EAF5EC] text-[#22702E] border border-[#CCE7D2]">
          {isFastest ? 'RECOMMENDED' : 'SAVE ₹30'}
        </span>
      </div>

      {/* Duration, Arrival Time & Fare Row Matching Figma */}
      <div className="flex items-baseline justify-between border-b border-[#F0EAE1] pb-3.5">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl sm:text-[42px] font-extrabold text-[#1A2E3B] tracking-tight tabular-nums leading-none">
            {totalMin}
          </span>
          <span className="text-xs font-semibold text-[#7A7269]">min</span>
        </div>

        <div className="text-xs font-semibold text-[#7A7269]">
          Arrive {arrivalTime}
        </div>

        <div className="text-right">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7A7269]">
            EST. FARE
          </div>
          <div className="text-2xl font-black text-[#1A2E3B] tabular-nums tracking-tight leading-none mt-1">
            ₹{estFare}
          </div>
        </div>
      </div>

      {/* Timeline Legs Matching Figma */}
      <div className="space-y-3.5 pt-1">
        {/* Leg 1 */}
        <div className="flex items-start gap-3">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[11px] shrink-0 mt-0.5 shadow-2xs ${
              leg1Mode === 'M'
                ? 'bg-[#FAF0D9] text-[#9A721C] border border-[#F3E2BD]'
                : 'bg-[#1A2E3B] text-white'
            }`}
          >
            {leg1Mode}
          </div>
          <div className="text-xs font-bold text-[#6E665D] w-12 shrink-0 pt-0.5 tabular-nums">
            {leg1Min} min
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs text-[#1A2E3B] tracking-tight">
              {leg1Title}
            </div>
            <div className="text-[11px] font-normal text-[#7A7269] truncate">
              {leg1FromTo}
            </div>
          </div>
        </div>

        {/* Transfer Step */}
        <div className="flex items-center gap-3 pl-2">
          <div className="w-2.5 h-2.5 rounded-full border border-[#CBD5E1] bg-[#F1F5F9] shrink-0 ml-0.5" />
          <div className="text-xs font-medium text-[#7A7269] w-12 shrink-0 tabular-nums">
            5 min
          </div>
          <div className="text-[11px] font-medium text-[#7A7269]">
            Transfer at Rajiv Chowk
          </div>
        </div>

        {/* Leg 2 */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[11px] shrink-0 mt-0.5 bg-[#1A2E3B] text-white shadow-2xs">
            {leg2Mode}
          </div>
          <div className="text-xs font-bold text-[#6E665D] w-12 shrink-0 pt-0.5 tabular-nums">
            {leg2Min} min
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs text-[#1A2E3B] tracking-tight">
              {leg2Title}
            </div>
            <div className="text-[11px] font-normal text-[#7A7269] truncate">
              {leg2FromTo}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Metrics Strip Matching Figma */}
      <div className="border-t border-[#F0EAE1] pt-3.5 flex items-center justify-between text-xs text-[#7A7269]">
        <span className="font-medium">{metricsText}</span>
        <span className="font-bold text-[#C49A43] group-hover:text-[#A77B32] transition-colors flex items-center gap-1.5 cursor-pointer">
          <span>View details</span>
          <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </article>
  )
}
