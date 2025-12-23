# Copilot Instructions for AI Agents

## Project Overview
Binance Watch Live is a bilingual (AR/EN) real-time portfolio and asset analysis web app built with React (TypeScript), Vite, Tailwind CSS, and Supabase. It provides coin recommendations, portfolio analysis, price alerts, and advanced filtering for Binance and CoinGecko data.

## Architecture Overview

### Frontend Stack
- **React 18** + **TypeScript** with SWC compiler for fast builds
- **Vite 5** dev server (port 8080) with React Fast Refresh
- **Tailwind CSS 3** + **shadcn/ui** (Radix UI components) for UI
- **React Router 6** for client-side routing
- **TanStack React Query 5** for server state management
- **Zod** for runtime type validation

### Key File Structure
```
src/
├── pages/           # Route-level components (Index, Auth, PortfolioRebalance, etc.)
├── components/      # Reusable UI components (AssetCard, PriceAlerts, AdvancedRecommendationCard)
├── hooks/          # Custom hooks (useFavorites, use-mobile, use-toast)
├── lib/            # Core utilities: translations.ts, coins-database.ts, utils.ts
├── utils/          # Domain logic: advancedSearch.ts, coinAnalyzer.ts
├── integrations/supabase/  # Supabase client (client.ts) and auto-generated types (types.ts)
└── App.tsx         # Router setup with QueryClientProvider, TooltipProvider
```

### Data Flow Patterns
1. **Authentication**: Supabase Auth → localStorage (persistent sessions)
2. **Portfolio Data**: Supabase RLS tables (profiles, recommendation_status) → React state
3. **Coin Data**: CoinGecko API (via Supabase Edge Functions) → React Query cache
4. **Favorites**: localStorage (FAVORITES_KEY) → custom useFavorites hook
5. **UI State**: localStorage for alerts and settings

## Critical Patterns & Conventions

### Bilingual System (AR/EN)
- All user-facing text uses `translations` from `src/lib/translations.ts`
- Use `getTranslation(key, language)` for dynamic language switching
- Database fields follow pattern: `field_ar` / `field_en` (or `field` / `field_en`)
- Example: `project_description` (Arabic) + `project_description_en`

### Advanced Search & Filtering (`src/utils/advancedSearch.ts`)
- **Smart Filters**: `applySmartFilters()` for liquidity, risk, growth criteria
- **Coin Classification**: `classifyProject()` maps symbols to categories (DeFi, Staking, etc.)
- **Ranking**: `rankCoins()` combines age bonus, market metrics, and filtering weights
- **Search Stats**: `getSearchStats()` returns analytics for filtered coin sets
- Key functions: `performSmartSearch()`, `shuffleCoins()`, `getListingDate()`

### Coin Scoring & Recommendations
- **Confidence Score** (`coinAnalyzer.ts`): Combines volatility, market cap, liquidity, trading volume
- **Favorite Scoring** (`useFavorites.ts`): Weighted formula (Growth 25%, Liquidity 20%, Risk 20%, Value 15%, Age 10%, Halal 10%)
- Scores normalize to 0-100 range for consistent ranking

### Component Patterns
- **Asset Cards**: Display coin metrics with visual indicators (icons for risk/liquidity)
- **Advanced Recommendation Card**: Shows filtering criteria, coin count, recommendation type
- **Portfolio Analysis**: Pie charts (Recharts library) showing asset distribution and PnL
- **Price Alerts**: Custom hook for reactive notifications (stored in localStorage)

### State Management
- **React Query**: For async server state (coin data, portfolios)
- **useState**: For local UI state (expanded cards, filter toggles)
- **localStorage**: For user preferences, favorites, alerts, recent searches
- **Supabase Auth**: Session managed via `supabase.auth.getSession()`

## Developer Workflows

### Setup & Running
```sh
npm install              # Install dependencies
npm run dev             # Start Vite dev server (http://localhost:8080)
npm run build           # Production build
npm run lint            # ESLint checks
npm run preview         # Preview production build locally
```

### Windows-Specific Scripts
- `start-app.bat` or `start-app.ps1` for simplified local startup

### Testing Utilities
- `test-coingecko-live.js`: Browser console tests for CoinGecko API response times and sampling
- API responses cached with `_=${Date.now()}` to bypass browser caching

### Supabase Management
- Configuration: `supabase/config.toml`
- Migrations: `supabase/migrations/` (auto-generated from schema changes)
- Edge Functions: Deno-based serverless functions in `supabase/functions/`
- Auto-generated types: `src/integrations/supabase/types.ts` (do NOT edit manually)

### Build Configuration
- **TypeScript**: Loose mode (`noImplicitAny: false`, `strictNullChecks: false`) for flexibility
- **Path Alias**: `@/*` → `src/*` (configured in tsconfig.json)
- **Lovable Integration**: Uses `lovable-tagger` in dev mode for component tracking
- **Tailwind JIT**: Automatically processes utility classes in `@` aliased files

## External Integrations

### Lovable.dev
- Project URL: https://lovable.dev/projects/457af8ba-e635-417a-b45e-b7786521e270
- Changes sync bidirectionally (Lovable ↔ GitHub repo)

### Supabase
- **Auth**: Email/password authentication with email confirmation
- **Database**: PostgreSQL with Row-Level Security (RLS) policies
- **Tables**: `profiles` (user metadata), `recommendation_status` (tracking)
- **Edge Functions**: Run Deno code for CoinGecko API aggregation

### External APIs
- **CoinGecko**: `/markets` endpoint for 250+ coins (price, market cap, 24h change)
- **Binance**: Direct portfolio fetch via API keys (if configured in profiles)

## Tips for AI Agents

1. **Always use `@` paths** for imports: `import { Coin } from '@/utils/coinAnalyzer'`
2. **Bilingual-first mindset**: When adding features, add Arabic AND English translations simultaneously
3. **localStorage is the source of truth** for favorites, alerts, and recent searches—sync with DB when needed
4. **Use existing components** from shadcn/ui (Button, Card, Dialog, etc.) for consistency
5. **React Query for async**: Wrap API calls with `useQuery()` for caching and automatic refetching
6. **Supabase RLS**: All DB queries run with authenticated user context—check `user_id` in where clauses
7. **Test API changes** using `test-coingecko-live.js` in browser console before deploying
8. **TypeScript is loose**: Feel free to use `any` if types get complex, but prefer clear interfaces
9. **Tailor to mobile**: Use `use-mobile` hook and test responsive Tailwind breakpoints (sm, md, lg)
10. **Performance**: Component separation and React Query caching prevent unnecessary re-renders
- Reference the relevant markdown docs for advanced features and troubleshooting (e.g., `ADVANCED_FILTERS_APPLIED.md`, `TROUBLESHOOTING_PNL.md`).
- Always use translation utilities for UI text.
- Follow the modular component structure and avoid monolithic files.
- For new features, add them as new components or hooks in the appropriate directory.
- Use the provided scripts for local development and deployment.

---
_Review and update these instructions as the codebase evolves. For unclear or missing sections, ask maintainers for clarification._
