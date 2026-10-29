import FleetDashboard from '../components/FleetDashboard'

export default function FleetPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">Fleet Intelligence</h1>
        <p className="text-sm text-gray-500">Simulate disruptions and evaluate response options. All data is simulated.</p>
      </div>
      <FleetDashboard />
    </div>
  )
}
