# estimador.pt Design System

## Philosophy

This design prioritizes **data over decoration**. It draws inspiration from editorial publications like The Economist, FiveThirtyEight, and Bloomberg—focused on clear information hierarchy and distinctive typography rather than generic UI patterns.

### Core Principles

1. **No rounded box syndrome** - Avoid the shadcn/Tailwind default of cards with rounded corners and shadows
2. **Data-first** - Let numbers and charts speak; containers should be invisible
3. **Editorial layout** - Use dividers, columns, and whitespace like a newspaper
4. **Distinctive color** - Warm stone palette instead of cold grays
5. **Meaningful color** - Candidate/party colors only where they convey information

---

## Color Palette

### Base Colors (Stone)
```
stone-50   #fafaf9  - Page background
stone-100  #f5f5f4  - Section backgrounds
stone-200  #e7e5e3  - Borders, dividers
stone-300  #d6d3d1  - Stronger borders
stone-500  #78716c  - Secondary text
stone-600  #57534e  - Body text
stone-800  #292524  - Dark backgrounds (banner, footer)
stone-900  #1c1917  - Headings, primary text
```

### Accent Colors
```
blue-600   #2563eb  - Links, interactive elements
blue-700   #1d4ed8  - Link hover
amber-500  #f59e0b  - Warnings, second round indicator
amber-600  #d97706  - Warning text
```

### Candidate Colors
Each candidate has a distinctive color used for:
- Vertical identification bars
- Large probability numbers
- Chart elements

```
Gouveia e Melo     #4A90D9  Blue
Marques Mendes     #FF8C00  Orange
André Ventura      #8B0000  Dark Red
António José Seguro #FF69B4  Pink
Cotrim Figueiredo  #00CED1  Cyan
Catarina Martins   #DC143C  Crimson
António Filipe     #228B22  Green
Others             #808080  Gray
```

---

## Typography

### Hierarchy
- **Page title**: `text-3xl md:text-4xl font-bold` - Bold, confident
- **Section headings**: `text-xl font-bold tracking-tight`
- **Subsection headings**: `text-lg font-semibold`
- **Micro-labels**: `text-[10px] font-bold uppercase tracking-wider text-stone-500`
- **Body text**: `text-sm text-stone-600`

### Data Display
- **Large numbers**: `text-4xl font-black tabular-nums tracking-tighter` in candidate color
- **Secondary numbers**: `text-sm font-semibold tabular-nums`
- **Uncertainty**: `±X.X%` format, smaller and lighter

---

## Layout Patterns

### Section Structure
```
section.py-10.border-b.border-stone-300
  div.max-w-7xl.mx-auto.px-4
    h2 (section title)
    content
```

### Grid with Dividers (Candidate Cards)
Instead of individual cards:
```
div.grid.grid-cols-5.divide-x.divide-stone-200.border-y.border-stone-200
  div.p-4 (each cell)
```

### Two-Column with Vertical Divider
```
div.grid.grid-cols-5.gap-12
  div.col-span-3 (main content)
  div.col-span-2.border-l.border-stone-200.pl-12 (sidebar)
```

### Color Bar Indicator
Vertical bar on left edge to indicate category:
```
div.flex.items-start.gap-2
  div.w-1.h-12.flex-shrink-0 (style="background: candidateColor")
  div (content)
```

---

## Component Patterns

### Second Round Indicator
Simple layout with vertical color bar:
```
div.flex.items-center.justify-between
  div.flex.items-center.gap-4
    div.w-2.h-12.bg-amber-500
    div (label + sublabel)
  div.text-5xl.font-black (percentage)
```

### Candidate Card
No box, just content with color bar:
```
div.p-4
  div.h-1.-mx-4.-mt-4.mb-4 (color bar at top - removed)
  OR
  div.w-1.h-12 (vertical color bar on left)
  
  h3 (name)
  span (party)
  div.text-4xl.font-black (probability in candidate color)
  div (vote share with ± uncertainty)
```

### Warning/Note Box
Left border accent, no rounded corners:
```
div.border-l-2.border-amber-500.pl-4.py-2.bg-amber-50/50
  p.text-amber-800
```

### Navigation Links
Simple text with arrow, no button styling:
```
Link.group.inline-flex.items-center.gap-2.text-stone-700.hover:text-blue-700
  span.font-semibold (label)
  ArrowRight.w-4.h-4.group-hover:translate-x-1.transition-transform
```

---

## What to Avoid

### ❌ Don't
- Rounded corners on containers (`rounded-lg`, `rounded-xl`)
- Box shadows (`shadow-sm`, `shadow-md`)
- Cards with backgrounds (`bg-white border rounded-lg p-6`)
- Gradient backgrounds
- Pill-shaped badges
- Icon-heavy designs
- Colorful buttons

### ✅ Do
- Sharp edges or no visible edges
- Divider lines (horizontal/vertical)
- Direct content without wrappers
- Flat, solid colors
- Simple text labels
- Vertical color bars for categorization
- Let whitespace do the work

---

## Responsive Considerations

- Candidate grid: 2 cols on mobile, 5 on desktop
- Two-column layouts stack on mobile
- Navigation links wrap naturally
- Chart maintains minimum width with horizontal scroll

---

## Animation

Minimal, purposeful:
- Link arrows: `group-hover:translate-x-1 transition-transform`
- Color transitions: `transition-colors`
- No decorative animations



