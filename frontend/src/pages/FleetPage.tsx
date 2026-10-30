import FleetDashboard from '../components/FleetDashboard'
import { BusIcon, ShieldCheckIcon } from '../components/common/Icons'

export default function FleetPage() {
  return (
    <div className="space-y-6 max-w-[1720px] mx-auto py-2 animate-fade-in">
      {/* Operations Control Center Header Matching Figma Design Language */}
      <section className="rounded-2xl border border-[#EBE5DC] bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C49A43]">
                OPERATIONS & CONTROL CENTRE
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF5EC] border border-[#D1E7D5] px-2.5 py-0.5 text-[11px] font-bold text-[#2E7D32]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
                <span>Simulator Active</span>
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A2E3B]">
              Fleet Telemetry & Incident Coordination
            </h1>
            <p className="max-w-3xl text-xs sm:text-sm text-[#7A7269] leading-relaxed">
              Real-time monitoring of Delhi DTC bus corridors, disruption simulation (mechanical breakdowns, traffic delays), algorithmic dispatch recommendations, and operational approvals.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-[#EBE5DC] bg-[#FAF7F2] p-3.5 text-xs shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1A2E3B] text-white">
              <ShieldCheckIcon className="w-5 h-5 text-[#C49A43]" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A7269]">
                Decision Engine
              </div>
              <div className="font-mono text-xs font-bold text-[#1A2E3B]">
                Rule & Graph Engine
              </div>
            </div>
          </div>
        </div>
      </section>

      <FleetDashboard />
    </div>
  )
}
