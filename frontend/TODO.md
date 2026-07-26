# Dashboard Loja Redesign - TODO

## ✅ Step 1: Import icon utility in dashboardMestre.jsx
- Added import for `obterIconeItem` from `../utils/itemIcons`

## ✅ Step 2: Add new CSS classes to DashboardMestre.css
- Card layout: `.loja-item`, `.loja-item-topo`, `.loja-item-icone`
- Type badge: `.loja-item-tipo`  
- Weapon stats: `.arma-status-card` (mirrors player store)
- Footer: `.loja-item-footer`

## ✅ Step 3: Modify catalog item rendering in dashboardMestre.jsx
- Replaced simple text rows with rich card layout using `loja-item` classes
- Added icon rendering via `obterIconeItem`
- Added weapon stats card for firearms (armas-fogo category)
- Added proper type badges and price styling

## ✅ Step 4: Polish the editor form styling
- Added `mestre-loja-form` styling improvements with card-like appearance
- Editor form now uses consistent dark minimal theme with gold accents

## Step 5: Test and verify (user)
- Verify all interactions still work (edit, delete, add items)
- Verify responsive behavior on different screen sizes

