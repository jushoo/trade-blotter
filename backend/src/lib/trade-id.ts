const SERIAL_OFFSET = 100000

/** Build the business id from the serial primary key. */
export function makeTradeId(serialId: number): string {
  return `TRD-${serialId + SERIAL_OFFSET}`
}

/** Parse a business id back to the serial primary key. Null when invalid. */
export function parseTradeId(id: string): number | null {
  const match = /^TRD-([1-9]\d*)$/.exec(id)
  const serial = Number(match?.[1]) - SERIAL_OFFSET
  if (!Number.isInteger(serial) || serial < 1) return null
  return serial
}
