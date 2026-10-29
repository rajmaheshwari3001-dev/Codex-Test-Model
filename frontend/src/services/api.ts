/* API service – all requests to the FastAPI backend go through here. */

import type {
  Stop, Route, JourneyOption, SavedRoute, ChatResponse,
  BusState, DisruptionResult,
} from '../types'

const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function getHealth() {
  return request<{ status: string; application: string }>('/health')
}

export async function getStops() {
  return request<Stop[]>('/stops')
}

export async function getRoutes() {
  return request<Route[]>('/routes')
}

export async function searchJourneys(body: {
  origin_stop_id: string
  destination_stop_id: string
  departure_time: string
  preference: string
}) {
  return request<{ options: JourneyOption[]; message?: string }>(
    '/journeys/search',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export async function createSavedRoute(body: Omit<SavedRoute, 'saved_route_id'>) {
  return request<SavedRoute>('/saved-routes', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getSavedRoutes() {
  return request<SavedRoute[]>('/saved-routes')
}

export async function deleteSavedRoute(id: number) {
  return request<{ message: string }>(`/saved-routes/${id}`, { method: 'DELETE' })
}

export async function sendChatMessage(message: string) {
  return request<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export async function getFleetState() {
  return request<{ buses: BusState[]; simulated: boolean }>('/fleet/state')
}

export async function triggerDisruption(body: {
  disruption_type: string
  affected_bus_id: string
  description?: string
  delay_minutes?: number
}) {
  return request<DisruptionResult>('/fleet/disruption', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function approveResponse(body: {
  disruption_id: string
  response_id: string
  approved: boolean
}) {
  return request<{
    message: string
    fleet_state: { buses: BusState[]; simulated: boolean }
  }>('/fleet/approve', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function setDelay(trip_id: string, delay_minutes: number) {
  return request<{ message: string }>('/delays', {
    method: 'POST',
    body: JSON.stringify({ trip_id, delay_minutes }),
  })
}

export async function getDelays() {
  return request<{ delays: Record<string, number>; simulated: boolean }>('/delays')
}

export async function clearDelays() {
  return request<{ message: string }>('/delays', { method: 'DELETE' })
}
