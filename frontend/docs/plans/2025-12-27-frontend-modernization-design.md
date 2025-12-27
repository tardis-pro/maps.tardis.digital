# Frontend Modernization Design

## Overview

Comprehensive modernization of the frontend to remove redundant dependencies, improve architecture, and consolidate styling.

## Decisions

| Category | Remove | Keep/Add |
|----------|--------|----------|
| Forms | Formik, Yup | React Hook Form + Zod |
| Animation | Anime.js, Popmotion | Framer Motion |
| Styling | styled-components, Emotion, all `.css` files | Tailwind only (inline classes) |
| State | Redux Toolkit, React Redux, redux-in-worker | TanStack Query + React Context |
| Error handling | — | Error boundaries (global + route-level) |

## State Management Architecture

### Redux Slices to New Approach Mapping

| Redux Slice | New Approach |
|-------------|--------------|
| `authSlice` | TanStack Query mutations + React Context for user session |
| `mapSlice` | React Context (UI state: viewState, isMapLoaded) |
| `uiSlice` | React Context (sidebar open, modals, theme) |
| `layerSlice` | TanStack Query for layer data + Context for visibility toggles |
| `analyticsSlice` | TanStack Query queries/mutations |
| `visualizationSlice` | React Context (local UI preferences) |
| `dataSlice` | TanStack Query (server data fetching) |
| `analysisSlice` | TanStack Query mutations (spatial analysis operations) |

### New Structure

```
src/
├── api/
│   └── queries/
│       ├── auth.ts        # useLogin, useLogout, useCurrentUser
│       ├── layers.ts      # useLayers, useCreateLayer, useDeleteLayer
│       ├── analytics.ts   # useAnalytics, useRunAnalysis
│       └── data.ts        # useDataSources, useImportData
├── context/
│   ├── AuthContext.tsx    # User session state
│   ├── MapContext.tsx     # View state, map instance
│   └── UIContext.tsx      # Sidebar, modals, theme
├── providers/
│   └── AppProviders.tsx   # Combines QueryClient + all Contexts
```

### Key Principles

- Server state (data that lives on backend) → TanStack Query
- UI state (ephemeral, local-only) → React Context
- No prop drilling - contexts for shared UI state

## Styling Conversion

### Files to Convert

```
src/effects/*.css      → Tailwind classes in components
src/bits/*.css         → Tailwind classes in components
src/components/*.css   → Tailwind classes in components
src/App.css           → CSS variables → Tailwind config
src/index.css         → Keep minimal reset only
src/styles.css        → Merge into index.css or remove
```

### CSS Variables Strategy

Move CSS custom properties to `tailwind.config.js`:

```js
export default {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#1e40af',
      }
    }
  }
}
```

### Complex Styles Handling

- Use Tailwind's `@apply` in minimal `globals.css` only if truly needed
- Framer Motion handles most animation needs
- Tailwind arbitrary values `[property:value]` for edge cases

## Error Handling

### Structure

```
src/
├── components/
│   └── errors/
│       ├── GlobalErrorBoundary.tsx   # Catches all unhandled errors
│       ├── RouteErrorBoundary.tsx    # Per-route fallback UI
│       └── QueryErrorBoundary.tsx    # TanStack Query error handling
```

### App Structure

```tsx
<GlobalErrorBoundary fallback={<CrashScreen />}>
  <QueryClientProvider>
    <AppProviders>
      <RouterProvider />
    </AppProviders>
  </QueryClientProvider>
</GlobalErrorBoundary>
```

### TanStack Query Error Handling

- Global `onError` callback for toast notifications
- Per-query error states via `isError`, `error`
- Retry logic built-in (3 retries by default)

### Additional Patterns

| Pattern | Purpose |
|---------|---------|
| `React.Suspense` | Loading states for lazy-loaded routes |
| `React.lazy()` | Code-split heavy components (map, 3D viewer) |
| Custom `useToast` hook | Consistent error/success notifications |

## Dependency Changes

### Remove (8 packages)

```
formik
yup
animejs
popmotion
@emotion/react
@emotion/styled
styled-components
@reduxjs/toolkit
react-redux
redux-in-worker
```

### Add (2 packages)

```
@tanstack/react-query
zod
```

### Keep

```
@hookform/resolvers (already installed)
```

## Implementation Phases

### Phase 1: Setup
- Add TanStack Query, Zod dependencies
- Create providers structure (`src/providers/AppProviders.tsx`)
- Add error boundaries (`src/components/errors/`)
- Configure QueryClient with defaults

### Phase 2: Auth
- Convert `authSlice` → `useAuth` query + `AuthContext`
- Update `Signin.tsx`, `Signup.tsx`, `PasswordChange.tsx`
- Update protected route logic

### Phase 3: Core UI
- Convert `uiSlice` → `UIContext`
- Convert `mapSlice` → `MapContext`
- Update `Sidebar.tsx`, `Dashboard.tsx`

### Phase 4: Data Layer
- Convert `dataSlice` → TanStack Query hooks
- Convert `layerSlice` → TanStack Query + Context
- Convert `analysisSlice` → TanStack Query mutations
- Convert `analyticsSlice` → TanStack Query
- Convert `visualizationSlice` → Context

### Phase 5: Components
- Update remaining components to use new state
- Remove Formik usages, convert to React Hook Form + Zod
- Update form validation schemas

### Phase 6: Styling
- Extract CSS variables to `tailwind.config.js`
- Convert component CSS files to Tailwind classes
- Remove all `.css` files (except minimal `index.css`)
- Remove styled-components/Emotion usages

### Phase 7: Cleanup
- Remove old Redux files (`slices/`, `store.ts`, `actions.js`, `reducers.js`)
- Remove unused dependencies from `package.json`
- Run `pnpm install` to clean lockfile
- Run type-check, lint, build
- Test all functionality

## File Impact Summary

- ~45 files modified
- ~25 files deleted (CSS, legacy Redux)
- ~15 files created (queries, contexts, error boundaries)
