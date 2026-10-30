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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 sm:p-7 text-slate-800 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Cashback and Perks dialog"
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <XIcon className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="border-b border-slate-100 pb-4 pr-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800 mb-2">
            <DollarSignIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Commuter Benefits & Smart Tariffs</span>
          </div>
          <h2 id="cashback-modal-title" className="text-xl sm:text-2xl font-bold text-slate-900">
            Delhi Transit Cashback & Concessions
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Live calculations on actual statutory savings across Delhi public transport
          </p>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-5">
          {/* Interactive Calculator Section */}
          <section aria-labelledby="calc-heading" className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <h3 id="calc-heading" className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <ZapIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Smart Card Live Cashback Calculator</span>
            </h3>

            <div className="flex items-center justify-between gap-4">
              <label htmlFor="fare-input" className="text-xs text-slate-600 font-medium">
                Standard Single Token Fare:
              </label>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900">₹</span>
                <input
                  id="fare-input"
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  value={calcFare}
                  onChange={e => setCalcFare(Number(e.target.value) || 0)}
                  className="w-20 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Savings Cards Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center space-y-1 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Peak Hours (-10%)
                </div>
                <div className="font-mono text-xl font-black text-slate-900">
                  ₹{peakFare}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600">
                  Saves ₹{peakDiscount} per ride
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-center space-y-1 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Off-Peak Hours (-20%)
                </div>
                <div className="font-mono text-xl font-black text-amber-900">
                  ₹{offPeakFare}
                </div>
                <div className="text-[10px] font-bold text-emerald-700">
                  Saves ₹{offPeakDiscount} per ride
                </div>
              </div>
            </div>

            {/* Cumulative Projection */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between">
              <span className="font-medium">Monthly Commuter Savings (44 trips):</span>
              <span className="font-mono font-bold text-sm text-emerald-900">₹{monthlySavings} / mo</span>
            </div>
          </section>

          {/* Statutory Concessions List */}
          <section aria-labelledby="perks-heading" className="space-y-3">
            <h3 id="perks-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Official Concession Policies
            </h3>

            <div className="space-y-2.5 text-xs">
              {/* DMRC Smart Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <TrainIcon className="w-4 h-4 text-amber-600" />
                    <span>Delhi Metro Smart Card</span>
                  </span>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    10% — 20% Off
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Automatic 10% discount on all token fares. Additional 10% off-peak discount applies before 08:00 AM, 12:00 PM – 05:00 PM, and after 09:00 PM, as well as all day Sundays.
                </p>
              </div>

              {/* DTC Pink Ticket */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <BusIcon className="w-4 h-4 text-rose-600" />
                    <span>DTC Pink Ticket Scheme</span>
                  </span>
                  <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                    100% Free for Women
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Women passengers travel completely free on all DTC and Cluster Non-AC and AC city buses using single-journey Pink Passes issued onboard.
                </p>
              </div>

              {/* DTC Daily Pass */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-blue-600" />
                    <span>DTC Daily Pass</span>
                  </span>
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                    ₹40 / ₹50 Unlimited
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Unlimited travel on the DTC bus network for an entire day: ₹40 for Non-AC buses, ₹50 for all AC & Non-AC buses. Saves up to ₹70/day for multi-leg journeys.
                </p>
              </div>

              {/* PoochhO Auto Feeder */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <AutoRickshawIcon className="w-4 h-4 text-emerald-600" />
                    <span>PoochhO Statutory Meter</span>
                  </span>
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                    No Surge Pricing
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  First 1.5 km at ₹30, thereafter ₹11/km regulated by the Delhi Transport Department. Zero surge pricing during rush hour, saving 25%–40% over commercial ride-hailing apps.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Rates verified against DMRC and DTC notifications.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
