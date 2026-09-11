import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';

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

export type DistrictGeometry = Geometry;
export type DistrictFeature = Feature<Geometry, DistrictProperties>;
export type DistrictFeatureCollection = FeatureCollection<Geometry, DistrictProperties>;
export type PortugalTopoJSON = Topology<{ ilhasGeo2: GeometryCollection<DistrictProperties> }>;

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