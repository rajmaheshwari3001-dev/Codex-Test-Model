/**
 * Real-world Delhi Transit station landmark metadata and corridor definitions.
 */

export interface StationMetadata {
  landmark: string
  interchanges: string[]
  icon: string
  type: 'metro_interchange' | 'bus_terminal' | 'rail_hub' | 'standard'
}

export const DELHI_STATION_METADATA: Record<string, StationMetadata> = {
  S01: {
    landmark: 'Connaught Place Central Hub',
    interchanges: ['Blue Line', 'Yellow Line'],
    icon: '🛍️',
    type: 'metro_interchange',
  },
  S02: {
    landmark: 'Interstate Bus Terminal ISBT',
    interchanges: ['Red Line', 'Yellow Line', 'Violet Line', 'Interstate Buses'],
    icon: '🏛️',
    type: 'metro_interchange',
  },
  S03: {
    landmark: 'Old Delhi Railway Station & Red Fort',
    interchanges: ['Yellow Line', 'Northern Railways'],
    icon: '🕌',
    type: 'rail_hub',
  },
  S04: {
    landmark: 'New Delhi Railway Stn (Ajmeri Gate)',
    interchanges: ['Yellow Line', 'Airport Express', 'Indian Railways'],
    icon: '🚆',
    type: 'rail_hub',
  },
  S05: {
    landmark: 'Connaught Place & Central Secretariat',
    interchanges: ['Yellow Line', 'Violet Line', 'DTC Ring Bus'],
    icon: '🏛️',
    type: 'metro_interchange',
  },
  S06: {
    landmark: 'Kartavya Path & C-Hexagon',
    interchanges: ['DTC Ring Bus', 'DTC Express'],
    icon: '🎖️',
    type: 'standard',
  },
  S07: {
    landmark: 'Central Market & Ring Road',
    interchanges: ['Pink Line', 'Violet Line', 'DTC Bus Hub'],
    icon: '🏬',
    type: 'metro_interchange',
  },
  S08: {
    landmark: 'Select Citywalk & District Centre',
    interchanges: ['Yellow Line', 'DTC South Express'],
    icon: '🛍️',
    type: 'standard',
  },
  S09: {
    landmark: 'IIT Delhi & Aurobindo Marg',
    interchanges: ['Yellow Line', 'Magenta Line'],
    icon: '🎓',
    type: 'metro_interchange',
  },
  S10: {
    landmark: 'Safdarjung Hospital & Ansari Nagar',
    interchanges: ['Yellow Line', 'DTC Mudrika Express'],
    icon: '🏥',
    type: 'standard',
  },
  S11: {
    landmark: 'Vikas Marg & Media District',
    interchanges: ['Violet Line', 'DTC Bus Express'],
    icon: '📰',
    type: 'standard',
  },
  S12: {
    landmark: 'Asia IT Hardware Market',
    interchanges: ['Violet Line', 'Magenta Line'],
    icon: '💻',
    type: 'standard',
  },
  S13: {
    landmark: 'IGI Airport Gateway & DDA Sports',
    interchanges: ['Blue Line', 'Airport Express'],
    icon: '✈️',
    type: 'metro_interchange',
  },
  S14: {
    landmark: 'District Centre & Najafgarh Road',
    interchanges: ['Blue Line', 'Magenta Line'],
    icon: '🏢',
    type: 'metro_interchange',
  },
  S15: {
    landmark: 'Main Market & Shivaji Place',
    interchanges: ['Blue Line', 'Pink Line'],
    icon: '🛍️',
    type: 'metro_interchange',
  },
  S16: {
    landmark: 'Crafts Bazaar & Dilli Haat',
    interchanges: ['Yellow Line', 'Pink Line'],
    icon: '🎨',
    type: 'metro_interchange',
  },
  S17: {
    landmark: 'National Theatre & Cultural District',
    interchanges: ['Blue Line', 'Violet Line'],
    icon: '🎭',
    type: 'metro_interchange',
  },
  S18: {
    landmark: 'Trans-Yamuna ISBT & Railway Link',
    interchanges: ['Blue Line', 'Pink Line', 'Interstate Buses'],
    icon: '🚌',
    type: 'bus_terminal',
  },
  S19: {
    landmark: 'Noida Sector 38 Hub',
    interchanges: ['Blue Line', 'Magenta Line'],
    icon: '🌿',
    type: 'metro_interchange',
  },
  S20: {
    landmark: 'Hazrat Nizamuddin Railway Station',
    interchanges: ['Pink Line', 'Ring Road Express', 'Indian Railways'],
    icon: '🚆',
    type: 'rail_hub',
  },
}

export function getStationMeta(stopId: string): StationMetadata {
  return (
    DELHI_STATION_METADATA[stopId] || {
      landmark: 'Delhi Transit Stop',
      interchanges: [],
      icon: '📍',
      type: 'standard',
    }
  )
}

export function getStationSubtitle(stopId: string): string {
  return getStationMeta(stopId).landmark
}

export function getStationIcon(stopNameOrId: string, stopId?: string): string {
  if (stopId && DELHI_STATION_METADATA[stopId]) {
    return DELHI_STATION_METADATA[stopId].icon
  }
  // Try match by stopId first
  if (DELHI_STATION_METADATA[stopNameOrId]) {
    return DELHI_STATION_METADATA[stopNameOrId].icon
  }
  // Match by keyword in name
  const lower = stopNameOrId.toLowerCase()
  if (lower.includes('dwarka') || lower.includes('airport')) return '✈️'
  if (lower.includes('railway') || lower.includes('stn') || lower.includes('nizamuddin')) return '🚆'
  if (lower.includes('isbt') || lower.includes('kashmere') || lower.includes('terminal')) return '🏛️'
  if (lower.includes('chowk') || lower.includes('place') || lower.includes('market') || lower.includes('haat')) return '🛍️'
  if (lower.includes('aiims') || lower.includes('hospital')) return '🏥'
  if (lower.includes('botanical') || lower.includes('garden') || lower.includes('park')) return '🌿'
  if (lower.includes('iit') || lower.includes('university')) return '🎓'
  return '📍'
}
