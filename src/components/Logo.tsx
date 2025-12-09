interface LogoIconOnlyProps {
  size?: number;
  className?: string;
}

export function LogoIconOnly({ size = 80, className = '' }: LogoIconOnlyProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left circle - small, dark navy blue */}
      <circle cx="11" cy="50" r="8" fill="#1E3A5F" />

      {/* Middle circle - medium, teal/cyan */}
      <circle cx="42" cy="50" r="12" fill="#0F766E" />

      {/* Right circle - large, gold/amber */}
      <circle cx="81" cy="50" r="16" fill="#D4A000" />
    </svg>
  );
}

interface LogoHorizontalProps {
  className?: string;
  showWordmark?: boolean;
  variant?: 'default' | 'onNavy' | 'monochromeNavy' | 'monochromeWhite';
}

export function LogoHorizontal({
  className = '',
  showWordmark = true,
  variant = 'default'
}: LogoHorizontalProps) {
  let textColor = "#1E3A5F";
  let navyDotColor = "#1E3A5F";
  let tealDotColor = "#0F766E";
  let goldDotColor = "#D4A000";

  if (variant === 'onNavy') {
    textColor = "#FFFFFF";
    navyDotColor = "#4A6FA5";
  }

  if (variant === 'monochromeNavy') {
    navyDotColor = "#1E3A5F";
    tealDotColor = "#1E3A5F";
    goldDotColor = "#1E3A5F";
    textColor = "#1E3A5F";
  }

  if (variant === 'monochromeWhite') {
    navyDotColor = "#FFFFFF";
    tealDotColor = "#FFFFFF";
    goldDotColor = "#FFFFFF";
    textColor = "#FFFFFF";
  }

  // Dimensions based on whether we show wordmark
  const width = showWordmark ? 200 : 80;
  const height = 40;
  const iconScale = 0.4; // Scale factor for the icon

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Icon group - scaled and positioned */}
      <g transform={`translate(0, ${height/2 - 16}) scale(${iconScale})`}>
        {/* Left circle - small */}
        <circle cx="11" cy="20" r="8" fill={navyDotColor} />
        {/* Middle circle - medium */}
        <circle cx="42" cy="20" r="12" fill={tealDotColor} />
        {/* Right circle - large */}
        <circle cx="81" cy="20" r="16" fill={goldDotColor} />
      </g>

      {showWordmark && (
        <text
          x="45"
          y="27"
          fill={textColor}
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
          fontSize="20"
          fontWeight="600"
          letterSpacing="-0.02em"
        >
          estimador
        </text>
      )}
    </svg>
  );
}

interface LogoStackedProps {
  className?: string;
  variant?: 'default' | 'onNavy';
}

export function LogoStacked({ className = '', variant = 'default' }: LogoStackedProps) {
  const textColor = variant === 'onNavy' ? "#FFFFFF" : "#1E3A5F";
  const navyDotColor = variant === 'onNavy' ? "#4A6FA5" : "#1E3A5F";

  return (
    <svg
      width="160"
      height="100"
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dots group - centered horizontally */}
      <circle cx="48" cy="32" r="8" fill={navyDotColor} />
      <circle cx="79" cy="32" r="12" fill="#0F766E" />
      <circle cx="118" cy="32" r="16" fill="#D4A000" />

      {/* Text - estimador */}
      <text
        x="80"
        y="71"
        fill={textColor}
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="24"
        fontWeight="600"
        letterSpacing="-0.02em"
        textAnchor="middle"
      >
        estimador
      </text>
    </svg>
  );
}

// Export brand colors for use in other components
export const logoColors = {
  navy: '#1E3A5F',
  navyLight: '#4A6FA5',
  navyDark: '#152a45',
  teal: '#0F766E',
  gold: '#D4A000',
} as const;
