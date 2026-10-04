'use client';

import { useState } from 'react';
import { X, Save, DollarSign, CreditCard, ShieldCheck, AlertTriangle, Clock, PieChart } from 'lucide-react';
import { UserFinancialData } from '@/lib/reputationEngine';
import { Button } from '@/components/ui';

interface FinancialInputModalProps {
  userId: string;
  initialData?: UserFinancialData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INPUT_CLASS =
  'h-11 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-slate-100 ' +
  'transition-[border-color,background-color] duration-[var(--frl-dur-fast)] ' +
  'ease-[var(--frl-ease-standard)] placeholder:text-fg-subtle ' +
  'hover:border-white/25 focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none ' +
  'focus:ring-2 focus:ring-primary/25';

/**
 * Renders an owner-entered value as the raw text of a number.
 *
 * Anything that is not a finite number becomes an empty string, so an absent
 * field can never be converted into a 0 by accident.
 */
function asText(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  step?: string;
  max?: string;
}

/**
 * One labelled numeric input.
 *
 * Every value that reaches the API is entered through this component, so what
 * FRL records is always something the owner actually typed and can see.
 */
function Field({ id, label, value, onChange, hint, step, max }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-caption font-medium text-fg-secondary">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        min="0"
        max={max}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hintId}
        className={INPUT_CLASS}
      />
      {hint ? (
        <p id={hintId} className="mt-1 text-caption leading-relaxed text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
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

  // Form state is held as text and starts EMPTY when the owner has no record.
  //
  // This deliberately replaces a set of prefilled example numbers — ฿75,000 of
  // income, 24 months of stability, 240 transactions, five years of account
  // history — several of which the owner never saw at all. Those were not the
  // owner's evidence, they were the application's guess, and because the form
  // could be saved untouched, FRL would mint a real-mode reputation out of
  // numbers nobody entered.
  //
  // An empty form now stays empty. The owner declares what is true; the engine
  // decides what it can score and reports the rest as missing evidence.
  const [monthlyIncome, setMonthlyIncome] = useState(asText(initialData?.income.monthly));
  const [stabilityMonths, setStabilityMonths] = useState(
    asText(initialData?.income.stabilityMonths)
  );
  const [sourcesCount, setSourcesCount] = useState(asText(initialData?.income.sourcesCount));
  const [monthlyExpenses, setMonthlyExpenses] = useState(asText(initialData?.expenses.monthlyAvg));
  const [discretionaryRatio, setDiscretionaryRatio] = useState(
    asText(initialData?.expenses.discretionaryRatio)
  );
  const [onTimeCount, setOnTimeCount] = useState(asText(initialData?.payments.onTimeCount));
  const [lateCount, setLateCount] = useState(asText(initialData?.payments.lateCount));
  const [missedCount, setMissedCount] = useState(asText(initialData?.payments.missedCount));
  const [savingsBalance, setSavingsBalance] = useState(
    asText(initialData?.savings.currentBalance)
  );
  const [monthlySavings, setMonthlySavings] = useState(
    asText(initialData?.savings.monthlyContribution)
  );
  const [emergencyMonths, setEmergencyMonths] = useState(
    asText(initialData?.savings.emergencyFundMonths)
  );
  const [totalDebt, setTotalDebt] = useState(asText(initialData?.debts.totalDebt));
  const [creditLimit, setCreditLimit] = useState(asText(initialData?.debts.creditLimit));
  const [utilizationRatio, setUtilizationRatio] = useState(
    asText(initialData?.debts.utilizationRatio)
  );
  const [monthlyDebtService, setMonthlyDebtService] = useState(
    asText(initialData?.debts.monthlyDebtService)
  );
  const [transactions6M, setTransactions6M] = useState(
    asText(initialData?.transactions.count6Months)
  );
  const [bouncedCount, setBouncedCount] = useState(asText(initialData?.transactions.bouncedCount));
  const [oldestAccountYears, setOldestAccountYears] = useState(
    asText(initialData?.transactions.oldestAccountYears)
  );

  if (!isOpen) return null;

  /** Empty or non-numeric input is not a value. It is never coerced to 0. */
  const parse = (raw: string): number | null => {
    if (raw.trim() === '') return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsed = {
      monthlyIncome: parse(monthlyIncome),
      stabilityMonths: parse(stabilityMonths),
      sourcesCount: parse(sourcesCount),
      monthlyExpenses: parse(monthlyExpenses),
      discretionaryRatio: parse(discretionaryRatio),
      onTimeCount: parse(onTimeCount),
      lateCount: parse(lateCount),
      missedCount: parse(missedCount),
      savingsBalance: parse(savingsBalance),
      monthlySavings: parse(monthlySavings),
      emergencyMonths: parse(emergencyMonths),
      totalDebt: parse(totalDebt),
      creditLimit: parse(creditLimit),
      utilizationRatio: parse(utilizationRatio),
      monthlyDebtService: parse(monthlyDebtService),
      transactions6M: parse(transactions6M),
      bouncedCount: parse(bouncedCount),
      oldestAccountYears: parse(oldestAccountYears),
    };

    /**
     * Every field must be declared.
     *
     * Storing 0 for a field the owner left blank would be the same fabrication
     * as the prefilled defaults, just quieter: it would assert "this owner
     * reports zero bounced payments" when the truth is "we were never told".
     */
    const requiredValue = (label: string, value: number | null): number => {
      if (value === null) {
        setError(
          `Enter a value for ${label}. FRL cannot record evidence it has not been given, so an ` +
            `unanswered field is left out rather than assumed to be zero.`
        );
        return Number.NaN;
      }
      return value;
    };

    const values = {
      monthlyIncome: requiredValue('Monthly income', parsed.monthlyIncome),
      stabilityMonths: requiredValue('Income continuity', parsed.stabilityMonths),
      sourcesCount: requiredValue('Number of revenue sources', parsed.sourcesCount),
      monthlyExpenses: requiredValue('Monthly expenses', parsed.monthlyExpenses),
      discretionaryRatio: requiredValue('Discretionary ratio', parsed.discretionaryRatio),
      onTimeCount: requiredValue('On-time payments', parsed.onTimeCount),
      lateCount: requiredValue('Late payments', parsed.lateCount),
      missedCount: requiredValue('Missed payments', parsed.missedCount),
      savingsBalance: requiredValue('Total liquid savings', parsed.savingsBalance),
      monthlySavings: requiredValue('Monthly savings contribution', parsed.monthlySavings),
      emergencyMonths: requiredValue('Emergency fund cover', parsed.emergencyMonths),
      totalDebt: requiredValue('Total outstanding debt', parsed.totalDebt),
      creditLimit: requiredValue('Total credit limit', parsed.creditLimit),
      utilizationRatio: requiredValue('Credit utilisation ratio', parsed.utilizationRatio),
      monthlyDebtService: requiredValue('Monthly debt service', parsed.monthlyDebtService),
      transactions6M: requiredValue('Transactions in the last 6 months', parsed.transactions6M),
      bouncedCount: requiredValue('Returned payments', parsed.bouncedCount),
      oldestAccountYears: requiredValue('Account duration', parsed.oldestAccountYears),
    };

    if (Object.values(values).some((value) => Number.isNaN(value))) {
      setLoading(false);
      return;
    }

    const negativeLabels = [
      ['Monthly income', values.monthlyIncome],
      ['Monthly expenses', values.monthlyExpenses],
      ['Savings', values.savingsBalance],
      ['Total debt', values.totalDebt],
      ['On-time payments', values.onTimeCount],
      ['Late payments', values.lateCount],
      ['Missed payments', values.missedCount],
    ] as const;

    const negative = negativeLabels.find(([, value]) => value < 0);

    if (negative) {
      setError(`${negative[0]} cannot be negative.`);
      setLoading(false);
      return;
    }

    if (values.discretionaryRatio > 1 || values.utilizationRatio > 1) {
      setError('Ratios must be between 0 and 1. Enter 0.24 for 24%.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        userId,
        financialData: {
          income: {
            monthly: values.monthlyIncome,
            stabilityMonths: values.stabilityMonths,
            sourcesCount: values.sourcesCount,
          },
          expenses: {
            monthlyAvg: values.monthlyExpenses,
            discretionaryRatio: values.discretionaryRatio,
          },
          payments: {
            totalDue: values.onTimeCount + values.lateCount + values.missedCount,
            onTimeCount: values.onTimeCount,
            lateCount: values.lateCount,
            missedCount: values.missedCount,
          },
          savings: {
            currentBalance: values.savingsBalance,
            monthlyContribution: values.monthlySavings,
            emergencyFundMonths: values.emergencyMonths,
          },
          debts: {
            totalDebt: values.totalDebt,
            creditLimit: values.creditLimit,
            utilizationRatio: values.utilizationRatio,
            monthlyDebtService: values.monthlyDebtService,
          },
          transactions: {
            count6Months: values.transactions6M,
            bouncedCount: values.bouncedCount,
            oldestAccountYears: values.oldestAccountYears,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl space-y-6 rounded-lg border border-white/15 bg-slate-900 p-5 shadow-[var(--shadow-float)] sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-h3 text-slate-100">
              <ShieldCheck className="h-5 w-5 text-primary-hover" aria-hidden="true" />
              Financial evidence
            </h2>
            <p className="mt-1.5 text-body-sm leading-relaxed text-fg-muted">
              These are values you declare. FRL records what you enter here; it has not verified any
              of it against a bank or an accounting system, and the reputation score is produced by
              the FRL engine from whatever evidence is present.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-2 text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-rose-500/20 bg-rose-500/10 p-3.5 text-body-sm leading-relaxed text-rose-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="space-y-3">
            <legend className="flex items-center gap-1.5 text-label uppercase tracking-wider text-emerald-300">
              <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
              Income &amp; Expenditure
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="frl-income-monthly"
                label="Monthly income (฿)"
                value={monthlyIncome}
                onChange={setMonthlyIncome}
              />
              <Field
                id="frl-income-continuity"
                label="Income continuity (months)"
                value={stabilityMonths}
                onChange={setStabilityMonths}
              />
              <Field
                id="frl-income-sources"
                label="Number of revenue sources"
                value={sourcesCount}
                onChange={setSourcesCount}
                hint="Count of distinct revenue streams you can evidence."
              />
              <Field
                id="frl-expenses-monthly"
                label="Monthly expenses (฿)"
                value={monthlyExpenses}
                onChange={setMonthlyExpenses}
              />
              <Field
                id="frl-expenses-discretionary"
                label="Discretionary ratio"
                value={discretionaryRatio}
                onChange={setDiscretionaryRatio}
                step="0.01"
                max="1"
                hint="Share of spending that is non-essential, 0 to 1."
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="flex items-center gap-1.5 text-label uppercase tracking-wider text-emerald-300">
              <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
              Payment Reliability
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                id="frl-payments-ontime"
                label="Paid on time"
                value={onTimeCount}
                onChange={setOnTimeCount}
              />
              <Field
                id="frl-payments-late"
                label="Paid late"
                value={lateCount}
                onChange={setLateCount}
              />
              <Field
                id="frl-payments-missed"
                label="Missed"
                value={missedCount}
                onChange={setMissedCount}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="flex items-center gap-1.5 text-label uppercase tracking-wider text-amber-300">
              <PieChart className="h-3.5 w-3.5" aria-hidden="true" />
              Savings &amp; Reserves
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                id="frl-savings-balance"
                label="Liquid savings (฿)"
                value={savingsBalance}
                onChange={setSavingsBalance}
              />
              <Field
                id="frl-savings-monthly"
                label="Monthly contribution (฿)"
                value={monthlySavings}
                onChange={setMonthlySavings}
              />
              <Field
                id="frl-savings-emergency"
                label="Emergency fund (months)"
                value={emergencyMonths}
                onChange={setEmergencyMonths}
                step="0.1"
                hint="Months of expenses covered."
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="flex items-center gap-1.5 text-label uppercase tracking-wider text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Debt Liabilities
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="frl-debts-total"
                label="Total outstanding debt (฿)"
                value={totalDebt}
                onChange={setTotalDebt}
              />
              <Field
                id="frl-debts-credit-limit"
                label="Total credit limit (฿)"
                value={creditLimit}
                onChange={setCreditLimit}
              />
              <Field
                id="frl-debts-utilisation"
                label="Credit utilisation ratio"
                value={utilizationRatio}
                onChange={setUtilizationRatio}
                step="0.01"
                max="1"
                hint="Drawn credit over total limit, 0 to 1."
              />
              <Field
                id="frl-debts-service"
                label="Monthly debt service (฿)"
                value={monthlyDebtService}
                onChange={setMonthlyDebtService}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="flex items-center gap-1.5 text-label uppercase tracking-wider text-indigo-300">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Transaction History
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                id="frl-transactions-count"
                label="Transactions (last 6 months)"
                value={transactions6M}
                onChange={setTransactions6M}
              />
              <Field
                id="frl-transactions-bounced"
                label="Returned payments"
                value={bouncedCount}
                onChange={setBouncedCount}
              />
              <Field
                id="frl-transactions-age"
                label="Account duration (years)"
                value={oldestAccountYears}
                onChange={setOldestAccountYears}
                step="0.5"
              />
            </div>
          </fieldset>

          <p className="text-caption leading-relaxed text-fg-subtle">
            FRL will only produce a score once every required factor has evidence. A factor you
            cannot evidence is left unscored rather than assumed.
          </p>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} icon={<Save className="h-4 w-4" />}>
              Save &amp; Recalculate Engine Score
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}