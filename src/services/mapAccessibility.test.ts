import { describe, expect, it } from 'vitest';
import { areaPinName } from './mapAccessibility';

describe('areaPinName', () => {
  it('names the pin with rank, neighbourhood identity, and true monthly cost', () => {
    expect(
      areaPinName(1, {
        neighbourhood: { name: 'Malvern / Rouge (Scarborough North)' },
        trueMonthlyCost: 2039,
      })
    ).toBe('Rank 1: Malvern / Rouge (Scarborough North), $2,039 per month');
  });

  it('never reduces to a bare rank number', () => {
    const name = areaPinName(10, {
      neighbourhood: { name: 'Downtown East (Regent Park/Moss Park)' },
      trueMonthlyCost: 2819,
    });
    expect(name).toContain('Downtown East (Regent Park/Moss Park)');
    expect(name).toContain('$2,819');
    expect(name).not.toMatch(/^\d+$/);
  });
});
