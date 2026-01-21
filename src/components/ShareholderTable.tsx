'use client';

import { useState } from 'react';
import { Shareholder, ShareClass, Currency, CURRENCY_SYMBOLS } from '@/types';
import { generateId } from '@/lib/format';

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
  onAddClass: (name: string) => void;
}

export function ShareholderTable({
  shareholders,
  classes,
  currency,
  onAddShareholder,
  onUpdateShareholder,
  onRemoveShareholder,
  onAddClass,
}: ShareholderTableProps) {
  const [newName, setNewName] = useState('');
  const [newClassId, setNewClassId] = useState('common');
  const [newClassName, setNewClassName] = useState('');
  const [newShares, setNewShares] = useState('');
  const [newInvested, setNewInvested] = useState('');
  const [showNewClassInput, setShowNewClassInput] = useState(false);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const shares = parseFloat(newShares) || 0;
    const invested = parseFloat(newInvested) || 0;

    // If creating a new class
    if (showNewClassInput && newClassName.trim()) {
      const classId = generateId();
      onAddClass(newClassName.trim());
      onAddShareholder(newName.trim(), classId, shares, invested);
    } else {
      onAddShareholder(newName.trim(), newClassId, shares, invested);
    }

    // Reset form
    setNewName('');
    setNewShares('');
    setNewInvested('');
    setNewClassName('');
    setShowNewClassInput(false);
  };

  const symbol = CURRENCY_SYMBOLS[currency];
  const selectedClass = classes.find((c) => c.id === newClassId);
  const isCommonSelected = selectedClass?.isCommon ?? false;

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
                  Invested ({symbol})
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
                        value={sh.amountInvested}
                        onChange={(e) =>
                          onUpdateShareholder(sh.id, {
                            amountInvested: parseFloat(e.target.value) || 0,
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
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
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
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">Add Shareholder</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="col-span-2 md:col-span-1">
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            {showNewClassInput ? (
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="New class name"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="flex-1 text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  onClick={() => setShowNewClassInput(false)}
                  className="text-gray-400 hover:text-gray-600 px-2"
                  title="Cancel"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex gap-1">
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
                  className="text-blue-500 hover:text-blue-700 px-2"
                  title="Add new class"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <div>
            <input
              type="number"
              placeholder="Shares"
              value={newShares}
              onChange={(e) => setNewShares(e.target.value)}
              className="w-full text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder={`Invested (${symbol})`}
              value={newInvested}
              onChange={(e) => setNewInvested(e.target.value)}
              disabled={isCommonSelected && !showNewClassInput}
              className={`w-full text-sm border-gray-300 rounded px-3 py-2 border focus:border-blue-500 focus:ring-blue-500 ${
                isCommonSelected && !showNewClassInput
                  ? 'bg-gray-100 text-gray-400'
                  : ''
              }`}
            />
          </div>
          <div>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm font-medium rounded px-4 py-2 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
