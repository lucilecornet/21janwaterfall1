'use client';

import { WaterfallResult, Currency } from '@/types';
import { formatCurrency, formatPPS } from '@/lib/format';

interface WaterfallTableProps {
  result: WaterfallResult;
  currency: Currency;
  selectedEv: number;
  onSelectEv: (ev: number) => void;
  showPerShareholder: boolean;
  onTogglePerShareholder: () => void;
}

export function WaterfallTable({
  result,
  currency,
  selectedEv,
  onSelectEv,
  showPerShareholder,
  onTogglePerShareholder,
}: WaterfallTableProps) {
  const { rows, classes, shareholders } = result;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Waterfall Table</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPerShareholder}
            onChange={onTogglePerShareholder}
            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-gray-700">Show per shareholder</span>
        </label>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                EV
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Equity
              </th>
              {showPerShareholder
                ? shareholders.map((sh) => (
                    <th
                      key={sh.id}
                      className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {sh.name}
                    </th>
                  ))
                : classes.map((cls) => (
                    <th
                      key={cls.id}
                      className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {cls.name}
                    </th>
                  ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row) => {
              const isSelected = row.ev === selectedEv;
              return (
                <tr
                  key={row.ev}
                  onClick={() => onSelectEv(row.ev)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-sm font-medium sticky left-0 ${
                      isSelected ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    {formatCurrency(row.ev, currency, true)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                    {formatCurrency(row.equityValue, currency, true)}
                  </td>
                  {showPerShareholder
                    ? shareholders.map((sh) => {
                        const proceeds =
                          row.shareholderProceeds.find(
                            (sp) => sp.shareholderId === sh.id
                          )?.proceeds || 0;
                        return (
                          <td
                            key={sh.id}
                            className="px-3 py-2 whitespace-nowrap text-sm text-right"
                          >
                            {formatCurrency(proceeds, currency, true)}
                          </td>
                        );
                      })
                    : classes.map((cls) => {
                        const classProceeds = row.classProceeds.find(
                          (cp) => cp.classId === cls.id
                        );
                        return (
                          <td
                            key={cls.id}
                            className="px-3 py-2 whitespace-nowrap text-sm text-right"
                          >
                            {formatCurrency(
                              classProceeds?.totalProceeds || 0,
                              currency,
                              true
                            )}
                          </td>
                        );
                      })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PPS Summary */}
      {!showPerShareholder && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Price Per Share at {formatCurrency(selectedEv, currency, true)} EV
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {classes.map((cls) => {
              const row = rows.find((r) => r.ev === selectedEv);
              const classProceeds = row?.classProceeds.find(
                (cp) => cp.classId === cls.id
              );
              return (
                <div key={cls.id}>
                  <p className="text-xs text-gray-500">{cls.name}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPPS(classProceeds?.pps || 0, currency)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
