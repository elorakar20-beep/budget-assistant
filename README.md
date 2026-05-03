# Budget Reality Check Agent

A comprehensive budget tracking and analysis platform with scheduled reports, daily expense tracking, and monthly comparisons. Built for the **Vercel Zero to Agent Hackathon** (Workflow/WDK Track).

## Features

### Core Budget Analysis
- **Budget Health Score** (0-100) with visual score ring
- **Spending Leak Detection** to find where money is escaping
- **7-Day Triage Plan** for quick wins
- **30-Day Recovery Workflow** to build lasting habits
- Personalized feedback in your choice of tone (Gentle, Direct, or Spicy)

### Daily Expense Tracking
- **Quick Add Expense** - Log expenses on the go with mobile-friendly UI
- **Daily Expense List** - View and manage daily spending
- **Custom Categories** - Create your own fixed and variable expense categories
- **Monthly Summary** - See spending trends by category

### Scheduled Reports & Reminders
- **Mid-Month Reports** (15th) - Get a progress check on your budget
- **End-of-Month Reports** (last day) - Full monthly analysis
- **Daily Reminders** (9-10 PM) - Gentle nudge to log your expenses
- **Email Reports** - Receive reports via email with Resend integration

### Monthly Comparison
- **Historical Snapshots** - Track your budget health over time
- **Month-over-Month Comparison** - See what changed and why
- **Change Reason Analysis** - AI-powered insights on spending changes
- **Trend Visualization** - Charts showing your financial progress

### Mobile-First Design
- **Responsive Dashboard** - Works beautifully on any device
- **Bottom Navigation** - Easy thumb access on mobile
- **Floating Action Button** - Quick expense entry
- **Dark/Light Theme** - System-aware theme with manual toggle
- **Touch-Friendly UI** - Large tap targets and swipe actions

### Authentication & Security
- **Supabase Auth** - Secure email/password authentication
- **Row Level Security** - Your data is protected at the database level
- **User Profiles** - Personalized settings and preferences

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Workflow Engine**: Vercel Workflow SDK
- **AI Integration**: Vercel AI SDK with AI Gateway
- **Email**: Resend
- **Scheduling**: Vercel Cron
- **Deployment**: Vercel

## Database Schema

```sql
-- User profiles with settings
profiles (id, email, full_name, timezone, reminder_enabled, reminder_time)

-- Custom expense categories
expense_categories (id, user_id, name, type, icon, color, budget_limit)

-- Daily expense entries
expenses (id, user_id, category_id, amount, description, expense_date)

-- User budget settings
budget_settings (id, user_id, monthly_income, savings_goal_percent, tone, ...)

-- Historical snapshots for comparison
monthly_snapshots (id, user_id, month_year, health_score, category_breakdown, ...)

-- Report history
scheduled_reports (id, user_id, report_type, comparison_data, change_reasons, ...)
```

## How Vercel Workflow/WDK is Used

The app uses **Vercel Workflow SDK** with `"use workflow"` and `"use step"` directives:

```typescript
export async function budgetRealityWorkflow(input: BudgetInput): Promise<BudgetReport> {
  'use workflow';
  
  const normalizedBudget = await normalizeBudgetStep(input);
  const categorizedExpenses = await categorizeExpensesStep(input);
  const healthScore = await calculateScoreStep(normalizedBudget, input);
  const spendingLeaks = await detectLeaksStep(normalizedBudget, input);
  const triagePlan = await generateTriageStep(spendingLeaks, input);
  const recoveryWorkflow = await generateRecoveryStep(healthScore, input);
  const summary = await generateSummaryStep(healthScore, spendingLeaks, input);
  
  return compileReportStep(...);
}
```

## Scheduled Cron Jobs

```json
{
  "crons": [
    {
      "path": "/api/cron/monthly-report",
      "schedule": "0 9 15 * *"  // Mid-month (15th at 9 AM)
    },
    {
      "path": "/api/cron/monthly-report", 
      "schedule": "0 9 28-31 * *"  // End of month
    },
    {
      "path": "/api/cron/daily-reminder",
      "schedule": "0 21 * * *"  // Daily at 9 PM
    }
  ]
}
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cron Authentication
CRON_SECRET=your-cron-secret

# Email (Optional)
RESEND_API_KEY=your-resend-api-key
```

## How to Run Locally

```bash
# Clone and install
git clone <repo-url>
cd budget-reality-check
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server
pnpm dev

# Open http://localhost:3000
```

## App Structure

```
app/
  page.tsx                    # Landing page with demo workflow
  auth/
    login/page.tsx            # Login page
    signup/page.tsx           # Sign up page
    callback/route.ts         # Auth callback handler
  dashboard/
    page.tsx                  # Main dashboard overview
    expenses/page.tsx         # Expense list and management
    expenses/add/page.tsx     # Quick add expense
    categories/page.tsx       # Category management
    reports/page.tsx          # Historical reports & comparison
    settings/page.tsx         # User settings
  api/
    analyze/route.ts          # Budget analysis workflow
    cron/
      monthly-report/route.ts # Scheduled monthly reports
      daily-reminder/route.ts # Daily expense reminders
```

## Safety Limitations

**This tool is NOT financial, investment, tax, or legal advice.**

- Only helps organize spending and identify patterns
- Uses deterministic rules for scoring (not AI-generated numbers)
- Does not connect to bank accounts or payment systems
- Does not make investment recommendations

Always consult qualified financial professionals for important financial decisions.

## License

MIT

---

Built with v0 for the Vercel Zero to Agent Hackathon
