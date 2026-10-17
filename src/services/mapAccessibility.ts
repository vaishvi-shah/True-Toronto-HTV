/**
 * Accessible names for Leaflet neighbourhood pins.
 *
 * Leaflet renders divIcon markers as tabindex'd divs with role="button", so a
 * screen reader announces the icon's text content — which is just the visible
 * rank number ("1"). This helper builds the full identity string embedded
 * (visually hidden) in each pin, so keyboard and screen-reader users get the
 * area identity, rank, and true monthly cost without needing the
 * hover-only tooltip.
 */
export interface PinNameInput {
  neighbourhood: { name: string };
  trueMonthlyCost: number;
}

export function areaPinName(rank: number, item: PinNameInput): string {
  return `Rank ${rank}: ${item.neighbourhood.name}, $${item.trueMonthlyCost.toLocaleString()} per month`;
}
