/**
 * Real-world Delhi Transit station landmark metadata and corridor definitions.
 */

export interface StationMetadata {
  landmark: string
  interchanges: string[]
  type: 'metro_interchange' | 'bus_terminal' | 'rail_hub' | 'standard'
  badgeText: string
}

export const DELHI_STATION_METADATA: Record<string, StationMetadata> = {
  S01: {
    landmark: 'Connaught Place Central Hub',
    interchanges: ['Blue Line', 'Yellow Line'],
    type: 'metro_interchange',
    badgeText: 'Central Hub',
  },
  S02: {
    landmark: 'Interstate Bus Terminal ISBT',
    interchanges: ['Red Line', 'Yellow Line', 'Violet Line', 'Interstate Buses'],
    type: 'metro_interchange',
    badgeText: 'Major Terminal',
  },
  S03: {
    landmark: 'Old Delhi Railway Station & Red Fort',
    interchanges: ['Yellow Line', 'Northern Railways'],
    type: 'rail_hub',
    badgeText: 'Railway Link',
  },
  S04: {
    landmark: 'New Delhi Railway Stn (Ajmeri Gate)',
    interchanges: ['Yellow Line', 'Airport Express', 'Indian Railways'],
    type: 'rail_hub',
    badgeText: 'National Rail',
  },
  S05: {
    landmark: 'Connaught Place & Central Secretariat',
    interchanges: ['Yellow Line', 'Violet Line', 'DTC Ring Bus'],
    type: 'metro_interchange',
    badgeText: 'Secretariat',
  },
  S06: {
    landmark: 'Kartavya Path & C-Hexagon',
    interchanges: ['DTC Ring Bus', 'DTC Express'],
    type: 'standard',
    badgeText: 'Heritage Corridor',
  },
  S07: {
    landmark: 'Central Market & Ring Road',
    interchanges: ['Pink Line', 'Violet Line', 'DTC Bus Hub'],
    type: 'metro_interchange',
    badgeText: 'Commercial Hub',
  },
  S08: {
    landmark: 'Select Citywalk & District Centre',
    interchanges: ['Yellow Line', 'DTC South Express'],
    type: 'standard',
    badgeText: 'Retail District',
  },
  S09: {
    landmark: 'IIT Delhi & Aurobindo Marg',
    interchanges: ['Yellow Line', 'Magenta Line'],
    type: 'metro_interchange',
    badgeText: 'Academic Hub',
  },
  S10: {
    landmark: 'Safdarjung Hospital & Ansari Nagar',
    interchanges: ['Yellow Line', 'DTC Mudrika Express'],
    type: 'standard',
    badgeText: 'Medical Hub',
  },
  S11: {
    landmark: 'Vikas Marg & Media District',
    interchanges: ['Violet Line', 'DTC Bus Express'],
    type: 'standard',
    badgeText: 'Institutional',
  },
  S12: {
    landmark: 'Asia IT Hardware Market',
    interchanges: ['Violet Line', 'Magenta Line'],
    type: 'standard',
    badgeText: 'Tech District',
  },
  S13: {
    landmark: 'IGI Airport Gateway & DDA Sports',
    interchanges: ['Blue Line', 'Airport Express'],
    type: 'metro_interchange',
    badgeText: 'Airport Link',
  },
  S14: {
    landmark: 'District Centre & Najafgarh Road',
    interchanges: ['Blue Line', 'Magenta Line'],
    type: 'metro_interchange',
    badgeText: 'West Hub',
  },
  S15: {
    landmark: 'Main Market & Shivaji Place',
    interchanges: ['Blue Line', 'Pink Line'],
    type: 'metro_interchange',
    badgeText: 'Interchange',
  },
  S16: {
    landmark: 'Crafts Bazaar & Dilli Haat',
    interchanges: ['Yellow Line', 'Pink Line'],
    type: 'metro_interchange',
    badgeText: 'Cultural Link',
  },
  S17: {
    landmark: 'National Theatre & Cultural District',
    interchanges: ['Blue Line', 'Violet Line'],
    type: 'metro_interchange',
    badgeText: 'Arts District',
  },
  S18: {
    landmark: 'Trans-Yamuna ISBT & Railway Link',
    interchanges: ['Blue Line', 'Pink Line', 'Interstate Buses'],
    type: 'bus_terminal',
    badgeText: 'East Terminal',
  },
  S19: {
    landmark: 'Noida Sector 38 Hub',
    interchanges: ['Blue Line', 'Magenta Line'],
    type: 'metro_interchange',
    badgeText: 'Suburban Link',
  },
  S20: {
    landmark: 'Hazrat Nizamuddin Railway Station',
    interchanges: ['Pink Line', 'Ring Road Express', 'Indian Railways'],
    type: 'rail_hub',
    badgeText: 'Terminal Rail',
  },
}

export function getStationMeta(stopId: string): StationMetadata {
  return (
    DELHI_STATION_METADATA[stopId] || {
      landmark: 'Delhi Transit Stop',
      interchanges: [],
      type: 'standard',
      badgeText: 'Transit Node',
    }
  )
}

export function getStationSubtitle(stopId: string): string {
  return getStationMeta(stopId).landmark
}

export function getStationBadge(stopId: string): string {
  return getStationMeta(stopId).badgeText
}

export function getStationIcon(_stopId: string): string {
  return ''
}
