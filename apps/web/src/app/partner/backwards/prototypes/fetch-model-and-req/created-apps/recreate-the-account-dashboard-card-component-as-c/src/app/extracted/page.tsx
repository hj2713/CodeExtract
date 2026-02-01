/**
 * Next.js page demonstrating the Account Dashboard Card component
 */

import AccountDashboard from './AccountDashboard';
import { MOCK_ACCOUNT_METRICS, MOCK_TRANSACTIONS } from './utils';

export default function AccountDashboardPage() {
  // In a real app, you would fetch this data using server components or client-side hooks
  // For this demo, we use static mock data

  const handlePayOut = () => {
    console.log('Pay Out button clicked');
    alert('Payout initiated! In a real app, this would trigger the payment processing flow.');
  };

  return (
    <AccountDashboard
      accountMetrics={MOCK_ACCOUNT_METRICS}
      transactions={MOCK_TRANSACTIONS}
      onPayOut={handlePayOut}
    />
  );
}
