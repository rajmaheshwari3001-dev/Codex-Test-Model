/* Shared TypeScript types matching the backend API models. */

export interface Stop {
  stop_id: string
  stop_name: string
  stop_lat: number
  stop_lon: number
  zone_id: string
}

export interface Route {
  route_id: string
  route_name: string
  route_type: string
  route_color: string
  description: string
  stops: Stop[]
}

export interface JourneyLeg {
  leg_index: number
  trip_id: string
  route_id: string
  route_name: string
  route_color: string
  board_stop_id: string
  board_stop_name: string
  boarding_crowding_level: 'low' | 'medium' | 'high' | 'unknown'
  boarding_crowding_percent: number | null
  alight_stop_id: string
  alight_stop_name: string
  departure_time: string
  arrival_time: string
  intermediate_stops: string[]
  intermediate_stop_ids: string[]
  fare: number | null
  currency: string
}

export interface TransferInfo {
  at_stop_id: string
  at_stop_name: string
  wait_minutes: number
}

export interface JourneyOption {
  option_id: string
  label: string
  total_duration_minutes: number
  departure_time: string
  arrival_time: string
  legs: JourneyLeg[]
  transfers: TransferInfo[]
  total_fare: number | null
  currency: string
  fare_available: boolean
  crowding_warnings: string[]
  delay_warnings: string[]
  data_status: string
  warnings: string[]
}

export interface SavedRoute {
  saved_route_id: number | null
  label: string
  origin_stop_id: string
  origin_stop_name: string
  destination_stop_id: string
  destination_stop_name: string
  preferred_departure_time: string
  preference: string
}

export interface ChatResponse {
  intent: string
  reply: string
  data: unknown
}

export interface BusState {
  bus_id: string
  route_id: string
  trip_id: string
  status: string
  occupancy_percent: number
  delay_minutes: number
}

export interface ScenarioMetrics {
  scenario_name: string
  affected_passengers: number
  average_wait_increase_minutes: number
  delayed_trips: number
  fleet_utilization_percent: number
  total_buses_active: number
  total_buses_available: number
  crowding_increase_percent: number
}

export interface ResponseOption {
  response_id: string
  label: string
  description: string
  feasible: boolean
  reason_if_infeasible: string
  metrics: ScenarioMetrics | null
  explanation: string
  trade_offs: string[]
}

export interface DisruptionResult {
  disruption: {
    disruption_id: string
    disruption_type: string
    affected_bus_id: string
    description: string
    delay_minutes: number
  }
  baseline: ScenarioMetrics
  responses: ResponseOption[]
  recommended_response_id: string | null
  metric_notes: string[]
  fleet_state: { buses: BusState[]; simulated: boolean }
  error?: string
}
