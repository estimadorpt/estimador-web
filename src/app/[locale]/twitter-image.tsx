import { ImageResponse } from 'next/og';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const alt = 'estimador.pt - Portuguese Election Forecast';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'pt' }];
}

interface PresidentialWinProbability {
  name: string;
  color: string;
  leading_probability: number;
  first_round_win_probability: number;
  mean_support: number;
}

interface PresidentialWinProbabilitiesData {
  election_date: string;
  second_round_probability: number;
  candidates: PresidentialWinProbability[];
}

async function loadWinProbabilities(): Promise<PresidentialWinProbabilitiesData | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'presidential_win_probabilities.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await loadWinProbabilities();
  
  const leadingCandidate = data?.candidates[0];
  const secondRoundProb = data?.second_round_probability ?? 0.98;
  
  const formatProbability = (value: number) => {
    const pct = value * 100;
    if (pct >= 99.5) return '>99%';
    if (pct < 1) return '<1%';
    return `${Math.round(pct)}%`;
  };

  const electionLabel = locale === 'pt' ? 'Eleições Presidenciais 2026' : 'Presidential Election 2026';
  const leadingLabel = locale === 'pt' ? 'lidera com' : 'leads with';
  const chanceLabel = locale === 'pt' ? 'probabilidade de vencer' : 'chance of winning';
  const tagline = locale === 'pt' ? 'Previsões Eleitorais Portuguesas' : 'Portuguese Election Forecast';
  const secondRoundLabel = locale === 'pt' ? 'Prob. 2ª volta' : 'Runoff probability';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#292524', // stone-800
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: '#fafaf9', // stone-50
                letterSpacing: '-0.02em',
              }}
            >
              estimador.pt
            </div>
            <div
              style={{
                fontSize: 20,
                color: '#a8a29e', // stone-400
                marginTop: '4px',
              }}
            >
              {tagline}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#44403c', // stone-700
              padding: '12px 24px',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                fontSize: 18,
                color: '#fafaf9',
                fontWeight: 600,
              }}
            >
              {electionLabel}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            gap: '50px',
            alignItems: 'center',
          }}
        >
          {/* Leading Candidate */}
          {leadingCandidate && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '24px',
                }}
              >
                {/* Color bar */}
                <div
                  style={{
                    width: '8px',
                    height: '100px',
                    backgroundColor: leadingCandidate.color,
                    borderRadius: '4px',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      fontSize: 52,
                      fontWeight: 800,
                      color: '#fafaf9',
                      lineHeight: 1.1,
                    }}
                  >
                    {leadingCandidate.name}
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      color: '#a8a29e',
                      marginTop: '8px',
                    }}
                  >
                    {leadingLabel}
                  </div>
                </div>
              </div>

              {/* Win Probability */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '16px',
                  marginLeft: '28px',
                }}
              >
                <div
                  style={{
                    fontSize: 120,
                    fontWeight: 900,
                    color: leadingCandidate.color,
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {formatProbability(leadingCandidate.leading_probability)}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    color: '#78716c', // stone-500
                    maxWidth: '200px',
                    lineHeight: 1.3,
                  }}
                >
                  {chanceLabel}
                </div>
              </div>
            </div>
          )}

          {/* Stats Column */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              borderLeft: '1px solid #57534e', // stone-600
              paddingLeft: '50px',
              width: '320px',
            }}
          >
            {/* Second Round Probability */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#44403c',
                padding: '24px',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#a8a29e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '8px',
                }}
              >
                {secondRoundLabel}
              </div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: '#f59e0b', // amber-500
                }}
              >
                {formatProbability(secondRoundProb)}
              </div>
            </div>

            {/* Top 3 Candidates */}
            {data?.candidates.slice(0, 3).map((candidate, i) => (
              <div
                key={candidate.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: i < 2 ? '1px solid #44403c' : 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '4px',
                      height: '32px',
                      backgroundColor: candidate.color,
                      borderRadius: '2px',
                    }}
                  />
                  <div
                    style={{
                      fontSize: 18,
                      color: '#e7e5e3', // stone-200
                      fontWeight: 500,
                    }}
                  >
                    {candidate.name}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: candidate.color,
                  }}
                >
                  {formatProbability(candidate.leading_probability)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

