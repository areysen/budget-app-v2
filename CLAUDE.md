# Budget App v2 - Claude Documentation

## Quick Reference

### Development Commands
```bash
# Development
npm run dev          # Start development server (localhost:3000)

# Build & Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Database (Supabase CLI required)
supabase start       # Start local Supabase instance
supabase db reset    # Reset local database
supabase gen types typescript --local > src/types/supabase.ts  # Generate types
```

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
OPENAI_API_KEY=  # For Supabase AI features
```

## Architecture Overview

### Core Concept
This is a **paycheck-period focused, zero-based budgeting app** with envelope method for spending categories. Built for household sharing (primary user + spouse) with AI-powered insights.

### Key Business Logic
- **Semi-monthly budget cycles**: 1st-14th (paid 15th), 15th-EOM (paid EOM)
- **Envelope system**: Spending categories with allocated amounts per period
- **Conservative budgeting**: Don't count secondary income until confirmed
- **Dual transaction system**: Plaid imports + user transactions as source of truth

### Tech Stack
- **Framework**: Next.js 15 with App Router & TypeScript
- **Database**: Supabase with Row Level Security (RLS)  
- **Banking**: Plaid integration (planned)
- **UI**: Tailwind CSS + shadcn/ui components
- **Authentication**: Supabase Auth with middleware protection
- **Icons**: Lucide React
- **Notifications**: react-hot-toast

## Database Architecture

### Core Data Model
All data is scoped to `household_id` via RLS. Key relationships:

```
profiles (extends Supabase auth)
├── household_members (user permissions)
    └── households (shared budget groups)
        ├── paycheck_periods (budget periods)
        │   ├── period_income (income sources per period)
        │   ├── period_envelopes (envelope allocations)
        │   ├── period_fixed_expenses (bills per period)
        │   └── savings_contributions (goal contributions)
        ├── envelopes (spending category definitions)
        ├── fixed_expenses (recurring bill definitions)
        ├── savings_goals (long-term targets)
        ├── plaid_transactions (raw bank imports)
        ├── user_transactions (source of truth with envelope assignments)
        ├── ai_recommendations (AI suggestions)
        └── spending_insights (pattern analysis)
```

### Key Tables
- **paycheck_periods**: Semi-monthly periods with start/end dates, status (draft/active/completed)
- **envelopes**: Master spending categories with rollover rules ('save', 'rollover', 'rollover_limit')
- **user_transactions**: Source of truth transactions with approval workflow
- **household_members**: Role-based permissions (primary/secondary user)

## Code Organization

### Directory Structure
```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Auth routes (/login, /signup, etc.)
│   ├── (dashboard)/        # Protected routes (/dashboard, etc.)
│   ├── onboarding/         # First-time user setup
│   └── api/                # API routes
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components  
│   ├── auth/               # Authentication components
│   ├── dashboard/          # Dashboard specific components
│   ├── periods/            # Paycheck period components
│   └── transactions/       # Transaction components
├── lib/                    # Utilities and business logic
│   ├── supabase/           # Database clients (client.ts, server.ts)
│   ├── utils/              # Utility functions (currency, dates)
│   ├── periods.ts          # Period management logic
│   ├── budget-allocation.ts # Budget allocation logic
│   └── period-income.ts    # Income calculation logic
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript definitions
└── middleware.ts           # Auth middleware
```

## Key Patterns & Conventions

### Database Access Patterns
```typescript
// Client-side (browser)
import { createClient } from "@/lib/supabase/client";

// Server-side (SSR/API routes)  
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Always scope queries to household
const { data } = await supabase
  .from("envelopes")
  .select("*")
  .eq("household_id", householdId);
```

### Authentication Flow
1. **Middleware**: `/Users/areysen/budget-app-v2/src/middleware.ts` protects all routes except auth
2. **Route Guards**: Components check auth state and redirect appropriately
3. **Session Management**: Server/client contexts handle auth state differently

### Component Patterns
```typescript
// Use shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Utility class merging
import { cn } from "@/lib/utils";

// Currency formatting
import { formatCurrency } from "@/lib/utils/currency";
```

### TypeScript Patterns
```typescript
// Use generated database types
import type { Database, Tables } from "@/types/supabase";

// Component interfaces
interface EnvelopeBalanceProps {
  householdId: string;
  userId: string;
}
```

## Design System

### Styling Philosophy
"Make budgeting feel positive, approachable, and achievable" - friendly, warm design that reduces financial anxiety.

### Key Design Tokens
```css
/* Colors */
--primary: #3b82f6 (bright blue)
--success: #10b981 (mint green)  
--warning: #f97316 (warm orange)
--error: #ef4444 (clear red)

/* Layout */
--card-padding: 24px (space-6)
--border-radius: rounded-lg (cards), rounded-2xl (mobile)
```

### Component Patterns
- **Mobile-first**: Touch-friendly (44px minimum targets)
- **Friendly borders**: Rounded corners, soft shadows
- **Progress bars**: Gradient success indicators
- **Currency display**: Monospace fonts for amounts
- **Color coding**: Success (positive), error (negative), muted (neutral)

## Business Logic Patterns

### Period Management
```typescript
// Current period detection
import { getCurrentPeriod } from "@/lib/periods";

// Period creation with business rules
await createNewPeriod(supabase, householdId, paycheckDate);

// Conservative income calculation (don't count unconfirmed)
const budget = calculateConservativeBudget(confirmedIncome, expectedIncome);
```

### Envelope System
- **Rollover rules**: Configurable per envelope (save/rollover/rollover_limit)
- **Overspending**: Alert and suggest transfers between envelopes
- **Balance tracking**: Real-time allocated vs spent amounts

### Transaction Flow
1. **Plaid import**: Raw transactions → pending review
2. **Manual entry**: Direct to approved status
3. **AI categorization**: Suggest envelope assignments
4. **Approval workflow**: Both users can review/approve
5. **Envelope assignment**: Required before final approval

## Key Files Reference

### Configuration
- `/Users/areysen/budget-app-v2/.cursorrules` - Comprehensive development guidelines
- `/Users/areysen/budget-app-v2/components.json` - shadcn/ui configuration
- `/Users/areysen/budget-app-v2/middleware.ts` - Auth protection
- `/Users/areysen/budget-app-v2/supabase/config.toml` - Local database config

### Core Libraries  
- `/Users/areysen/budget-app-v2/src/lib/supabase/` - Database clients
- `/Users/areysen/budget-app-v2/src/lib/utils/currency.ts` - Money formatting
- `/Users/areysen/budget-app-v2/src/lib/utils/dates.ts` - Period date logic
- `/Users/areysen/budget-app-v2/src/lib/periods.ts` - Period management
- `/Users/areysen/budget-app-v2/src/types/supabase.ts` - Generated DB types

### Key Components
- `/Users/areysen/budget-app-v2/src/app/(dashboard)/dashboard/page.tsx` - Main dashboard
- `/Users/areysen/budget-app-v2/src/components/auth/AuthGuard.tsx` - Route protection
- `/Users/areysen/budget-app-v2/src/components/dashboard/envelope-balances.tsx` - Budget display

## Development Workflow

### Database Changes
1. Modify migrations in `supabase/migrations/`
2. Reset local: `supabase db reset`
3. Generate types: `supabase gen types typescript --local > src/types/supabase.ts`
4. Test thoroughly
5. Deploy: `supabase db push`

### Common Patterns
- **Error handling**: Try-catch with user-friendly toast messages
- **Loading states**: Skeleton components while fetching
- **Optimistic updates**: Show changes immediately, sync later
- **Household scoping**: Always filter by household_id in queries

## AI Integration Strategy

### Planned AI Features
- **Emergency handling**: Smart recommendations when overspending
- **Impact analysis**: Show how changes affect future periods/goals
- **Pattern insights**: Detect spending trends and optimization opportunities
- **Bill prediction**: Smart estimates for variable expenses
- **Cash flow forecasting**: Predict tight periods, recommend adjustments

### Implementation Notes
- Store recommendations with confidence scores
- Context-aware suggestions based on current financial situation
- User feedback loop for learning and improvement
- Proactive insights based on spending patterns

This codebase is designed for real-world household budgeting with a focus on making financial management feel less intimidating and more achievable through thoughtful UX and AI-powered insights.