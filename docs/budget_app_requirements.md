# New Budget App - Requirements & Vision

## Core Problems to Solve
- **Data model confusion** around paychecks, paycheck periods, vaults, envelopes
- **UX/UI complexity** in current app
- Need clearer separation between savings (vaults) and spending (envelopes)

## Core Vision
**Paycheck-period focused, zero-based budgeting with envelope method for spending categories**

## Income Sources & Schedule

### Primary Income (InvestCloud)
- **Schedule**: Semi-monthly (15th + End of Month)
- **Type**: Primary salary

### Secondary Income
1. **Mobile Reimbursement**: $40 on 15th of each month
2. **Jordan's Mom**: $400 every 2 weeks

### Paycheck Period Logic
- **Primary periods**: Driven by InvestCloud paycheck (15th to EOM, 1st to 14th)
- **Auto-start**: New periods automatically start on scheduled dates
- **Early paycheck handling**: Manual override to advance to next period if paid early
- **Secondary income**: If Jordan's mom's bi-weekly payment falls within period, add to total
- **Budgeting rule**: Must be able to afford all allocations without secondary income until it arrives
- Example: June 13-26 period, Jordan's mom pays June 19th → budget conservatively until 19th

## Core Budgeting Concepts

### 1. Envelopes (Spending Categories)
- **Purpose**: Day-to-day spending allocation per paycheck period
- **Examples**: Groceries, Gas, Dining Out, Entertainment, Personal Care, Dog Supplies
- **Behavior**: 
  - Gets allocated fixed amount each paycheck
  - Money spent reduces envelope balance
  - **Leftover handling**: Configurable per envelope:
    - "Always roll over" (Dog Supplies)
    - "Roll over up to $X, then to savings" (Groceries)
    - "Always to savings" (Entertainment)
  - Can transfer between envelopes if needed

### 2. Fixed Items (Recurring Expenses)
- **Purpose**: Predictable expenses with known due dates (highest priority)
- **Examples**: Rent, Insurance, Phone Bill, Subscriptions
- **Variable Bills**: Electric (~$190), Gas (~$60) 
- **Behavior**: 
  - Starts with predefined estimated amount
  - During budget planning: adjust to actual bill amount
  - Uses unallocated money for any increases (not "over budget")
  - Automatically scheduled each relevant paycheck period
  - Due date driven

### 3. Vaults (Long-term Savings Goals)
- **Purpose**: Accumulating money for specific goals or safety nets
- **Types**:
  - **Emergency Fund**: $1000 minimum target, automatic overflow destination
  - **General Savings**: After emergency fund minimum met
  - **Roundup Vault**: Automatic small amounts from transaction roundups
  - **Big Ticket Items**: vacation, car, house down payment
- **Behavior**:
  - Money accumulates across paycheck periods
  - Can contribute fixed amounts per paycheck or variable amounts
  - Track progress toward goals

## User Roles & Use Cases

### Primary User (You)
- Full budget setup and management
- Paycheck allocation planning
- Category management
- Goal setting and tracking
- AI-assisted planning and insights

### Secondary User (Jordan)
- Transaction logging and approval
- Quick spending summaries ("How much left in groceries?")
- Overall budget status view
- Simple, non-overwhelming interface

### Future: Multi-Tenant Permissions (SaaS)
- Role-based access controls
- Custom permission levels
- Admin vs. user capabilities

## Key Features & Goals

### Zero-Based Budgeting
- Every dollar of income gets assigned a purpose
- Clear visual of allocated vs. unallocated money
- Easy reallocation tools

### Envelope Method
- Spending categories with allocated amounts
- Real-time balance tracking
- Overspending alerts and easy transfers

### Easy Transaction Management
- **Dual Table System**: 
  - Plaid synced transactions (read-only from bank)
  - True transaction records (user-controlled source of truth)
- **Transaction Flow**:
  - Plaid transactions import as "pending review"
  - Manual transactions entered directly as "approved"
  - Link manual transactions to Plaid imports when they match
  - Both users can review and approve pending transactions
- **Smart Categorization**: AI-suggested envelope/category assignment
- **Review Queue**: Clear list of pending transactions requiring attention
- **Roundup Logic**: Optional (can disable SoFi feature if simpler)
  - Round cleared transactions to nearest dollar → designated vault
  - Skip ACH transfers, bill pays, credit card payments

### Cash Flow & Planning
- Upcoming bills and due dates
- Paycheck period forecasting
- Trend analysis over time
- "What if" scenario planning

### AI Features (Core Integration)
- **Smart Emergency Handling**: When expenses exceed envelope balances, AI recommends optimal funding sources
- **Impact Analysis**: Show how emergency expenses affect future periods and savings goals
- **Spending Pattern Insights**: AI-detected trends and optimization suggestions
- **Bill Prediction**: Smart estimates for variable expenses based on history
- **Budget Optimization**: AI suggestions for better allocation strategies
- **Personalized Financial Tips**: Context-aware advice based on spending behavior
- **Cash Flow Forecasting**: Predict tight periods and recommend adjustments
- **Goal Achievement Coaching**: AI guidance on reaching savings targets faster

## Technical Goals

### User Experience
- Mobile-first design
- Intuitive navigation
- Fast, responsive interface
- Clear visual hierarchy
- Minimal cognitive load

### Multi-User Support
- Role-based permissions
- Shared budget visibility
- Individual vs. joint views
- Activity logging

### Scalability (SaaS Future)
- Multi-tenant architecture
- Flexible paycheck schedules
- Customizable categories and workflows
- Usage analytics and insights

## Success Metrics
- **Ease of Use**: Time to complete common tasks
- **Budget Adherence**: Percentage of periods staying within envelopes
- **Transparency**: Both users always know financial status
- **Automation**: Minimal manual data entry required
- **Insights**: Clear understanding of spending patterns and trends