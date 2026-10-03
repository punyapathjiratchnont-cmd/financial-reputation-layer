import { UserFinancialData, ScoreHistoryPoint } from './reputationEngine';

/**
 * Mock Financial Profiles for Engine Testing & Demonstration.
 * Separated cleanly from production data.
 */

export const MOCK_FINANCIAL_PROFILES: Record<string, { label: string; data: UserFinancialData; history: ScoreHistoryPoint[] }> = {
  normal: {
    label: 'Standard / Normal Profile (TechFlow)',
    data: {
      income: { monthly: 75000, stabilityMonths: 36, sourcesCount: 2 },
      expenses: { monthlyAvg: 42000, discretionaryRatio: 0.2 },
      payments: { totalDue: 24, onTimeCount: 24, lateCount: 0, missedCount: 0 },
      savings: { currentBalance: 350000, monthlyContribution: 15000, emergencyFundMonths: 8 },
      debts: { totalDebt: 120000, creditLimit: 500000, utilizationRatio: 0.24, monthlyDebtService: 12000 },
      transactions: { count6Months: 240, bouncedCount: 0, oldestAccountYears: 6 },
    },
    history: [
      { date: '2024-01-01', score: 720, level: 'Good' },
      { date: '2024-04-01', score: 728, level: 'Good' },
      { date: '2024-07-01', score: 735, level: 'Good' },
      { date: '2024-10-01', score: 762, level: 'Excellent' },
    ],
  },

  highExpense: {
    label: 'High Expense & Discretionary Spending',
    data: {
      income: { monthly: 45000, stabilityMonths: 12, sourcesCount: 1 },
      expenses: { monthlyAvg: 48000, discretionaryRatio: 0.6 },
      payments: { totalDue: 18, onTimeCount: 15, lateCount: 2, missedCount: 1 },
      savings: { currentBalance: 15000, monthlyContribution: 1000, emergencyFundMonths: 0.3 },
      debts: { totalDebt: 180000, creditLimit: 200000, utilizationRatio: 0.9, monthlyDebtService: 16000 },
      transactions: { count6Months: 120, bouncedCount: 1, oldestAccountYears: 2 },
    },
    history: [
      { date: '2024-01-01', score: 580, level: 'Fair' },
      { date: '2024-04-01', score: 540, level: 'Fair' },
      { date: '2024-07-01', score: 510, level: 'Fair' },
      { date: '2024-10-01', score: 485, level: 'Low' },
    ],
  },

  latePayment: {
    label: 'Delayed Payments & Missed Bills',
    data: {
      income: { monthly: 50000, stabilityMonths: 18, sourcesCount: 1 },
      expenses: { monthlyAvg: 35000, discretionaryRatio: 0.3 },
      payments: { totalDue: 20, onTimeCount: 12, lateCount: 5, missedCount: 3 },
      savings: { currentBalance: 50000, monthlyContribution: 3000, emergencyFundMonths: 1.4 },
      debts: { totalDebt: 90000, creditLimit: 150000, utilizationRatio: 0.6, monthlyDebtService: 9000 },
      transactions: { count6Months: 90, bouncedCount: 2, oldestAccountYears: 3 },
    },
    history: [
      { date: '2024-01-01', score: 620, level: 'Fair' },
      { date: '2024-04-01', score: 580, level: 'Fair' },
      { date: '2024-07-01', score: 530, level: 'Fair' },
      { date: '2024-10-01', score: 490, level: 'Low' },
    ],
  },

  highSavings: {
    label: 'Strong Savings & Zero Debt (Excellent)',
    data: {
      income: { monthly: 120000, stabilityMonths: 48, sourcesCount: 3 },
      expenses: { monthlyAvg: 40000, discretionaryRatio: 0.15 },
      payments: { totalDue: 36, onTimeCount: 36, lateCount: 0, missedCount: 0 },
      savings: { currentBalance: 1200000, monthlyContribution: 50000, emergencyFundMonths: 30 },
      debts: { totalDebt: 10000, creditLimit: 600000, utilizationRatio: 0.02, monthlyDebtService: 2000 },
      transactions: { count6Months: 350, bouncedCount: 0, oldestAccountYears: 10 },
    },
    history: [
      { date: '2024-01-01', score: 790, level: 'Excellent' },
      { date: '2024-04-01', score: 810, level: 'Excellent' },
      { date: '2024-07-01', score: 830, level: 'Excellent' },
      { date: '2024-10-01', score: 845, level: 'Excellent' },
    ],
  },

  empty: {
    label: 'No Financial Data (Baseline / Insufficient)',
    data: {
      income: { monthly: 0, stabilityMonths: 0, sourcesCount: 0 },
      expenses: { monthlyAvg: 0, discretionaryRatio: 0 },
      payments: { totalDue: 0, onTimeCount: 0, lateCount: 0, missedCount: 0 },
      savings: { currentBalance: 0, monthlyContribution: 0, emergencyFundMonths: 0 },
      debts: { totalDebt: 0, creditLimit: 0, utilizationRatio: 0, monthlyDebtService: 0 },
      transactions: { count6Months: 0, bouncedCount: 0, oldestAccountYears: 0 },
    },
    history: [
      { date: '2024-01-01', score: 480, level: 'Low' },
    ],
  },
};
