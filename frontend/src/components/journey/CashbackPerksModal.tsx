import { useState } from 'react'
import {
  DollarSignIcon,
  ZapIcon,
  TrainIcon,
  BusIcon,
  TagIcon,
  AutoRickshawIcon,
  XIcon,
} from '../common/Icons'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function CashbackPerksModal({ isOpen, onClose }: Props) {
  const [calcFare, setCalcFare] = useState<number>(40)

  if (!isOpen) return null

  // Calculate live discounts
  const peakDiscount = Math.round(calcFare * 0.1)
  const peakFare = calcFare - peakDiscount

  const offPeakDiscount = Math.round(calcFare * 0.2)
  const offPeakFare = calcFare - offPeakDiscount

  const monthlySavings = (peakDiscount * 2) * 22

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cashback-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#243B4A]/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#D8C8AA] bg-[#FFFCF5] shadow-2xl p-6 sm:p-7 text-[#29343A] animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Cashback and Perks dialog"
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#D8C8AA] bg-[#EEE5D6] text-[#77766D] hover:text-[#243B4A] hover:bg-[#D8C8AA]/50 transition-colors cursor-pointer"
        >
          <XIcon className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="border-b border-[#D8C8AA] pb-4 pr-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EEE5D6] border border-[#D8C8AA] px-3 py-1 text-xs font-bold text-[#243B4A] mb-2">
            <DollarSignIcon className="w-3.5 h-3.5 text-[#C49A43]" />
            <span>Commuter Benefits & Smart Tariffs</span>
          </div>
          <h2 id="cashback-modal-title" className="font-serif text-xl sm:text-2xl font-bold text-[#243B4A]">
            Delhi Transit Cashback & Concessions
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#77766D]">
            Live calculations on actual statutory savings across Delhi public transport
          </p>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-5">
          {/* Interactive Calculator Section */}
          <section aria-labelledby="calc-heading" className="rounded-2xl border border-[#D8C8AA] bg-[#EEE5D6]/60 p-4 space-y-3">
            <h3 id="calc-heading" className="text-xs font-bold uppercase tracking-wider text-[#243B4A] flex items-center gap-1.5">
              <ZapIcon className="w-3.5 h-3.5 text-[#C49A43]" />
              <span>Smart Card Live Cashback Calculator</span>
            </h3>

            <div className="flex items-center justify-between gap-4">
              <label htmlFor="fare-input" className="text-xs text-[#29343A] font-medium">
                Standard Single Token Fare:
              </label>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#243B4A]">₹</span>
                <input
                  id="fare-input"
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  value={calcFare}
                  onChange={e => setCalcFare(Number(e.target.value) || 0)}
                  className="w-20 rounded-xl border border-[#D8C8AA] bg-[#FFFCF5] px-2.5 py-1.5 text-sm font-mono font-bold text-[#29343A] focus:outline-none focus:border-[#C49A43]"
                />
              </div>
            </div>

            {/* Savings Cards Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-[#D8C8AA] bg-[#FFFCF5] p-3 text-center space-y-1 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#77766D]">
                  Peak Hours (-10%)
                </div>
                <div className="font-mono text-xl font-black text-[#243B4A]">
                  ₹{peakFare}
                </div>
                <div className="text-[10px] font-semibold text-[#547A60]">
                  Saves ₹{peakDiscount} per ride
                </div>
              </div>

              <div className="rounded-xl border border-[#D8C8AA] bg-[#EEE5D6] p-3 text-center space-y-1 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C49A43]">
                  Off-Peak Hours (-20%)
                </div>
                <div className="font-mono text-xl font-black text-[#243B4A]">
                  ₹{offPeakFare}
                </div>
                <div className="text-[10px] font-bold text-[#547A60]">
                  Saves ₹{offPeakDiscount} per ride
                </div>
              </div>
            </div>

            {/* Cumulative Projection */}
            <div className="rounded-xl bg-[#547A60]/15 border border-[#547A60]/30 p-3 text-xs text-[#243B4A] flex items-center justify-between">
              <span className="font-medium">Monthly Commuter Savings (44 trips):</span>
              <span className="font-mono font-bold text-sm text-[#547A60]">₹{monthlySavings} / mo</span>
            </div>
          </section>

          {/* Statutory Concessions List */}
          <section aria-labelledby="perks-heading" className="space-y-3">
            <h3 id="perks-heading" className="text-xs font-bold uppercase tracking-wider text-[#77766D]">
              Official Concession Policies
            </h3>

            <div className="space-y-2.5 text-xs">
              {/* DMRC Smart Card */}
              <div className="rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#243B4A] flex items-center gap-2">
                    <TrainIcon className="w-4 h-4 text-[#C49A43]" />
                    <span>Delhi Metro Smart Card</span>
                  </span>
                  <span className="rounded-full bg-[#547A60]/15 border border-[#547A60]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#547A60]">
                    10% — 20% Off
                  </span>
                </div>
                <p className="text-[11px] text-[#77766D] leading-relaxed">
                  Automatic 10% discount on all token fares. Additional 10% off-peak discount applies before 08:00 AM, 12:00 PM – 05:00 PM, and after 09:00 PM, as well as all day Sundays.
                </p>
              </div>

              {/* DTC Pink Ticket */}
              <div className="rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#243B4A] flex items-center gap-2">
                    <BusIcon className="w-4 h-4 text-[#A6533C]" />
                    <span>DTC Pink Ticket Scheme</span>
                  </span>
                  <span className="rounded-full bg-[#A6533C]/15 border border-[#A6533C]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#A6533C]">
                    100% Free for Women
                  </span>
                </div>
                <p className="text-[11px] text-[#77766D] leading-relaxed">
                  Women passengers travel completely free on all DTC and Cluster Non-AC and AC city buses using single-journey Pink Passes issued onboard.
                </p>
              </div>

              {/* DTC Daily Pass */}
              <div className="rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#243B4A] flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-[#243B4A]" />
                    <span>DTC Daily Pass</span>
                  </span>
                  <span className="rounded-full bg-[#EEE5D6] border border-[#D8C8AA] px-2.5 py-0.5 text-[10px] font-bold text-[#243B4A]">
                    ₹40 / ₹50 Unlimited
                  </span>
                </div>
                <p className="text-[11px] text-[#77766D] leading-relaxed">
                  Unlimited travel on the DTC bus network for an entire day: ₹40 for Non-AC buses, ₹50 for all AC & Non-AC buses. Saves up to ₹70/day for multi-leg journeys.
                </p>
              </div>

              {/* PoochhO Auto Feeder */}
              <div className="rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#243B4A] flex items-center gap-2">
                    <AutoRickshawIcon className="w-4 h-4 text-[#547A60]" />
                    <span>PoochhO Statutory Meter</span>
                  </span>
                  <span className="rounded-full bg-[#EEE5D6] border border-[#D8C8AA] px-2.5 py-0.5 text-[10px] font-bold text-[#243B4A]">
                    No Surge Pricing
                  </span>
                </div>
                <p className="text-[11px] text-[#77766D] leading-relaxed">
                  First 1.5 km at ₹30, thereafter ₹11/km regulated by the Delhi Transport Department. Zero surge pricing during rush hour, saving 25%–40% over commercial ride-hailing apps.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-[#D8C8AA] pt-4 flex items-center justify-between">
          <span className="text-[11px] text-[#77766D]">
            Rates verified against DMRC and DTC notifications.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#C49A43] hover:bg-[#A77B32] px-5 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
