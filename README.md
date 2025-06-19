# Budget App v2

Budget App v2 is a modern, paycheck-period-focused, zero-based budgeting application built with Next.js, TypeScript, and Supabase. It's designed for household budget management, featuring an envelope system for spending categories, AI-powered insights, and a friendly, approachable user interface.

## Core Concepts

- **Paycheck-Period Budgeting**: The app is centered around semi-monthly budget cycles (e.g., 1st-14th and 15th-EOM).
- **Zero-Based Budgeting**: Every dollar of income is assigned a purpose, whether it's for an expense, a savings goal, or an envelope.
- **Envelope System**: Users can create spending categories (envelopes) and allocate funds to them for each budget period.
- **Household Sharing**: Designed for collaboration between household members, with support for primary and secondary users.
- **AI-Powered Insights**: The app provides smart recommendations and analyzes spending patterns to help users optimize their budget.

## Tech Stack

- **Framework**: Next.js 15 (with App Router)
- **Language**: TypeScript
- **Database & Auth**: Supabase
- **UI**: Tailwind CSS with shadcn/ui components
- **State Management**: React Hooks and Context API
- **Notifications**: `react-hot-toast`
- **Icons**: `lucide-react`

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm
- Supabase account and local CLI

### 1. Clone the repository

```bash
git clone https://github.com/your-repo/budget-app-v2.git
cd budget-app-v2
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project and add your Supabase project URL and anon key:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You will also need to set up your Supabase instance locally or on the cloud. Refer to the [Supabase documentation](https://supabase.com/docs) for more details.

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The project follows a standard Next.js App Router structure:

```
src/
├── app/                # App Router pages and API routes
├── components/         # Shared React components
├── hooks/              # Custom React hooks
├── lib/                # Helper functions, utilities, and Supabase clients
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

## Learn More

To learn more about the technologies used in this project, refer to the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
