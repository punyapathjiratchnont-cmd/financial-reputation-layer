'use client';

import { useState } from 'react';
import { X, Save, DollarSign, CreditCard, ShieldCheck } from 'lucide-react';
import { UserFinancialData } from '@/lib/reputationEngine';

interface FinancialInputModalProps {
  userId: string;
  initialData?: UserFinancialData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FinancialInputModal({
  userId,
  initialData,
  isOpen,
  onClose,
  onSuccess,
}: FinancialInputModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [monthlyIncome, setMonthlyIncome] = useState(initialData?.income.monthly || 75000);
  const [stabilityMonths, setStabilityMonths] = useState(initialData?.income.stabilityMonths || 24);
  const [monthlyExpenses, setMonthlyExpenses] = useState(initialData?.expenses.monthlyAvg || 42000);
  const [discretionaryRatio, setDiscretionaryRatio] = useState(initialData?.expenses.discretionaryRatio || 0.2);
  const [onTimeCount, setOnTimeCount] = useState(initialData?.payments.onTimeCount || 24);
  const [lateCount, setLateCount] = useState(initialData?.payments.lateCount || 0);
  const [missedCount, setMissedCount] = useState(initialData?.payments.missedCount || 0);
  const [savingsBalance, setSavingsBalance] = useState(initialData?.savings.currentBalance || 350000);
  const [monthlySavings, setMonthlySavings] = useState(initialData?.savings.monthlyContribution || 15000);
  const [emergencyMonths, setEmergencyMonths] = useState(initialData?.savings.emergencyFundMonths || 8);
  const [totalDebt, setTotalDebt] = useState(initialData?.debts.totalDebt || 120000);
  const [creditLimit, setCreditLimit] = useState(initialData?.debts.creditLimit || 500000);
  const [utilizationRatio, setUtilizationRatio] = useState(initialData?.debts.utilizationRatio || 0.24);
  const [monthlyDebtService, setMonthlyDebtService] = useState(initialData?.debts.monthlyDebtService || 12000);
  const [transactions6M, setTransactions6M] = useState(initialData?.transactions.count6Months || 240);
  const [bouncedCount, setBouncedCount] = useState(initialData?.transactions.bouncedCount || 0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation (Requirement 14)
    if (
      monthlyIncome < 0 ||
      monthlyExpenses < 0 ||
      savingsBalance < 0 ||
      totalDebt < 0 ||
      onTimeCount < 0 ||
      lateCount < 0 ||
      missedCount < 0
    ) {
      setError('Financial values must be non-negative numbers.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        userId,
        financialData: {
          income: { monthly: Number(monthlyIncome), stabilityMonths: Number(stabilityMonths), sourcesCount: 2 },
          expenses: { monthlyAvg: Number(monthlyExpenses), discretionaryRatio: Number(discretionaryRatio) },
          payments: {
            totalDue: Number(onTimeCount) + Number(lateCount) + Number(missedCount),
            onTimeCount: Number(onTimeCount),
            lateCount: Number(lateCount),
            missedCount: Number(missedCount),
          },
          savings: {
            currentBalance: Number(savingsBalance),
            monthlyContribution: Number(monthlySavings),
            emergencyFundMonths: Number(emergencyMonths),
          },
          debts: {
            totalDebt: Number(totalDebt),
            creditLimit: Number(creditLimit),
            utilizationRatio: Number(utilizationRatio),
            monthlyDebtService: Number(monthlyDebtService),
          },
          transactions: {
            count6Months: Number(transactions6M),
            bouncedCount: Number(bouncedCount),
            oldestAccountYears: 5,
          },
        },
      };

      const res = await fetch('/api/reputation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save financial data.');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating financial data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 my-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-100">Update Real Financial Data</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-300">
          {/* Income & Expenses */}
          <div className="space-y-3">
            <h3 className="font-semibold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <DollarSign className="w-4 h-4" /> Income & Expenditure
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Monthly Income (฿)</label>
                <input
                  type="number"
                  min="0"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Monthly Expenses (฿)</label>
                <input
                  type="number"
                  min="0"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Income Continuity (Months)</label>
                <input
                  type="number"
                  min="0"
                  value={stabilityMonths}
                  onChange={(e) => setStabilityMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Discretionary Ratio (0.0 to 1.0)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={discretionaryRatio}
                  onChange={(e) => setDiscretionaryRatio(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Payments & Reliability */}
          <div className="space-y-3">
            <h3 className="font-semibold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <CreditCard className="w-4 h-4" /> Payment Reliability
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">On-Time Payments</label>
                <input
                  type="number"
                  min="0"
                  value={onTimeCount}
                  onChange={(e) => setOnTimeCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Late Payments</label>
                <input
                  type="number"
                  min="0"
                  value={lateCount}
                  onChange={(e) => setLateCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Missed Payments</label>
                <input
                  type="number"
                  min="0"
                  value={missedCount}
                  onChange={(e) => setMissedCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Savings & Debts */}
          <div className="space-y-3">
            <h3 className="font-semibold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              Savings & Debt Liabilities
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Total Liquid Savings (฿)</label>
                <input
                  type="number"
                  min="0"
                  value={savingsBalance}
                  onChange={(e) => setSavingsBalance(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Monthly Savings Contribution (฿)</label>
                <input
                  type="number"
                  min="0"
                  value={monthlySavings}
                  onChange={(e) => setMonthlySavings(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Total Outstanding Debt (฿)</label>
                <input
                  type="number"
                  min="0"
                  value={totalDebt}
                  onChange={(e) => setTotalDebt(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Total Credit Limit (฿)</label>
                <input
                  type="number"
                  min="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving Data...' : 'Save & Recalculate Engine Score'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
