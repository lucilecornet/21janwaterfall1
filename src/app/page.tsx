'use client';

import { useWaterfallState } from '@/hooks/useWaterfallState';
import {
  CompanySettings,
  ShareholderTable,
  ClassTerms,
  AdvancedSettings,
  WaterfallTable,
  ExplanationPanel,
  ExcelExport,
  CapTable,
} from '@/components';

export default function Home() {
  const {
    settings,
    classes,
    shareholders,
    selectedEv,
    showAdvanced,
    showPerShareholder,
    waterfallResult,
    selectedExplanation,
    updateSettings,
    setCurrency,
    setCompanyName,
    updateClass,
    removeClass,
    addShareholder,
    updateShareholder,
    removeShareholder,
    setSelectedEv,
    toggleAdvanced,
    togglePerShareholder,
  } = useWaterfallState();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                VC Waterfall Calculator
              </h1>
              <p className="text-sm text-gray-500">
                Model liquidation preferences and exit scenarios
              </p>
            </div>
            <ExcelExport result={waterfallResult} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Inputs */}
          <div className="space-y-6">
            {/* Company Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <CompanySettings
                name={settings.name}
                currency={settings.currency}
                onNameChange={setCompanyName}
                onCurrencyChange={setCurrency}
              />
            </div>

            {/* Shareholder Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <ShareholderTable
                shareholders={shareholders}
                classes={classes}
                currency={settings.currency}
                onAddShareholder={addShareholder}
                onUpdateShareholder={updateShareholder}
                onRemoveShareholder={removeShareholder}
              />
            </div>

            {/* Cap Table */}
            {shareholders.length > 0 && (
              <CapTable
                shareholders={shareholders}
                classes={classes}
                currency={settings.currency}
              />
            )}

            {/* Class Terms */}
            <div className="bg-white rounded-lg shadow p-6">
              <ClassTerms
                classes={classes}
                onUpdateClass={updateClass}
                onRemoveClass={removeClass}
              />
            </div>

            {/* Advanced Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <AdvancedSettings
                settings={settings}
                isOpen={showAdvanced}
                onToggle={toggleAdvanced}
                onUpdate={updateSettings}
              />
            </div>
          </div>

          {/* Right column: Results */}
          <div className="space-y-6">
            {waterfallResult ? (
              <>
                {/* EV Selector */}
                <div className="bg-white rounded-lg shadow p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Exit Value for Details
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={settings.evMax}
                    step={settings.evStepSize}
                    value={selectedEv}
                    onChange={(e) => setSelectedEv(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span className="font-medium text-blue-600">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: settings.currency,
                        notation: 'compact',
                        maximumFractionDigits: 0,
                      }).format(selectedEv)}
                    </span>
                    <span>
                      {new Intl.NumberFormat('en-US', {
                        notation: 'compact',
                        maximumFractionDigits: 0,
                      }).format(settings.evMax)}
                    </span>
                  </div>
                </div>

                {/* Waterfall Table */}
                <div className="bg-white rounded-lg shadow p-6">
                  <WaterfallTable
                    result={waterfallResult}
                    currency={settings.currency}
                    selectedEv={selectedEv}
                    onSelectEv={setSelectedEv}
                    showPerShareholder={showPerShareholder}
                    onTogglePerShareholder={togglePerShareholder}
                  />
                </div>

                {/* Explanation Panel */}
                <div className="bg-white rounded-lg shadow">
                  <ExplanationPanel
                    explanation={selectedExplanation}
                    settings={settings}
                  />
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Data Yet
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Add shareholders to the table on the left to generate the
                    waterfall analysis.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            VC Waterfall Calculator - Model exit scenarios for VC-backed startups
          </p>
        </div>
      </footer>
    </div>
  );
}
