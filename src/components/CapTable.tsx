'use client';

import { Shareholder, ShareClass, Currency, CURRENCY_SYMBOLS } from '@/types';
import { formatNumber } from '@/lib/format';

interface CapTableProps {
  shareholders: Shareholder[];
  classes: ShareClass[];
  currency: Currency;
}

export function CapTable({ shareholders, classes, currency }: CapTableProps) {
  const symbol = CURRENCY_SYMBOLS[currency];
  const MILLION = 1_000_000;

  // Calculate total shares
  const totalShares = shareholders.reduce((sum, sh) => sum + sh.shares, 0);

  // Group shareholders by class for summary
  const classSummary = classes.map((cls) => {
    const classHolders = shareholders.filter((sh) => sh.classId === cls.id);
    const classShares = classHolders.reduce((sum, sh) => sum + sh.shares, 0);
    const classInvested = classHolders.reduce((sum, sh) => sum + sh.amountInvested, 0);
    return {
      ...cls,
      shareholders: classHolders,
      totalShares: classShares,
      totalInvested: classInvested,
      ownership: totalShares > 0 ? (classShares / totalShares) * 100 : 0,
    };
  }).filter((cls) => cls.totalShares > 0);

  if (shareholders.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Cap Table</h3>
        <p className="text-xs text-gray-500">Add shareholders to see the cap table</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Cap Table</h3>

      {/* Per-shareholder breakdown */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                Shareholder
              </th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-2 py-1.5 text-right font-medium text-gray-500 uppercase tracking-wider">
                Shares
              </th>
              <th className="px-2 py-1.5 text-right font-medium text-gray-500 uppercase tracking-wider">
                %
              </th>
              <th className="px-2 py-1.5 text-right font-medium text-gray-500 uppercase tracking-wider">
                Invested
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {shareholders.map((sh) => {
              const cls = classes.find((c) => c.id === sh.classId);
              const ownership = totalShares > 0 ? (sh.shares / totalShares) * 100 : 0;
              return (
                <tr key={sh.id}>
                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-900">
                    {sh.name}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-gray-600">
                    {cls?.name || 'Unknown'}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-right text-gray-900">
                    {formatNumber(sh.shares)}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-right text-gray-900">
                    {ownership.toFixed(2)}%
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-right text-gray-600">
                    {sh.amountInvested > 0
                      ? `${symbol}${(sh.amountInvested / MILLION).toFixed(1)}m`
                      : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 font-medium">
            <tr>
              <td className="px-2 py-1.5 text-gray-900">Total</td>
              <td className="px-2 py-1.5"></td>
              <td className="px-2 py-1.5 text-right text-gray-900">
                {formatNumber(totalShares)}
              </td>
              <td className="px-2 py-1.5 text-right text-gray-900">100%</td>
              <td className="px-2 py-1.5 text-right text-gray-600">
                {symbol}
                {(shareholders.reduce((sum, sh) => sum + sh.amountInvested, 0) / MILLION).toFixed(1)}m
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Class summary */}
      {classSummary.length > 1 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">By Class</p>
          <div className="space-y-1">
            {classSummary.map((cls) => (
              <div key={cls.id} className="flex justify-between text-xs">
                <span className="text-gray-700">{cls.name}</span>
                <span className="text-gray-900 font-medium">
                  {cls.ownership.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
