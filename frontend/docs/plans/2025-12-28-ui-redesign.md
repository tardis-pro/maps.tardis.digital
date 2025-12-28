# UI Redesign: Data Exploration Focus

## Summary

Redesign the map application UI from cluttered overlapping panels to a clean, professional layout optimized for data exploration.

## Requirements

- **Primary use case**: Data exploration (layer browsing, visibility, analysis)
- **Visual style**: Light, professional (ArcGIS Online-like)
- **Layout**: Left sidebar + bottom drawer
- **Sidebar behavior**: Fully hideable for maximum map space

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ [≡] Tardis Maps                    [?] [⚙] [User ▾]   │
├───────┬─────────────────────────────────────────────────┤
│       │                                                 │
│ LEFT  │              MAP (FULL BLEED)                   │
│ SIDE  │                                                 │
│ BAR   │                                    [+][-][◐]   │
│ 280px │                                                 │
├───────┴─────────────────────────────────────────────────┤
│ ▲ Features (collapsed)                       [expand]  │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. Top Bar (48px height)
- Hamburger menu to toggle sidebar
- App branding
- Right side: help, settings, user menu
- Clean, minimal

### 2. Left Sidebar (280px, hideable)

**Layers Section:**
- Search/filter input
- Layer list with checkboxes for visibility
- Each row: checkbox, layer name, overflow menu (style, zoom to, remove)
- "Add Layer" button opens modal

**Analysis Section:**
- Buffer, Intersect, Measure tools
- Results appear in bottom drawer

### 3. Bottom Drawer (40px collapsed, 300px expanded)
- Collapsed: shows feature count summary
- Expanded: data table with sortable columns, pagination
- Triggered by: selecting a layer, running analysis
- Resizable via drag handle

### 4. Add Layer Modal
- Tabs: Upload, API, Database
- Upload tab: drag-drop zone
- Replaces inline DataManager panels
- All existing upload logic moves here

### 5. Map Controls (floating, bottom-right)
- Zoom in/out
- 3D toggle
- Compass/reset north
- Small, unobtrusive

## Visual Styling

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | #FFFFFF | Panel backgrounds |
| `--bg-secondary` | #F5F7FA | Hover states, alternating rows |
| `--border` | #E2E8F0 | Subtle borders |
| `--text-primary` | #1A202C | Main text |
| `--text-secondary` | #718096 | Labels, metadata |
| `--accent` | #2563EB | Primary buttons, selected state |
| `--accent-light` | #EBF5FF | Selected backgrounds |

### Typography
- Font: Inter or system-ui
- Headers: 14px, 600 weight, uppercase, secondary color
- Body: 14px, 400 weight
- Small: 12px for metadata

### Spacing
- Panel padding: 16px
- Item padding: 12px vertical, 16px horizontal
- Gap: 8px

### Shadows
- Panels: `0 1px 3px rgba(0,0,0,0.1)`
- Modals: `0 4px 20px rgba(0,0,0,0.15)`
- Hover: `0 2px 8px rgba(0,0,0,0.1)`

## Files to Modify

### Delete/Replace
- `src/bits/DataManager.tsx` → move logic to AddLayerModal
- `src/bits/Dashboard.tsx` → replace with TopBar
- `src/bits/Sidebar.tsx` → rewrite completely
- `src/bits/MapControls.tsx` → simplify to floating controls

### Create New
- `src/components/TopBar.tsx`
- `src/components/Sidebar/index.tsx`
- `src/components/Sidebar/LayerList.tsx`
- `src/components/Sidebar/AnalysisTools.tsx`
- `src/components/BottomDrawer.tsx`
- `src/components/AddLayerModal.tsx`
- `src/styles/variables.css` (CSS custom properties)

### Update
- `src/pages/Home.tsx` → new layout structure
- `src/App.tsx` → if routing changes needed
- `src/index.css` or Tailwind config for new design tokens

## Migration Notes

- Keep all existing functionality (upload, API connect, database)
- Just reorganize into cleaner layout
- Use Mantine components where possible (Modal, Table, Tabs)
- Keep Framer Motion for sidebar show/hide animation
- Use Tailwind for utility classes, CSS variables for design tokens
