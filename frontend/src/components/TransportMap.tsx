import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import type { JourneyOption, Stop, Route as TRoute } from '../types'

interface Props {
  stops: Stop[]
  routes: TRoute[]
  selectedJourney: JourneyOption | null
}

function isValidCoord(lat: unknown, lon: unknown): lat is number {
  return typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}

export default function TransportMap({ stops, routes, selectedJourney }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const [hasJourney, setHasJourney] = useState(false)

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Center on Delhi metropolitan coordinates
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([28.6139, 77.2090], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 18,
      minZoom: 9,
    }).addTo(map)

    mapRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Draw Layers
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return
    const lg = layerGroupRef.current
    lg.clearLayers()

    const validStops = stops.filter(s => isValidCoord(s.stop_lat, s.stop_lon))
    const stopsById = new Map(validStops.map(s => [s.stop_id, s]))

    // 1. Draw all transit route polylines
    routes.forEach(route => {
      if (!route.stops || route.stops.length < 2) return
      const validRoutePoints = route.stops
        .filter(s => isValidCoord(s.stop_lat, s.stop_lon))
        .map(s => [s.stop_lat, s.stop_lon] as [number, number])

      if (validRoutePoints.length >= 2) {
        L.polyline(validRoutePoints, {
          color: route.route_color || '#94a3b8',
          weight: 3,
          opacity: 0.35,
          dashArray: '4, 4',
        })
          .bindTooltip(`Route ${route.route_name}`, { sticky: true })
          .addTo(lg)
      }
    })

    // 2. Draw all stops as standard network node markers
    validStops.forEach(s => {
      L.circleMarker([s.stop_lat, s.stop_lon], {
        radius: 4.5,
        color: '#64748b',
        fillColor: '#cbd5e1',
        fillOpacity: 0.8,
        weight: 1.5,
      })
        .bindTooltip(`<b>${s.stop_name}</b><br/><span style="font-size:10px;color:#64748b">Zone ${s.zone_id} • Stop ${s.stop_id}</span>`, {
          direction: 'top',
          offset: [0, -6],
        })
        .addTo(lg)
    })

    // 3. Highlight selected journey path and key stops
    if (selectedJourney && selectedJourney.legs.length > 0) {
      setHasJourney(true)
      const journeyCoords: [number, number][] = []
      const boardStopId = selectedJourney.legs[0]?.board_stop_id
      const finalAlightStopId = selectedJourney.legs[selectedJourney.legs.length - 1]?.alight_stop_id
      const transferStopIds = new Set(selectedJourney.transfers.map(t => t.at_stop_id))

      selectedJourney.legs.forEach(leg => {
        const legStopIds = [
          leg.board_stop_id,
          ...(leg.intermediate_stop_ids || []),
          leg.alight_stop_id,
        ]

        const legCoords: [number, number][] = []
        legStopIds.forEach(stopId => {
          const stopObj = stopsById.get(stopId)
          if (stopObj && isValidCoord(stopObj.stop_lat, stopObj.stop_lon)) {
            legCoords.push([stopObj.stop_lat, stopObj.stop_lon])
          }
        })

        if (legCoords.length >= 2) {
          // Glow shadow under active line
          L.polyline(legCoords, {
            color: leg.route_color || '#4f46e5',
            weight: 7,
            opacity: 0.3,
          }).addTo(lg)

          // Main journey polyline
          L.polyline(legCoords, {
            color: leg.route_color || '#4f46e5',
            weight: 4,
            opacity: 0.95,
          })
            .bindTooltip(`${leg.route_name} (${leg.departure_time} - ${leg.arrival_time})`, {
              sticky: true,
            })
            .addTo(lg)

          journeyCoords.push(...legCoords)
        }
      })

      // Draw Key Special Markers (Origin, Destination, Transfer)
      validStops.forEach(s => {
        if (s.stop_id === boardStopId) {
          // Origin: Distinctive Emerald Green
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 8,
            color: '#065f46',
            fillColor: '#10b981',
            fillOpacity: 1,
            weight: 2.5,
          })
            .bindTooltip(`🟢 <b>Origin: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -9],
            })
            .addTo(lg)
        } else if (s.stop_id === finalAlightStopId) {
          // Destination: Distinctive Crimson Red
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 8,
            color: '#991b1b',
            fillColor: '#ef4444',
            fillOpacity: 1,
            weight: 2.5,
          })
            .bindTooltip(`🔴 <b>Destination: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -9],
            })
            .addTo(lg)
        } else if (transferStopIds.has(s.stop_id)) {
          // Transfer Junction: Purple
          L.circleMarker([s.stop_lat, s.stop_lon], {
            radius: 7,
            color: '#5b21b6',
            fillColor: '#8b5cf6',
            fillOpacity: 1,
            weight: 2,
          })
            .bindTooltip(`🔄 <b>Transfer: ${s.stop_name}</b>`, {
              permanent: true,
              direction: 'top',
              offset: [0, -8],
            })
            .addTo(lg)
        }
      })

      // Auto-fit bounds
      if (journeyCoords.length >= 2) {
        mapRef.current.fitBounds(L.latLngBounds(journeyCoords.map(c => L.latLng(c[0], c[1]))), {
          padding: [45, 45],
          maxZoom: 14,
        })
      }
    } else {
      setHasJourney(false)
      // Fit to all stops if no journey is selected
      if (validStops.length > 0) {
        const allCoords = validStops.map(s => L.latLng(s.stop_lat, s.stop_lon))
        mapRef.current.fitBounds(L.latLngBounds(allCoords), {
          padding: [30, 30],
        })
      }
    }
  }, [stops, routes, selectedJourney])

  function handleResetView() {
    if (!mapRef.current) return
    const validStops = stops.filter(s => isValidCoord(s.stop_lat, s.stop_lon))
    if (validStops.length > 0) {
      const allCoords = validStops.map(s => L.latLng(s.stop_lat, s.stop_lon))
      mapRef.current.fitBounds(L.latLngBounds(allCoords), {
        padding: [30, 30],
      })
    } else {
      mapRef.current.setView([28.6139, 77.2090], 12)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden relative">
      {/* Map Control Bar Overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-lg shadow-sm border border-gray-200 text-xs">
        <button
          type="button"
          onClick={handleResetView}
          className="px-2.5 py-1 text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded font-medium transition-colors"
          title="Fit whole transit network on screen"
        >
          Reset Network
        </button>
        {hasJourney && (
          <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium border border-indigo-100">
            Journey Active
          </span>
        )}
      </div>

      {/* Main Leaflet Map Container */}
      <div
        ref={containerRef}
        className="w-full h-[400px] sm:h-[460px] z-10"
        aria-label="Interactive Transit Map"
        role="region"
      />

      {/* Map Footer Provenance Note */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-1.5 text-[11px] text-gray-500 flex flex-wrap items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Origin</span>
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          <span>Destination</span>
          <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
          <span>Transfer</span>
        </div>
        <span className="text-gray-400">
          OpenStreetMap tiles • Real GPS Coordinates • Simulated Fleet
        </span>
      </div>
    </div>
  )
}
