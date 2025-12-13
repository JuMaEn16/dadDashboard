# Dad Dashboard - Copilot Instructions

## Project Overview
**dadDashboard** is a React + TypeScript + Vite web application. Currently a minimal starter template with a counter component. No existing architecture patterns yet—establish patterns early as the project grows.

## Build & Development Workflow

### Essential Commands
- **`npm run dev`**: Start Vite dev server with HMR (hot module reloading)
- **`npm run build`**: Compile TypeScript (`tsc -b`) then build with Vite for production
- **`npm run lint`**: Run ESLint on all files (includes React Hooks and React Refresh rules)
- **`npm run preview`**: Preview the production build locally

### Key Development Details
- **TypeScript compilation** happens before Vite build (two-step process in production)
- **React Compiler** is enabled in `vite.config.ts` — impacts dev/build performance but optimizes components
- **Hot Module Reloading (HMR)** works automatically; ESLint enforces `react-refresh` rules via `react-refresh` ESLint plugin

## Architecture & Code Structure

### Current Structure
```
src/
  main.tsx          # Entry point; renders App into root
  App.tsx           # Root component (counter demo, replace with real content)
  App.css           # App-level styles
  index.css         # Global styles
  assets/           # Static assets (SVGs, images)
```

### Component Patterns
- Use **functional components** with hooks (project already uses `useState`)
- All components are TypeScript (`.tsx`)
- Place component-specific styles alongside components (e.g., `Component.tsx` + `Component.css`)
- Import React only when needed (modern JSX doesn't require explicit `React` import)

### Root Component Entry Pattern
The pattern established in `main.tsx` uses:
```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```
**Keep this structure:** `StrictMode` helps identify issues during development; `StrictMode` should wrap the entire app, not individual components.

## TypeScript & Linting

### Compiler Configuration
- **`tsconfig.json`**: Base config (all settings)
- **`tsconfig.app.json`**: App-specific overrides (include `src/`)
- **`tsconfig.node.json`**: Build tooling config (include config files like `vite.config.ts`)
- **Build command includes type checking** (`tsc -b` before Vite build)

### ESLint Rules & Enforcement
Flat config (`eslint.config.js`) enforces:
- **TypeScript ESLint recommended rules** (`tseslint.configs.recommended`)
- **React Hooks rules** (`react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`)
- **React Refresh rules** (prevents breaking HMR patterns)
- **Browser globals** (no Node.js globals assumed)

**Strict mode ready:** README suggests upgrading to `strictTypeChecked` when ready for production—prepare code for this future upgrade.

## Dependencies & Notable Libraries

### Core Dependencies
- **react** ^19.2.0, **react-dom** ^19.2.0: React 19 with latest improvements
- **vite**: Build tool (using `rolldown-vite` variant for faster builds)
- **typescript** ~5.9.3: Pinned minor version for consistency
- **@vitejs/plugin-react**: React support with Babel/Oxc Fast Refresh

### Dev Tools
- **babel-plugin-react-compiler**: Enables React Compiler for optimization
- **typescript-eslint**: ESLint + TypeScript integration
- **eslint-plugin-react-hooks**, **eslint-plugin-react-refresh**: React-specific linting

## When Adding Features

1. **Create new components in `src/`** as `.tsx` files with accompanying `.css` if needed
2. **Import from `src/` not `public/`** (public is for static assets served directly)
3. **Run linting often** (`npm run lint`) during development—ESLint catches common mistakes early
4. **Type all props** explicitly (TypeScript enforces this)
5. **Use `npm run build` locally** before committing to catch TypeScript errors that might pass in dev

## Important Caveats

- **React Compiler is experimental**—watch for performance changes; disable in `vite.config.ts` if issues arise
- **No routing or state management** currently installed—add these as needed (e.g., React Router, Zustand)
- **No testing framework**—testing infrastructure should be added early if required
- **No CSS-in-JS or component library**—plain CSS is used; consider adding if project grows
