import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { JourneyOption, Stop, Route as TRoute } from '../types'

interface Props {
  stops: Stop[]
  routes: TRoute[]
  selectedJourney: JourneyOption | null
}

export default function TransportMap({ stops, routes, selectedJourney }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current).setView([28.61, 77.2], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    mapRef.current = map
    layerGroupRef.current = L.layerGroup().addTo(map)

    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return
    const lg = layerGroupRef.current
    lg.clearLayers()

    // Draw all stops as small gray markers.
    stops.forEach(s => {
      L.circleMarker([s.stop_lat, s.stop_lon], {
        radius: 5, color: '#6b7280', fillColor: '#d1d5db', fillOpacity: 0.7, weight: 1,
      })
        .bindTooltip(s.stop_name, { direction: 'top', offset: [0, -5] })
        .addTo(lg)
    })

    // Draw route lines.
    routes.forEach(route => {
      if (!route.stops || route.stops.length < 2) return
      const latlngs = route.stops.map(s => [s.stop_lat, s.stop_lon] as [number, number])
      L.polyline(latlngs, { color: route.route_color, weight: 2, opacity: 0.3 }).addTo(lg)
    })

    // Highlight selected journey.
    if (selectedJourney) {
      const journeyStopIds = new Set<string>()
      const journeyCoords: [number, number][] = []

      selectedJourney.legs.forEach(leg => {
        journeyStopIds.add(leg.board_stop_id)
        journeyStopIds.add(leg.alight_stop_id)

        const boardStop = stops.find(s => s.stop_id === leg.board_stop_id)
        const alightStop = stops.find(s => s.stop_id === leg.alight_stop_id)
        if (boardStop) journeyCoords.push([boardStop.stop_lat, boardStop.stop_lon])
        if (alightStop) journeyCoords.push([alightStop.stop_lat, alightStop.stop_lon])
      })

      // Draw journey path.
      if (journeyCoords.length >= 2) {
        L.polyline(journeyCoords, { color: '#4f46e5', weight: 5, opacity: 0.8 }).addTo(lg)
      }

      // Highlight journey stops.
      stops.filter(s => journeyStopIds.has(s.stop_id)).forEach(s => {
        L.circleMarker([s.stop_lat, s.stop_lon], {
          radius: 8, color: '#4f46e5', fillColor: '#818cf8', fillOpacity: 1, weight: 2,
        })
          .bindTooltip(s.stop_name, { permanent: true, direction: 'top', offset: [0, -8] })
          .addTo(lg)
      })

      // Fit map to journey.
      if (journeyCoords.length >= 2) {
        mapRef.current.fitBounds(L.latLngBounds(journeyCoords.map(c => L.latLng(c[0], c[1]))), {
          padding: [40, 40],
        })
      }
    }
  }, [stops, routes, selectedJourney])

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div ref={containerRef} style={{ height: 400 }} />
    </div>
  )
}
