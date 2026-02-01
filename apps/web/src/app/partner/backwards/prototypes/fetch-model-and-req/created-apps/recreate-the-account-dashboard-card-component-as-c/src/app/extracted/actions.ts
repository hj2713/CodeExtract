/**
 * Server actions for Account Dashboard Card
 *
 * Note: In a real implementation, these would connect to actual APIs/databases.
 * For this isolated example, they return mock data.
 */

'use server';

import { Transaction, AccountMetrics } from './types';
import { MOCK_TRANSACTIONS, MOCK_ACCOUNT_METRICS } from './utils';

/**
 * Fetch account metrics
 * Mock implementation - would normally fetch from database/API
 */
export async function fetchAccountMetrics(): Promise<AccountMetrics> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return MOCK_ACCOUNT_METRICS;
}

/**
 * Fetch all transactions
 * Mock implementation - would normally fetch from database/API
 */
export async function fetchTransactions(): Promise<Transaction[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return MOCK_TRANSACTIONS;
}

/**
 * Process payout request
 * Mock implementation - would normally call payment processing API
 */
export async function processPayout(amount: number): Promise<{ success: boolean; message: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock successful payout
  return {
    success: true,
    message: `Payout of $${amount.toFixed(2)} initiated successfully`,
  };
}
