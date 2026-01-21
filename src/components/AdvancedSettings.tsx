'use client';

import { CompanySettings, CURRENCY_SYMBOLS } from '@/types';
import { formatCurrency } from '@/lib/format';

interface AdvancedSettingsProps {
  settings: CompanySettings;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<CompanySettings>) => void;
}

export function AdvancedSettings({
  settings,
  isOpen,
  onToggle,
  onUpdate,
}: AdvancedSettingsProps) {
  const symbol = CURRENCY_SYMBOLS[settings.currency];

  return (
    <div className="space-y-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        Advanced Settings
      </button>

      {isOpen && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cash on Balance ({symbol})
              </label>
              <input
                type="number"
                value={settings.cash}
                onChange={(e) =>
                  onUpdate({ cash: parseFloat(e.target.value) || 0 })
                }
                className="mt-1 w-full text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Added to equity value</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Debt ({symbol})
              </label>
              <input
                type="number"
                value={settings.debt}
                onChange={(e) =>
                  onUpdate({ debt: parseFloat(e.target.value) || 0 })
                }
                className="mt-1 w-full text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Subtracted from equity value
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Transaction Fees ({symbol})
              </label>
              <input
                type="number"
                value={settings.fees}
                onChange={(e) =>
                  onUpdate({ fees: parseFloat(e.target.value) || 0 })
                }
                className="mt-1 w-full text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Subtracted from equity value
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                EV Step Size ({symbol})
              </label>
              <select
                value={settings.evStepSize}
                onChange={(e) =>
                  onUpdate({ evStepSize: parseInt(e.target.value) })
                }
                className="mt-1 w-full text-sm border-gray-300 rounded px-3 py-2 border bg-white focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={5000000}>
                  {formatCurrency(5_000_000, settings.currency, true)}
                </option>
                <option value={10000000}>
                  {formatCurrency(10_000_000, settings.currency, true)}
                </option>
                <option value={25000000}>
                  {formatCurrency(25_000_000, settings.currency, true)}
                </option>
                <option value={50000000}>
                  {formatCurrency(50_000_000, settings.currency, true)}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max EV ({symbol})
              </label>
              <select
                value={settings.evMax}
                onChange={(e) =>
                  onUpdate({ evMax: parseInt(e.target.value) })
                }
                className="mt-1 w-full text-sm border-gray-300 rounded px-3 py-2 border bg-white focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={50000000}>
                  {formatCurrency(50_000_000, settings.currency, true)}
                </option>
                <option value={100000000}>
                  {formatCurrency(100_000_000, settings.currency, true)}
                </option>
                <option value={200000000}>
                  {formatCurrency(200_000_000, settings.currency, true)}
                </option>
                <option value={500000000}>
                  {formatCurrency(500_000_000, settings.currency, true)}
                </option>
                <option value={1000000000}>
                  {formatCurrency(1_000_000_000, settings.currency, true)}
                </option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
