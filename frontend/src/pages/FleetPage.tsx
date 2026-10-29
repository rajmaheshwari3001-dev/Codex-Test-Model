import FleetDashboard from '../components/FleetDashboard'

export default function FleetPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Operations Control Center Command Header */}
      <section className="rounded-xl border border-[#E8DFCE] bg-[#173B32] p-6 text-white shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#FAF7F2]/10 border border-[#FAF7F2]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#F5F0E6]">
                Fleet Intelligence Module
              </span>
              <span className="rounded-md bg-[#236B56] px-2.5 py-0.5 text-[11px] font-bold text-white">
                Simulator Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#FFFFFF]">
              Fleet Telemetry & Incident Coordination
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-[#E8DFCE]">
              Monitor simulated bus fleet operations, trigger disruption scenarios (breakdown, delay), evaluate algorithm recommendations, and record operational approvals.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-lg border border-[#FAF7F2]/20 bg-[#FAF7F2]/10 p-4 text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#E8DFCE]/80">
                Evaluation Model
              </div>
              <div className="font-mono text-sm font-bold text-[#FFFFFF]">
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
