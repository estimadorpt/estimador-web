# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**estimador.pt** is a Portuguese election forecasting website built with Next.js. It was migrated from Observable Framework to provide a professional news-style interface with interactive visualizations.

## Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production (static export)
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Deployment
The project deploys automatically to Azure Static Web Apps via GitHub Actions when pushing to `main`. The deployment uses:
- `AZURE_DEPLOYMENT_TOKEN` secret for Azure authentication
- Static export configuration (`output: 'export'` in next.config.js)
- Builds to `out/` directory

## Architecture

### Data Flow
- **Static Data**: Election data lives in `public/data/` as JSON files
- **Chart Components**: Use Observable Plot + D3 for visualizations in `src/components/charts/`
- **Configuration**: Party colors, names, and order defined in `src/lib/config/colors.ts`
- **Election Management**: Election configs and switching logic in `src/lib/config/elections.ts`
- **Types**: Election data interfaces in `src/types/index.ts`

### Chart Architecture
All chart components follow a consistent pattern:
1. **Responsive sizing**: Use `containerRef.current.offsetWidth` for dynamic width
2. **ResizeObserver**: Handle container size changes 
3. **Data filtering**: Filter data using `partyColors.hasOwnProperty(party)` to exclude raw field names
4. **Observable Plot**: Primary charting library with D3 for data manipulation

### Key Data Files
- `seat_forecast_simulations.json` - Monte Carlo simulation results (9000+ data points)
- `national_trends.json` - Polling averages over time
- `house_effects.json` - Pollster bias analysis (logit deviations)
- `contested_summary.json` - Competitive seat analysis using ENSC methodology
- `district_forecast.json` - District-level projections

### Portuguese Electoral Context
- **Parties**: AD (center-right), PS (center-left), CH (right), IL (liberal), BE (left), CDU (communist), L (green), PAN (animal rights)
- **System**: Proportional representation using D'Hondt method across multiple districts
- **ENSC**: Effective Number of Seat Changes - measures district competitiveness (threshold: 0.8)

## Chart Components

### Critical Implementation Details
- **HouseEffects.tsx**: Custom HTML/CSS matrix instead of Observable Plot due to layout issues
- **CoalitionDotPlot.tsx**: Samples large datasets (1600 from 18000 points) for performance
- **DistrictSummary.tsx**: Uses ENSC methodology to identify contested seats
- **PollingChart.tsx**: Implements `Plot.dodgeY` for label collision avoidance

### Data Transformation Patterns
```typescript
// Seat data: Transform from {[party]: seats}[] to {party, seats}[]
const seatData = Object.entries(data).map(([party, seats]) => ({party, seats}))
  .filter(([party, seats]) => partyColors.hasOwnProperty(party));

// House effects: Color interpolation for logit deviations
const normalized = Math.max(-1, Math.min(1, value / 0.4));
```

## Azure Static Web Apps Configuration

### staticwebapp.config.json
- Explicit routes for `/_next/static/*` assets
- MIME types for `.json` and `.txt` (RSC files)
- Navigation fallback excludes static assets and RSC files
- Cache headers for optimal performance

### Common Deployment Issues
- **404 for static assets**: Ensure `/_next/*` excluded from navigation fallback
- **RSC .txt files**: Include `.txt` in MIME types and exclusions
- **Build output**: Uses `out/` directory (not `dist/`)

## Development Workflow

### Git Branch Strategy
**DEFAULT WORKFLOW**: Use feature branches for development. This is the preferred approach.

**BEST PRACTICE**: Create feature branches for non-trivial work:
- New features or significant changes
- Bug fixes that require testing
- Experimental work
- When you want to review changes before merging

**DIRECT TO MAIN**: Allowed for:
- Small fixes and updates
- Documentation changes  
- Quick configuration tweaks
- When explicitly requested by the user

**BEFORE ANY WORK**: Default to `git checkout -b feature/description` unless otherwise specified.

```bash
# Start new feature/fix
git checkout -b feature/your-feature-name
git checkout -b fix/issue-description

# Work on changes...
git add .
git commit -m "Your commit message"
git push -u origin feature/your-feature-name

# Create PR when ready
gh pr create --title "Feature: Your feature name" --body "Description of changes"

# After PR approval, merge and clean up
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

### Branch Naming Convention
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `update/` - Updates to existing functionality
- `docs/` - Documentation changes

### Commit Guidelines
- Use descriptive commit messages
- Include Claude Code attribution footer
- Keep commits focused and atomic
- Reference issues when applicable

## Development Notes

### Adding New Charts
1. Create component in `src/components/charts/`
2. Implement responsive sizing with `containerRef` pattern
3. Filter data using `partyColors.hasOwnProperty()`
4. Add ResizeObserver for responsive behavior
5. Use Observable Plot for consistency

### Data Updates
Election data files are manually updated in `public/data/`. Future automation could integrate with polling APIs.

### Party Configuration
All party-related configuration (colors, names, order) centralized in `src/lib/config/colors.ts`. This ensures consistency across all charts and components.

## Multi-Election Platform Architecture

### Overview
The platform supports multiple election types through a flexible architecture that can handle different electoral systems while maintaining consistent UI/UX.

### Current Elections
- **2025 Legislative Elections** (May 18, 2025) - Active election with full forecast data
- Future elections can be added when forecast data becomes available

### Election Configuration
Elections are defined in `src/lib/config/elections.ts`:

```typescript
export const PARLIAMENTARY_2025: ElectionConfig = {
  type: 'parliamentary',
  id: 'parliamentary-2025',
  name: 'Eleições Legislativas 2025',
  date: '2025-05-18',
  description: 'Eleições para a Assembleia da República',
  isActive: true,
  geographicLevel: 'district'
};
```

### Election Types Supported
- **Parliamentary**: Portuguese legislative elections with district-level D'Hondt allocation
- **Presidential**: Direct election with potential second round (future)
- **Municipal**: Local elections for mayors and municipal assemblies (future)
- **European**: EU Parliament elections (future)

### Election Context System
The `ElectionContext` provides election state management:

```typescript
// Usage in components
const { currentElection, contestants, switchElection } = useElection();

// Election-specific data filtering
const { filterDataByContestants, isValidContestant } = useElectionFiltering();

// Election-specific data paths
const { getDataPath, electionId } = useElectionDataPaths();
```

### Election-Aware Components

#### ElectionSummaryStats
Displays contextually appropriate metrics based on election type:
- **Parliamentary**: AD/PS most seats, left/right majority chances
- **Presidential**: Leading candidate, second round probability (future)
- **Municipal**: Mayoral races, municipal councils (future)

#### ElectionAwareContent
Conditional rendering for election-specific content:
- Shows appropriate charts and visualizations per election type
- Maintains consistent UI while adapting content

#### ElectionSelector
Dropdown for switching between elections (hidden when only one election available):
- Grouped by election type
- Shows election status (Active, Historical, Upcoming)
- Proper internationalization support

### Adding New Elections

1. **Define Election Config** in `src/lib/config/elections.ts`:
```typescript
export const NEW_ELECTION: ElectionConfig = {
  type: 'parliamentary',
  id: 'parliamentary-2029',
  name: 'Eleições Legislativas 2029',
  date: '2029-03-XX',
  description: 'Description',
  isActive: false,
  geographicLevel: 'district'
};
```

2. **Add to ALL_ELECTIONS array**
3. **Add translation keys** in `messages/pt.json` and `messages/en.json`
4. **Add data files** in `public/data/` (if different structure needed)
5. **Update ElectionSummaryStats** if new metrics needed

### Internationalization
Election-specific translations support:
- Election names and descriptions
- Type-specific terminology (e.g., "candidato" vs "partido")
- Status indicators (Active, Historical, Upcoming)
- Metric labels appropriate for each election type

### Data Organization
Currently all election data lives in `public/data/`. Future organization:
```
public/data/
├── shared/           # Common data across elections
├── parliamentary-2025/  # Election-specific data
├── presidential-2026/   # Future election data
└── municipal-2025/      # Municipal election data
```

### Best Practices
- Only add elections with real forecast data
- Test election switching thoroughly
- Ensure all components handle election context gracefully
- Maintain consistent chart styling across elections
- Add proper loading states for election transitions