'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { partyColors } from '@/lib/config/colors';

interface DistrictForecast {
  district_name: string;
  winning_party: string;
  probs: Record<string, number>;
}

interface DistrictMapPreviewProps {
  districtForecast: DistrictForecast[];
  className?: string;
  height?: number;
}

// Function to identify island geometries belonging to aggregated regions
function getRegionForIsland(islandName: string): string {
  const azoresIslands = [
    "Ilha do Faial", "Ilha de São Jorge", "Ilha da Graciosa", "Ilha Terceira", 
    "Ilha das Flores", "Ilha do Corvo", "Ilha de São Miguel", "Ilha de Santa Maria", "Ilha do Pico"
  ];
  const madeiraIslands = ["Ilha da Madeira", "Ilha de Porto Santo"];

  if (azoresIslands.includes(islandName)) return "Açores";
  if (madeiraIslands.includes(islandName)) return "Madeira";
  return islandName; // If not an island, return the name itself (continental district)
}

export default function DistrictMapPreview({ 
  districtForecast, 
  className = '',
  height = 300 
}: DistrictMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [portugalTopoJson, setPortugalTopoJson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    content: string;
  }>({ show: false, x: 0, y: 0, content: '' });

  // Load TopoJSON data
  useEffect(() => {
    async function loadTopoJson() {
      try {
        const response = await fetch('/data/Portugal-Distritos-Ilhas_TopoJSON.json');
        if (!response.ok) {
          throw new Error('Failed to load TopoJSON data');
        }
        const data = await response.json();
        setPortugalTopoJson(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading TopoJSON:', err);
        setError('Failed to load map data');
        setIsLoading(false);
      }
    }

    loadTopoJson();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !portugalTopoJson || !districtForecast || isLoading) {
      return;
    }

    const container = containerRef.current;
    
    // Clear previous content
    container.innerHTML = '';

    try {
      // Extract features from TopoJSON
      const districts = topojson.feature(portugalTopoJson, portugalTopoJson.objects.ilhasGeo2);
      
      if (!districts || !districts.features || districts.features.length === 0) {
        console.error('No valid districts features found in TopoJSON');
        return;
      }

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

      // Create geometry data map
      const geometryDataMap = new Map<string, { winner: string; forecast: Record<string, number> }>();
      
      for (const feature of districts.features) {
        const geometryName = feature.properties.NAME_1;
        const regionOrDistrictName = getRegionForIsland(geometryName);
        const winnerForRegion = winningParty.get(regionOrDistrictName);
        const actualProbs = districtProbs.get(regionOrDistrictName) || {};

        geometryDataMap.set(geometryName, {
          winner: winnerForRegion || 'default',
          forecast: actualProbs
        });
      }

      // Get container dimensions for responsive sizing
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight || height;

      // Create the Plot (simplified for preview)
      const plot = Plot.plot({
        width: containerWidth,
        height: containerHeight,
        projection: {
          type: "mercator",
          domain: districts,
        },
        // No legend for preview version  
        marks: [
          Plot.geo(districts, {
            fill: (d: any) => {
              const data = geometryDataMap.get(d.properties.NAME_1);
              return partyColors[data?.winner] || "#e5e7eb";
            },
            stroke: "white",
            strokeWidth: 0.5,
            cursor: "pointer",
          })
        ]
      });

      container.appendChild(plot);

      // Add mouseover event listener (same pattern as working DistrictMap)
      plot.addEventListener("mouseover", (event: any) => {
        const target = event.target;
        if (!target || typeof target.__data__ !== 'number') return;

        const featureIndex = target.__data__;
        if (featureIndex >= 0 && featureIndex < districts.features.length) {
          const feature = districts.features[featureIndex];
          const geometryName = feature?.properties?.NAME_1;
          
          if (geometryName) {
            const regionName = getRegionForIsland(geometryName);
            const data = geometryDataMap.get(geometryName);
            
            if (data?.forecast) {
              const parties = Object.entries(data.forecast)
                .filter(([party]) => partyColors.hasOwnProperty(party))
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3);
              
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect && parties.length > 0) {
                const tooltipContent = `
                  <div class="font-semibold text-sm mb-2">${regionName}</div>
                  ${parties.map(([party, percentage]) => 
                    `<div class="flex items-center justify-between text-xs">
                      <span>${party}</span>
                      <span class="font-medium">${(percentage * 100).toFixed(1)}%</span>
                    </div>`
                  ).join('')}
                `;
                
                setTooltip({
                  show: true,
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                  content: tooltipContent
                });
              }
            }
          }
        }
      });

      // Add mouseout event listener
      plot.addEventListener("mouseout", () => {
        setTooltip({ show: false, x: 0, y: 0, content: '' });
      });

      // Cleanup function
      return () => {
        try {
          if (container && container.contains(plot)) {
            container.removeChild(plot);
          } else if (container) {
            container.innerHTML = '';
          }
        } catch (error) {
          if (container) {
            container.innerHTML = '';
          }
        }
      };

    } catch (err) {
      console.error('Error creating district map preview:', err);
      setError('Failed to create map visualization');
    }
  }, [portugalTopoJson, districtForecast, isLoading, height]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-gray-500 text-sm">A carregar mapa...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`} style={{ minHeight: height }}>
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
      
      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: tooltip.x > 200 ? 'translateX(-100%)' : 'none'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
}