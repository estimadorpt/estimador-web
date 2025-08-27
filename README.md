# estimador.pt - Portugal's Election Forecasting Platform

**Data-driven election analysis for Portuguese democracy**

estimador.pt is Portugal's premier election forecasting platform, bringing rigorous statistical analysis to Portuguese politics in an accessible, trustworthy format. Think FiveThirtyEight for Portugal - we combine sophisticated modeling with clear, engaging journalism to help citizens understand electoral dynamics.

## Our Vision

We're building a credible media platform that makes complex electoral data accessible to everyone, not just political insiders. Our goal is to elevate public discourse around Portuguese elections through:

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
├── app/                    # Next.js pages
│   ├── page.tsx           # Homepage with latest forecasts
│   ├── forecast/          # Main forecast dashboard
│   ├── articles/          # Analysis and insights
│   ├── about/             # Mission and team
│   └── methodology/       # Technical documentation
├── components/
│   ├── ui/                # Design system components
│   ├── charts/            # Data visualizations
│   └── Header.tsx         # Shared navigation
├── lib/
│   ├── config/            # Party colors, coalition definitions
│   └── utils/             # Data processing and calculations
└── types/                 # TypeScript interfaces

public/data/               # Election data and forecasts
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

### Phase 1: Core Platform ✅
- [x] Professional homepage and navigation
- [x] Main forecast dashboard
- [x] Basic chart visualizations  
- [x] About and methodology pages
- [x] Azure deployment pipeline

### Phase 2: Enhanced Visualizations
- [ ] Interactive district map with TopoJSON
- [ ] Improved contested seats analysis
- [ ] Coalition probability tracking
- [ ] Mobile chart optimization

### Phase 3: Content & Features  
- [ ] MDX-based article system
- [ ] Newsletter signup integration
- [ ] Historical forecast tracking
- [ ] Portuguese language support

### Phase 4: Advanced Analytics
- [ ] Real-time data pipeline
- [ ] Polling aggregation automation
- [ ] API for external consumption
- [ ] Historical accuracy tracking

## Contributing

We welcome contributions that improve electoral transparency and democratic discourse. Key areas:

- **Data visualization** improvements
- **Mobile experience** optimization  
- **Accessibility** enhancements
- **Content** creation and fact-checking
- **Translation** to Portuguese

## About

**estimador.pt** was founded by Bernardo Caldas to bring rigorous, transparent election analysis to Portuguese democracy. Our mission is to help citizens make informed decisions by providing trustworthy, accessible forecasts and analysis.

For questions or media inquiries: [info@estimador.pt](mailto:info@estimador.pt)

---

*Built with transparency and open methodology*  
*© 2025 estimador.pt*