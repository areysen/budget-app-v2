# Budget App v2 - Product Requirements Document
*Updated: June 19, 2025*

## Executive Summary

A paycheck-period focused, zero-based budgeting application with envelope method for spending categories. This app provides household sharing capabilities, AI-powered insights, and seamless integration with banking systems through Plaid. The application solves the core problems of budget complexity and data model confusion by providing clear separation between spending (envelopes) and savings (goals) while maintaining a user-friendly, mobile-first interface.

## Project Status & Completed Milestones

### ✅ COMPLETED Features
- **Project Repository Setup**: Next.js 15 with TypeScript, Supabase integration, shadcn/ui components
- **Core Data Models**: Complete database schema with 12+ tables, Row Level Security, proper relationships
- **User Authentication**: Supabase Auth integration with household management
- **Fixed Expenses Management**: 28 fixed expenses implemented with enhanced frequency system (monthly, quarterly, annual, custom)
- **Income Sources Implementation**: 3 income sources with configurable frequency patterns and automatic period allocation

### 🔄 IN PROGRESS Features
- **Budget Setup Flow**: Multi-step wizard (Income → Expenses → Envelopes → Savings Goals)
- **Envelope System**: Core spending category allocation and tracking
- **Savings Goals System**: Long-term accumulation targets with progress tracking
- **User Interface Enhancement**: Modernizing UI components to match established patterns

## Core Vision & Problems Solved

### Primary Problem
Current budgeting solutions suffer from:
- Complex data models that confuse users
- Poor separation between spending and saving categories
- Overwhelming user interfaces
- Lack of paycheck-focused budgeting periods

### Solution
**Paycheck-period focused, zero-based budgeting** where every dollar gets assigned a purpose, organized around realistic pay cycles rather than arbitrary monthly periods.

## Product Architecture

### Core Concepts

#### 1. Paycheck Periods (Budget Timeline)
- **Semi-monthly cycles**: 15th + End of Month based on primary income
- **Auto-start**: New periods automatically begin on scheduled dates
- **Early paycheck handling**: Manual override capability for early payments
- **Income aggregation**: Multiple income sources consolidated per period

#### 2. Enhanced Frequency System
**Currently Implemented**: Sophisticated frequency handling for both income and expenses
- **Standard Frequencies**: Weekly, bi-weekly, monthly, quarterly, annual
- **Custom Frequencies**: Every N days/weeks/months with configurable start dates
- **Smart Allocation**: Automatic calculation of which periods receive allocations
- **Prorated Amounts**: Partial amounts when frequencies don't align perfectly with periods

#### 3. Four-Category Budget Structure

**Fixed Expenses (Priority 1 - COMPLETED)**
- Recurring bills with known due dates (rent, utilities, insurance)
- Variable amounts supported (electric ~$190, gas ~$60)
- Frequency-based automatic scheduling
- 28 expenses currently configured

**Income Sources (Priority 1 - COMPLETED)**  
- Primary: InvestCloud salary (semi-monthly)
- Secondary: Mobile reimbursement ($40/month), Jordan's mom ($400 bi-weekly)
- 3 sources currently configured with enhanced frequency system

**Envelopes (Priority 2 - IN PROGRESS)**
- Day-to-day spending categories (groceries, gas, entertainment)
- Configurable rollover rules per envelope:
  - Always roll over (Dog Supplies)
  - Roll over up to limit, excess to savings (Groceries)
  - Always to savings (Entertainment)
- Real-time balance tracking with overspending alerts

**Savings Goals (Priority 3 - IN PROGRESS)**
- Long-term accumulation targets
- Emergency fund prioritization ($1000 minimum)
- Multiple contribution types: planned, overflow, roundup, manual
- Progress tracking and achievement strategies

## Technical Requirements

### Frontend Architecture
- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Context for budget setup flow
- **Design System**: Friendly & Approachable with consistent spacing (4, 8, 12, 16, 24px)
- **Responsive**: Mobile-first design with touch-optimized interactions

### Backend Architecture
- **Database**: Supabase with Row Level Security (RLS)
- **Authentication**: Supabase Auth with household membership
- **API**: Next.js API routes with proper validation
- **Real-time**: Supabase subscriptions for shared household updates
- **Security**: Household-scoped data access, input validation

### Integration Requirements
- **Banking**: Plaid integration for transaction imports
- **AI Services**: Smart categorization and budget recommendations
- **Notifications**: Email alerts for bill due dates and overspending
- **Mobile**: Progressive Web App (PWA) capabilities

## Data Model

### Core Database Tables (12 tables implemented)
```
profiles, households, household_members
paycheck_periods, period_income
envelopes, period_envelopes
fixed_expenses, period_fixed_expenses
savings_goals, savings_contributions
plaid_transactions, user_transactions
ai_recommendations, spending_insights
```

### Key Relationships
- Users → Households (via household_members)
- Periods → Income/Expenses/Envelopes/Savings (via period_* tables)
- Transactions → Categories (envelope, fixed_expense, or savings_goal)
- AI insights tied to households and periods

## User Experience Requirements

### Budget Setup Flow (CURRENT FOCUS)
**Step 1: Income Sources** ✅ COMPLETED
- Summary cards showing configured sources
- Add/edit/delete income sources
- Frequency configuration with visual preview
- Form validation and error handling

**Step 2: Fixed Expenses** ✅ COMPLETED  
- Summary cards for 28 configured expenses
- CRUD operations with frequency management
- Category selection and amount estimation
- Due date and variable expense handling

**Step 3: Envelopes** 🔄 IN PROGRESS
- **NEEDS**: Modernize to match income/expense patterns
- Summary cards with allocation amounts
- Rollover rule configuration
- Default amount suggestions based on history

**Step 4: Savings Goals** 🔄 IN PROGRESS
- **NEEDS**: Modernize to match income/expense patterns  
- Goal creation with target amounts and dates
- Emergency fund prioritization
- Progress tracking visualization

### Design System Standards
- **Colors**: Consistent semantic colors (primary, destructive, muted)
- **Typography**: Clear hierarchy with proper contrast ratios
- **Spacing**: 4px grid system (4, 8, 12, 16, 24px)
- **Components**: shadcn/ui based with custom extensions
- **Interactions**: Touch-friendly with proper feedback

## Implementation Priorities

### Phase 1: Complete Budget Setup (CURRENT - Weeks 1-2)
**IMMEDIATE TASKS**:
1. **Modernize Envelopes Step**: Update to match income/expense UI patterns
   - Summary cards with allocation amounts
   - Add/edit/delete operations
   - Rollover rule configuration UI
   - State management integration

2. **Modernize Savings Goals Step**: Update to match established patterns
   - Summary cards with progress indicators  
   - Target amount and date configuration
   - Emergency fund priority handling
   - CRUD operations with form validation

3. **Complete Flow Integration**: End-to-end budget setup testing
   - Navigation between all four steps
   - Data persistence across steps
   - Form state management improvements
   - Error handling and validation

### Phase 2: Budget Management (Weeks 3-4)
1. **Paycheck Period Logic**: Implement period creation and management
2. **Zero-Based Budgeting System**: Allocation tracking and unallocated funds
3. **Category Management**: Enhanced category selection and custom categories
4. **Form State Improvements**: Fix dropdown persistence and validation feedback

### Phase 3: Transaction System (Weeks 5-8)
1. **Plaid Integration**: Bank account connection and transaction import
2. **Transaction Management**: Dual transaction system (Plaid + user)
3. **Envelope Spending**: Real-time balance updates and overspending alerts
4. **AI Categorization**: Smart category suggestions

### Phase 4: Advanced Features (Weeks 9-12)
1. **Multi-User Support**: Shared household management
2. **AI Insights**: Spending pattern analysis and recommendations
3. **Reporting**: Budget performance and trend analysis
4. **Mobile Optimization**: PWA and enhanced mobile experience

## Success Metrics

### User Experience
- **Setup Time**: Complete budget setup in under 10 minutes
- **Adoption Rate**: 90% of users complete full budget setup
- **Error Rate**: Less than 5% of form submissions result in errors
- **Mobile Usage**: 70% of interactions on mobile devices

### Budget Management  
- **Budget Adherence**: 80% of periods stay within envelope allocations
- **Emergency Fund**: 90% of users maintain minimum emergency fund
- **Transaction Accuracy**: 95% of transactions correctly categorized
- **Household Sharing**: 60% of users invite household members

### Technical Performance
- **Page Load**: Under 2 seconds on mobile networks
- **Uptime**: 99.9% availability
- **Data Sync**: Real-time updates within 500ms
- **Security**: Zero data breaches, proper RLS enforcement

## Risk Mitigation

### Technical Risks
- **Plaid Integration Complexity**: Implement fallback manual transaction entry
- **Real-time Sync Issues**: Graceful degradation with offline capability
- **Database Performance**: Proper indexing and query optimization
- **Mobile Performance**: Lazy loading and code splitting

### User Experience Risks
- **Budget Setup Complexity**: Progressive disclosure and helpful defaults
- **Multi-User Conflicts**: Clear permission system and activity logging
- **Data Migration**: Comprehensive backup and rollback procedures
- **Learning Curve**: Intuitive UI with contextual help and onboarding

## Development Standards

### Code Quality
- TypeScript strict mode with proper interfaces
- Comprehensive error handling and loading states
- Atomic design principles for component structure
- RESTful API design with proper validation

### Testing Strategy
- Unit tests for business logic and utilities
- Integration tests for database operations
- End-to-end tests for critical user flows
- Performance testing for mobile devices

### Security Requirements
- Row Level Security for all database access
- Input validation on all forms and APIs
- Secure credential management
- Regular security audits and updates

## Conclusion

This PRD outlines a comprehensive budget management application that builds upon significant completed work (authentication, data models, income/expenses) to deliver a complete, user-friendly budgeting solution. The immediate focus on completing the budget setup flow provides a clear, achievable milestone that enables full application functionality while maintaining the established quality and design standards.