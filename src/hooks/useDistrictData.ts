import { useMemo } from 'react';
import * as d3 from 'd3';
import type { DistrictForecast, GeometryDataMap } from '@/types/geography';

// Function to identify island geometries belonging to aggregated regions
export const getRegionForIsland = (islandName: string): string => {
  const azoresIslands = [
    "Ilha do Faial", "Ilha de São Jorge", "Ilha da Graciosa", "Ilha Terceira", 
    "Ilha das Flores", "Ilha do Corvo", "Ilha de São Miguel", "Ilha de Santa Maria", "Ilha do Pico"
  ];
  const madeiraIslands = ["Ilha da Madeira", "Ilha de Porto Santo"];

  if (azoresIslands.includes(islandName)) return "Açores";
  if (madeiraIslands.includes(islandName)) return "Madeira";
  return islandName; // If not an island, return the name itself (continental district)
};

/**
 * Custom hook to process district forecast data and create lookup maps
 */
export function useDistrictData(districtForecast: DistrictForecast[]) {
  const processedData = useMemo(() => {
    // Process forecast data to find the winning party per district/region
    const normalizedForecast = districtForecast.map(d => ({
      ...d,
      district_name: d.district_name === "Açores" ? "Açores" : d.district_name
    }));

    const forecastByDistrict = d3.group(normalizedForecast, d => d.district_name);
    const winningParty = new Map<string, string>();
    const districtProbs = new Map<string, Record<string, number>>();

    // Extract winning party and probabilities for each district
    for (const [districtName, forecastEntries] of forecastByDistrict) {
      if (forecastEntries && forecastEntries.length > 0) {
        const districtData = forecastEntries[0];
        districtProbs.set(districtName, districtData.probs || {});
        winningParty.set(districtName, districtData.winning_party || 'default');
      } else {
        districtProbs.set(districtName, {});
        winningParty.set(districtName, 'default');
      }
    }

    return { winningParty, districtProbs };
  }, [districtForecast]);

  return processedData;
}

/**
 * Custom hook to create geometry data map from district data
 */
export function useGeometryDataMap(
  features: Array<{ properties: { NAME_1: string } }>,
  winningParty: Map<string, string>,
  districtProbs: Map<string, Record<string, number>>
) {
  const geometryDataMap = useMemo(() => {
    const map = new Map<string, GeometryDataMap>();
    
    for (const feature of features) {
      const geometryName = feature.properties.NAME_1;
      const regionOrDistrictName = getRegionForIsland(geometryName);
      const winnerForRegion = winningParty.get(regionOrDistrictName);
      const actualProbs = districtProbs.get(regionOrDistrictName) || {};

      map.set(geometryName, {
        winner: winnerForRegion || 'default',
        forecast: actualProbs
      });
    }

    return map;
  }, [features, winningParty, districtProbs]);

  return geometryDataMap;
}