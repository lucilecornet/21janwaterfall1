'use client';

import { Currency } from '@/types';

interface CompanySettingsProps {
  name: string;
  currency: Currency;
  onNameChange: (name: string) => void;
  onCurrencyChange: (currency: Currency) => void;
}

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'EUR', label: '€ EUR' },
  { value: 'USD', label: '$ USD' },
  { value: 'GBP', label: '£ GBP' },
];

export function CompanySettings({
  name,
  currency,
  onNameChange,
  onCurrencyChange,
}: CompanySettingsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Company</h2>

      <div>
        <label
          htmlFor="company-name"
          className="block text-sm font-medium text-gray-700"
        >
          Company Name
        </label>
        <input
          type="text"
          id="company-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter company name"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
        />
      </div>

      <div>
        <label
          htmlFor="currency"
          className="block text-sm font-medium text-gray-700"
        >
          Currency
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value as Currency)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border bg-white"
        >
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
