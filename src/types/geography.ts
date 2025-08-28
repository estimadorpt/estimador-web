// TypeScript types for Portuguese geographic data structures

export interface DistrictProperties {
  NAME_1: string;
  OBJECTID: number;
  NAME_0?: string;
  ID_1?: number;
  TYPE_1?: string;
  ENGTYPE_1?: string;
  NL_NAME_1?: string;
  VARNAME_1?: string;
}

export interface DistrictGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

export interface DistrictFeature {
  type: 'Feature';
  properties: DistrictProperties;
  geometry: DistrictGeometry;
  id?: string | number;
}

export interface DistrictFeatureCollection {
  type: 'FeatureCollection';
  features: DistrictFeature[];
}

export interface PortugalTopoJSON {
  type: 'Topology';
  objects: {
    ilhasGeo2: {
      type: 'GeometryCollection';
      geometries: Array<{
        type: 'Polygon' | 'MultiPolygon';
        properties: DistrictProperties;
        arcs: number[][] | number[][][];
      }>;
    };
  };
  arcs: number[][][];
  transform?: {
    scale: [number, number];
    translate: [number, number];
  };
  bbox?: [number, number, number, number];
}

export interface DistrictForecast {
  district_name: string;
  winning_party: string;
  probs: Record<string, number>;
}

export interface GeometryDataMap {
  winner: string;
  forecast: Record<string, number>;
}

export interface TooltipData {
  regionName: string;
  parties: [string, number][];
}

export interface TooltipState {
  show: boolean;
  x: number;
  y: number;
  content: TooltipData | null;
}

// Helper type for district selection in map components
export interface SelectedDistrict {
  id: string;
  probs: Record<string, number>;
}

// Type for the region mapping function
export type RegionMapper = (islandName: string) => string;