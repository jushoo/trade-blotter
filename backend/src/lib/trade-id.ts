/**
 * Make the business trade id from the internal serial id.
 * Example: 1 becomes "TRD-100001", 42 becomes "TRD-100042".
 */
export function makeTradeId(id: number): string {
  return `TRD-${id + 100000}`
}
