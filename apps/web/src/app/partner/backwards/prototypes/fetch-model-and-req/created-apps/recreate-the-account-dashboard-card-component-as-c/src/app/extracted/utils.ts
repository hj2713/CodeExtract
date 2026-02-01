/**
 * Utility functions and mock data for Account Dashboard Card
 */

import { Transaction, AccountMetrics, TransactionType } from './types';

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Filter transactions by type
 */
export function filterTransactionsByType(
  transactions: Transaction[],
  type: TransactionType
): Transaction[] {
  return transactions.filter((transaction) => transaction.type === type);
}

/**
 * Mock transaction data
 * Note: This is fixture data replacing any actual database or API calls
 */
export const MOCK_TRANSACTIONS: Transaction[] = [
  // Payments
  {
    id: 'txn_1',
    amount: 1250.00,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Customer Payment - Invoice #1234',
    date: new Date('2024-01-28'),
    type: 'Payments',
  },
  {
    id: 'txn_2',
    amount: 850.50,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Customer Payment - Invoice #1235',
    date: new Date('2024-01-27'),
    type: 'Payments',
  },
  {
    id: 'txn_3',
    amount: 2100.00,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Customer Payment - Invoice #1236',
    date: new Date('2024-01-26'),
    type: 'Payments',
  },
  {
    id: 'txn_4',
    amount: 450.25,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Customer Payment - Invoice #1237',
    date: new Date('2024-01-25'),
    type: 'Payments',
  },

  // Collected fees
  {
    id: 'fee_1',
    amount: 25.00,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Processing Fee - Transaction #1234',
    date: new Date('2024-01-28'),
    type: 'Collected fees',
  },
  {
    id: 'fee_2',
    amount: 17.01,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Processing Fee - Transaction #1235',
    date: new Date('2024-01-27'),
    type: 'Collected fees',
  },
  {
    id: 'fee_3',
    amount: 42.00,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Processing Fee - Transaction #1236',
    date: new Date('2024-01-26'),
    type: 'Collected fees',
  },

  // Transfers
  {
    id: 'tr_1',
    amount: 5000.00,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Bank Transfer - Account ****4532',
    date: new Date('2024-01-28'),
    type: 'Transfers',
  },
  {
    id: 'tr_2',
    amount: 3500.00,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Bank Transfer - Account ****4532',
    date: new Date('2024-01-24'),
    type: 'Transfers',
  },
  {
    id: 'tr_3',
    amount: 2250.00,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Bank Transfer - Account ****4532',
    date: new Date('2024-01-20'),
    type: 'Transfers',
  },

  // Payouts
  {
    id: 'po_1',
    amount: 4800.00,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Payout to Bank - Account ****4532',
    date: new Date('2024-01-29'),
    type: 'Payouts',
  },
  {
    id: 'po_2',
    amount: 3200.00,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Payout to Bank - Account ****4532',
    date: new Date('2024-01-25'),
    type: 'Payouts',
  },
  {
    id: 'po_3',
    amount: 2100.00,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Payout to Bank - Account ****4532',
    date: new Date('2024-01-21'),
    type: 'Payouts',
  },
  {
    id: 'po_4',
    amount: 1500.00,
    currency: 'USD',
    status: 'Succeeded',
    accountDetails: 'Payout to Bank - Account ****4532',
    date: new Date('2024-01-18'),
    type: 'Payouts',
  },
];

/**
 * Mock account metrics data
 * Note: This replaces any actual account balance API calls
 */
export const MOCK_ACCOUNT_METRICS: AccountMetrics = {
  balance: 12450.75,
  currency: 'USD',
  pendingBalance: 3250.00,
  totalRevenue: 45678.90,
  totalPayouts: 33228.15,
};
