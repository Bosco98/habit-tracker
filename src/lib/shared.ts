import type { DayKey } from "./days";

/**
 * Shared fate: a combined streak survives only on days *everyone* delivered.
 * Feeding the intersection into the normal streak engine keeps one
 * strictness rule for both personal and shared habits.
 */
export function intersectDoneDays(
  sets: ReadonlySet<DayKey>[],
): Set<DayKey> {
  if (sets.length === 0) return new Set();
  const [first, ...rest] = sets;
  const out = new Set<DayKey>();
  for (const day of first) {
    if (rest.every((set) => set.has(day))) out.add(day);
  }
  return out;
}

export function unionDoneDays(sets: ReadonlySet<DayKey>[]): Set<DayKey> {
  const out = new Set<DayKey>();
  for (const set of sets) for (const day of set) out.add(day);
  return out;
}
