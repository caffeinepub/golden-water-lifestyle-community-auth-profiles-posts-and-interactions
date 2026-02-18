/**
 * Helper utilities for encoding optional values in Candid-friendly format.
 * The backend actor expects null for None and the value directly for Some.
 */

/**
 * Encodes an optional value for Candid.
 * Returns null for None, or the value directly for Some.
 */
export function toCandidOpt<T>(value: T | null | undefined): T | null {
  return value === undefined || value === null ? null : value;
}

/**
 * Type guard to check if a value is present (not null/undefined)
 */
export function isSome<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
