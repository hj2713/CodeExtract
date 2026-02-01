/**
 * TypeScript type definitions for Account Dashboard Card
 */

export type TransactionStatus = 'Succeeded';

export type TransactionType = 'Payments' | 'Collected fees' | 'Transfers' | 'Payouts';

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  accountDetails: string;
  date: Date;
  type: TransactionType;
}

export interface AccountMetrics {
  balance: number;
  currency: string;
  pendingBalance: number;
  totalRevenue: number;
  totalPayouts: number;
}

export interface AccountDashboardProps {
  accountMetrics: AccountMetrics;
  transactions: Transaction[];
  onPayOut?: () => void;
}
