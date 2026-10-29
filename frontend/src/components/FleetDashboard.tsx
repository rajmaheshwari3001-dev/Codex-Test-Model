import { useState, useEffect } from 'react'
import type { BusState, DisruptionResult } from '../types'
import { getFleetState, triggerDisruption, approveResponse } from '../services/api'
import ScenarioComparison from './ScenarioComparison'

export default function FleetDashboard() {
  const [buses, setBuses] = useState<BusState[]>([])
  const [loading, setLoading] = useState(true)
  const [disruptionType, setDisruptionType] = useState('breakdown')
  const [selectedBus, setSelectedBus] = useState('')
  const [delayMinutes, setDelayMinutes] = useState(15)
  const [result, setResult] = useState<DisruptionResult | null>(null)
  const [actionMsg, setActionMsg] = useState('')
  const [decisionMade, setDecisionMade] = useState(false)
  const [decisionPending, setDecisionPending] = useState(false)
  const [simulating, setSimulating] = useState(false)

  // Filters for bus roster
  const [routeFilter, setRouteFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    getFleetState()
      .then(data => updateFleetState(data.buses))
      .catch(error => {
        setActionMsg(
          error instanceof Error
            ? `Failed to load fleet state: ${error.message}`
            : 'Failed to load fleet state.',
        )
      })
      .finally(() => setLoading(false))
  }, [])

  function updateFleetState(nextBuses: BusState[]) {
    setBuses(nextBuses)
    setSelectedBus(current => {
      if (nextBuses.some(b => b.bus_id === current && b.status === 'active')) {
        return current
      }
      return nextBuses.find(b => b.status === 'active')?.bus_id ?? ''
    })
  }

  async function handleDisrupt() {
    if (!selectedBus) return
    setSimulating(true)
    setResult(null)
    setActionMsg('')
    setDecisionMade(false)
    try {
      const res = await triggerDisruption({
        disruption_type: disruptionType,
        affected_bus_id: selectedBus,
        description: `Simulated ${disruptionType} for vehicle ${selectedBus}`,
        delay_minutes: disruptionType === 'delay' ? delayMinutes : 0,
      })
      updateFleetState(res.fleet_state.buses)
      setResult(res)
    } catch (error) {
      setActionMsg(error instanceof Error ? error.message : 'Disruption evaluation failed.')
    } finally {
      setSimulating(false)
    }
  }

  async function handleApprove(responseId: string, approved: boolean) {
    if (!result || decisionMade || decisionPending) return
    setDecisionPending(true)
    try {
      const res = await approveResponse({
        disruption_id: result.disruption.disruption_id,
        response_id: responseId,
        approved,
      })
      updateFleetState(res.fleet_state.buses)
      setDecisionMade(true)
      setActionMsg(res.message)
    } catch (error) {
      setActionMsg(error instanceof Error ? error.message : 'Response decision failed.')
    } finally {
      setDecisionPending(false)
    }
  }

  const activeBuses = buses.filter(b => b.status === 'active')
  const spareBuses = buses.filter(b => b.status === 'spare')
  const brokenBuses = buses.filter(b => b.status === 'broken_down')
  const delayedBuses = buses.filter(b => b.delay_minutes > 0)

  // Filtered list
  const filteredBuses = buses.filter(b => {
    if (routeFilter !== 'ALL' && b.route_id !== routeFilter) return false
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false
    if (searchQuery && !b.bus_id.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const uniqueRoutes = Array.from(new Set(buses.map(b => b.route_id).filter(Boolean))).sort()

  const statusColor: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    spare: 'bg-amber-100 text-amber-800 border-amber-200',
    broken_down: 'bg-red-100 text-red-800 border-red-200',
    reassigned: 'bg-blue-100 text-blue-800 border-blue-200',
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
        <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading simulated fleet telemetry...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Simulation Transparency Banner */}
      <div className="bg-indigo-50 border border-indigo-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🔬</span>
          <div>
            <div className="text-xs font-bold text-indigo-950">Deterministic Operations Simulator</div>
            <div className="text-[11px] text-indigo-800/80">
              Fleet telemetry, breakdown events, and operational responses are generated from synthetic simulation models.
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono font-semibold uppercase text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
          Sandboxed Mode
        </span>
      </div>

      {/* Active Operational Alerts Banner */}
      {(brokenBuses.length > 0 || delayedBuses.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-3 text-xs text-red-900 shadow-xs">
          <span className="text-xl" aria-hidden="true">🚨</span>
          <div>
            <span className="font-bold">Active Fleet Disruption Alerts: </span>
            <span>
              {brokenBuses.length > 0 && `${brokenBuses.length} vehicle(s) broken down. `}
              {delayedBuses.length > 0 && `${delayedBuses.length} trip(s) experiencing delays.`}
            </span>
          </div>
        </div>
      )}

      {/* Fleet Overview & Telemetry Cards */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-gray-100 gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Fleet Operations Telemetry</h2>
            <p className="text-xs text-gray-500">Live monitoring of simulated transit rolling stock</p>
          </div>
          <div className="text-xs text-gray-400">
            {buses.length} vehicles registered across {uniqueRoutes.length} routes
          </div>
        </div>

        {/* Metric summary counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{buses.length}</div>
            <div className="text-xs font-medium text-gray-500">Total Fleet</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-700">{activeBuses.length}</div>
            <div className="text-xs font-medium text-emerald-800">Active Service</div>
          </div>
          <div className="bg-amber-50 border border-amber-150 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-amber-700">{spareBuses.length}</div>
            <div className="text-xs font-medium text-amber-800">Depot Spares</div>
          </div>
          <div className="bg-red-50 border border-red-150 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{brokenBuses.length}</div>
            <div className="text-xs font-medium text-red-800">Disrupted</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-3 bg-gray-50/70 p-2.5 rounded-lg border border-gray-200">
          <div className="flex-1 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by Bus ID (e.g. B-T01)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={routeFilter}
              onChange={e => setRouteFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Routes</option>
              {uniqueRoutes.map(r => (
                <option key={r} value={r}>Route {r}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="spare">Spare Only</option>
              <option value="broken_down">Broken Down</option>
            </select>
          </div>
        </div>

        {/* Bus Roster Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
              <tr>
                <th scope="col" className="py-2.5 px-3">Vehicle ID</th>
                <th scope="col" className="py-2.5 px-3">Route</th>
                <th scope="col" className="py-2.5 px-3">Active Trip</th>
                <th scope="col" className="py-2.5 px-3">Operational Status</th>
                <th scope="col" className="py-2.5 px-3">Passenger Load</th>
                <th scope="col" className="py-2.5 px-3">Schedule Adherence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {filteredBuses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    No vehicles match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBuses.map(b => (
                  <tr key={b.bus_id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-gray-900">{b.bus_id}</td>
                    <td className="py-2 px-3 font-semibold text-gray-700">{b.route_id || '—'}</td>
                    <td className="py-2 px-3 font-mono text-gray-500">{b.trip_id || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusColor[b.status] || 'bg-gray-100 text-gray-700'}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              b.occupancy_percent > 80
                                ? 'bg-red-500'
                                : b.occupancy_percent > 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(b.occupancy_percent, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-gray-700">{b.occupancy_percent}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {b.delay_minutes > 0 ? (
                        <span className="text-red-700 font-semibold font-mono">+{b.delay_minutes} min late</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">On Schedule</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disruption Simulator Trigger Panel */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
        <div className="pb-3 mb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Simulate Operational Disruption</h2>
          <p className="text-xs text-gray-500">
            Inject synthetic operational incidents to compute candidate countermeasure evaluations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Incident Type</label>
            <select
              value={disruptionType}
              onChange={e => setDisruptionType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="breakdown">Mechanical Breakdown (Bus Failure)</option>
              <option value="delay">Corridor Delay (Congestion)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Target Active Vehicle</label>
            <select
              value={selectedBus}
              onChange={e => setSelectedBus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {activeBuses.map(b => (
                <option key={b.bus_id} value={b.bus_id}>
                  {b.bus_id} ({b.route_id} • Trip {b.trip_id})
                </option>
              ))}
            </select>
          </div>

          {disruptionType === 'delay' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Delay Magnitude (minutes)</label>
              <input
                type="number"
                value={delayMinutes}
                onChange={e => setDelayMinutes(Math.max(1, Math.min(120, Number(e.target.value))))}
                min={1}
                max={120}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 font-mono bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDisrupt}
          disabled={simulating || !selectedBus}
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-2"
        >
          {simulating ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Evaluating Countermeasures...</span>
            </>
          ) : (
            <span>Simulate Disruption & Compare Responses</span>
          )}
        </button>
      </div>

      {/* Scenario Comparison Section */}
      {result && !result.error && (
        <ScenarioComparison
          result={result}
          onApprove={handleApprove}
          decisionMade={decisionMade}
          decisionPending={decisionPending}
        />
      )}

      {result?.error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-800">
          <div className="font-bold mb-1">Simulation Error</div>
          <div>{result.error}</div>
        </div>
      )}

      {actionMsg && (
        <div
          role="status"
          className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 font-medium flex items-center gap-2 shadow-xs"
        >
          <span aria-hidden="true">ℹ️</span>
          <span>{actionMsg}</span>
        </div>
      )}
    </div>
  )
}
