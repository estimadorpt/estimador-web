// Dependency-free SVG bar chart for quarterly GDP growth. The repo uses d3,
// not recharts, but a simple bar chart needs neither — plain SVG keeps this a
// server component with zero runtime deps.

export interface GdpChartPoint {
  quarter: string;
  value: number; // log-diff fraction
  isNowcast?: boolean;
}

interface Props {
  data: GdpChartPoint[];
  labels: { official: string; nowcast: string };
}

export function GdpNowcastChart({ data, labels }: Props) {
  const W = 720;
  const H = 260;
  const padX = 10;
  const padTop = 14;
  const padBottom = 30;
  const plotH = H - padTop - padBottom;
  const maxAbs = Math.max(0.01, ...data.map((d) => Math.abs(d.value)));
  const zeroY = padTop + plotH / 2;
  const scale = plotH / 2 / maxAbs;
  const n = Math.max(data.length, 1);
  const slot = (W - padX * 2) / n;
  const barW = Math.min(slot * 0.6, 42);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" role="img" aria-label="GDP growth by quarter">
        <line x1={padX} x2={W - padX} y1={zeroY} y2={zeroY} stroke="#d6d3d1" strokeWidth={1} />
        {data.map((d, i) => {
          const cx = padX + slot * i + slot / 2;
          const h = Math.max(Math.abs(d.value) * scale, 1);
          const y = d.value >= 0 ? zeroY - h : zeroY;
          const fill = d.isNowcast ? "#1B4D5E" : d.value < 0 ? "#ef4444" : "#a8a29e";
          return (
            <g key={`${d.quarter}-${i}`}>
              <rect
                x={cx - barW / 2}
                y={y}
                width={barW}
                height={h}
                rx={2}
                fill={fill}
                fillOpacity={d.isNowcast ? 0.95 : 0.8}
              />
              <text x={cx} y={H - padBottom + 15} textAnchor="middle" fontSize="10" fill="#78716c">
                {d.quarter.replace("20", "’")}
              </text>
              <text
                x={cx}
                y={d.value >= 0 ? y - 4 : y + h + 11}
                textAnchor="middle"
                fontSize="9"
                fill="#57534e"
              >
                {(d.value * 100).toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#a8a29e" }} />
          {labels.official}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#1B4D5E" }} />
          {labels.nowcast}
        </span>
      </div>
    </div>
  );
}
