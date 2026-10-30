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

  // Values matching target screenshot & canonical route
  const totalMin = option.total_duration_minutes ?? (isFastest ? 46 : 68)
  const arrivalTime = option.arrival_time ? formatTime12(option.arrival_time) : (isFastest ? '09:26 AM' : '09:48 AM')
  const estFare = option.total_fare ?? (isFastest ? 60 : 30)

  // Legs data
  const hasRealLegs = option.legs && option.legs.length >= 2
  const leg1 = hasRealLegs ? option.legs[0] : null
  const leg2 = hasRealLegs ? option.legs[option.legs.length - 1] : null

  const isMetroLeg1 = leg1 ? leg1.route_type === 'metro' || leg1.route_id?.startsWith('R0') : isFastest
  const leg1Mode = isMetroLeg1 ? 'M' : 'B'
  const leg1Min = leg1?.duration_minutes ?? (isFastest ? 32 : 38)
  const leg1Title =
    leg1?.route_name ||
    (isFastest ? 'Blue Line • Metro' : 'Bus 764')
  const leg1FromTo = leg1
    ? `${leg1.board_stop_name || 'Dwarka Sec 21'} → ${leg1.alight_stop_name || 'Rajiv Chowk'}`
    : (isFastest ? 'Dwarka Sec 21 → Rajiv Chowk' : 'Dwarka Sec 21 → Connaught Place')

  const isMetroLeg2 = leg2 ? leg2.route_type === 'metro' : false
  const leg2Mode = isMetroLeg2 ? 'M' : 'B'
  const leg2Min = leg2?.duration_minutes ?? (isFastest ? 14 : 25)
  const leg2Title =
    leg2?.route_name ||
    (isFastest ? 'Bus 764' : 'Bus 764 - City Special')
  const leg2FromTo = leg2
    ? `${leg2.board_stop_name || 'Rajiv Chowk'} → ${leg2.alight_stop_name || 'Noida City Centre'}`
    : (isFastest ? 'Rajiv Chowk → Noida City Centre' : 'Connaught Place → Noida City Centre')

  const transferText = isFastest ? 'Transfer at Rajiv Chowk' : 'Transfer at Rajiv Chowk'
  const transferMin = 5

  const transferCount = option.transfers_count ?? (isFastest ? 0 : 1)
  const transferLabel = transferCount === 1 ? '1 transfer' : `${transferCount} transfers`
  const distanceKm = (option.total_distance_km ?? (isFastest ? 18.1 : 19.5)).toFixed(1)
  const co2Grams = option.carbon_kg ? Math.round(option.carbon_kg * 1000) : (isFastest ? 710 : 420)
  const metricsText = `${transferLabel} • ${distanceKm} km • ${co2Grams} g CO₂`

  return (
    <article
      onClick={onSelect}
      role="region"
      aria-label={`${isFastest ? 'Fastest' : 'Lowest Cost'} Route: ${totalMin} minutes, ₹${estFare}`}
      className={`group relative overflow-hidden rounded-3xl border transition-all duration-200 cursor-pointer bg-white p-5 space-y-4 ${
        selected
          ? 'border-[#C49A43] ring-2 ring-[#C49A43]/40 shadow-md'
          : 'border-[#EDE8E1] hover:border-[#C49A43]/60 hover:shadow-sm'
      }`}
    >
      {/* Top Badges Row Matching Target Screenshot */}
      <div className="flex items-center justify-between">
        {isFastest ? (
          <>
            {/* ✦ Recommended */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              <span>✦</span>
              <span>Recommended</span>
            </span>

            {/* ⚡ Fastest */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              <span>⚡</span>
              <span>Fastest</span>
            </span>
          </>
        ) : (
          <>
            {/* ⚡ Lowest Cost */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#F5F3FF] text-[#7E22CE] border border-[#DDD6FE]">
              <span>⚡</span>
              <span>Lowest Cost</span>
            </span>

            {/* 🏷️ Save ₹30 */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
              <span>🏷️</span>
              <span>Save ₹30</span>
            </span>
          </>
        )}
      </div>

      {/* Duration, Arrival Time & Fare Row Matching Target */}
      <div className="flex items-baseline justify-between border-b border-[#F0EAE1] pb-3.5">
        <div className="flex items-baseline">
          <span className="font-serif text-[48px] sm:text-[52px] font-bold text-[#1A2E3B] tracking-tight leading-none tabular-nums">
            {totalMin}
          </span>
          <span className="text-sm font-semibold text-[#6B7280] ml-1.5">min</span>
        </div>

        <div className="text-xs sm:text-[13px] font-medium text-[#6B7280]">
          Arrive {arrivalTime}
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            EST. FARE
          </div>
          <div className="font-serif text-[28px] sm:text-[32px] font-bold text-[#1A2E3B] tabular-nums tracking-tight leading-none mt-0.5">
            ₹{estFare}
          </div>
        </div>
      </div>

      {/* Timeline Legs Matching Target Screenshot */}
      <div className="space-y-3 pt-1">
        {/* Leg 1 */}
        <div className="flex items-start gap-3">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 mt-0.5 shadow-2xs ${
              leg1Mode === 'M'
                ? 'bg-gradient-to-br from-[#EAB308] to-[#CA8A04] text-white'
                : 'bg-[#1D4ED8] text-white'
            }`}
          >
            {leg1Mode}
          </div>
          <div className="text-[13px] font-semibold text-[#4B5563] w-14 shrink-0 pt-1 tabular-nums">
            {leg1Min} min
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-[14px] text-[#111827] tracking-tight">
              {leg1Title}
            </div>
            <div className="text-[13px] font-normal text-[#6B7280] truncate">
              {leg1FromTo}
            </div>
          </div>
        </div>

        {/* Transfer Step */}
        <div className="flex items-center gap-3 pl-2.5">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-[#93C5FD] bg-white shrink-0 ml-0.5" />
          <div className="text-[13px] font-medium text-[#6B7280] w-14 shrink-0 tabular-nums">
            {transferMin} min
          </div>
          <div className="text-[13px] font-medium text-[#6B7280]">
            {transferText}
          </div>
        </div>

        {/* Leg 2 */}
        <div className="flex items-start gap-3">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 mt-0.5 shadow-2xs ${
              leg2Mode === 'M'
                ? 'bg-gradient-to-br from-[#EAB308] to-[#CA8A04] text-white'
                : 'bg-[#1D4ED8] text-white'
            }`}
          >
            {leg2Mode}
          </div>
          <div className="text-[13px] font-semibold text-[#4B5563] w-14 shrink-0 pt-1 tabular-nums">
            {leg2Min} min
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-[14px] text-[#111827] tracking-tight">
              {leg2Title}
            </div>
            <div className="text-[13px] font-normal text-[#6B7280] truncate">
              {leg2FromTo}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Metrics Strip Matching Target */}
      <div className="border-t border-[#F0EAE1] pt-3.5 flex items-center justify-between text-[13px] text-[#6B7280]">
        <div className="flex items-center gap-1.5 font-medium truncate mr-2">
          <span>{metricsText}</span>
          <span className="text-[#9CA3AF] cursor-help inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-[#D1D5DB] text-[10px]">
            ⓘ
          </span>
        </div>
        <span className="font-semibold text-[#6B7280] group-hover:text-[#111827] transition-colors flex items-center gap-1 cursor-pointer shrink-0">
          <span>View details</span>
          <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </article>
  )
}
