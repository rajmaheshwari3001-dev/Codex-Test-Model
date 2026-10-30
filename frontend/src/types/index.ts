/* Shared TypeScript types matching the backend API models. */

export type ServiceDay = 'weekday' | 'weekend'
export type ModePreference = 'all' | 'metro' | 'bus' | 'auto'

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
  route_type?: string
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
  distance_km?: number | null
  route_distance_km?: number | null
  fare_provenance?: string | null
}

export interface TransferInfo {
  at_stop_id: string
  at_stop_name: string
  wait_minutes: number
  from_mode?: string | null
  to_mode?: string | null
  transfer_description?: string | null
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
  total_distance_km?: number | null
  crowding_warnings: string[]
  delay_warnings: string[]
  data_status: string
  warnings: string[]
  primary_mode?: 'metro' | 'bus' | 'multimodal' | 'auto'
  fare_comparison_note?: string | null
  budget_status?: string | null
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
  service_day: ServiceDay
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

export interface PoochhOEstimate {
  origin_stop_id: string
  origin_stop_name: string
  destination_stop_id: string
  destination_stop_name: string
  haversine_distance_km: number
  estimated_road_distance_km: number
  estimated_duration_minutes: number
  traffic_speed_kmh: number
  is_night_time: boolean
  departure_time: string
  auto_rickshaw: {
    fare: number
    currency: string
    base_fare: number
    rate_per_km: number
    night_surcharge: number
    fare_breakdown: string
  }
  taxi: {
    non_ac_fare: number
    ac_fare: number
    currency: string
    fare_breakdown: string
  }
  feeder_recommendation: string
  provenance: string
}

export interface JourneySearchResponse {
  options: JourneyOption[]
  message?: string
  poochho_estimate?: PoochhOEstimate
}
