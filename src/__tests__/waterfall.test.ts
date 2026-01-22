import { describe, it, expect } from 'vitest';
import {
  calculateEquityValue,
  calculateWaterfallRow,
  calculateWaterfall,
} from '@/lib/waterfall';
import {
  CompanySettings,
  ShareClass,
  Shareholder,
  DEFAULT_COMPANY_SETTINGS,
} from '@/types';

// Helper to create test data
const createSettings = (
  overrides: Partial<CompanySettings> = {}
): CompanySettings => ({
  ...DEFAULT_COMPANY_SETTINGS,
  name: 'Test Company',
  ...overrides,
});

const createCommonClass = (id = 'common'): ShareClass => ({
  id,
  name: 'Common',
  isCommon: true,
  preferenceType: 'non-participating',
  preferenceMultiple: 0,
  seniorityGroup: 999,
});

const createPreferredClass = (
  id: string,
  name: string,
  seniorityGroup: number,
  overrides: Partial<ShareClass> = {}
): ShareClass => ({
  id,
  name,
  isCommon: false,
  preferenceType: 'non-participating',
  preferenceMultiple: 1.0,
  seniorityGroup,
  ...overrides,
});

describe('calculateEquityValue', () => {
  it('calculates equity value correctly', () => {
    expect(calculateEquityValue(100, 10, 20, 5)).toBe(85);
  });

  it('returns 0 when EV is less than liabilities', () => {
    expect(calculateEquityValue(10, 0, 20, 5)).toBe(0);
  });

  it('adds cash to equity value', () => {
    expect(calculateEquityValue(100, 50, 0, 0)).toBe(150);
  });

  it('handles zero EV', () => {
    expect(calculateEquityValue(0, 0, 0, 0)).toBe(0);
  });
});

describe('calculateWaterfallRow - Basic scenarios', () => {
  it('distributes all to common when no preferred exists', () => {
    const settings = createSettings();
    const classes = [createCommonClass()];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 1000, amountInvested: 0 },
    ];

    const result = calculateWaterfallRow(100_000_000, settings, classes, shareholders);

    expect(result.equityValue).toBe(100_000_000);
    expect(result.classProceeds[0].totalProceeds).toBe(100_000_000);
    expect(result.shareholderProceeds[0].proceeds).toBe(100_000_000);
  });

  it('pays preference first then remaining to common', () => {
    const settings = createSettings();
    const classes = [
      createCommonClass(),
      createPreferredClass('seriesA', 'Series A', 1),
    ];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 800, amountInvested: 0 },
      { id: 's2', name: 'Investor', classId: 'seriesA', shares: 200, amountInvested: 10_000_000 },
    ];

    // At €50M exit: Series A gets €10M pref, then decides whether to convert
    // Common: 800 shares, Series A: 200 shares (if converts)
    // If Series A converts: gets 200/1000 * 50M = 10M (same as pref, so doesn't convert)
    // Series A takes pref (€10M), Common gets €40M
    const result = calculateWaterfallRow(50_000_000, settings, classes, shareholders);

    expect(result.equityValue).toBe(50_000_000);

    const seriesA = result.classProceeds.find(cp => cp.classId === 'seriesA');
    const common = result.classProceeds.find(cp => cp.classId === 'common');

    expect(seriesA?.totalProceeds).toBe(10_000_000);
    expect(seriesA?.converted).toBe(false);
    expect(common?.totalProceeds).toBe(40_000_000);
  });

  it('non-participating converts when beneficial', () => {
    const settings = createSettings();
    const classes = [
      createCommonClass(),
      createPreferredClass('seriesA', 'Series A', 1),
    ];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 500, amountInvested: 0 },
      { id: 's2', name: 'Investor', classId: 'seriesA', shares: 500, amountInvested: 10_000_000 },
    ];

    // At €100M exit:
    // If Series A takes pref: €10M pref, €90M to common only = €10M vs €0 participation
    // If Series A converts: 500/1000 * €100M = €50M
    // Conversion is better (€50M > €10M), so Series A should convert
    const result = calculateWaterfallRow(100_000_000, settings, classes, shareholders);

    const seriesA = result.classProceeds.find(cp => cp.classId === 'seriesA');
    const common = result.classProceeds.find(cp => cp.classId === 'common');

    expect(seriesA?.converted).toBe(true);
    expect(seriesA?.totalProceeds).toBe(50_000_000);
    expect(common?.totalProceeds).toBe(50_000_000);
  });
});

describe('calculateWaterfallRow - Participating preferred', () => {
  it('participating preferred gets pref plus participation', () => {
    const settings = createSettings();
    const classes = [
      createCommonClass(),
      createPreferredClass('seriesA', 'Series A', 1, {
        preferenceType: 'participating',
      }),
    ];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 800, amountInvested: 0 },
      { id: 's2', name: 'Investor', classId: 'seriesA', shares: 200, amountInvested: 10_000_000 },
    ];

    // At €100M exit:
    // Series A pref: €10M
    // Remaining: €90M
    // Participation: Series A gets 200/1000 * €90M = €18M
    // Total Series A: €10M + €18M = €28M
    // Common gets: 800/1000 * €90M = €72M
    const result = calculateWaterfallRow(100_000_000, settings, classes, shareholders);

    const seriesA = result.classProceeds.find(cp => cp.classId === 'seriesA');
    const common = result.classProceeds.find(cp => cp.classId === 'common');

    expect(seriesA?.totalProceeds).toBe(28_000_000);
    expect(common?.totalProceeds).toBe(72_000_000);
  });

  it('participating preferred with cap', () => {
    const settings = createSettings();
    const classes = [
      createCommonClass(),
      createPreferredClass('seriesA', 'Series A', 1, {
        preferenceType: 'participating',
        participationCapMultiple: 3.0, // Capped at 3x investment = €30M
      }),
    ];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 800, amountInvested: 0 },
      { id: 's2', name: 'Investor', classId: 'seriesA', shares: 200, amountInvested: 10_000_000 },
    ];

    // At €200M exit:
    // Without cap: Series A gets €10M pref + 200/1000 * €190M = €10M + €38M = €48M
    // With 3x cap: Series A capped at €30M
    // Remaining €170M goes to common (after redistributing excess)
    const result = calculateWaterfallRow(200_000_000, settings, classes, shareholders);

    const seriesA = result.classProceeds.find(cp => cp.classId === 'seriesA');
    const common = result.classProceeds.find(cp => cp.classId === 'common');

    expect(seriesA?.totalProceeds).toBe(30_000_000);
    expect(seriesA?.capHit).toBe(true);
    expect(common?.totalProceeds).toBe(170_000_000);
  });
});

describe('calculateWaterfallRow - Seniority', () => {
  it('pays more senior classes first', () => {
    const settings = createSettings();
    const classes = [
      createCommonClass(),
      createPreferredClass('seriesA', 'Series A', 2), // Less senior
      createPreferredClass('seriesB', 'Series B', 1), // More senior
    ];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 600, amountInvested: 0 },
      { id: 's2', name: 'A Investor', classId: 'seriesA', shares: 200, amountInvested: 5_000_000 },
      { id: 's3', name: 'B Investor', classId: 'seriesB', shares: 200, amountInvested: 10_000_000 },
    ];

    // At €12M exit (insufficient for all preferences):
    // Series B (senior) claims €10M, gets paid first
    // Remaining €2M goes to Series A (claims €5M, gets €2M - shortfall)
    // Nothing left for common
    const result = calculateWaterfallRow(12_000_000, settings, classes, shareholders);

    const seriesA = result.classProceeds.find(cp => cp.classId === 'seriesA');
    const seriesB = result.classProceeds.find(cp => cp.classId === 'seriesB');
    const common = result.classProceeds.find(cp => cp.classId === 'common');

    expect(seriesB?.totalProceeds).toBe(10_000_000);
    expect(seriesA?.totalProceeds).toBe(2_000_000);
    expect(common?.totalProceeds).toBe(0);
  });

  it('pari passu classes split pro rata', () => {
    const settings = createSettings();
    const classes = [
      createCommonClass(),
      createPreferredClass('seriesA', 'Series A', 1), // Same seniority
      createPreferredClass('seriesB', 'Series B', 1), // Same seniority
    ];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 600, amountInvested: 0 },
      { id: 's2', name: 'A Investor', classId: 'seriesA', shares: 200, amountInvested: 4_000_000 },
      { id: 's3', name: 'B Investor', classId: 'seriesB', shares: 200, amountInvested: 6_000_000 },
    ];

    // At €5M exit (shortfall for €10M total pref):
    // Series A claims €4M, Series B claims €6M
    // Pro rata split: A gets 4/10 * 5M = €2M, B gets 6/10 * 5M = €3M
    const result = calculateWaterfallRow(5_000_000, settings, classes, shareholders);

    const seriesA = result.classProceeds.find(cp => cp.classId === 'seriesA');
    const seriesB = result.classProceeds.find(cp => cp.classId === 'seriesB');
    const common = result.classProceeds.find(cp => cp.classId === 'common');

    expect(seriesA?.totalProceeds).toBe(2_000_000);
    expect(seriesB?.totalProceeds).toBe(3_000_000);
    expect(common?.totalProceeds).toBe(0);
  });
});

describe('calculateWaterfallRow - Shareholder allocation', () => {
  it('allocates preference by investment within class', () => {
    const settings = createSettings();
    const classes = [
      createCommonClass(),
      createPreferredClass('seriesA', 'Series A', 1),
    ];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 800, amountInvested: 0 },
      { id: 's2', name: 'Investor 1', classId: 'seriesA', shares: 100, amountInvested: 3_000_000 },
      { id: 's3', name: 'Investor 2', classId: 'seriesA', shares: 100, amountInvested: 7_000_000 },
    ];

    // At €15M exit (Series A takes pref):
    // Total pref: €10M
    // Investor 1 gets 3/10 * €10M = €3M
    // Investor 2 gets 7/10 * €10M = €7M
    const result = calculateWaterfallRow(15_000_000, settings, classes, shareholders);

    const investor1 = result.shareholderProceeds.find(sp => sp.shareholderId === 's2');
    const investor2 = result.shareholderProceeds.find(sp => sp.shareholderId === 's3');

    expect(investor1?.proceeds).toBe(3_000_000);
    expect(investor2?.proceeds).toBe(7_000_000);
  });

  it('allocates participation by shares within class', () => {
    const settings = createSettings();
    const classes = [
      createCommonClass(),
      createPreferredClass('seriesA', 'Series A', 1, {
        preferenceType: 'participating',
      }),
    ];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 800, amountInvested: 0 },
      { id: 's2', name: 'Investor 1', classId: 'seriesA', shares: 150, amountInvested: 3_000_000 },
      { id: 's3', name: 'Investor 2', classId: 'seriesA', shares: 50, amountInvested: 7_000_000 },
    ];

    // At €100M exit:
    // Pref (by investment): Investor 1 = €3M, Investor 2 = €7M
    // Remaining €90M participation:
    //   Investor 1: 150/1000 * €90M = €13.5M participation
    //   Investor 2: 50/1000 * €90M = €4.5M participation
    const result = calculateWaterfallRow(100_000_000, settings, classes, shareholders);

    const investor1 = result.shareholderProceeds.find(sp => sp.shareholderId === 's2');
    const investor2 = result.shareholderProceeds.find(sp => sp.shareholderId === 's3');

    expect(investor1?.preferenceProceeds).toBe(3_000_000);
    expect(investor1?.participationProceeds).toBe(13_500_000);
    expect(investor1?.proceeds).toBe(16_500_000);

    expect(investor2?.preferenceProceeds).toBe(7_000_000);
    expect(investor2?.participationProceeds).toBe(4_500_000);
    expect(investor2?.proceeds).toBe(11_500_000);
  });
});

describe('calculateWaterfallRow - Preference multiples', () => {
  it('applies preference multiple correctly', () => {
    const settings = createSettings();
    const classes = [
      createCommonClass(),
      createPreferredClass('seriesA', 'Series A', 1, {
        preferenceMultiple: 2.0, // 2x preference
      }),
    ];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 800, amountInvested: 0 },
      { id: 's2', name: 'Investor', classId: 'seriesA', shares: 200, amountInvested: 10_000_000 },
    ];

    // At €25M exit: Series A claims 2x = €20M preference
    const result = calculateWaterfallRow(25_000_000, settings, classes, shareholders);

    const seriesA = result.classProceeds.find(cp => cp.classId === 'seriesA');
    const common = result.classProceeds.find(cp => cp.classId === 'common');

    expect(seriesA?.totalProceeds).toBe(20_000_000);
    expect(common?.totalProceeds).toBe(5_000_000);
  });
});

describe('calculateWaterfallRow - Edge cases', () => {
  it('handles zero equity value', () => {
    const settings = createSettings({ debt: 100_000_000 });
    const classes = [createCommonClass()];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 1000, amountInvested: 0 },
    ];

    const result = calculateWaterfallRow(50_000_000, settings, classes, shareholders);

    expect(result.equityValue).toBe(0);
    expect(result.classProceeds[0].totalProceeds).toBe(0);
  });

  it('verifies total distributed equals equity value', () => {
    const settings = createSettings();
    const classes = [
      createCommonClass(),
      createPreferredClass('seriesA', 'Series A', 1, {
        preferenceType: 'participating',
        participationCapMultiple: 2.5,
      }),
      createPreferredClass('seriesB', 'Series B', 0), // More senior
    ];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 600, amountInvested: 0 },
      { id: 's2', name: 'A Investor', classId: 'seriesA', shares: 200, amountInvested: 10_000_000 },
      { id: 's3', name: 'B Investor', classId: 'seriesB', shares: 200, amountInvested: 20_000_000 },
    ];

    // Test at various EV points
    const evPoints = [0, 10_000_000, 30_000_000, 50_000_000, 100_000_000, 200_000_000];

    for (const ev of evPoints) {
      const result = calculateWaterfallRow(ev, settings, classes, shareholders);
      const totalDistributed = result.classProceeds.reduce(
        (sum, cp) => sum + cp.totalProceeds,
        0
      );

      expect(totalDistributed).toBeCloseTo(result.equityValue, 0);
    }
  });
});

describe('calculateWaterfall - Full waterfall', () => {
  it('generates correct number of rows', () => {
    const settings = createSettings({
      evStepSize: 10_000_000,
      evMax: 100_000_000,
    });
    const classes = [createCommonClass()];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 1000, amountInvested: 0 },
    ];

    const result = calculateWaterfall(settings, classes, shareholders);

    // 0, 10M, 20M, ..., 100M = 11 rows
    expect(result.rows.length).toBe(11);
    expect(result.rows[0].ev).toBe(0);
    expect(result.rows[10].ev).toBe(100_000_000);
  });

  it('PPS increases with EV', () => {
    const settings = createSettings({
      evStepSize: 50_000_000,
      evMax: 200_000_000,
    });
    const classes = [createCommonClass()];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 1000, amountInvested: 0 },
    ];

    const result = calculateWaterfall(settings, classes, shareholders);

    // PPS should increase as EV increases
    for (let i = 1; i < result.rows.length; i++) {
      const prevPps = result.rows[i - 1].classProceeds[0].pps;
      const currPps = result.rows[i].classProceeds[0].pps;
      expect(currPps).toBeGreaterThanOrEqual(prevPps);
    }
  });
});

describe('Explanation generation', () => {
  it('identifies shortfall correctly', () => {
    const settings = createSettings();
    const classes = [
      createCommonClass(),
      createPreferredClass('seriesA', 'Series A', 1),
    ];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 800, amountInvested: 0 },
      { id: 's2', name: 'Investor', classId: 'seriesA', shares: 200, amountInvested: 10_000_000 },
    ];

    const result = calculateWaterfallRow(5_000_000, settings, classes, shareholders);

    const seriesAPayment = result.explanation.preferencePayments.find(
      pp => pp.classId === 'seriesA'
    );
    expect(seriesAPayment?.shortfall).toBe(true);
    expect(seriesAPayment?.claim).toBe(10_000_000);
    expect(seriesAPayment?.paid).toBe(5_000_000);
  });

  it('tracks cap hit in explanation', () => {
    const settings = createSettings();
    const classes = [
      createCommonClass(),
      createPreferredClass('seriesA', 'Series A', 1, {
        preferenceType: 'participating',
        participationCapMultiple: 2.0,
      }),
    ];
    const shareholders: Shareholder[] = [
      { id: 's1', name: 'Founder', classId: 'common', shares: 800, amountInvested: 0 },
      { id: 's2', name: 'Investor', classId: 'seriesA', shares: 200, amountInvested: 10_000_000 },
    ];

    const result = calculateWaterfallRow(200_000_000, settings, classes, shareholders);

    expect(result.explanation.capsHit.length).toBe(1);
    expect(result.explanation.capsHit[0].classId).toBe('seriesA');
    expect(result.explanation.capsHit[0].capAmount).toBe(20_000_000);
  });
});
