import { useState } from 'react'
import type { PoochhOEstimate } from '../types'

interface Props {
  estimate: PoochhOEstimate
  onSelectAutoOption?: () => void
  isNightOutOfHours?: boolean
}

export default function PoochhOEstimateCard({
  estimate,
  onSelectAutoOption,
  isNightOutOfHours = false,
}: Props) {
  const [showTaxiDetails, setShowTaxiDetails] = useState(false)

  return (
    <div
      className={`overflow-hidden rounded-xl border text-left transition-all ${
        isNightOutOfHours
          ? 'border-[#B88A43] bg-[#FCFBF8] shadow-md ring-2 ring-[#B88A43]/20'
          : 'border-[#E8DFCE] bg-[#FFFFFF] shadow-xs hover:border-[#B88A43]/50'
      }`}
    >
      {/* Top Banner Accent */}
      <div className="bg-[#B88A43] px-4 py-1.5 text-white flex items-center justify-between text-xs font-bold">
        <div className="flex items-center gap-2">
          <span>🛺</span>
          <span>PoochhO Auto & Taxi Assistant (DIMTS)</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider bg-black/15 px-2 py-0.5 rounded">
          {estimate.is_night_time ? '🌙 Night Surcharge (25%)' : '☀️ Standard Fare'}
        </span>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Out-of-hours alert note if public transit has closed */}
        {isNightOutOfHours && (
          <div className="rounded-lg border border-[#B88A43]/30 bg-[#F4EBD9] p-2.5 text-xs text-[#25312D] space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-[#B88A43]">
              <span>🌙</span> 24/7 Reliable Night Mobility
            </div>
            <p className="text-[11px] text-[#53645F] leading-snug">
              Buses and Metros are closed for the night. PoochhO auto-rickshaws operate 24/7 with the official statutory 25% night meter tariff.
            </p>
          </div>
        )}

        {/* Primary Auto Meter Telemetry */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8DFCE] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#25312D]">
                ₹{estimate.auto_rickshaw.fare}
              </span>
              <span className="rounded bg-[#F4EBD9] border border-[#B88A43]/30 px-2 py-0.5 text-xs font-bold text-[#B88A43]">
                Auto-Rickshaw
              </span>
            </div>
            <div className="text-[11px] text-[#53645F] font-mono mt-0.5">
              {estimate.auto_rickshaw.fare_breakdown}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] px-3 py-1 text-center">
              <div className="text-base font-black text-[#173B32]">
                ~{estimate.estimated_duration_minutes}
                <span className="text-xs font-medium text-[#53645F] ml-0.5">m</span>
              </div>
              <div className="text-[10px] text-[#53645F] uppercase font-semibold">
                Est. Time
              </div>
            </div>

            <div className="rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] px-3 py-1 text-center">
              <div className="text-base font-black text-[#25312D]">
                {estimate.estimated_road_distance_km}
                <span className="text-xs font-medium text-[#53645F] ml-0.5">km</span>
              </div>
              <div className="text-[10px] text-[#53645F] uppercase font-semibold">
                Road Dist
              </div>
            </div>
          </div>
        </div>

        {/* Smart Multimodal Feeder Recommendation */}
        <div className="rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] p-3 text-xs space-y-1.5">
          <div className="font-bold text-[#173B32] flex items-center gap-1.5">
            <span>💡</span> Multimodal Feeder Guidance
          </div>
          <p className="text-[11px] text-[#53645F] leading-relaxed">
            {estimate.feeder_recommendation}
          </p>
        </div>

        {/* Expandable Taxi Tariffs Toggle */}
        <div className="text-xs pt-1">
          <button
            type="button"
            onClick={() => setShowTaxiDetails(!showTaxiDetails)}
            className="flex items-center gap-1.5 font-bold text-[#173B32] hover:underline"
          >
            <span>{showTaxiDetails ? '▼' : '▶'}</span>
            <span>Compare with Delhi Taxi Fares (Non-AC / AC)</span>
          </button>

          {showTaxiDetails && (
            <div className="mt-2.5 rounded-lg border border-[#E8DFCE] bg-[#FFFFFF] p-3 space-y-2 text-xs animate-fade-in">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-md border border-[#E8DFCE] bg-[#FAF7F2] p-2">
                  <div className="text-base font-extrabold text-[#25312D]">
                    ₹{estimate.taxi.non_ac_fare}
                  </div>
                  <div className="text-[10px] text-[#53645F] font-semibold">
                    🚕 Black & Yellow Non-AC
                  </div>
                  <div className="text-[9px] text-[#53645F]/80 mt-0.5">
                    ₹40 base + ₹17/km
                  </div>
                </div>

                <div className="rounded-md border border-[#E8DFCE] bg-[#FAF7F2] p-2">
                  <div className="text-base font-extrabold text-[#25312D]">
                    ₹{estimate.taxi.ac_fare}
                  </div>
                  <div className="text-[10px] text-[#53645F] font-semibold">
                    🚖 AC Taxi / Sedan
                  </div>
                  <div className="text-[9px] text-[#53645F]/80 mt-0.5">
                    ₹40 base + ₹20/km
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-[#53645F] text-center pt-1">
                Rates governed by Transport Dept, Govt. of NCT of Delhi statutory notification.
              </p>
            </div>
          )}
        </div>

        {/* Action Controls & Attribution */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E8DFCE] pt-3 text-xs">
          <span className="font-mono text-[10px] text-[#53645F]">
            Source: {estimate.provenance}
          </span>

          {onSelectAutoOption && (
            <button
              type="button"
              onClick={onSelectAutoOption}
              className="rounded-lg bg-[#B88A43] px-3.5 py-1.5 font-bold text-white hover:bg-[#A37736] transition-colors shadow-xs"
            >
              Route via Auto
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
