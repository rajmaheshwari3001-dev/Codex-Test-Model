import { useState } from 'react'
import type { PoochhOEstimate } from '../types'
import {
  AutoRickshawIcon,
  MoonIcon,
  SparklesIcon,
  CarIcon,
  ClockIcon,
  NavigationIcon,
} from './common/Icons'

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
      className={`overflow-hidden rounded-2xl border text-left transition-all ${
        isNightOutOfHours
          ? 'border-[#C49A43] bg-[#EEE5D6]/40 shadow-md ring-2 ring-[#C49A43]/20'
          : 'border-[#D8C8AA] bg-[#FFFCF5] shadow-xs hover:border-[#C49A43]'
      }`}
    >
      {/* Top Banner Accent */}
      <div className="bg-[#243B4A] px-4 py-2 text-[#FFFCF5] flex items-center justify-between text-xs font-bold">
        <div className="flex items-center gap-2">
          <AutoRickshawIcon className="w-4 h-4 text-[#C49A43]" />
          <span>Poochh-O Auto & Feeder Assistant (DIMTS)</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
          {estimate.is_night_time ? (
            <>
              <MoonIcon className="w-3 h-3 text-[#C49A43]" />
              <span>Night Surcharge (25%)</span>
            </>
          ) : (
            <span>Standard Meter Tariff</span>
          )}
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Out-of-hours alert note if public transit has closed */}
        {isNightOutOfHours && (
          <div className="rounded-xl border border-[#D8C8AA] bg-[#EEE5D6] p-3 text-xs text-[#243B4A] space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-[#243B4A]">
              <MoonIcon className="w-3.5 h-3.5 text-[#C49A43]" />
              <span>24/7 Overnight Mobility Option</span>
            </div>
            <p className="text-[11px] text-[#77766D] leading-snug">
              Buses and Delhi Metro are currently closed for the night. Poochh-O autos operate 24/7 with the statutory 25% night meter tariff.
            </p>
          </div>
        )}

        {/* Primary Auto Meter Telemetry */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8C8AA] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#243B4A]">
                ₹{estimate.auto_rickshaw.fare}
              </span>
              <span className="rounded-lg bg-[#547A60]/15 border border-[#547A60]/30 px-2 py-0.5 text-xs font-bold text-[#547A60]">
                Statutory Auto
              </span>
            </div>
            <div className="text-[11px] text-[#77766D] font-mono mt-0.5">
              {estimate.auto_rickshaw.fare_breakdown}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]/50 px-3 py-1.5 text-center">
              <div className="text-sm font-black text-[#243B4A] flex items-center justify-center gap-1">
                <ClockIcon className="w-3.5 h-3.5 text-[#77766D]" />
                <span>~{estimate.estimated_duration_minutes}m</span>
              </div>
              <div className="text-[9px] text-[#77766D] uppercase font-semibold">
                Est. Time
              </div>
            </div>

            <div className="rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]/50 px-3 py-1.5 text-center">
              <div className="text-sm font-black text-[#243B4A] flex items-center justify-center gap-1">
                <NavigationIcon className="w-3.5 h-3.5 text-[#77766D]" />
                <span>{estimate.estimated_road_distance_km}km</span>
              </div>
              <div className="text-[9px] text-[#77766D] uppercase font-semibold">
                Road Dist
              </div>
            </div>
          </div>
        </div>

        {/* Smart Multimodal Feeder Recommendation */}
        <div className="rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]/60 p-3 text-xs space-y-1">
          <div className="font-bold text-[#243B4A] flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5 text-[#C49A43]" />
            <span>Multimodal Feeder Advice</span>
          </div>
          <p className="text-[11px] text-[#29343A] leading-relaxed">
            {estimate.feeder_recommendation}
          </p>
        </div>

        {/* Expandable Taxi Tariffs Toggle */}
        <div className="text-xs pt-0.5">
          <button
            type="button"
            onClick={() => setShowTaxiDetails(!showTaxiDetails)}
            className="flex items-center gap-1.5 font-bold text-[#243B4A] hover:text-[#C49A43] cursor-pointer"
          >
            <span>{showTaxiDetails ? 'Hide' : 'Compare'} Delhi Taxi Fares (Non-AC / AC)</span>
          </button>

          {showTaxiDetails && (
            <div className="mt-2.5 rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]/40 p-3.5 space-y-2.5 text-xs animate-fade-in">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl border border-[#D8C8AA] bg-[#FFFCF5] p-2.5">
                  <div className="text-base font-extrabold text-[#243B4A]">
                    ₹{estimate.taxi.non_ac_fare}
                  </div>
                  <div className="text-[11px] text-[#77766D] font-semibold flex items-center justify-center gap-1 mt-0.5">
                    <CarIcon className="w-3.5 h-3.5 text-[#C49A43]" />
                    <span>Black & Yellow Non-AC</span>
                  </div>
                  <div className="text-[10px] text-[#77766D] mt-0.5 font-mono">
                    ₹40 base + ₹17/km
                  </div>
                </div>

                <div className="rounded-xl border border-[#D8C8AA] bg-[#FFFCF5] p-2.5">
                  <div className="text-base font-extrabold text-[#243B4A]">
                    ₹{estimate.taxi.ac_fare}
                  </div>
                  <div className="text-[11px] text-[#77766D] font-semibold flex items-center justify-center gap-1 mt-0.5">
                    <CarIcon className="w-3.5 h-3.5 text-[#243B4A]" />
                    <span>AC Taxi / Sedan</span>
                  </div>
                  <div className="text-[10px] text-[#77766D] mt-0.5 font-mono">
                    ₹40 base + ₹20/km
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-[#77766D] text-center">
                Rates governed by Transport Dept, Govt. of NCT of Delhi statutory gazette.
              </p>
            </div>
          )}
        </div>

        {onSelectAutoOption && (
          <button
            type="button"
            onClick={onSelectAutoOption}
            className="w-full rounded-xl bg-[#547A60] hover:bg-[#43644e] py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all cursor-pointer"
          >
            Select Auto Mode Route
          </button>
        )}
      </div>
    </div>
  )
}
