'use client';

import { useState } from 'react';
import { Shareholder, ShareClass, Currency, CURRENCY_SYMBOLS } from '@/types';

type InputMode = 'shares' | 'pps' | 'valuation';

interface ShareholderTableProps {
  shareholders: Shareholder[];
  classes: ShareClass[];
  currency: Currency;
  onAddShareholder: (
    name: string,
    classId: string,
    shares: number,
    amountInvested: number
  ) => void;
  onUpdateShareholder: (id: string, updates: Partial<Shareholder>) => void;
  onRemoveShareholder: (id: string) => void;
}

const PRESET_CLASSES = [
  'Series Seed',
  'Series A',
  'Series B',
  'Series C',
];

export function ShareholderTable({
  shareholders,
  classes,
  currency,
  onAddShareholder,
  onUpdateShareholder,
  onRemoveShareholder,
}: ShareholderTableProps) {
  const [newName, setNewName] = useState('');
  const [newClassId, setNewClassId] = useState('preferred');
  const [newClassName, setNewClassName] = useState('');
  const [showNewClassInput, setShowNewClassInput] = useState(false);

  // Input mode and values
  const [inputMode, setInputMode] = useState<InputMode>('pps');
  const [newShares, setNewShares] = useState('');
  const [newInvested, setNewInvested] = useState('');
  const [newPPS, setNewPPS] = useState('');
  const [newValuation, setNewValuation] = useState('');

  const symbol = CURRENCY_SYMBOLS[currency];

  // All monetary inputs are in millions - convert to actual values
  const MILLION = 1_000_000;

  // Calculate shares based on input mode
  const calculateShares = (): number => {
    const investedM = parseFloat(newInvested) || 0;
    const invested = investedM * MILLION;

    if (inputMode === 'shares') {
      return parseFloat(newShares) || 0;
    } else if (inputMode === 'pps') {
      const pps = parseFloat(newPPS) || 0;
      return pps > 0 ? Math.round(invested / pps) : 0;
    } else if (inputMode === 'valuation') {
      const valuationM = parseFloat(newValuation) || 0;
      const valuation = valuationM * MILLION;
      if (valuation <= 0 || invested <= 0) return 0;
      // Calculate ownership % and convert to shares
      // Use 10M as base share count (proportional for waterfall)
      const ownershipPct = invested / valuation;
      const baseShares = 10_000_000;
      return Math.round(ownershipPct * baseShares);
    }
    return 0;
  };

  const handleAdd = () => {
    if (!newName.trim()) return;

    const shares = calculateShares();
    const investedM = parseFloat(newInvested) || 0;
    const invested = investedM * MILLION;

    if (showNewClassInput && newClassName.trim()) {
      // Pass a temp ID with the class name encoded - the hook will create the class
      const tempClassId = `temp_${newClassName.trim().toLowerCase().replace(/\s+/g, '_')}`;
      onAddShareholder(newName.trim(), tempClassId, shares, invested);
    } else {
      onAddShareholder(newName.trim(), newClassId, shares, invested);
    }

    // Reset form
    setNewName('');
    setNewShares('');
    setNewInvested('');
    setNewPPS('');
    setNewValuation('');
    setNewClassName('');
    setShowNewClassInput(false);
  };

  // Filter presets that don't exist yet
  const existingClassNames = classes.map(c => c.name.toLowerCase());
  const availablePresets = PRESET_CLASSES.filter(
    name => !existingClassNames.includes(name.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Shareholders</h2>

      {shareholders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shares
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invested ({symbol}m)
                </th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shareholders.map((sh) => {
                const cls = classes.find((c) => c.id === sh.classId);
                return (
                  <tr key={sh.id}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={sh.name}
                        onChange={(e) =>
                          onUpdateShareholder(sh.id, { name: e.target.value })
                        }
                        className="w-full text-sm border-gray-300 rounded px-2 py-1 border focus:border-blue-500 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <select
                        value={sh.classId}
                        onChange={(e) =>
                          onUpdateShareholder(sh.id, { classId: e.target.value })
                        }
                        className="text-sm border-gray-300 rounded px-2 py-1 border bg-white focus:border-blue-500 focus:ring-blue-500"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="number"
                        value={sh.shares}
                        onChange={(e) =>
                          onUpdateShareholder(sh.id, {
                            shares: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-24 text-sm text-right border-gray-300 rounded px-2 py-1 border focus:border-blue-500 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.1"
                        value={sh.amountInvested / MILLION || ''}
                        onChange={(e) =>
                          onUpdateShareholder(sh.id, {
                            amountInvested: (parseFloat(e.target.value) || 0) * MILLION,
                          })
                        }
                        disabled={cls?.isCommon}
                        className={`w-28 text-sm text-right border-gray-300 rounded px-2 py-1 border focus:border-blue-500 focus:ring-blue-500 ${
                          cls?.isCommon ? 'bg-gray-100 text-gray-400' : ''
                        }`}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() => onRemoveShareholder(sh.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add new shareholder form */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-700">Add Shareholder</p>

          {/* Input mode toggle - available for all share classes */}
          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setInputMode('shares')}
              className={`px-2 py-1 rounded ${
                inputMode === 'shares' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Shares
            </button>
            <button
              onClick={() => setInputMode('pps')}
              className={`px-2 py-1 rounded ${
                inputMode === 'pps' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              PPS
            </button>
            <button
              onClick={() => setInputMode('valuation')}
              className={`px-2 py-1 rounded ${
                inputMode === 'valuation' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Valuation
            </button>
          </div>
        </div>

        {/* Row 1: Name and Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              type="text"
              placeholder="e.g., John Smith or Acme Ventures"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Share Class</label>
            {showNewClassInput ? (
              <div className="space-y-2">
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="e.g., Series A"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="flex-1 text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      setShowNewClassInput(false);
                      setNewClassName('');
                    }}
                    className="text-gray-400 hover:text-gray-600 px-2 border border-gray-300 rounded"
                    title="Cancel"
                  >
                    Cancel
                  </button>
                </div>
                {availablePresets.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-400">Quick add:</span>
                    {availablePresets.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setNewClassName(preset)}
                        className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={newClassId}
                  onChange={(e) => setNewClassId(e.target.value)}
                  className="flex-1 text-sm border-gray-300 rounded px-3 py-2 border bg-white focus:border-blue-500 focus:ring-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewClassInput(true)}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded px-3 py-2 whitespace-nowrap"
                >
                  + New Preferred
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Financial inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Amount Invested - shown for PPS and Valuation modes */}
          {inputMode !== 'shares' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Amount Invested ({symbol}m)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 5"
                value={newInvested}
                onChange={(e) => setNewInvested(e.target.value)}
                className="w-full text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Shares input - shown when mode is 'shares' */}
          {inputMode === 'shares' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Shares</label>
              <input
                type="number"
                placeholder="e.g., 1000000"
                value={newShares}
                onChange={(e) => setNewShares(e.target.value)}
                className="w-full text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          {/* PPS input */}
          {inputMode === 'pps' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Price Per Share ({symbol})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g., 1.50"
                value={newPPS}
                onChange={(e) => setNewPPS(e.target.value)}
                className="w-full text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500"
              />
              {newPPS && newInvested && parseFloat(newPPS) > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  = {Math.round((parseFloat(newInvested) * MILLION) / parseFloat(newPPS)).toLocaleString()} shares
                </p>
              )}
            </div>
          )}

          {/* Valuation input */}
          {inputMode === 'valuation' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Post-Money Valuation ({symbol}m)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 50"
                value={newValuation}
                onChange={(e) => setNewValuation(e.target.value)}
                className="w-full text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500"
              />
              {newValuation && newInvested && parseFloat(newValuation) > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  = {((parseFloat(newInvested) / parseFloat(newValuation)) * 100).toFixed(2)}% ownership
                </p>
              )}
            </div>
          )}

          {/* Add button */}
          <div className="flex items-end">
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || (showNewClassInput && !newClassName.trim())}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm font-medium rounded px-4 py-2 transition-colors"
            >
              Add Shareholder
            </button>
          </div>
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-500">
          {inputMode === 'shares' && 'Enter the number of shares directly.'}
          {inputMode === 'pps' && 'Shares will be calculated as: Amount Invested ÷ Price Per Share'}
          {inputMode === 'valuation' && 'Ownership will be calculated as: Amount Invested ÷ Post-Money Valuation'}
        </p>
      </div>
    </div>
  );
}
