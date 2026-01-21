'use client';

import { WaterfallExplanation, CompanySettings } from '@/types';
import { formatCurrency } from '@/lib/format';

interface ExplanationPanelProps {
  explanation: WaterfallExplanation | null;
  settings: CompanySettings;
}

export function ExplanationPanel({
  explanation,
  settings,
}: ExplanationPanelProps) {
  const { currency } = settings;

  if (!explanation) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Explanation
        </h2>
        <p className="text-sm text-gray-500">
          Add shareholders to see the waterfall analysis.
        </p>
      </div>
    );
  }

  const {
    ev,
    equityValue,
    bridge,
    preferencePayments,
    conversions,
    capsHit,
    commonReceives,
  } = explanation;

  const hasShortfall = preferencePayments.some((pp) => pp.shortfall);
  const hasConversions = conversions.some((c) => c.converted);
  const hasCapsHit = capsHit.length > 0;

  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Explanation
        </h2>
        <p className="text-sm text-gray-600">
          Exit analysis at {formatCurrency(ev, currency)} enterprise value
        </p>
      </div>

      {/* EV to Equity Bridge */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-800">
          Enterprise Value to Equity Value
        </h3>
        <div className="bg-white rounded p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Enterprise Value</span>
            <span className="font-medium">{formatCurrency(ev, currency)}</span>
          </div>
          {bridge.cash > 0 && (
            <div className="flex justify-between text-green-600">
              <span>+ Cash</span>
              <span>{formatCurrency(bridge.cash, currency)}</span>
            </div>
          )}
          {bridge.debt > 0 && (
            <div className="flex justify-between text-red-600">
              <span>- Debt</span>
              <span>{formatCurrency(bridge.debt, currency)}</span>
            </div>
          )}
          {bridge.fees > 0 && (
            <div className="flex justify-between text-red-600">
              <span>- Transaction Fees</span>
              <span>{formatCurrency(bridge.fees, currency)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1 font-medium">
            <span>= Equity Value</span>
            <span>{formatCurrency(equityValue, currency)}</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-800">What Happens</h3>

        {equityValue === 0 ? (
          <p className="text-sm text-gray-600">
            At this exit value, there is no equity available for distribution.
            All proceeds go to debt and fees.
          </p>
        ) : (
          <div className="space-y-3 text-sm text-gray-600">
            {/* Preference payments */}
            {preferencePayments.length > 0 && (
              <div>
                <p className="font-medium text-gray-700">Preference Payments:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  {preferencePayments
                    .sort((a, b) => a.seniorityGroup - b.seniorityGroup)
                    .map((pp) => (
                      <li key={pp.classId}>
                        <span className="font-medium">{pp.className}</span>
                        {pp.shortfall ? (
                          <span className="text-orange-600">
                            {' '}
                            receives {formatCurrency(pp.paid, currency)} of{' '}
                            {formatCurrency(pp.claim, currency)} claim (pro rata
                            shortfall)
                          </span>
                        ) : (
                          <span>
                            {' '}
                            receives full {formatCurrency(pp.paid, currency)}{' '}
                            preference
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Shortfall explanation */}
            {hasShortfall && (
              <p className="text-orange-600 bg-orange-50 p-2 rounded">
                Insufficient equity to pay all preferences. Junior classes
                receive reduced or no preference.
              </p>
            )}

            {/* Conversion decisions */}
            {conversions.length > 0 && (
              <div>
                <p className="font-medium text-gray-700">Conversion Decisions:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  {conversions.map((c) => (
                    <li key={c.classId}>
                      <span className="font-medium">{c.className}</span>
                      {c.converted ? (
                        <span className="text-green-600">
                          {' '}
                          converts to common (better outcome:{' '}
                          {formatCurrency(c.conversionValue, currency)} vs{' '}
                          {formatCurrency(c.preferenceValue, currency)}{' '}
                          preference)
                        </span>
                      ) : (
                        <span>
                          {' '}
                          takes preference ({c.reason})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Participation caps */}
            {hasCapsHit && (
              <div>
                <p className="font-medium text-gray-700">Participation Caps:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  {capsHit.map((ch) => (
                    <li key={ch.classId} className="text-purple-600">
                      <span className="font-medium">{ch.className}</span> hits{' '}
                      {ch.capMultiple}x cap at{' '}
                      {formatCurrency(ch.capAmount, currency)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common proceeds */}
            <div className="bg-white rounded p-3">
              <p>
                <span className="font-medium">Common shareholders</span>{' '}
                {commonReceives > 0 ? (
                  <span>
                    receive {formatCurrency(commonReceives, currency)} in
                    proceeds.
                  </span>
                ) : (
                  <span className="text-gray-500">
                    receive nothing at this exit value.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick insight */}
      {equityValue > 0 && (
        <div className="text-xs text-gray-500 border-t pt-4">
          {hasConversions ? (
            <p>
              At higher exit values, non-participating preferred often converts
              to common to share in the upside.
            </p>
          ) : commonReceives === 0 ? (
            <p>
              Common shareholders begin receiving proceeds once all preferences
              are satisfied.
            </p>
          ) : (
            <p>
              Total equity of {formatCurrency(equityValue, currency)} is
              distributed across all share classes based on their terms.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
