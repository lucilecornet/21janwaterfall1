// Currency options supported by the application
export type Currency = 'EUR' | 'USD' | 'GBP';

// Currency symbols for display
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

// Global company settings
export interface CompanySettings {
  name: string;
  currency: Currency;
  // Advanced settings (collapsed by default)
  cash: number;        // Default: 0
  debt: number;        // Default: 0
  fees: number;        // Default: 0
  evStepSize: number;  // Default: 10_000_000
  evMax: number;       // Default: 200_000_000
}

// Default company settings
export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: '',
  currency: 'EUR',
  cash: 0,
  debt: 0,
  fees: 0,
  evStepSize: 10_000_000,
  evMax: 200_000_000,
};

// Preference type for share classes
export type PreferenceType = 'non-participating' | 'participating';

// Share class definition
export interface ShareClass {
  id: string;
  name: string;                        // e.g., "Series A", "Common"
  isCommon: boolean;                   // Common has no preference
  preferenceType: PreferenceType;      // Default: non-participating
  preferenceMultiple: number;          // Default: 1.0
  participationCapMultiple?: number;   // Only if participating (cap on total return as multiple of investment)
  seniorityGroup: number;              // Lower = more senior (0 = most senior)
}

// Default share class for common stock
export const createCommonClass = (id: string): ShareClass => ({
  id,
  name: 'Common',
  isCommon: true,
  preferenceType: 'non-participating',
  preferenceMultiple: 0,
  seniorityGroup: 999, // Common is always last
});

// Create a preferred share class with defaults
export const createPreferredClass = (
  id: string,
  name: string,
  seniorityGroup: number
): ShareClass => ({
  id,
  name,
  isCommon: false,
  preferenceType: 'non-participating',
  preferenceMultiple: 1.0,
  seniorityGroup,
});

// Individual shareholder
export interface Shareholder {
  id: string;
  name: string;
  classId: string;        // Reference to ShareClass
  shares: number;
  amountInvested: number; // 0 for common holders
}

// Calculation results per shareholder at specific EV
export interface ShareholderProceeds {
  shareholderId: string;
  shareholderName: string;
  className: string;
  shares: number;
  amountInvested: number;
  proceeds: number;
  preferenceProceeds: number;
  participationProceeds: number;
}

// Calculation results per class at specific EV
export interface ClassProceeds {
  classId: string;
  className: string;
  isCommon: boolean;
  totalShares: number;
  totalInvested: number;
  totalProceeds: number;
  pps: number;            // proceeds / shares
  converted: boolean;     // For non-participating: did they convert?
  capHit: boolean;        // For participating: was cap reached?
}

// Full waterfall row (one EV point)
export interface WaterfallRow {
  ev: number;
  equityValue: number;
  shareholderProceeds: ShareholderProceeds[];
  classProceeds: ClassProceeds[];
  explanation: WaterfallExplanation;
}

// Bridge calculation details
export interface EquityBridge {
  ev: number;
  cash: number;
  debt: number;
  fees: number;
  equityValue: number;
}

// Preference payment detail
export interface PreferencePayment {
  className: string;
  classId: string;
  claim: number;
  paid: number;
  shortfall: boolean;
  seniorityGroup: number;
}

// Conversion decision detail
export interface ConversionDecision {
  className: string;
  classId: string;
  preferenceValue: number;
  conversionValue: number;
  converted: boolean;
  reason: string;
}

// Cap hit detail
export interface CapHitDetail {
  className: string;
  classId: string;
  capMultiple: number;
  capAmount: number;
  proceedsBeforeCap: number;
}

// Explanation for a single EV
export interface WaterfallExplanation {
  ev: number;
  equityValue: number;
  bridge: EquityBridge;
  preferencePayments: PreferencePayment[];
  conversions: ConversionDecision[];
  capsHit: CapHitDetail[];
  commonReceives: number;
  totalDistributed: number;
}

// Complete waterfall result
export interface WaterfallResult {
  rows: WaterfallRow[];
  settings: CompanySettings;
  classes: ShareClass[];
  shareholders: Shareholder[];
}

// Application state
export interface AppState {
  settings: CompanySettings;
  classes: ShareClass[];
  shareholders: Shareholder[];
  selectedEv: number;
  showAdvanced: boolean;
  showPerShareholder: boolean;
}
