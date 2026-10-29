import FleetDashboard from '../components/FleetDashboard'

export default function FleetPage() {
  return (
    <div className="space-y-6">
      {/* Operations Control Center Command Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-r from-[#0B1020] via-[#172554] to-slate-900 p-6 text-white shadow-xl shadow-slate-900/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.2),_transparent_60%)]" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/20 px-3 py-1 font-mono text-xs font-bold text-blue-300 backdrop-blur-md">
                <span className="h-2 w-2 animate-ping rounded-full bg-blue-400" />
                OPERATIONS CONTROL CENTER (OCC)
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 font-mono text-xs font-semibold text-emerald-300">
                Simulated Telemetry Active
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
              Fleet Coordination & Intelligence
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-300">
              Live monitoring of simulated rolling stock, corridor health diagnostics, operational disruption injection, and automated countermeasure evaluation.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Response Authority</div>
              <div className="text-sm font-extrabold text-white">Operator Approval Required</div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg">
              🛡️
            </div>
          </div>
        </div>
      </section>

      <FleetDashboard />
    </div>
  )
}
