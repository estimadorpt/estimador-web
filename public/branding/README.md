# estimador.pt Brand Assets

## Available Assets

### Icon Only (no text)
- `logo-icon-large.svg` - Scalable vector (1024x1024 viewBox)
- `logo-icon-large-256w.png` - 256px PNG
- `logo-icon-large-512w.png` - 512px PNG
- `logo-icon-large-1024w.png` - 1024px PNG
- `logo-icon-large-2048w.png` - 2048px PNG (high-res)

### Stacked Logo (icon + text below)
Light version (for white/light backgrounds):
- `logo-stacked.svg` - Scalable vector
- `logo-stacked-400w.png` - Small
- `logo-stacked-800w.png` - Medium
- `logo-stacked-1200w.png` - Large

Dark version (for dark backgrounds):
- `logo-stacked-dark.svg` - Scalable vector
- `logo-stacked-dark-400w.png` - Small
- `logo-stacked-dark-800w.png` - Medium
- `logo-stacked-dark-1200w.png` - Large

### Horizontal Logo (icon + text side by side)
- `logo-horizontal.svg` - Scalable vector
- `logo-horizontal-300w.png` - Small
- `logo-horizontal-600w.png` - Medium
- `logo-horizontal-1200w.png` - Large

### Social Media Optimized
- `linkedin-post-light.png` - 1200x1200 square (light background)
- `linkedin-post-dark.png` - 1200x1200 square (dark background)
- `linkedin-cover-dark.png` - 1584x396 banner (dark background, for profile cover)

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Navy | `#1E3A5F` | Primary text, small circle |
| Teal | `#0F766E` | Medium circle |
| Gold | `#D4A000` | Large circle |
| Light Navy | `#4A6FA5` | Small circle on dark backgrounds |
| Light Teal | `#14B8A6` | Medium circle on dark backgrounds |
| Light Gold | `#FBBF24` | Large circle on dark backgrounds |

## Regenerating Assets

Run from project root:
```bash
node scripts/generate-branding.mjs
```

Requires: `sharp` package (already in devDependencies)

