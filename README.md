# Profile Mirror

AI-powered talent intelligence platform that helps job seekers see what employers see. Upload your resume and get comprehensive insights about your professional profile, skills, market position, and career trajectory.

## Features

- **Resume Parsing**: AI-powered extraction of skills, experience, and education from PDF resumes
- **Web Presence Discovery**: Find your professional profiles across LinkedIn, GitHub, Twitter, etc.
- **Skills Analysis**: Identify stated skills, inferred skills, and skill gaps
- **Market Position**: Understand your competitiveness and salary range
- **Career Trajectory**: Analyze progression patterns and potential next roles
- **Actionable Recommendations**: Get specific advice to improve your profile

## Tech Stack

- **Next.js 16** - Full-stack React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Claude AI** - Resume parsing and analysis

## API Integrations

| Service | Purpose | Required |
|---------|---------|----------|
| Anthropic Claude | AI analysis | Yes |
| PDF.co | PDF text extraction | Yes |
| SerpAPI | Web search | Yes |
| Bright Data | LinkedIn enrichment | Optional |
| JobsPikr | Labor market data | Optional |

## Setup

1. Clone the repository
2. Copy environment file:
   ```bash
   cp env.example .env
   ```
3. Add your API keys to `.env`
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000)

## Deployment (Railway)

1. Push to GitHub
2. Connect Railway to your repo
3. Add environment variables in Railway dashboard
4. Deploy

## Environment Variables

```
ANTHROPIC_API_KEY=     # Required - Claude AI
PDFCO_API_KEY=         # Required - PDF extraction
SERPAPI_API_KEY=       # Required - Web search
BRIGHTDATA_API_KEY=    # Optional - LinkedIn data
JOBSPIKR_CLIENT_ID=    # Optional - Job market data
JOBSPIKR_AUTH_KEY=     # Optional - Job market data
```

## License

MIT
