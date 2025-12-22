# Telegram Mini App Design Guidelines

## Design Approach
**Reference-Based Approach:** Telegram Dark Mode aesthetic
- Follow Telegram's native app patterns for familiarity and user comfort
- Dark theme-first design with Telegram's signature blue accents
- Utility-focused interface prioritizing speed and clarity

## Core Design Elements

### Typography
- **Primary Font:** System fonts (-apple-system, Roboto, sans-serif) for optimal mobile rendering
- **Hierarchy:**
  - Headers: text-xl to text-2xl, font-semibold
  - Body: text-base, font-normal
  - Labels/Captions: text-sm, font-medium
  - Numbers/Currency: font-mono for balance displays

### Layout System
**Spacing Primitives:** Tailwind units of 3, 4, 6, and 8
- Consistent padding: p-4 for cards, p-6 for sections
- Vertical spacing: space-y-4 for lists, space-y-6 for sections
- Grid gaps: gap-3 for tight grids, gap-4 for comfortable spacing

### Component Library

**Navigation (Bottom Tab Bar):**
- Fixed bottom navigation with 4 tabs (Home, Tasks, Create, Profile)
- Active state with Telegram blue underline/icon fill
- Icon + label below for each tab

**Cards:**
- Rounded corners: rounded-xl
- Subtle elevation with border instead of shadow (border border-gray-700/50)
- Padding: p-4 internally
- Background: Semi-transparent dark (bg-gray-800/50)

**Buttons:**
- Primary (Telegram Blue): Full-width for major actions, rounded-lg, py-3
- Secondary (Outline): Border style for less critical actions
- Icon buttons: Rounded-full for copy/share actions
- Disabled state: reduced opacity (opacity-50)

**Forms:**
- Input fields: bg-gray-800 with border-gray-700, rounded-lg, p-3
- Labels: text-sm mb-2 above inputs
- Validation: Inline error messages in red below fields

**Lists:**
- Task cards: Individual bordered containers with space-y-3
- Transaction history: Compact list items with icon + details + amount
- Leaderboard: Numbered list with rank badge + username + earnings

**Balance Display:**
- Large, prominent numbers (text-3xl font-bold font-mono)
- Currency symbol clearly visible
- Center-aligned in header area

**Language Toggle:**
- Compact pill-style toggle in top-right
- EN | বাং format with active state highlighted

**Banner Slider (Home):**
- Full-width horizontal carousel
- Auto-play with dot indicators
- Rounded corners: rounded-xl, aspect ratio 16:9 or 2:1

**Modals/Sheets:**
- Bottom sheet style for deposit/withdraw forms
- Semi-transparent backdrop (bg-black/60)
- Slide-up animation

### Interaction Patterns
- Minimal animations: Focus on instant feedback
- Loading states: Skeleton screens or spinners for data fetching
- Copy actions: Instant visual confirmation (checkmark icon swap)
- Task verification: Progressive disclosure (Start → Verify flow)

### Mobile-First Considerations
- Thumb-friendly tap targets: Minimum 44px height for buttons
- Single-column layouts throughout
- Pull-to-refresh on Home and Tasks tabs
- Safe area handling for notched devices (pb-safe)

### Admin Panel
- Same dark theme but distinct header indicator
- Data tables with horizontal scroll on mobile
- Approve/Reject actions with confirmation dialogs

### Images
**No hero image required.** This is a functional utility app.
- Banner slider on Home: Promotional graphics (placeholder: 800x400px)
- Profile avatars: Circular, 40px for leaderboard, 80px for profile page
- Task icons: 24px square icons for task types

**Visual Consistency:**
- All monetary values right-aligned
- Consistent icon sizing (24px for most UI icons)
- Status indicators: colored dots/badges (green=success, yellow=pending, red=rejected)