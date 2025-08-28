'use client';

import React, { useRef, useEffect } from 'react';
import * as Plot from '@observablehq/plot';
import * as topojson from 'topojson-client';
import { partyColors } from '@/lib/config/colors';
import { useTopoJsonData } from '@/hooks/useTopoJsonData';
import { useDistrictData, useGeometryDataMap, getRegionForIsland } from '@/hooks/useDistrictData';
import { useTooltip } from '@/hooks/useTooltip';
import type { 
  DistrictForecast, 
  DistrictFeatureCollection
} from '@/types/geography';

interface DistrictMapPreviewProps {
  districtForecast: DistrictForecast[];
  className?: string;
  height?: number;
}

export default function DistrictMapPreview({ 
  districtForecast, 
  className = '',
  height = 300 
}: DistrictMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use custom hooks
  const { portugalTopoJson, isLoading, error } = useTopoJsonData();
  const { winningParty, districtProbs } = useDistrictData(districtForecast);
  const { tooltip, showTooltip, hideTooltip } = useTooltip();

  // Extract features and create geometry data map
  const districts = portugalTopoJson ? 
    topojson.feature(portugalTopoJson, portugalTopoJson.objects.ilhasGeo2) as DistrictFeatureCollection : 
    null;
  
  // Always call the hook, but pass empty array if no districts
  const geometryDataMap = useGeometryDataMap(
    districts?.features || [], 
    winningParty, 
    districtProbs
  );

  useEffect(() => {
    if (!containerRef.current || !portugalTopoJson || !districtForecast || isLoading || !districts) {
      return;
    }

    const container = containerRef.current;
    
    // Clear previous content
    container.innerHTML = '';

    try {
      if (!districts || !districts.features || districts.features.length === 0) {
        console.error('No valid districts features found in TopoJSON');
        return;
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
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                showTooltip(
                  event.clientX - rect.left,
                  event.clientY - rect.top,
                  regionName,
                  data.forecast
                );
              }
            }
          }
        }
      });

      // Add mouseout event listener
      plot.addEventListener("mouseout", () => {
        hideTooltip();
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
    }
  }, [portugalTopoJson, districtForecast, isLoading, height, districts, geometryDataMap, showTooltip, hideTooltip]);

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
      {tooltip.show && tooltip.content && (
        <div
          className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: tooltip.x > 200 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="font-semibold text-sm mb-2">{tooltip.content.regionName}</div>
          {tooltip.content.parties.map(([party, percentage]) => (
            <div key={party} className="flex items-center justify-between text-xs">
              <span>{party}</span>
              <span className="font-medium">{(percentage * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}