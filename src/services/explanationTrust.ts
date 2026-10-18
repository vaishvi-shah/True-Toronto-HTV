/**
 * Single-source-of-truth guard for the results hero banner.
 *
 * The banner headline/body arrive as opaque strings from the server explain
 * endpoint, which computes them with its own engine copy. The side panel and
 * neighbourhood cards always render client-computed `results[0]`. To prevent
 * the banner ever disagreeing with the panel and card (e.g. headline $2,010
 * vs panel $2,039), the server also returns structured anchor fields. This
 * verifier checks those anchors against the client-computed winner; on any
 * mismatch the caller must fall back to deterministic client copy.
 *
 * A field the server omits is treated as unverifiable and skipped, so legacy
 * payloads without the absolute anchors still pass when names and gaps agree.
 */
export interface ExplanationAnchors {
  headline?: string;
  body?: string;
  isAiGenerated?: boolean;
  cheapestRentNeighbourhood?: string;
  cheapestTrueNeighbourhood?: string;
  monthlyDifference?: number;
  timeDifferenceHours?: number;
  cheapestTrueMonthlyCost?: number;
  cheapestTrueRent?: number | null;
}

export interface TrustedTotals {
  cheapestTrueName: string;
  cheapestRentName: string;
  cheapestTrueMonthlyCost: number;
  cheapestTrueRent: number | null;
  monthlyDifference: number;
  timeDifferenceHours: number;
}

export function isExplanationConsistent(
  explanation: ExplanationAnchors | null | undefined,
  actual: TrustedTotals
): boolean {
  if (!explanation) return false;
  if (
    explanation.cheapestTrueNeighbourhood !== undefined &&
    explanation.cheapestTrueNeighbourhood !== actual.cheapestTrueName
  ) {
    return false;
  }
  if (
    explanation.cheapestRentNeighbourhood !== undefined &&
    explanation.cheapestRentNeighbourhood !== actual.cheapestRentName
  ) {
    return false;
  }
  if (
    explanation.monthlyDifference !== undefined &&
    explanation.monthlyDifference !== actual.monthlyDifference
  ) {
    return false;
  }
  if (
    explanation.timeDifferenceHours !== undefined &&
    explanation.timeDifferenceHours !== actual.timeDifferenceHours
  ) {
    return false;
  }
  if (
    explanation.cheapestTrueMonthlyCost !== undefined &&
    explanation.cheapestTrueMonthlyCost !== actual.cheapestTrueMonthlyCost
  ) {
    return false;
  }
  if (
    explanation.cheapestTrueRent !== undefined &&
    explanation.cheapestTrueRent !== actual.cheapestTrueRent
  ) {
    return false;
  }
  return true;
}
