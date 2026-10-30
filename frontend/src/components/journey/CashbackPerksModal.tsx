import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  currentFare?: number | null
}

export default function CashbackPerksModal({ isOpen, onClose, currentFare }: Props) {
  const [calcFare, setCalcFare] = useState<number>(currentFare || 30)

  if (!isOpen) return null

  const peakDiscount = Math.round(calcFare * 0.1)
  const peakFare = Math.max(0, calcFare - peakDiscount)

  const offPeakDiscount = Math.round(calcFare * 0.2)
  const offPeakFare = Math.max(0, calcFare - offPeakDiscount)

  // 44 trips per month (22 working days x 2 trips/day)
  const monthlySavings = offPeakDiscount * 44
  const annualSavings = monthlySavings * 12

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cashback-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#DAD3C6] bg-[#FBF8F1] shadow-2xl p-5 sm:p-7 text-[#29343A] animate-scale-in"
      >
        {/* Close Button (Never Hidden, 44px Touch Target) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Cashback and Perks dialog"
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#DAD3C6] bg-[#F5F0E6] text-[#73766F] hover:text-[#172D3B] hover:bg-[#EDE7DB] transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="border-b border-[#DAD3C6] pb-4 pr-8">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-[#F7F1E5] border border-[#C49A43]/40 px-2.5 py-0.5 text-xs font-bold text-[#A97C2E] mb-2">
            <span>💰</span>
            <span>Commuter Benefits & Smart Tariffs</span>
          </div>
          <h2 id="cashback-modal-title" className="font-serif text-xl sm:text-2xl font-bold text-[#172D3B]">
            Delhi Transit Cashback & Concessions
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#73766F]">
            Answer to the Cashback Question: How much do you actually save on Delhi public transport?
          </p>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-5">
          {/* Interactive Calculator Section */}
          <section aria-labelledby="calc-heading" className="rounded-xl border border-[#DAD3C6] bg-[#FFFFFF] p-4 shadow-2xs space-y-3">
            <h3 id="calc-heading" className="text-xs font-bold uppercase tracking-wider text-[#172D3B] flex items-center gap-1.5">
              <span>⚡</span>
              <span>Instant Smart Card Cashback Calculator</span>
            </h3>

            <div className="flex items-center justify-between gap-4">
              <label htmlFor="fare-input" className="text-xs text-[#73766F]">
                Standard Single Token Fare:
              </label>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#172D3B]">₹</span>
                <input
                  id="fare-input"
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  value={calcFare}
                  onChange={e => setCalcFare(Number(e.target.value) || 0)}
                  className="w-20 rounded-lg border border-[#DAD3C6] bg-[#FBF8F1] px-2.5 py-1 text-sm font-mono font-bold text-[#172D3B] focus:outline-none focus:border-[#C49A43]"
                />
              </div>
            </div>

            {/* Savings Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="rounded-lg border border-[#DAD3C6] bg-[#FBF8F1] p-3 text-center space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#73766F]">
                  Peak Hours (-10%)
                </div>
                <div className="font-mono text-lg font-black text-[#172D3B]">
                  ₹{peakFare}
                </div>
                <div className="text-[10px] font-semibold text-[#547A60]">
                  Saves ₹{peakDiscount} per ride
                </div>
              </div>

              <div className="rounded-lg border border-[#C49A43]/40 bg-[#F7F1E5] p-3 text-center space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A97C2E]">
                  Off-Peak Hours (-20%)
                </div>
                <div className="font-mono text-lg font-black text-[#A97C2E]">
                  ₹{offPeakFare}
                </div>
                <div className="text-[10px] font-bold text-[#547A60]">
                  Saves ₹{offPeakDiscount} per ride
                </div>
              </div>
            </div>

            {/* Cumulative Projection */}
            <div className="rounded-lg bg-[#EBF4F0] border border-[#547A60]/30 p-2.5 text-xs text-[#547A60] flex items-center justify-between">
              <span className="font-medium">Monthly Commuter Savings (44 trips):</span>
              <span className="font-mono font-bold text-sm">₹{monthlySavings} / mo</span>
            </div>
          </section>

          {/* Statutory Concessions List */}
          <section aria-labelledby="perks-heading" className="space-y-3">
            <h3 id="perks-heading" className="text-xs font-bold uppercase tracking-wider text-[#73766F]">
              Official Concession Policies
            </h3>

            <div className="space-y-2 text-xs">
              {/* DMRC Smart Card */}
              <div className="rounded-xl border border-[#DAD3C6] bg-[#FFFFFF] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172D3B] flex items-center gap-1.5">
                    <span>🚇</span>
                    <span>Delhi Metro Smart Card</span>
                  </span>
                  <span className="rounded bg-[#EBF4F0] px-2 py-0.5 text-[10px] font-bold text-[#547A60]">
                    10% — 20% Off
                  </span>
                </div>
                <p className="text-[11px] text-[#73766F] leading-relaxed">
                  Automatic 10% discount on all token fares. Additional 10% off-peak discount applies before 08:00 AM, 12:00 PM – 05:00 PM, and after 09:00 PM, as well as all day Sundays.
                </p>
              </div>

              {/* DTC Pink Ticket */}
              <div className="rounded-xl border border-[#DAD3C6] bg-[#FFFFFF] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172D3B] flex items-center gap-1.5">
                    <span>🚍</span>
                    <span>DTC Pink Ticket Scheme</span>
                  </span>
                  <span className="rounded bg-[#FDF2F8] border border-[#F472B6]/30 px-2 py-0.5 text-[10px] font-bold text-[#DB2777]">
                    100% Free for Women
                  </span>
                </div>
                <p className="text-[11px] text-[#73766F] leading-relaxed">
                  Women passengers travel completely free on all DTC and Cluster Non-AC and AC city buses using single-journey Pink Passes issued onboard.
                </p>
              </div>

              {/* DTC Daily Pass */}
              <div className="rounded-xl border border-[#DAD3C6] bg-[#FFFFFF] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172D3B] flex items-center gap-1.5">
                    <span>🎫</span>
                    <span>DTC Daily Pass</span>
                  </span>
                  <span className="rounded bg-[#F5F0E6] border border-[#DAD3C6] px-2 py-0.5 text-[10px] font-bold text-[#172D3B]">
                    ₹40 / ₹50 Unlimited
                  </span>
                </div>
                <p className="text-[11px] text-[#73766F] leading-relaxed">
                  Unlimited travel on the DTC bus network for an entire day: ₹40 for Non-AC buses, ₹50 for all AC & Non-AC buses. Saves up to ₹70/day for multi-leg journeys.
                </p>
              </div>

              {/* PoochhO Auto Feeder */}
              <div className="rounded-xl border border-[#DAD3C6] bg-[#FFFFFF] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172D3B] flex items-center gap-1.5">
                    <span>🛺</span>
                    <span>PoochhO Statutory Meter</span>
                  </span>
                  <span className="rounded bg-[#EDE7DB] px-2 py-0.5 text-[10px] font-bold text-[#29343A]">
                    No Surge Pricing
                  </span>
                </div>
                <p className="text-[11px] text-[#73766F] leading-relaxed">
                  First 1.5 km at ₹30, thereafter ₹11/km regulated by the Delhi Transport Department. Zero surge pricing during rush hour, saving 25%–40% over commercial ride-hailing apps.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-[#DAD3C6] pt-3 flex items-center justify-between">
          <span className="text-[11px] text-[#73766F]">
            Rates verified against DMRC and DTC notifications.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#C49A43] hover:bg-[#A97C2E] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
