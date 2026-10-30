import FleetDashboard from '../components/FleetDashboard'
import { BusIcon, ShieldCheckIcon } from '../components/common/Icons'

export default function FleetPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Operations Control Center Command Header */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7 text-white shadow-md">
        {/* Background artwork with responsive PC vs Mobile switching */}
        <picture className="absolute inset-0 z-0 opacity-25">
          <source media="(min-width: 768px)" srcSet="/images/delhi_transit_pc.jpg" />
          <img
            src="/images/delhi_transit_mobile.jpg"
            alt="Delhi Transit Fleet Network"
            className="w-full h-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-slate-900/50" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-0.5 text-xs font-semibold text-slate-200">
                <BusIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Fleet Telemetry Console</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-0.5 text-xs font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Simulator Active</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Fleet Telemetry & Incident Coordination
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300">
              Monitor simulated Delhi bus fleet operations, trigger disruption scenarios (mechanical breakdown, route delay), evaluate algorithmic dispatch recommendations, and record operational approvals.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 text-xs backdrop-blur-sm">
            <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Decision Engine
              </div>
              <div className="font-mono text-sm font-bold text-white">
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
