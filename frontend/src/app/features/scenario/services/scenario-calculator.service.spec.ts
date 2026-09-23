import { ScenarioCalculatorService } from './scenario-calculator.service';

describe('ScenarioCalculatorService', () => {
  const service = new ScenarioCalculatorService();

  it('calculates the documented baseline score', () => {
    const result = service.calculate([]);

    expect(result.baselineScore).toBeCloseTo(52.56, 2);
    expect(result.score).toBeCloseTo(result.baselineScore, 8);
    expect(result.criticalCount).toBe(2);
  });

  it('calculates the documented demo scenario', () => {
    const result = service.calculate([
      { measureId: 'M7', districtId: 'nura' },
      { measureId: 'M8', districtId: 'nura' },
      { measureId: 'M10', districtId: 'nura' },
      { measureId: 'M12' },
      { measureId: 'M5', districtId: 'saryarka' },
    ]);

    expect(result.score).toBeCloseTo(56.5, 1);
    expect(result.scoreDelta).toBeGreaterThan(3.9);
    expect(result.weakestDistrictId).toBe('nura');
    expect(result.criticalCount).toBe(0);
  });
});

