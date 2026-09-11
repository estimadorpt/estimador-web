"use client";

import * as Plot from "@observablehq/plot";
import { useLocale, useTranslations } from "next-intl";
import { ChartTable } from "@/components/viz/ChartTable";
import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import { leftBlocParties, rightBlocParties, majorityThreshold } from "@/lib/config/blocs";

interface SeatData {
  [party: string]: number;
}

interface CoalitionDotPlotProps {
  data: SeatData[];
  leftCoalitionLabel?: string;
  rightCoalitionLabel?: string;
  projectedSeatsLabel?: string;
  majorityLabel?: string;
  showingOutcomesLabel?: string;
}

export function CoalitionDotPlot({ 
  data, 
  leftCoalitionLabel: leftLabelProp,
  rightCoalitionLabel: rightLabelProp,
  projectedSeatsLabel = "Projected seats",
  majorityLabel = "Majority",
  showingOutcomesLabel = "Showing {count} simulation outcomes"
}: CoalitionDotPlotProps) {
  const t = useTranslations("forecast");
  const leftCoalitionLabel = leftLabelProp ?? t("leftCoalition");
  const rightCoalitionLabel = rightLabelProp ?? t("rightCoalition");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const locale = useLocale();
  const pt = locale !== "en";

  // The table twin: the distribution of each bloc's seats and its majority odds.
  const summary = useMemo(() => {
    const blocs: Array<[string, readonly string[]]> = [[leftCoalitionLabel, leftBlocParties], [rightCoalitionLabel, rightBlocParties]];
    return blocs.map(([label, parties]) => {
      const seats = (data ?? []).map(sim => parties.reduce((sum, p) => sum + (sim[p] || 0), 0)).sort((a, b) => a - b);
      const q = (p: number) => seats[Math.min(seats.length - 1, Math.floor(seats.length * p))] ?? 0;
      const majority = seats.length ? seats.filter(s => s >= majorityThreshold).length / seats.length : 0;
      return { label, p5: q(0.05), p25: q(0.25), median: q(0.5), p75: q(0.75), p95: q(0.95), majority };
    });
  }, [data, leftCoalitionLabel, rightCoalitionLabel]);

  // Ensure client-side only rendering to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !data || data.length === 0 || !containerRef.current) {
      return;
    }
    
    // Get actual container width for responsive sizing
    const containerWidth = containerRef.current.offsetWidth || 1000;
    const containerHeight = 350;
    const isMobile = containerWidth < 768;
    
    // Calculate coalition seats for each simulation
    const blocDrawData = data.flatMap((simulation, index) => {
      const leftSeats = leftBlocParties.reduce((sum, party) => sum + (simulation[party] || 0), 0);
      const rightSeats = rightBlocParties.reduce((sum, party) => sum + (simulation[party] || 0), 0);
      
      return [
        { draw: index, bloc: leftCoalitionLabel, totalSeats: leftSeats },
        { draw: index, bloc: rightCoalitionLabel, totalSeats: rightSeats }
      ];
    });

    // Calculate medians
    const blocMedians = Array.from(
      d3.rollup(blocDrawData, v => d3.median(v, d => d.totalSeats), d => d.bloc),
      ([bloc, medianSeats]) => ({ bloc, medianSeats })
    );

    // Sample data for performance - reduce for mobile devices
    const sampleSize = Math.min(isMobile ? 200 : 1600, blocDrawData.length);
    const sampledData = d3.shuffle(blocDrawData.slice()).slice(0, sampleSize);

    let plot;
    try {
      plot = Plot.plot({
      width: containerWidth,
      height: containerHeight,
      marginLeft: isMobile ? 80 : 140,
      marginRight: isMobile ? 30 : 60,
      marginTop: 30,
      marginBottom: 50,
      style: {
        backgroundColor: "transparent",
        fontSize: "12px",
        fontFamily: "Manrope, system-ui, sans-serif"
      },
      x: {
        label: projectedSeatsLabel,
        domain: [40, 140],
        grid: true,
        ticks: [50, 75, 100, majorityThreshold, 125]
      },
      fy: {
        domain: [leftCoalitionLabel, rightCoalitionLabel],
        label: null,
        axis: "left",
        padding: 0.1
      },
      color: {
        domain: [leftCoalitionLabel, rightCoalitionLabel],
        range: ["#5eb184", "#c49536"]
      },
      marks: [
        // Majority line (spans across facets)
        Plot.ruleX([majorityThreshold], { 
          stroke: "#a3543a", 
          strokeWidth: 2, 
          strokeDasharray: "4,2",
          facet: "exclude"
        }),
        
        // Dodged dots with mobile-optimized sizing
        Plot.dotX(sampledData, Plot.dodgeY({
          x: d => d.totalSeats + (d.draw % 100 - 50) * 0.03, // Consistent jitter based on draw index
          fy: "bloc",
          fill: "bloc",
          fillOpacity: isMobile ? 0.8 : 0.7,
          r: isMobile ? 2 : 1.2, // Larger dots for mobile
          stroke: "white",
          strokeWidth: isMobile ? 0.5 : 0.3,
          anchor: "middle"
        })),
        
        // Median lines
        Plot.ruleX(blocMedians, {
          x: "medianSeats",
          fy: "bloc",
          stroke: "black",
          strokeWidth: 2,
          strokeDasharray: "2,2"
        }),
        
        // Median labels
        Plot.text(blocMedians, {
          x: "medianSeats",
          fy: "bloc",
          text: d => Math.round(d.medianSeats).toString(),
          dy: -8,
          dx: 5,
          fontSize: 11,
          fontWeight: "bold",
          fill: "black"
        }),
        
        // Majority label
        Plot.text([{ x: majorityThreshold, fy: leftCoalitionLabel }], {
          x: "x",
          fy: "fy",
          text: `${majorityLabel} (${majorityThreshold})`,
          dx: 5,
          dy: -10,
          fontSize: 11,
          fill: "#a3543a",
          fontWeight: "600"
        })
      ]
      });
    } catch (plotError) {
      console.error('CoalitionDotPlot: Error creating Plot.plot():', plotError);
      return;
    }

    if (containerRef.current) {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Check if the plot was rendered successfully
      try {
        containerRef.current.appendChild(plot);
        
        // Verify dots were actually rendered
        const dots = plot.querySelectorAll('circle');
        
        if (dots.length === 0) {
          console.warn('CoalitionDotPlot: No dots rendered, Observable Plot may have failed');
          // Force a re-render with simpler visualization
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.innerHTML = `
                <div style="padding: 20px; text-align: center; background: #fcfbf5; border-radius: 8px;">
                  <p style="margin: 0; color: #5f7062;">${pt ? 'Gráfico das coligações indisponível neste dispositivo.' : 'Coalition chart unavailable on this device.'}</p>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #7f9284;">${pt ? 'A tabela abaixo tem os mesmos números.' : 'The table below carries the same numbers.'}</p>
                </div>
              `;
            }
          }, 100);
        }
      } catch (error) {
        console.error('CoalitionDotPlot: Error rendering plot:', error);
        containerRef.current.innerHTML = `
          <div style="padding: 20px; text-align: center; background: #fff2ee; border-radius: 8px;">
            <p style="margin: 0; color: #a3543a;">${pt ? 'Não foi possível desenhar o gráfico das coligações.' : 'The coalition chart could not be drawn.'}</p>
          </div>
        `;
      }
    }

    return () => {
      try {
        plot.remove();
      } catch (e) {
        console.warn('Error removing plot:', e);
      }
    };
  }, [isClient, data, leftCoalitionLabel, rightCoalitionLabel, projectedSeatsLabel, majorityLabel]);


  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-stone-500">
        <p>{pt ? 'A carregar as coligações…' : 'Loading coalition data…'}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={containerRef} className="overflow-x-auto" />
      <div className="text-xs text-stone-500 mt-2">
        {showingOutcomesLabel.replace('{count}', data.length.toString())}
      </div>
      <ChartTable caption={projectedSeatsLabel} columns={[pt ? "Bloco" : "Bloc", "P5", "P25", pt ? "Mediana" : "Median", "P75", "P95", pt ? "Prob. de maioria" : "Majority odds"]} rows={summary.map(s => [s.label, s.p5, s.p25, s.median, s.p75, s.p95, `${Math.round(s.majority * 100)}%`])} />
    </div>
  );
}