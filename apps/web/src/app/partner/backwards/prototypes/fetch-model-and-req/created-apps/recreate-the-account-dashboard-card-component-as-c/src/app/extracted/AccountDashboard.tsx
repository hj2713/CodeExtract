'use client';

/**
 * Account Dashboard Card Component
 *
 * A comprehensive dashboard card displaying account metrics and transaction activity.
 * Features tabbed navigation for different transaction types with filtering.
 */

import { useState } from 'react';
import { AccountDashboardProps, TransactionType } from './types';
import { formatCurrency, formatDate, filterTransactionsByType } from './utils';

const TRANSACTION_TABS: TransactionType[] = [
  'Payments',
  'Collected fees',
  'Transfers',
  'Payouts',
];

export default function AccountDashboard({
  accountMetrics,
  transactions,
  onPayOut,
}: AccountDashboardProps) {
  const [activeTab, setActiveTab] = useState<TransactionType>('Payments');

  const filteredTransactions = filterTransactionsByType(transactions, activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Account Dashboard
                </h1>
                <p className="text-indigo-100 text-sm">
                  Manage your account balance and transactions
                </p>
              </div>
              <button
                onClick={onPayOut}
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                aria-label="Initiate payout"
              >
                Pay Out
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <p className="text-indigo-100 text-sm font-medium mb-1">
                  Available Balance
                </p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(accountMetrics.balance, accountMetrics.currency)}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <p className="text-indigo-100 text-sm font-medium mb-1">
                  Pending Balance
                </p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(accountMetrics.pendingBalance, accountMetrics.currency)}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <p className="text-indigo-100 text-sm font-medium mb-1">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(accountMetrics.totalRevenue, accountMetrics.currency)}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <p className="text-indigo-100 text-sm font-medium mb-1">
                  Total Payouts
                </p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(accountMetrics.totalPayouts, accountMetrics.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Activity</h2>

            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6">
              <nav
                className="flex space-x-8"
                aria-label="Transaction type tabs"
                role="tablist"
              >
                {TRANSACTION_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      pb-4 px-1 text-sm font-semibold transition-colors relative
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-sm
                      ${
                        activeTab === tab
                          ? 'text-indigo-600'
                          : 'text-slate-500 hover:text-slate-700'
                      }
                    `}
                    role="tab"
                    aria-selected={activeTab === tab}
                    aria-controls={`${tab}-panel`}
                    tabIndex={activeTab === tab ? 0 : -1}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Transaction Table */}
            <div
              className="overflow-hidden rounded-lg border border-slate-200"
              role="tabpanel"
              id={`${activeTab}-panel`}
              aria-labelledby={activeTab}
            >
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Transaction Amount
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Account Details
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <svg
                              className="w-3 h-3 mr-1.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-700">
                            {transaction.accountDetails}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-500">
                            {formatDate(transaction.date)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-sm text-slate-500"
                      >
                        No {activeTab.toLowerCase()} found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Transaction Count */}
            {filteredTransactions.length > 0 && (
              <div className="mt-4 text-sm text-slate-500">
                Showing {filteredTransactions.length}{' '}
                {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
