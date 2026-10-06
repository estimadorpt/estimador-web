# estimador.pt — Dados para compreender Portugal

**Data and models about Portugal, with the uncertainty in view: who lives in each parish, how the Liga could end, and what the election forecasts said.**

*Dados e modelos sobre Portugal, com a incerteza à vista: quem vive em cada freguesia, como pode acabar a Liga e o que diziam as previsões eleitorais.*

estimador.pt publishes data and models about Portugal: an open synthetic population of every parish (2021 Census), Liga Portugal forecasts updated every matchday, and the archived forecasts for the 2026 presidential and 2025 parliamentary elections. An economy section is in preparation and publishes no figures yet. Every number carries its date and source, and its interval where one was calculated; the methodology of each section is on the site.

The visual identity is the interval mark on paper: see `/marca` on the site for the living guide and the downloadable files, `docs/design/design-system-proposal.md` for the design-system rationale, and `npm run brand` to regenerate every logo, icon and social asset from `src/lib/brand/geometry.json`.

## What the site publishes

In the order the site lists them, by what is live:

- **População** (`/populacao`): an open synthetic population of Portugal, parish by parish, generated from the 2021 Census. Look up a parish, play the daily Mystery parish, download the microdata, and read the quality tier and methodology of the release.
- **Liga Portugal** (`/desporto/liga`): a Bayesian model that simulates the rest of the season after every matchday: title, top-three and relegation probabilities, points ranges, club pages, a simulator and a prediction game against the model. Its next-matchday forecasts are scored against the closing market on `/desporto/liga/modelo`.
- **Eleições** (`/eleicoes/arquivo`): the presidential 2026 and parliamentary 2025 forecasts, kept as they were published, with how to read them.
- **Economia** (`/economia`): in preparation. Explainers on how to read prices, work and activity; no figures until the section is published.

## Principles

- **Uncertainty in view**: probabilities and intervals, never a bare point; where no margin of error was calculated, the page says so.
- **Dated and sourced**: every figure states the date it refers to and where it comes from.
- **Archives stay archives**: past forecasts are not rewritten with the outcome.
- **Independent**: a project by Bernardo Caldas, with no external funding.

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
│   ├── populacao/                  # Synthetic population (parish pages, game, data)
│   ├── desporto/liga/              # Liga Portugal forecast
│   ├── eleicoes/arquivo/           # How to read the election archive
│   ├── eleicoes/presidenciais/     # Presidential election (archive)
│   ├── eleicoes/legislativas/      # Parliamentary election (archive)
│   ├── economia/                   # Economy (in preparation)
│   ├── eleicoes/legislativas/mapa/ # District map (parliamentary 2025)
│   ├── artigos/                    # Articles
│   ├── sobre/                      # About
│   └── metodologia/                # Methodology hub (links each section's method)
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
- [ ] Economics section: in preparation at `/economia` (explainers online, no figures published); launch is `published: true` in `src/lib/config/economy-status.json`
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