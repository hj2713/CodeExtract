# Account Dashboard Card - Component Structure

## File Organization

```
src/app/extracted/
├── page.tsx                 # Next.js page entry point
├── AccountDashboard.tsx     # Main component (Client Component)
├── types.ts                 # TypeScript type definitions
├── utils.ts                 # Utility functions & mock data
├── actions.ts               # Server actions (mocked)
└── README.md                # Documentation
```

## Component Hierarchy

```
page.tsx (Server Component)
  └── AccountDashboard (Client Component)
       ├── Header Section
       │    ├── Title & Description
       │    ├── Pay Out Button
       │    └── Metrics Grid (4 cards)
       │         ├── Available Balance
       │         ├── Pending Balance
       │         ├── Total Revenue
       │         └── Total Payouts
       └── Activity Section
            ├── Tab Navigation
            │    ├── Payments
            │    ├── Collected fees
            │    ├── Transfers
            │    └── Payouts
            └── Transaction Table
                 ├── Headers (4 columns)
                 └── Rows (filtered by active tab)
```

## Data Flow

```
Mock Data (utils.ts)
    ↓
Page Component (page.tsx)
    ↓
Props
    ↓
AccountDashboard Component
    ↓
State Management (useState)
    ↓
Filtered Transactions
    ↓
Rendered Table
```

## Key Features

### 1. Header Section
- **Gradient background**: Indigo to purple
- **4 metric cards**: Glass morphism effect
- **Pay Out button**: White with hover effects

### 2. Activity Tabs
- **4 tabs**: Payments, Collected fees, Transfers, Payouts
- **Active state**: Underline indicator
- **Keyboard navigation**: Full accessibility support

### 3. Transaction Table
- **4 columns**: Amount, Status, Details, Date
- **Status badge**: Green "Succeeded" pill
- **Hover effects**: Row highlighting
- **Empty state**: Graceful "no data" message

## Styling Approach

- **Tailwind CSS**: All styling via utility classes
- **Responsive Grid**: 4-column layout for metrics
- **Color Palette**:
  - Primary: Indigo (600) & Purple (600)
  - Success: Green (100 bg, 800 text)
  - Neutral: Slate (50, 100, 200, 500, 700, 900)
- **Typography**:
  - Headers: Bold, larger sizes
  - Body: Medium weight, readable sizes
  - Labels: Uppercase, small, semibold

## Interactive Elements

1. **Pay Out Button**
   - Hover: Background lightens, shadow increases
   - Focus: Ring indicator
   - Click: Triggers `onPayOut` callback

2. **Tab Buttons**
   - Click: Changes active tab, filters data
   - Keyboard: Tab/Enter navigation
   - Visual: Active underline indicator

3. **Table Rows**
   - Hover: Background color change
   - Improves scannability

## Accessibility Features

- ✅ Semantic HTML (nav, table, button)
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Color contrast (WCAG AA)
- ✅ Screen reader support

## Mock Data Summary

### Account Metrics
- Available Balance: $12,450.75
- Pending Balance: $3,250.00
- Total Revenue: $45,678.90
- Total Payouts: $33,228.15

### Transactions by Type
- Payments: 4 transactions
- Collected fees: 3 transactions
- Transfers: 3 transactions
- Payouts: 4 transactions
- **Total**: 15 transactions (all "Succeeded" status)

## Usage Example

```tsx
import AccountDashboard from './AccountDashboard';
import { MOCK_ACCOUNT_METRICS, MOCK_TRANSACTIONS } from './utils';

export default function Page() {
  return (
    <AccountDashboard
      accountMetrics={MOCK_ACCOUNT_METRICS}
      transactions={MOCK_TRANSACTIONS}
      onPayOut={() => alert('Payout initiated!')}
    />
  );
}
```

## Customization Points

1. **Colors**: Modify gradient colors in header
2. **Metrics**: Add/remove metric cards
3. **Tabs**: Add additional transaction types
4. **Table Columns**: Add/remove columns
5. **Status Types**: Support multiple statuses (currently only "Succeeded")
6. **Filtering**: Add date range or amount filters
7. **Sorting**: Add column sorting
8. **Pagination**: Add for large datasets

## Future Enhancements (Not Included)

- ❌ Mobile responsiveness (per requirements)
- ❌ Multiple status types (only "Succeeded" required)
- ❌ Advanced sorting/filtering
- ❌ Real API integration
- ❌ Loading states
- ❌ Error handling
- ❌ Pagination
- ❌ Export functionality
- ❌ Search feature
