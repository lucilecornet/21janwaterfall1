import { Currency, CURRENCY_SYMBOLS } from '@/types';

/**
 * Format a number as currency
 */
export function formatCurrency(
  value: number,
  currency: Currency,
  compact = false
): string {
  const symbol = CURRENCY_SYMBOLS[currency];

  if (compact) {
    if (Math.abs(value) >= 1_000_000_000) {
      return `${symbol}${(value / 1_000_000_000).toFixed(1)}b`;
    }
    if (Math.abs(value) >= 1_000_000) {
      return `${symbol}${(value / 1_000_000).toFixed(1)}m`;
    }
    if (Math.abs(value) >= 1_000) {
      return `${symbol}${(value / 1_000).toFixed(0)}k`;
    }
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number with commas
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format PPS (price per share)
 */
export function formatPPS(value: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  if (value === 0) return `${symbol}0.00`;
  if (value < 0.01) return `${symbol}${value.toFixed(4)}`;
  return `${symbol}${value.toFixed(2)}`;
}

/**
 * Parse currency input string to number
 */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
