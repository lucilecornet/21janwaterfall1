import {
  CompanySettings,
  ShareClass,
  Shareholder,
  ShareholderProceeds,
  ClassProceeds,
  WaterfallRow,
  WaterfallExplanation,
  WaterfallResult,
  PreferencePayment,
  ConversionDecision,
  CapHitDetail,
  EquityBridge,
} from '@/types';

// Small epsilon for floating point comparisons
const EPSILON = 0.01;

/**
 * Calculate equity value from enterprise value
 */
export function calculateEquityValue(
  ev: number,
  cash: number,
  debt: number,
  fees: number
): number {
  return Math.max(0, ev + cash - debt - fees);
}

/**
 * Get total shares for a class
 */
function getClassShares(
  classId: string,
  shareholders: Shareholder[]
): number {
  return shareholders
    .filter((s) => s.classId === classId)
    .reduce((sum, s) => sum + s.shares, 0);
}

/**
 * Get total invested amount for a class
 */
function getClassInvested(
  classId: string,
  shareholders: Shareholder[]
): number {
  return shareholders
    .filter((s) => s.classId === classId)
    .reduce((sum, s) => sum + s.amountInvested, 0);
}

/**
 * Calculate preference claim for a class
 */
function getPreferenceClaim(
  shareClass: ShareClass,
  shareholders: Shareholder[]
): number {
  if (shareClass.isCommon) return 0;
  const totalInvested = getClassInvested(shareClass.id, shareholders);
  return totalInvested * shareClass.preferenceMultiple;
}

/**
 * Group classes by seniority
 */
function groupBySeniority(
  classes: ShareClass[]
): Map<number, ShareClass[]> {
  const groups = new Map<number, ShareClass[]>();
  for (const cls of classes) {
    if (cls.isCommon) continue; // Common doesn't get preference
    const existing = groups.get(cls.seniorityGroup) || [];
    existing.push(cls);
    groups.set(cls.seniorityGroup, existing);
  }
  return groups;
}

/**
 * Calculate participation cap amount for a class
 */
function getCapAmount(
  shareClass: ShareClass,
  shareholders: Shareholder[]
): number | null {
  if (
    shareClass.participationCapMultiple === undefined ||
    shareClass.participationCapMultiple <= 0
  ) {
    return null;
  }
  const totalInvested = getClassInvested(shareClass.id, shareholders);
  return totalInvested * shareClass.participationCapMultiple;
}

/**
 * Determine which non-participating classes should convert
 * Returns set of class IDs that should convert
 */
function determineConversionSet(
  classes: ShareClass[],
  shareholders: Shareholder[],
  remaining: number,
  preferencesPaid: Map<string, number>
): Set<string> {
  const nonParticipating = classes.filter(
    (c) => !c.isCommon && c.preferenceType === 'non-participating'
  );
  const participating = classes.filter(
    (c) => !c.isCommon && c.preferenceType === 'participating'
  );
  const common = classes.find((c) => c.isCommon);

  // Iteratively determine conversion set
  let converters = new Set<string>();
  let iterations = 0;
  const maxIterations = 100;

  while (iterations < maxIterations) {
    iterations++;
    const previousConverters = new Set(converters);

    // Calculate shares in participation pool
    let participationShares = 0;

    // Common shares
    if (common) {
      participationShares += getClassShares(common.id, shareholders);
    }

    // Converting non-participating classes
    for (const cls of nonParticipating) {
      if (converters.has(cls.id)) {
        participationShares += getClassShares(cls.id, shareholders);
      }
    }

    // Participating classes (always participate)
    for (const cls of participating) {
      participationShares += getClassShares(cls.id, shareholders);
    }

    // Calculate pool for participation
    // Converters give back their preference to the pool
    let converterPrefRefund = 0;
    for (const cls of nonParticipating) {
      if (converters.has(cls.id)) {
        converterPrefRefund += preferencesPaid.get(cls.id) || 0;
      }
    }

    const participationPool = remaining + converterPrefRefund;

    // Check each non-participating class's decision
    for (const cls of nonParticipating) {
      const preferenceValue = preferencesPaid.get(cls.id) || 0;
      const classShares = getClassShares(cls.id, shareholders);

      // Calculate conversion value if this class converts
      let conversionValue = 0;
      if (participationShares > 0) {
        conversionValue = (classShares / participationShares) * participationPool;
      }

      // Convert if conversion value exceeds preference value
      if (conversionValue > preferenceValue + EPSILON) {
        converters.add(cls.id);
      } else {
        converters.delete(cls.id);
      }
    }

    // Check for convergence
    if (
      converters.size === previousConverters.size &&
      [...converters].every((id) => previousConverters.has(id))
    ) {
      break;
    }
  }

  return converters;
}

/**
 * Distribute participation pool with caps
 * Returns map of classId -> proceeds
 */
function distributeWithCaps(
  classes: ShareClass[],
  shareholders: Shareholder[],
  pool: number,
  converters: Set<string>,
  preferencesPaid: Map<string, number>
): Map<string, number> {
  const result = new Map<string, number>();
  const common = classes.find((c) => c.isCommon);
  const participating = classes.filter(
    (c) => !c.isCommon && c.preferenceType === 'participating'
  );
  const convertingNonParticipating = classes.filter(
    (c) => !c.isCommon && c.preferenceType === 'non-participating' && converters.has(c.id)
  );

  // Build list of participating classes with their share counts
  interface ParticipantInfo {
    classId: string;
    shares: number;
    capAmount: number | null;
    alreadyReceived: number; // preference already paid
    capped: boolean;
  }

  const participants: ParticipantInfo[] = [];

  if (common) {
    participants.push({
      classId: common.id,
      shares: getClassShares(common.id, shareholders),
      capAmount: null,
      alreadyReceived: 0,
      capped: false,
    });
  }

  for (const cls of convertingNonParticipating) {
    participants.push({
      classId: cls.id,
      shares: getClassShares(cls.id, shareholders),
      capAmount: null, // Converting non-participating don't have caps
      alreadyReceived: 0, // They give up preference
      capped: false,
    });
  }

  for (const cls of participating) {
    const prefPaid = preferencesPaid.get(cls.id) || 0;
    participants.push({
      classId: cls.id,
      shares: getClassShares(cls.id, shareholders),
      capAmount: getCapAmount(cls, shareholders),
      alreadyReceived: prefPaid,
      capped: false,
    });
  }

  // Initialize results
  for (const p of participants) {
    result.set(p.classId, p.alreadyReceived);
  }

  // Iteratively distribute pool respecting caps
  let remainingPool = pool;
  let iterations = 0;
  const maxIterations = 100;

  while (remainingPool > EPSILON && iterations < maxIterations) {
    iterations++;

    // Get uncapped participants
    const uncapped = participants.filter((p) => !p.capped);
    if (uncapped.length === 0) break;

    const totalUncappedShares = uncapped.reduce((sum, p) => sum + p.shares, 0);
    if (totalUncappedShares <= 0) break;

    // Try to distribute remaining pool pro rata
    let distributed = 0;
    let anyCapped = false;

    for (const p of uncapped) {
      const share = (p.shares / totalUncappedShares) * remainingPool;
      const currentTotal = result.get(p.classId) || 0;
      const newTotal = currentTotal + share;

      if (p.capAmount !== null && newTotal > p.capAmount) {
        // Hit the cap
        const canReceive = Math.max(0, p.capAmount - currentTotal);
        result.set(p.classId, p.capAmount);
        distributed += canReceive;
        p.capped = true;
        anyCapped = true;
      } else {
        result.set(p.classId, newTotal);
        distributed += share;
      }
    }

    remainingPool -= distributed;

    // If no one was capped this round, we're done
    if (!anyCapped) break;
  }

  return result;
}

/**
 * Calculate waterfall for a single EV
 */
export function calculateWaterfallRow(
  ev: number,
  settings: CompanySettings,
  classes: ShareClass[],
  shareholders: Shareholder[]
): WaterfallRow {
  const { cash, debt, fees } = settings;
  const equityValue = calculateEquityValue(ev, cash, debt, fees);

  const bridge: EquityBridge = {
    ev,
    cash,
    debt,
    fees,
    equityValue,
  };

  const preferencePayments: PreferencePayment[] = [];
  const conversions: ConversionDecision[] = [];
  const capsHit: CapHitDetail[] = [];

  // Track preferences paid per class
  const preferencesPaid = new Map<string, number>();

  // Step 1: Pay preferences in seniority order
  let remaining = equityValue;
  const seniorityGroups = groupBySeniority(classes);
  const sortedSeniorities = Array.from(seniorityGroups.keys()).sort((a, b) => a - b);

  for (const seniority of sortedSeniorities) {
    const bucket = seniorityGroups.get(seniority) || [];
    if (bucket.length === 0) continue;

    // Calculate total claims in this bucket
    let totalClaims = 0;
    const claims = new Map<string, number>();

    for (const cls of bucket) {
      const claim = getPreferenceClaim(cls, shareholders);
      claims.set(cls.id, claim);
      totalClaims += claim;
    }

    if (totalClaims <= 0) continue;

    // Distribute to this bucket
    if (remaining >= totalClaims) {
      // Pay full claims
      for (const cls of bucket) {
        const claim = claims.get(cls.id) || 0;
        preferencesPaid.set(cls.id, claim);
        preferencePayments.push({
          className: cls.name,
          classId: cls.id,
          claim,
          paid: claim,
          shortfall: false,
          seniorityGroup: seniority,
        });
      }
      remaining -= totalClaims;
    } else {
      // Pro rata within bucket (shortfall)
      for (const cls of bucket) {
        const claim = claims.get(cls.id) || 0;
        const paid = totalClaims > 0 ? (claim / totalClaims) * remaining : 0;
        preferencesPaid.set(cls.id, paid);
        preferencePayments.push({
          className: cls.name,
          classId: cls.id,
          claim,
          paid,
          shortfall: claim > paid + EPSILON,
          seniorityGroup: seniority,
        });
      }
      remaining = 0;
      break; // No more to distribute after shortfall
    }
  }

  // Step 2: Determine conversion set for non-participating
  const converters = determineConversionSet(
    classes,
    shareholders,
    remaining,
    preferencesPaid
  );

  // Build conversion decisions
  const nonParticipating = classes.filter(
    (c) => !c.isCommon && c.preferenceType === 'non-participating'
  );

  for (const cls of nonParticipating) {
    const preferenceValue = preferencesPaid.get(cls.id) || 0;
    const converted = converters.has(cls.id);

    // Calculate what conversion value would be
    const classShares = getClassShares(cls.id, shareholders);
    const common = classes.find((c) => c.isCommon);
    const participating = classes.filter(
      (c) => !c.isCommon && c.preferenceType === 'participating'
    );

    let participationShares = common
      ? getClassShares(common.id, shareholders)
      : 0;
    for (const c of nonParticipating) {
      if (converters.has(c.id)) {
        participationShares += getClassShares(c.id, shareholders);
      }
    }
    for (const c of participating) {
      participationShares += getClassShares(c.id, shareholders);
    }

    // Converters give back their preference to the pool
    let converterPrefRefund = 0;
    for (const c of nonParticipating) {
      if (converters.has(c.id)) {
        converterPrefRefund += preferencesPaid.get(c.id) || 0;
      }
    }

    const participationPool = remaining + converterPrefRefund;
    const conversionValue =
      participationShares > 0
        ? (classShares / participationShares) * participationPool
        : 0;

    conversions.push({
      className: cls.name,
      classId: cls.id,
      preferenceValue,
      conversionValue,
      converted,
      reason: converted
        ? `Conversion (${formatCurrency(conversionValue, settings.currency)}) > Preference (${formatCurrency(preferenceValue, settings.currency)})`
        : conversionValue > EPSILON
        ? `Preference (${formatCurrency(preferenceValue, settings.currency)}) >= Conversion (${formatCurrency(conversionValue, settings.currency)})`
        : 'Takes preference',
    });
  }

  // Step 3: Calculate final distribution
  // Converters give back their preference to the pool
  let converterPrefRefund = 0;
  for (const cls of nonParticipating) {
    if (converters.has(cls.id)) {
      converterPrefRefund += preferencesPaid.get(cls.id) || 0;
    }
  }

  const participationPool = remaining + converterPrefRefund;

  // Distribute participation pool with caps
  const participationProceeds = distributeWithCaps(
    classes,
    shareholders,
    participationPool,
    converters,
    preferencesPaid
  );

  // Build final class proceeds
  const classProceeds: ClassProceeds[] = [];
  const common = classes.find((c) => c.isCommon);

  for (const cls of classes) {
    const totalShares = getClassShares(cls.id, shareholders);
    const totalInvested = getClassInvested(cls.id, shareholders);
    let totalProceeds: number;

    if (cls.isCommon) {
      totalProceeds = participationProceeds.get(cls.id) || 0;
    } else if (cls.preferenceType === 'non-participating') {
      if (converters.has(cls.id)) {
        // Converted: gets participation only
        totalProceeds = participationProceeds.get(cls.id) || 0;
      } else {
        // Didn't convert: gets preference only
        totalProceeds = preferencesPaid.get(cls.id) || 0;
      }
    } else {
      // Participating: gets preference + participation
      totalProceeds = participationProceeds.get(cls.id) || 0;
    }

    const pps = totalShares > 0 ? totalProceeds / totalShares : 0;
    const converted =
      !cls.isCommon &&
      cls.preferenceType === 'non-participating' &&
      converters.has(cls.id);

    const capAmount = getCapAmount(cls, shareholders);
    const capHit =
      capAmount !== null &&
      cls.preferenceType === 'participating' &&
      totalProceeds >= capAmount - EPSILON;

    if (capHit && capAmount !== null) {
      capsHit.push({
        className: cls.name,
        classId: cls.id,
        capMultiple: cls.participationCapMultiple || 0,
        capAmount,
        proceedsBeforeCap: totalProceeds,
      });
    }

    classProceeds.push({
      classId: cls.id,
      className: cls.name,
      isCommon: cls.isCommon,
      totalShares,
      totalInvested,
      totalProceeds,
      pps,
      converted,
      capHit,
    });
  }

  // Build shareholder proceeds
  const shareholderProceeds: ShareholderProceeds[] = [];

  for (const sh of shareholders) {
    const cls = classes.find((c) => c.id === sh.classId);
    if (!cls) continue;

    const classTotal = classProceeds.find((cp) => cp.classId === sh.classId);
    if (!classTotal) continue;

    const totalClassShares = getClassShares(cls.id, shareholders);
    const totalClassInvested = getClassInvested(cls.id, shareholders);

    let preferenceAmount = 0;
    let participationAmount = 0;

    if (cls.isCommon) {
      // Common only gets participation
      participationAmount =
        totalClassShares > 0
          ? (sh.shares / totalClassShares) * classTotal.totalProceeds
          : 0;
    } else if (cls.preferenceType === 'non-participating') {
      if (converters.has(cls.id)) {
        // Converted: all proceeds are participation
        participationAmount =
          totalClassShares > 0
            ? (sh.shares / totalClassShares) * classTotal.totalProceeds
            : 0;
      } else {
        // Didn't convert: all proceeds are preference (allocated by investment)
        preferenceAmount =
          totalClassInvested > 0
            ? (sh.amountInvested / totalClassInvested) * classTotal.totalProceeds
            : 0;
      }
    } else {
      // Participating
      const classPrefPaid = preferencesPaid.get(cls.id) || 0;
      const classParticipation = classTotal.totalProceeds - classPrefPaid;

      // Preference allocated by investment
      preferenceAmount =
        totalClassInvested > 0
          ? (sh.amountInvested / totalClassInvested) * classPrefPaid
          : 0;

      // Participation allocated by shares
      participationAmount =
        totalClassShares > 0
          ? (sh.shares / totalClassShares) * classParticipation
          : 0;
    }

    shareholderProceeds.push({
      shareholderId: sh.id,
      shareholderName: sh.name,
      className: cls.name,
      shares: sh.shares,
      amountInvested: sh.amountInvested,
      proceeds: preferenceAmount + participationAmount,
      preferenceProceeds: preferenceAmount,
      participationProceeds: participationAmount,
    });
  }

  // Calculate common receives
  const commonProceeds = common
    ? classProceeds.find((cp) => cp.classId === common.id)?.totalProceeds || 0
    : 0;

  // Total distributed (for verification)
  const totalDistributed = classProceeds.reduce(
    (sum, cp) => sum + cp.totalProceeds,
    0
  );

  const explanation: WaterfallExplanation = {
    ev,
    equityValue,
    bridge,
    preferencePayments,
    conversions,
    capsHit,
    commonReceives: commonProceeds,
    totalDistributed,
  };

  return {
    ev,
    equityValue,
    shareholderProceeds,
    classProceeds,
    explanation,
  };
}

/**
 * Calculate full waterfall for all EV steps
 */
export function calculateWaterfall(
  settings: CompanySettings,
  classes: ShareClass[],
  shareholders: Shareholder[]
): WaterfallResult {
  const rows: WaterfallRow[] = [];
  const { evStepSize, evMax } = settings;

  for (let ev = 0; ev <= evMax; ev += evStepSize) {
    rows.push(calculateWaterfallRow(ev, settings, classes, shareholders));
  }

  return {
    rows,
    settings,
    classes,
    shareholders,
  };
}

/**
 * Format currency for display (helper)
 */
function formatCurrency(value: number, currency: string): string {
  const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };
  const symbol = symbols[currency] || currency;
  if (Math.abs(value) >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(1)}m`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${symbol}${(value / 1_000).toFixed(0)}k`;
  }
  return `${symbol}${value.toFixed(0)}`;
}

/**
 * Generate EV values for dropdown
 */
export function generateEvOptions(
  evMax: number,
  evStepSize: number
): number[] {
  const options: number[] = [];
  for (let ev = 0; ev <= evMax; ev += evStepSize) {
    options.push(ev);
  }
  return options;
}
