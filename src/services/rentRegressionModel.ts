import { BedroomType, RentalPosting } from '../types';
import { NEIGHBOURHOODS } from '../data/neighbourhoods';
import { ATTACHED_POSTINGS } from '../data/listings';

export interface RegressionModelCoefficients {
  intercept: number;
  bedroomWeight: number; // CAD per additional bedroom
  transitMinutesWeight: number; // CAD per minute further from core
  rapidTransitBonus: number; // CAD bonus for walking subway access
  boroughFactorWeight: number; // CAD zone multiplier effect
  rSquared: number;
  residualStandardError: number;
  trainingSamplesCount: number;
  trainedAt: string;
}

export interface RentPredictionResult {
  neighbourhoodId: string;
  neighbourhoodName: string;
  bedrooms: string;
  predictedRent: number;
  intervalLow: number;
  intervalHigh: number;
  intervalMargin: number; // e.g. ±$165
  isEstimated: true;
  rSquared: number;
  sampleSize: number;
  explanation: string;
  coefficients: {
    baseIntercept: number;
    bedroomAdjustment: number;
    commuteAdjustment: number;
    transitProximityBonus: number;
  };
}

// Borough proximity / market strength weights based on City of Toronto planning zones
const BOROUGH_ZONE_SCORES: Record<string, number> = {
  'Old Toronto': 1.0,
  'North York': 0.88,
  'East York': 0.86,
  'Etobicoke': 0.82,
  York: 0.78,
  Scarborough: 0.74,
};

const BEDROOM_NUMERIC: Record<BedroomType, number> = {
  bachelor: 0,
  '1bed': 1,
  '2bed': 2,
  '3bed': 3,
};

interface DataPoint {
  bedrooms: number;
  transitMinutes: number;
  boroughScore: number;
  hasRapidTransit: number;
  monthlyRent: number;
}

/**
 * Solves (X^T * X + lambda * I)^-1 * X^T * Y using Gauss-Jordan elimination
 */
function solveRidgeRegression(X: number[][], y: number[], lambda = 0.05): number[] {
  const n = X.length;
  const p = X[0].length;

  // Compute X^T * X
  const XtX: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * X[k][j];
      }
      XtX[i][j] = sum;
    }
    // Add ridge penalty lambda to diagonal (except intercept at index 0)
    if (i > 0) {
      XtX[i][i] += lambda * n;
    }
  }

  // Compute X^T * y
  const Xty: number[] = new Array(p).fill(0);
  for (let i = 0; i < p; i++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += X[k][i] * y[k];
    }
    Xty[i] = sum;
  }

  // Solve XtX * beta = Xty using augmented matrix [XtX | Xty]
  const aug: number[][] = Array.from({ length: p }, (_, r) => [...XtX[r], Xty[r]]);

  for (let col = 0; col < p; col++) {
    // Find pivot
    let pivotRow = col;
    for (let r = col + 1; r < p; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivotRow][col])) {
        pivotRow = r;
      }
    }
    if (pivotRow !== col) {
      const temp = aug[col];
      aug[col] = aug[pivotRow];
      aug[pivotRow] = temp;
    }

    const pivotVal = aug[col][col];
    if (Math.abs(pivotVal) < 1e-12) continue;

    for (let c = col; c <= p; c++) {
      aug[col][c] /= pivotVal;
    }

    for (let r = 0; r < p; r++) {
      if (r !== col) {
        const factor = aug[r][col];
        for (let c = col; c <= p; c++) {
          aug[r][c] -= factor * aug[col][c];
        }
      }
    }
  }

  return aug.map((row) => row[p]);
}

/**
 * Trains the rent estimation regression model across all CMHC median rents and attached MLS postings.
 */
function trainModel(): {
  coefficients: RegressionModelCoefficients;
  XtX_inv: number[][];
} {
  const dataset: DataPoint[] = [];

  // 1. Ingest CMHC survey points (40 observations: 10 neighbourhoods x 4 bedrooms)
  for (const n of NEIGHBOURHOODS) {
    const commuteMin = n.commutes['downtown-hospital']?.transitMinutes || 35;
    const boroughScore = BOROUGH_ZONE_SCORES[n.borough] || 0.8;
    const hasRapidTransit = commuteMin <= 32 || n.summary.includes('Subway') || n.summary.includes('Line 2') ? 1 : 0;

    for (const [bedKey, rent] of Object.entries(n.rents)) {
      if (typeof rent === 'number' && rent > 0) {
        dataset.push({
          bedrooms: BEDROOM_NUMERIC[bedKey as BedroomType] ?? 1,
          transitMinutes: commuteMin,
          boroughScore,
          hasRapidTransit,
          monthlyRent: rent,
        });
      }
    }
  }

  // 2. Ingest active attached postings (28 observations from HouseSigma, Realtor.ca, Zillow)
  for (const p of ATTACHED_POSTINGS) {
    const n = NEIGHBOURHOODS.find((item) => item.id === p.neighbourhoodId);
    const commuteMin = n?.commutes['downtown-hospital']?.transitMinutes || 35;
    const boroughScore = n ? BOROUGH_ZONE_SCORES[n.borough] || 0.8 : 0.8;
    const hasRapid = (p.walkToSubwayMins !== undefined && p.walkToSubwayMins <= 8) ? 1 : 0;

    dataset.push({
      bedrooms: BEDROOM_NUMERIC[p.bedrooms] ?? 1,
      transitMinutes: commuteMin,
      boroughScore,
      hasRapidTransit: hasRapid,
      monthlyRent: p.monthlyRent,
    });
  }

  // Build design matrix X: [1, bedrooms, transitMinutes, boroughScore, hasRapidTransit]
  const X: number[][] = dataset.map((d) => [
    1,
    d.bedrooms,
    d.transitMinutes,
    d.boroughScore,
    d.hasRapidTransit,
  ]);
  const y: number[] = dataset.map((d) => d.monthlyRent);

  const beta = solveRidgeRegression(X, y);

  // Compute R^2 and Residual Standard Error
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  let ssTot = 0;
  let ssRes = 0;

  for (let i = 0; i < y.length; i++) {
    const yHat =
      beta[0] +
      beta[1] * X[i][1] +
      beta[2] * X[i][2] +
      beta[3] * X[i][3] +
      beta[4] * X[i][4];
    ssRes += Math.pow(y[i] - yHat, 2);
    ssTot += Math.pow(y[i] - yMean, 2);
  }

  const rSquared = Number((1 - ssRes / ssTot).toFixed(3));
  const rse = Math.round(Math.sqrt(ssRes / (y.length - beta.length)));

  // Approximate XtX_inv diagonal for prediction variance
  const XtX_inv: number[][] = []; // placeholder for prediction intervals

  const coefficients: RegressionModelCoefficients = {
    intercept: Math.round(beta[0]),
    bedroomWeight: Math.round(beta[1]),
    transitMinutesWeight: Number(beta[2].toFixed(1)),
    boroughFactorWeight: Math.round(beta[3]),
    rapidTransitBonus: Math.round(beta[4]),
    rSquared,
    residualStandardError: rse,
    trainingSamplesCount: dataset.length,
    trainedAt: '2025-02-17',
  };

  return { coefficients, XtX_inv };
}

// Global memoized model singleton
const MODEL_CACHE = trainModel();

/**
 * Returns the trained model coefficients, weights, and transparent training stats.
 */
export function getModelCoefficients(): RegressionModelCoefficients {
  return MODEL_CACHE.coefficients;
}

/**
 * Predicts asking rent for any neighbourhood and bedroom size (including 3-bed or 4-bed gaps).
 * Transparently flags `isEstimated: true` with a 95% prediction interval.
 */
export function estimateRentWithInterval(
  neighbourhoodId: string,
  bedroomsInput: BedroomType | number
): RentPredictionResult {
  const n = NEIGHBOURHOODS.find((item) => item.id === neighbourhoodId) || NEIGHBOURHOODS[0];
  const coeff = MODEL_CACHE.coefficients;

  const numBeds = typeof bedroomsInput === 'number' ? bedroomsInput : BEDROOM_NUMERIC[bedroomsInput] ?? 1;
  const bedLabel = typeof bedroomsInput === 'number' ? `${numBeds}-Bedroom` : bedroomsInput;

  const transitMin = n.commutes['downtown-hospital']?.transitMinutes || 35;
  const boroughScore = BOROUGH_ZONE_SCORES[n.borough] || 0.8;
  const hasRapidTransit = transitMin <= 32 || n.summary.includes('Subway') ? 1 : 0;

  const bedroomAdj = coeff.bedroomWeight * numBeds;
  const commuteAdj = Math.round(coeff.transitMinutesWeight * transitMin);
  const boroughAdj = Math.round(coeff.boroughFactorWeight * boroughScore);
  const transitAdj = coeff.rapidTransitBonus * hasRapidTransit;

  const rawPredicted = coeff.intercept + bedroomAdj + commuteAdj + boroughAdj + transitAdj;
  const predictedRent = Math.round(Math.max(1200, rawPredicted));

  // 95% Prediction Interval: ±1.96 * Residual Standard Error
  const margin = Math.round(1.96 * coeff.residualStandardError);
  const intervalLow = Math.round(predictedRent - margin);
  const intervalHigh = Math.round(predictedRent + margin);

  const explanation = `Estimated using Multivariable Linear Regression (R² = ${coeff.rSquared}) trained on N=${coeff.trainingSamplesCount} Toronto CMHC benchmark points and MLS asking listings. Feature breakdown: Base Intercept ($${coeff.intercept.toLocaleString()}) + ${numBeds} Beds (+$${bedroomAdj.toLocaleString()}) + Transit to Core (${commuteAdj >= 0 ? '+' : ''}$${commuteAdj}) + Zone Weight (+$${boroughAdj.toLocaleString()}) + Rapid Transit Access (+$${transitAdj}).`;

  return {
    neighbourhoodId: n.id,
    neighbourhoodName: n.name.split(' (')[0],
    bedrooms: bedLabel,
    predictedRent,
    intervalLow,
    intervalHigh,
    intervalMargin: margin,
    isEstimated: true,
    rSquared: coeff.rSquared,
    sampleSize: coeff.trainingSamplesCount,
    explanation,
    coefficients: {
      baseIntercept: coeff.intercept,
      bedroomAdjustment: bedroomAdj,
      commuteAdjustment: commuteAdj,
      transitProximityBonus: transitAdj,
    },
  };
}
