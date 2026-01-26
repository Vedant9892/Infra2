/**
 * Normalize site code input
 * Removes spaces, converts to uppercase, handles common formats
 */
export function normalizeSiteCode(input: string): string {
  if (!input) return '';
  // Remove all spaces and convert to uppercase
  return input.replace(/\s/g, '').toUpperCase();
}
