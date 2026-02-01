# Account Dashboard Card Component

## What this demonstrates

This example demonstrates a comprehensive Account Dashboard Card component that displays financial metrics and transaction activity with tabbed navigation. The component features a visually appealing card layout with a gradient header showing key account metrics (Available Balance, Pending Balance, Total Revenue, Total Payouts), and an activity section with four tabs (Payments, Collected fees, Transfers, Payouts) that filter and display transaction data in a responsive table format. All transactions show a "Succeeded" status with green styling, and the component includes a prominent "Pay Out" call-to-action button.

## Original implementation

Since no source repository was provided, this component was created from scratch based on the requirements. The design follows modern financial dashboard patterns commonly seen in payment processing platforms like Stripe, PayPal, and Square.

The component architecture includes:
- **Presentational component** (AccountDashboard.tsx) - Handles UI rendering and user interactions
- **Type definitions** (types.ts) - TypeScript interfaces for type safety
- **Utility functions** (utils.ts) - Helper functions and mock data
- **Server actions** (actions.ts) - API layer (mocked for this example)
- **Page component** (page.tsx) - Next.js page integration

Key design decisions:
- Used Tailwind CSS for styling to achieve a modern, polished look
- Implemented accessible keyboard navigation for tabs
- Created a responsive table layout optimized for laptop screens
- Used semantic HTML and ARIA labels for accessibility
- Gradient backgrounds and subtle animations for visual appeal

## Dependencies

### NPM packages required

No additional NPM packages are required beyond the standard Next.js 14 dependencies:
- `react` — Core React library
- `next` — Next.js framework
- `tailwindcss` — Utility-first CSS framework (should already be configured in Next.js project)

### Code ported from source

Since no source repository was provided, all code was created from scratch. No code was ported.

### Mocked in this example

The following features are mocked with static data:

- **Account Metrics** — Hardcoded financial data in `MOCK_ACCOUNT_METRICS` (balance: $12,450.75, pending: $3,250.00, revenue: $45,678.90, payouts: $33,228.15)
- **Transaction Data** — Hardcoded array of 15 transactions in `MOCK_TRANSACTIONS` spread across all four transaction types
- **Server Actions** — All server actions (`fetchAccountMetrics`, `fetchTransactions`, `processPayout`) return mock data instead of making real API calls
- **Authentication** — No authentication required; assumes logged-in user
- **Database** — No database connection; all data is in-memory
- **Payment Processing API** — The "Pay Out" button shows an alert instead of processing actual payments

## How to use

### Basic Usage

1. Ensure this is in a Next.js 14 project with Tailwind CSS configured
2. Navigate to `/extracted` route to see the component in action
3. Click on different tabs (Payments, Collected fees, Transfers, Payouts) to filter transactions
4. Click the "Pay Out" button to see the mock payout action

### Customizing the Data

To use your own data, replace the mock data in `utils.ts` or modify `page.tsx` to fetch real data:

```tsx
// Example: Fetching real data
import { fetchAccountMetrics, fetchTransactions } from './actions';

export default async function AccountDashboardPage() {
  const accountMetrics = await fetchAccountMetrics();
  const transactions = await fetchTransactions();

  return (
    <AccountDashboard
      accountMetrics={accountMetrics}
      transactions={transactions}
      onPayOut={() => {/* your handler */}}
    />
  );
}
```

### Integrating into an Existing Project

1. Copy the component files to your project
2. Import `AccountDashboard` component where needed
3. Pass in your account metrics and transaction data as props
4. Implement the `onPayOut` handler to integrate with your payment processing flow

### Accessibility Features

- Keyboard navigation supported for tabs (Tab/Shift+Tab to navigate, Enter to select)
- ARIA labels and roles for screen readers
- Semantic HTML structure
- Focus indicators on interactive elements
- Color contrast meets WCAG AA standards

### Styling Customization

The component uses Tailwind CSS classes. To customize:

- **Colors**: Modify the gradient colors in the header (currently indigo-600 to purple-600)
- **Spacing**: Adjust padding/margin classes
- **Typography**: Change font sizes and weights
- **Border radius**: Modify rounded-* classes

Example color customization:
```tsx
// Change from indigo/purple to blue/cyan gradient
<div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-10">
```

## Component Features

✅ **Functional Requirements:**
- Tab-based filtering for 4 transaction types
- Transaction table with 4 columns
- "Succeeded" status badge in green
- Pay Out button with hover effects
- Static data display via props

✅ **Visual Design:**
- Gradient header with glassmorphism effect on metric cards
- Clean table layout with hover states
- Responsive grid for metrics (4 columns)
- Professional color scheme
- Subtle shadows and borders

✅ **Accessibility:**
- ARIA labels and roles
- Keyboard navigation
- Focus indicators
- Semantic HTML
- Screen reader friendly

✅ **Technical:**
- TypeScript for type safety
- Client component for interactivity
- Modular file structure
- Mock data for easy testing
- No external dependencies beyond Next.js/React

## Browser Support

Optimized for modern browsers on laptop screens (1280px+):
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Note: Mobile responsiveness is not included per requirements.
