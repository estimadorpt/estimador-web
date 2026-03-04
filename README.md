# estimador.pt - Data Analysis for Portugal

**Data-driven analysis and forecasts for Portugal**

estimador.pt is a multi-domain data analysis platform for Portugal, providing rigorous statistical analysis across different domains — from football league forecasts to election predictions. We combine sophisticated Bayesian modeling with clear, engaging editorial design.

## Our Vision

We're building a credible data platform that makes complex analysis accessible to everyone. Our goal is to elevate public discourse through:

- **Transparent methodology** - Open about our assumptions and limitations
- **Accessible analysis** - Complex statistics explained for general audiences  
- **Professional presentation** - Media-quality visualizations and design
- **Timely updates** - Regular forecasts throughout election cycles
- **Independent voice** - Non-partisan analysis focused on data, not opinions

## What We Provide

### 🎯 Election Forecasts
Real-time probabilistic forecasts for Portuguese parliamentary elections, updated as new polling data becomes available. Our models account for polling uncertainty, historical patterns, and Portugal's proportional representation system.

### 📊 Data Visualization
Interactive charts and maps that make electoral trends immediately understandable:
- **Polling trends** - How party support evolves over time
- **Seat projections** - Monte Carlo simulations of likely outcomes
- **District analysis** - Where elections will be won and lost
- **Coalition scenarios** - Paths to parliamentary majorities

### 📝 Electoral Analysis
In-depth articles examining Portuguese political trends, polling methodology, and electoral dynamics. Written for engaged citizens who want to understand the data behind the headlines.

### 🔍 Methodology Transparency
Complete documentation of our forecasting approach, data sources, and model assumptions. We believe transparency builds trust in democratic institutions.

## Technology & Design

Built as a modern media website with professional news-style design:

### Technical Stack
- **Next.js 15** - Modern React framework with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling  
- **shadcn/ui** - Professional UI components
- **Observable Plot** - Statistical visualizations
- **next-intl** - Internationalization (PT/EN support)
- **React Context** - Election state management
- **Azure Static Web Apps** - Reliable, scalable hosting

### Design Philosophy
1. **Mobile-first** - Optimized for smartphones and tablets
2. **Scannable content** - Key insights visible in seconds
3. **Professional aesthetics** - News-quality design and typography
4. **Accessible** - Works for colorblind users, includes proper alt text
5. **Trust indicators** - Clear attribution, update times, and data sources

## Project Structure

```
src/
├── app/[locale]/
│   ├── page.tsx                    # Hub homepage
│   ├── desporto/liga/              # Liga Portugal forecast
│   ├── eleicoes/presidenciais/     # Presidential election
│   ├── eleicoes/legislativas/      # Parliamentary election
│   ├── eleicoes/mapa/              # District map
│   ├── artigos/                    # Articles
│   ├── sobre/                      # About
│   └── metodologia/                # Methodology
├── components/
│   ├── charts/                     # Election chart components
│   ├── charts/football/            # Football chart components
│   └── Header.tsx                  # Navigation with dropdowns
├── lib/
│   ├── config/                     # Section, election, football configs
│   └── utils/                      # Data loaders
├── types/                          # TypeScript interfaces
│   ├── index.ts                    # Election types
│   └── football.ts                 # Football types
└── contexts/                       # React contexts

public/data/
├── elections/
│   ├── presidential-2026/          # Presidential forecast data
│   └── parliamentary-2025/         # Parliamentary forecast data
└── football/
    └── liga-2025-26/               # Liga Portugal matchday predictions
```

## Key Features

### 🏠 Professional Homepage
- Current election status and key probabilities
- Latest polling snapshot with party standings
- Trust indicators (last update, simulation count)
- Recent analysis articles
- Clear value proposition for new visitors

### 📈 Forecast Dashboard  
- **National view** - Polling trends and vote share projections
- **Seats** - Parliamentary seat distribution forecasts
- **Districts** - Geographic breakdown of competitive races
- **Polling** - House effects and bias analysis

### 📰 Article System
- Typography-focused reading experience
- Live chart embedding from forecast data
- Mobile-optimized layout
- Social sharing integration

### 🔧 Methodology Documentation
- Model explanation for technical audiences
- Data sources and collection methods
- Historical accuracy and validation
- Limitations and uncertainty quantification

### Liga Portugal
- **Predicted standings** with championship, top 3, and relegation probabilities
- **Title race** and relegation battle evolution charts
- **Next matchday** predictions with probability bars
- **Position heatmap** — 18x18 probability matrix
- **Decisive matches** and critical paths analysis

### Multi-Section Architecture
- **Section-based navigation** with dropdown menus
- **Football + Elections** with consistent design language
- **Extensible** — new domains can be added with minimal friction

## Data Sources

Our forecasts are based on:

- **Polling data** from major Portuguese firms (CESOP, Aximage, Pitagórica, etc.)
- **Historical results** from CNE (Comissão Nacional de Eleições)
- **Demographic data** from INE (Instituto Nacional de Estatística)
- **Electoral system modeling** using D'Hondt seat allocation

All data is processed through our statistical models to produce probabilistic forecasts.

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Git Workflow
We use feature branches for all development:

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Work on changes, commit, and push
git add .
git commit -m "Your descriptive commit message"
git push -u origin feature/your-feature-name

# Create pull request
gh pr create --title "Feature: Your feature name" --body "Description"
```

See `CLAUDE.md` for detailed development guidelines.

## Deployment

Automatically deploys to Azure Static Web Apps on push to `main`:

- **GitHub Actions** workflow handles CI/CD
- **Static export** for optimal performance
- **Route handling** for single-page app behavior  
- **Cache optimization** for data files

## Roadmap

### Phase 1: Core Election Platform ✅
- [x] Professional homepage and navigation
- [x] Election forecast dashboard with interactive charts
- [x] Multi-election support (parliamentary + presidential)
- [x] Portuguese/English internationalization
- [x] Azure deployment pipeline

### Phase 2: Multi-Domain Platform ✅
- [x] Liga Portugal football forecasts
- [x] Section-based architecture (sections.ts)
- [x] Hub homepage with section summaries
- [x] Data reorganization into subdirectories
- [x] Dropdown navigation with section grouping

### Phase 3: Future Domains
- [ ] Economics section (GDP, inflation, employment forecasts)
- [ ] Demographics section (population, migration trends)
- [ ] Additional sports (Champions League, national team)

## Contributing

We welcome contributions that improve electoral transparency and democratic discourse. Key areas:

- **Data visualization** improvements
- **Mobile experience** optimization  
- **Accessibility** enhancements
- **Content** creation and fact-checking
- **Multi-election features** - Adding support for future elections
- **Testing infrastructure** - Playwright E2E testing
- **Internationalization** - Translation improvements and new languages

## About

**estimador.pt** was founded by Bernardo Caldas to bring rigorous, data-driven analysis to Portuguese public life. Our mission is to help citizens make informed decisions by providing trustworthy, accessible forecasts and analysis across multiple domains.

For questions or media inquiries: [info@estimador.pt](mailto:info@estimador.pt)

---

*Built with transparency and open methodology*  
*© 2025 estimador.pt*