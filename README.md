# estimador.pt - Portuguese Election Forecasting

A modern, professional election forecasting website for Portuguese elections. Built as a migration from Observable Framework to Next.js with improved design and user experience.

## Features

### 🏠 Professional Homepage
- Hero section with top-line forecasts
- Key metrics dashboard showing probabilities
- Latest polling snapshot with party avatars  
- Trust indicators (last updated, simulation count)
- Newsletter signup (UI only)

### 📊 Interactive Forecast Dashboard
- **National Trends**: Improved polling average charts with confidence intervals
- **Seat Projections**: Clear seat distribution visualizations
- **District Analysis**: Geographic breakdown (placeholder for future maps)
- **Polling Analysis**: House effects and bias analysis (placeholder)

### 📝 Content Pages
- **About**: Mission, approach, team information
- **Methodology**: Comprehensive technical explanation with accordions
- **Articles**: Blog-style analysis pieces with sample content

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Charts**: Observable Plot + D3
- **Deployment**: Azure Static Web Apps

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   ├── forecast/          # Forecast dashboard
│   ├── about/             # About page
│   ├── articles/          # Articles listing
│   └── methodology/       # Technical documentation
├── components/
│   ├── ui/                # shadcn/ui components
│   └── charts/            # Chart components
├── lib/
│   ├── config/            # Colors, party definitions
│   └── utils/             # Data loading, calculations
└── types/                 # TypeScript definitions

public/data/               # Election data (JSON files)
```

## Data Sources

The application uses the following data files:

- `seat_forecast_simulations.json` - Monte Carlo simulation results
- `national_trends.json` - Polling averages over time
- `district_forecast.json` - District-level projections
- `contested_summary.json` - Competitive seat analysis
- `house_effects.json` - Pollster bias analysis
- `poll_bias.json` - Historical polling accuracy

## Key Improvements from Observable

### Design & UX
- ✅ Professional media-style homepage (FiveThirtyEight inspired)
- ✅ Consistent navigation and branding
- ✅ Mobile-first responsive design
- ✅ Improved chart design with better labels and annotations
- ✅ Trust indicators and transparency features

### Technical
- ✅ Modern Next.js architecture
- ✅ Type-safe data handling
- ✅ Server-side rendering for performance
- ✅ Azure deployment configuration
- ✅ Improved chart rendering with Observable Plot

### Content Strategy
- ✅ General audience focus (less academic language)
- ✅ Clear hierarchy and scannable layout
- ✅ Context and explanations for complex metrics
- ✅ Dedicated methodology section

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

Configured for Azure Static Web Apps with:

- GitHub Actions workflow
- Static export configuration
- Route handling for SPA behavior
- Cache optimization for data files

### Azure Setup

1. Create Azure Static Web App resource
2. Connect to GitHub repository
3. Add `AZURE_STATIC_WEB_APPS_API_TOKEN` secret
4. Push to main branch triggers automatic deployment

## Future Enhancements

### Charts & Visualizations
- [ ] Interactive district map with TopoJSON
- [ ] Coalition probability visualizations
- [ ] Improved contested seats heatmap
- [ ] House effects heatmap
- [ ] Polling diagnostics charts

### Features
- [ ] Real newsletter signup integration
- [ ] MDX-based article system
- [ ] Live data updates
- [ ] Historical forecast tracking
- [ ] Mobile chart optimization

### Content
- [ ] Portuguese language support
- [ ] More analysis articles
- [ ] Historical election data
- [ ] API documentation

## Data Pipeline

The current setup expects data files to be manually updated in `public/data/`. 
Future versions could include:

- Automated polling data collection
- Real-time model updates
- API integration for dynamic content

## License

© 2025 estimador.pt - Built with transparency and open methodology
Developed by Bernardo Caldas
