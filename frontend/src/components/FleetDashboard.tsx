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
    setSelectedBus(current => (
      nextBuses.some(bus => bus.bus_id === current && bus.status === 'active')
        ? current
        : nextBuses.find(bus => bus.status === 'active')?.bus_id ?? ''
    ))
  }

  async function handleDisrupt() {
    setResult(null)
    setActionMsg('')
    setDecisionMade(false)
    try {
      const res = await triggerDisruption({
        disruption_type: disruptionType,
        affected_bus_id: selectedBus,
        description: `Simulated ${disruptionType} for ${selectedBus}`,
        delay_minutes: disruptionType === 'delay' ? delayMinutes : 0,
      })
      updateFleetState(res.fleet_state.buses)
      setResult(res)
    } catch (error) {
      setActionMsg(error instanceof Error ? error.message : 'Disruption evaluation failed.')
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

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    spare: 'bg-yellow-100 text-yellow-700',
    broken_down: 'bg-red-100 text-red-700',
    reassigned: 'bg-blue-100 text-blue-700',
  }

  if (loading) return <div className="text-gray-500">Loading fleet data...</div>

  return (
    <div className="space-y-6">
      {/* Fleet overview */}
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Fleet Overview</h2>
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div className="bg-gray-50 rounded p-3">
            <div className="text-2xl font-bold text-gray-900">{buses.length}</div>
            <div className="text-xs text-gray-500">Total Buses</div>
          </div>
          <div className="bg-green-50 rounded p-3">
            <div className="text-2xl font-bold text-green-700">{activeBuses.length}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="bg-yellow-50 rounded p-3">
            <div className="text-2xl font-bold text-yellow-700">{spareBuses.length}</div>
            <div className="text-xs text-gray-500">Spare</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="py-2 pr-4">Bus</th>
                <th className="py-2 pr-4">Route</th>
                <th className="py-2 pr-4">Trip</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Load</th>
                <th className="py-2">Delay</th>
              </tr>
            </thead>
            <tbody>
              {buses.map(b => (
                <tr key={b.bus_id} className="border-b last:border-0">
                  <td className="py-1.5 pr-4 font-mono text-xs">{b.bus_id}</td>
                  <td className="py-1.5 pr-4">{b.route_id || '-'}</td>
                  <td className="py-1.5 pr-4">{b.trip_id || '-'}</td>
                  <td className="py-1.5 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColor[b.status] || 'bg-gray-100'}`}>{b.status}</span>
                  </td>
                  <td className="py-1.5 pr-4">{b.occupancy_percent}%</td>
                  <td className="py-1.5">{b.delay_minutes > 0 ? `+${b.delay_minutes} min` : 'On time'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-1">All fleet data is simulated.</p>
        </div>
      </div>

      {/* Disruption trigger */}
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Trigger Disruption</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={disruptionType}
              onChange={e => setDisruptionType(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="breakdown">Bus Breakdown</option>
              <option value="delay">Delay</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Affected Bus</label>
            <select
              value={selectedBus}
              onChange={e => setSelectedBus(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              {activeBuses.map(b => (
                <option key={b.bus_id} value={b.bus_id}>{b.bus_id} ({b.route_id})</option>
              ))}
            </select>
          </div>
          {disruptionType === 'delay' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Delay (min)</label>
              <input
                type="number"
                value={delayMinutes}
                onChange={e => setDelayMinutes(Number(e.target.value))}
                min={1}
                max={120}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>
        <button
          onClick={handleDisrupt}
          className="bg-red-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Simulate Disruption
        </button>
      </div>

      {/* Scenario comparison */}
      {result && !result.error && (
        <ScenarioComparison
          result={result}
          onApprove={handleApprove}
          decisionMade={decisionMade}
          decisionPending={decisionPending}
        />
      )}
      {result?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{result.error}</div>
      )}
      {actionMsg && (
        <div role="status" className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">{actionMsg}</div>
      )}
    </div>
  )
}
