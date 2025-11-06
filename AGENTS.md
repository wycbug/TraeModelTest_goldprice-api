# Agent Guidelines

## Commands
- `bun run dev` - Start development server
- `bun run build` - Build for production (runs TypeScript check + Vite build)
- `bun run lint` - Run ESLint on all files
- `bun run preview` - Preview production build locally
- `bun run deploy` - Build and deploy to Cloudflare Workers
- `bun run cf-typegen` - Generate Cloudflare Worker types

## Code Style
- **Imports**: Use absolute imports with `@/` alias for src directory, group external imports first
- **TypeScript**: Strict typing enabled, use interfaces for data structures, prefer `const` assertions
- **Components**: Use React.forwardRef for composable components, follow Radix UI patterns
- **Styling**: Tailwind CSS only, use `cn()` utility from @/lib/utils for class merging
- **Error Handling**: Try-catch with proper error types, exponential backoff for retries
- **Naming**: camelCase for variables, PascalCase for components, kebab-case for files
- **Formatting**: ESLint + TypeScript rules, no semicolons, 2-space indentation
- **Worker Code**: Use async/await, implement caching with 5-minute TTL, handle stale data fallback

## Testing
No test framework configured - add testing setup before writing tests.

## Architecture
- Frontend: React 19 + TypeScript + Vite
- Backend: Cloudflare Workers with caching
- Charts: Chart.js with react-chartjs-2
- Export: PapaParse for CSV/Excel downloads