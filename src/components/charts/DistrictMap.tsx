'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { partyColors, partyOrder } from '@/lib/config/colors';
import { getRegionForIsland } from '@/lib/geography/regionMapping';
import type { 
  DistrictForecast, 
  PortugalTopoJSON, 
  DistrictFeatureCollection,
  GeometryDataMap,
  SelectedDistrict
} from '@/types/geography';

interface DistrictMapProps {
  districtForecast: DistrictForecast[];
  className?: string;
  onDistrictClick?: (district: SelectedDistrict) => void;
  selectedDistrict?: string | null;
}

export default function DistrictMap({ 
  districtForecast, 
  className = '', 
  onDistrictClick,
  selectedDistrict 
}: DistrictMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [portugalTopoJson, setPortugalTopoJson] = useState<PortugalTopoJSON | null>(null);
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

      // Get container width for responsive sizing
      const containerWidth = containerRef.current.offsetWidth;

      // Create the Plot
      const plot = Plot.plot({
        width: containerWidth,
        height: Math.min(500, containerWidth * 0.8), // Responsive height
        projection: {
          type: "mercator",
          domain: districts,
        },
        color: {
          domain: partyOrder.filter(p => p !== 'OTH'),
          range: partyOrder.filter(p => p !== 'OTH').map(p => partyColors[p] || "#888888"),
          legend: true,
          label: "Partido vencedor"
        },
        marks: [
          Plot.geo(districts, {
            fill: (d: any) => {
              const data = geometryDataMap.get(d.properties.NAME_1);
              return partyColors[data?.winner] || "#e5e7eb";
            },
            stroke: "white",
            strokeWidth: 0.5,
            cursor: "pointer",
            // Remove title for now - we'll handle tooltips manually
          })
        ]
      });

      // Add event listeners for click and hover
      plot.addEventListener("click", (event: any) => {
        const target = event.target;
        if (!target || typeof target.__data__ !== 'number') return;

        const featureIndex = target.__data__;
        if (featureIndex >= 0 && featureIndex < districts.features.length) {
          const clickedFeature = districts.features[featureIndex];
          const clickedFeatureKey = clickedFeature?.properties?.NAME_1;
          
          if (clickedFeatureKey) {
            const data = geometryDataMap.get(clickedFeatureKey);
            const regionName = getRegionForIsland(clickedFeatureKey);
            
            if (onDistrictClick && data) {
              onDistrictClick({
                id: regionName,
                probs: data.forecast
              });
            }
          }
        }
      });

      // Add mouseover event listener
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
            const winner = data?.winner || 'N/A';
            const percentage = data?.forecast[winner] || 0;
            
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setTooltip({
                show: true,
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
                content: `${regionName}\nLíder: ${winner}\nVotos: ${(percentage * 100).toFixed(1)}%`
              });
            }
          }
        }
      });

      // Add mouseout event listener
      plot.addEventListener("mouseout", () => {
        setTooltip({ show: false, x: 0, y: 0, content: '' });
      });

      container.appendChild(plot);

      // Cleanup function
      return () => {
        // More robust cleanup
        try {
          if (container && container.contains(plot)) {
            container.removeChild(plot);
          } else if (container) {
            container.innerHTML = '';
          }
        } catch (error) {
          // Fallback to clearing innerHTML if removeChild fails
          if (container) {
            container.innerHTML = '';
          }
        }
      };

    } catch (err) {
      console.error('Error creating district map:', err);
      setError('Failed to create map visualization');
    }
  }, [portugalTopoJson, districtForecast, isLoading]);

  // Handle district selection highlighting
  useEffect(() => {
    if (!containerRef.current || !portugalTopoJson) return;

    try {
      // Extract features to match path indices
      const districts = topojson.feature(portugalTopoJson, portugalTopoJson.objects.ilhasGeo2);
      const paths = containerRef.current.querySelectorAll("path");
      
      paths.forEach((path: Element, i: number) => {
        const pathElement = path as HTMLElement;
        if (i < districts.features.length) {
          const feature = districts.features[i];
          const geometryName = feature?.properties?.NAME_1;
          const regionName = getRegionForIsland(geometryName);
          
          if (regionName === selectedDistrict) {
            pathElement.style.strokeWidth = "2";
            pathElement.style.stroke = "white";
          } else {
            pathElement.style.strokeWidth = "0.5";
            pathElement.style.stroke = "white";
          }
        }
      });
    } catch (err) {
      console.error('Error updating district highlighting:', err);
    }
  }, [selectedDistrict, portugalTopoJson]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Trigger re-render when container size changes
      if (portugalTopoJson && districtForecast && !isLoading) {
        // Force re-render by updating a dependency
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [portugalTopoJson, districtForecast, isLoading]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-gray-500">A carregar mapa...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`w-full relative ${className}`}
      style={{ minHeight: '400px' }}
    >
      {/* Custom Tooltip */}
      {tooltip.show && (
        <div
          className="absolute z-10 bg-black text-white text-xs rounded px-2 py-1 pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            whiteSpace: 'pre-line'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}