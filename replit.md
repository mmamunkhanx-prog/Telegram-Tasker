# TaskEarn - Telegram Mini App

## Overview

TaskEarn is a Telegram Mini App that enables users to earn money by completing tasks (primarily joining Telegram channels). Users can also create tasks to promote their own channels, manage deposits/withdrawals, and earn through referrals. The app features a bilingual interface (English/Bangla) with a Telegram-native dark mode aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: React Context API for global app state (user, language)
- **Data Fetching**: TanStack React Query for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom path aliases (@/, @shared/, @assets/)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful JSON API endpoints under /api prefix
- **Development**: Vite middleware for HMR in development mode
- **Production**: Static file serving from dist/public

### Database Layer
- **Database**: PostgreSQL (Neon-backed via Replit)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: shared/schema.ts (shared between client and server)
- **Migrations**: Drizzle Kit with `npm run db:push` for schema sync
- **Connection**: Node-postgres (pg) pool via DATABASE_URL

### Data Models
- **Users**: Telegram authentication, balance tracking, referral system
  - Fields: id, telegramId, username, firstName, lastName, photoUrl, balance, referralCode, referredBy, isAdmin, dailyCheckinLastClaimed, createdAt
- **Tasks**: Channel promotion tasks with budget management
  - Fields: id, creatorId, title, titleBn, channelUsername, channelLink, rewardPerMember, totalBudget, remainingBudget, completedCount, maxMembers, isActive, createdAt
- **TaskCompletions**: Track user task progress and verification
  - Fields: id, taskId, userId, status (pending/verified/failed), rewardAmount, verifiedAt, retentionChecked, deducted, createdAt
- **Transactions**: Deposits, withdrawals, earnings, and referral bonuses
  - Fields: id, userId, type, amount, status, method, walletAddress, transactionId, note, createdAt
- **Banners**: Dynamic homepage banner management
  - Fields: id, imageUrl, caption, redirectLink, isActive, createdAt

### Authentication
- **Method**: Telegram WebApp auto-login (no passwords)
- **Flow**: Client extracts Telegram user data via @twa-dev/sdk, sends to /api/auth/telegram
- **Referral Support**: Start parameter parsing for referral code tracking

### Internationalization
- **Languages**: English (en) and Bangla (bn)
- **Implementation**: Custom i18n module with translation objects
- **Persistence**: Language preference stored in localStorage

## Key Features

### Task System
- Users complete tasks by joining Telegram channels
- Task verification simulates Telegram Bot API (70% success rate in demo)
- Minimum reward per task: 0.5 BDT
- Task budget determines max members

### Financial System
- Deposit methods: bKash, Nagad, USDT (BEP-20)
- Minimum deposit: 10 BDT
- Minimum withdrawal: 50 BDT
- Manual admin approval for all transactions
- Withdrawal rejection refunds balance immediately

### Referral System
- 5 BDT bonus for referrer when new user joins
- Each user has unique referral code
- Referral links work via Telegram start parameter

### Admin Panel
- Access at /admin-master route (hidden from nav)
- **Only Telegram ID 1991771063 has admin access** (configurable via ADMIN_TELEGRAM_ID env var)
- Server-side middleware validates admin access on all admin API endpoints
- View pending deposits/withdrawals
- Approve/reject transactions with proper balance handling
- Dashboard shows platform statistics

## External Dependencies

### Telegram Integration
- **@twa-dev/sdk**: Official Telegram Web App SDK for user data, haptic feedback, and native features
- **Telegram WebApp Script**: Loaded via CDN in index.html

### Payment Methods (UI only)
- **Supported**: bKash, Nagad, USDT (BEP-20)
- **Flow**: Manual verification through admin panel

### UI Components
- **shadcn/ui**: Full component library with Radix UI primitives
- **Styling**: CSS variables for theming, dark mode by default
- **Icons**: Lucide React icons, react-icons for brand icons

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner
- **Build**: esbuild for server bundling, Vite for client

## API Endpoints

### Authentication
- POST /api/auth/telegram - Auto-login via Telegram

### Tasks
- GET /api/tasks - Get all active tasks
- GET /api/tasks/completions?userId={id} - Get user's task completions
- POST /api/tasks - Create new task
- POST /api/tasks/:taskId/verify - Verify task completion

### Transactions
- GET /api/transactions?userId={id} - Get user's transactions
- POST /api/transactions/deposit - Submit deposit request
- POST /api/transactions/withdraw - Submit withdrawal request

### Users
- GET /api/users/top-earners - Get leaderboard

### Admin
- GET /api/admin/stats - Platform statistics
- GET /api/admin/pending-deposits - Pending deposits list
- GET /api/admin/pending-withdrawals - Pending withdrawals list
- POST /api/admin/transactions/:id/approve - Approve transaction
- GET /api/admin/banners - Get all banners (admin only)
- POST /api/admin/banners - Create new banner (admin only)
- DELETE /api/admin/banners/:id - Delete banner (admin only)

### Banners
- GET /api/banners - Get active banners (public)

### Retention
- POST /api/retention/check - Check if users left channels within 48 hours and deduct rewards (manual API call)
- Automated hourly cron job (server/scheduler.ts) - Runs retention checks automatically every hour at the start of the hour

### Scheduled Tasks
- **Retention Check Scheduler** (server/scheduler.ts)
  - Runs every hour via node-cron
  - Automatically checks pending task completions for 48-hour retention
  - Deducts balance if users left channels early
  - Sends Telegram notifications for deductions
  - Handles insufficient balance cases gracefully

## Recent Changes

### December 24, 2025
- Added Dynamic Banner Management System
- Banners table with imageUrl, caption, redirectLink, isActive fields
- Admin panel now has Banners tab for CRUD operations (add/delete)
- BannerSlider component fetches active banners from API
- Falls back to default gradient banners if no admin banners exist
- Banners auto-slide every 4 seconds and open redirect links on click
- Public endpoint GET /api/banners for active banners

### December 23, 2025 (Part 2)
- Simplified Create Task page: Removed 'Task Title (Bangla)' field
- Added Daily Check-in feature with 1 BDT reward
- Daily Check-in logic: Users can claim once every 24 hours with countdown timer
- Removed Top Earners section from Homepage
- Created DailyCheckin component with countdown timer UI
- Added POST /api/users/daily-checkin endpoint for claiming daily rewards
- Users table now tracks dailyCheckinLastClaimed timestamp

### December 23, 2025 (Part 1)
- Added Ongoing/Completed tabs to Tasks page with filtering logic
- Implemented retention check system for 48-hour channel membership verification
- Added deduction transaction type for early channel leavers
- Retention check deducts from referrer for referral tasks, from user for personal tasks
- TaskCompletions now track rewardAmount, verifiedAt, retentionChecked, deducted
- Telegram notifications sent when deductions occur
- Created automated cron scheduler (server/scheduler.ts) for hourly retention checks
- Installed node-cron for scheduling and task automation

### December 22, 2025
- Implemented admin access control with Telegram ID 1991771063 as sole admin
- Added server-side requireAdmin middleware for all admin API endpoints
- Admin status is now verified on each login and synced with database
- Implemented real Telegram Bot API verification for task completion (using TELEGRAM_BOT_TOKEN)
- Fixed withdrawal rejection logic to properly refund balance
- Fixed deposit approval logic for consistency
- Migrated from in-memory storage to PostgreSQL with Drizzle ORM
- Added comprehensive data-testid attributes for testing
