import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Calculate live discounts
  const peakDiscount = Math.round(calcFare * 0.1)
  const peakFare = Math.max(0, calcFare - peakDiscount)

  const offPeakDiscount = Math.round(calcFare * 0.2)
  const offPeakFare = Math.max(0, calcFare - offPeakDiscount)

  const monthlySavings = peakDiscount * 2 * 22

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cashback-modal-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#1A2E3B]/70 p-3 sm:p-4 backdrop-blur-sm pointer-events-auto overflow-y-auto animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#EBE5DC] bg-white shadow-2xl p-6 sm:p-7 text-[#1A202C] animate-fade-in pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Cashback and Perks dialog"
          className="absolute top-5 right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#EBE5DC] bg-[#FAF7F2] text-[#7A7269] hover:text-[#1A2E3B] hover:bg-[#F2ECE1] transition-all cursor-pointer active:scale-90 shadow-2xs"
        >
          <XIcon className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="border-b border-[#EBE5DC] pb-4 pr-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF0D9] border border-[#E8D4AE] px-3 py-1 text-xs font-extrabold text-[#9A721C] mb-2">
            <DollarSignIcon className="w-3.5 h-3.5 text-[#C49A43]" />
            <span>Commuter Benefits & Smart Tariffs</span>
          </div>
          <h2 id="cashback-modal-title" className="font-serif text-xl sm:text-2xl font-normal text-[#1A2E3B] tracking-tight">
            Delhi Transit Cashback & Concessions
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#7A7269] leading-relaxed">
            Live calculations on actual statutory savings across Delhi Metro, DTC city buses, and Poochh-O autos
          </p>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-5">
          {/* Interactive Calculator Section */}
          <section aria-labelledby="calc-heading" className="rounded-2xl border border-[#EBE5DC] bg-[#FAF7F2] p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 id="calc-heading" className="text-xs font-bold uppercase tracking-wider text-[#1A2E3B] flex items-center gap-1.5">
                <ZapIcon className="w-3.5 h-3.5 text-[#C49A43]" />
                <span>Smart Card Live Cashback Calculator</span>
              </h3>
              <span className="text-[11px] font-bold text-[#2E7D32] bg-[#EAF5EC] px-2 py-0.5 rounded-full border border-[#D1E7D5]">
                DMRC Approved
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label htmlFor="fare-input" className="text-xs text-[#1A202C] font-semibold">
                Standard Single Token Fare:
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-[#EBE5DC] bg-white px-3 py-1.5 focus-within:border-[#C49A43] focus-within:ring-2 focus-within:ring-[#C49A43]/20 shadow-2xs">
                  <span className="font-bold text-sm text-[#1A2E3B]">₹</span>
                  <input
                    id="fare-input"
                    type="number"
                    min="10"
                    max="100"
                    step="5"
                    value={calcFare || ''}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10)
                      setCalcFare(isNaN(val) ? 0 : Math.max(0, Math.min(120, val)))
                    }}
                    className="w-16 bg-transparent text-sm font-mono font-bold text-[#1A202C] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Fare Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A7269] mr-1">
                Common Fares:
              </span>
              {[
                { label: '₹20 (Short)', fare: 20 },
                { label: '₹30 (Suburban)', fare: 30 },
                { label: '₹40 (Dwarka-CP)', fare: 40 },
                { label: '₹50 (CP-Noida)', fare: 50 },
                { label: '₹60 (Full Line)', fare: 60 },
              ].map(chip => (
                <button
                  key={chip.fare}
                  type="button"
                  onClick={() => setCalcFare(chip.fare)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    calcFare === chip.fare
                      ? 'bg-[#C49A43] text-white shadow-2xs'
                      : 'bg-white border border-[#EBE5DC] text-[#1A2E3B] hover:border-[#C49A43]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Savings Cards Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-[#EBE5DC] bg-white p-3 text-center space-y-1 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A7269]">
                  Peak Hours (-10%)
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-[#1A2E3B]">
                  ₹{peakFare}
                </div>
                <div className="text-[10px] font-bold text-[#2E7D32]">
                  Saves ₹{peakDiscount} per ride
                </div>
              </div>

              <div className="rounded-xl border border-[#C5E5CC] bg-[#EAF5EC] p-3 text-center space-y-1 shadow-2xs">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#2E7D32]">
                  Off-Peak Hours (-20%)
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black text-[#2E7D32]">
                  ₹{offPeakFare}
                </div>
                <div className="text-[10px] font-extrabold text-[#22702E]">
                  Saves ₹{offPeakDiscount} per ride
                </div>
              </div>
            </div>

            {/* Cumulative Projection */}
            <div className="rounded-xl bg-white border border-[#EBE5DC] p-3 text-xs text-[#1A2E3B] flex items-center justify-between shadow-2xs">
              <span className="font-medium text-[#7A7269]">Monthly Commuter Savings (44 trips):</span>
              <span className="font-mono font-black text-sm text-[#2E7D32]">₹{monthlySavings} / mo</span>
            </div>
          </section>

          {/* Statutory Concessions List */}
          <section aria-labelledby="perks-heading" className="space-y-3">
            <h3 id="perks-heading" className="text-xs font-bold uppercase tracking-wider text-[#7A7269]">
              Official Delhi Concession Policies
            </h3>

            <div className="space-y-2.5 text-xs">
              {/* DMRC Smart Card */}
              <div className="rounded-2xl border border-[#EBE5DC] bg-white p-4 space-y-1.5 shadow-2xs hover:border-[#C49A43] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1A2E3B] flex items-center gap-2">
                    <TrainIcon className="w-4 h-4 text-[#C49A43]" />
                    <span>Delhi Metro Smart Card</span>
                  </span>
                  <span className="rounded-full bg-[#EAF5EC] border border-[#D1E7D5] px-2.5 py-0.5 text-[10px] font-bold text-[#2E7D32]">
                    10% — 20% Off
                  </span>
                </div>
                <p className="text-[11px] text-[#7A7269] leading-relaxed">
                  Automatic 10% discount on all token fares. Additional 10% statutory discount applies during off-peak windows (before 08:00 AM, 12:00 PM – 05:00 PM, and after 09:00 PM, plus all day Sundays).
                </p>
              </div>

              {/* DTC Pink Ticket */}
              <div className="rounded-2xl border border-[#EBE5DC] bg-white p-4 space-y-1.5 shadow-2xs hover:border-[#A6533C] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1A2E3B] flex items-center gap-2">
                    <BusIcon className="w-4 h-4 text-[#A6533C]" />
                    <span>DTC Pink Ticket Scheme</span>
                  </span>
                  <span className="rounded-full bg-[#FDE8E8] border border-[#F8B4B4] px-2.5 py-0.5 text-[10px] font-bold text-[#9B1C1C]">
                    100% Free for Women
                  </span>
                </div>
                <p className="text-[11px] text-[#7A7269] leading-relaxed">
                  Women passengers travel completely free on all DTC and Cluster Non-AC and AC city buses using single-journey Pink Passes issued onboard.
                </p>
              </div>

              {/* DTC Daily Pass */}
              <div className="rounded-2xl border border-[#EBE5DC] bg-white p-4 space-y-1.5 shadow-2xs hover:border-[#1A2E3B] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1A2E3B] flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-[#1A2E3B]" />
                    <span>DTC Daily Pass</span>
                  </span>
                  <span className="rounded-full bg-[#FAF7F2] border border-[#EBE5DC] px-2.5 py-0.5 text-[10px] font-bold text-[#1A2E3B]">
                    ₹40 / ₹50 Unlimited
                  </span>
                </div>
                <p className="text-[11px] text-[#7A7269] leading-relaxed">
                  Unlimited travel on the DTC bus network for an entire calendar day: ₹40 for Non-AC buses, ₹50 for all AC & Non-AC buses. Saves up to ₹70/day for multi-leg journeys.
                </p>
              </div>

              {/* PoochhO Auto Feeder */}
              <div className="rounded-2xl border border-[#EBE5DC] bg-white p-4 space-y-1.5 shadow-2xs hover:border-[#2E7D32] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1A2E3B] flex items-center gap-2">
                    <AutoRickshawIcon className="w-4 h-4 text-[#2E7D32]" />
                    <span>PoochhO Statutory Meter</span>
                  </span>
                  <span className="rounded-full bg-[#FAF7F2] border border-[#EBE5DC] px-2.5 py-0.5 text-[10px] font-bold text-[#1A2E3B]">
                    No Surge Pricing
                  </span>
                </div>
                <p className="text-[11px] text-[#7A7269] leading-relaxed">
                  Regulated by Delhi Transport Department: First 1.5 km at ₹30, thereafter ₹11/km. Zero surge pricing during rush hour, saving 25%–40% over commercial ride-hailing apps.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-[#EBE5DC] pt-4 flex items-center justify-between">
          <span className="text-[11px] text-[#7A7269]">
            Rates verified against DMRC and DTC notifications.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-[#C49A43] via-[#BA8F39] to-[#AF842F] hover:from-[#B88E3B] hover:via-[#AF842F] hover:to-[#A17528] px-6 py-2.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(196,154,67,0.3)] hover:shadow-[0_6px_20px_rgba(196,154,67,0.4)] transition-all cursor-pointer active:scale-95"
          >
            Done ✓
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent
}
