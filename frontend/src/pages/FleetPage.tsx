import FleetDashboard from '../components/FleetDashboard'

export default function FleetPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-200/80 gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Fleet Intelligence & Disruption Dispatch</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time simulated telemetry, countermeasure evaluation, and operational decision support
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            ● Dispatch Terminal Active
          </span>
        </div>
      </div>
      <FleetDashboard />
    </div>
  )
}
