import { calculateCarbonMath, FootprintInputs } from '../../src/utils/carbonMath';

describe('Carbon Math Formulas', () => {
  const defaultInputs: FootprintInputs = {
    transportMode: 'car',
    travelDistance: 10,
    electricity: 100,
    acUsage: 2,
    diet: 'mixed',
    shoppingOnline: 0,
    shoppingFashion: 0,
    recyclingHabit: 'never',
    plasticUsage: 'medium',
  };

  it('should calculate transport emissions correctly for car', () => {
    const result = calculateCarbonMath({ ...defaultInputs, transportMode: 'car', travelDistance: 10 });
    // transportCO2 = 10 * 30 * 0.18 = 54
    expect(result.transportCO2).toBeCloseTo(54);
  });

  it('should calculate transport emissions correctly for flight', () => {
    const result = calculateCarbonMath({ ...defaultInputs, transportMode: 'flight', travelDistance: 100 });
    // transportCO2 = 100 * 30 * 0.25 = 750
    expect(result.transportCO2).toBeCloseTo(750);
  });

  it('should calculate transport emissions correctly for cycling/walking (0 factor)', () => {
    const result = calculateCarbonMath({ ...defaultInputs, transportMode: 'cycling', travelDistance: 15 });
    expect(result.transportCO2).toBe(0);
  });

  it('should calculate energy emissions correctly', () => {
    const result = calculateCarbonMath({ ...defaultInputs, electricity: 150, acUsage: 5 });
    // energyElectricityCO2 = 150 * 0.4 = 60
    // energyACCO2 = 5 * 30 * 0.8 = 120
    // energyCO2 = 180
    expect(result.energyCO2).toBeCloseTo(180);
  });

  it('should calculate food emissions for vegetarian diet', () => {
    const result = calculateCarbonMath({ ...defaultInputs, diet: 'vegetarian' });
    expect(result.foodCO2).toBe(60);
  });

  it('should calculate food emissions for non-vegetarian diet', () => {
    const result = calculateCarbonMath({ ...defaultInputs, diet: 'non-vegetarian' });
    expect(result.foodCO2).toBe(250);
  });

  it('should calculate shopping emissions correctly', () => {
    const result = calculateCarbonMath({ ...defaultInputs, shoppingOnline: 3, shoppingFashion: 2 });
    // shoppingCO2 = 3 * 3 + 2 * 15 = 9 + 30 = 39
    expect(result.shoppingCO2).toBe(39);
  });

  it('should calculate waste emissions with recycling deduction', () => {
    const result = calculateCarbonMath({
      ...defaultInputs,
      plasticUsage: 'high',
      recyclingHabit: 'always'
    });
    // wasteBase = 10 + 20 = 30
    // recyclingDeduction = -15
    // wasteCO2 = 15
    expect(result.wasteCO2).toBe(15);
  });

  it('should cap waste emissions at 0', () => {
    const result = calculateCarbonMath({
      ...defaultInputs,
      plasticUsage: 'low',
      recyclingHabit: 'always'
    });
    // wasteBase = 10 + 2 = 12
    // recyclingDeduction = -15
    // wasteCO2 = Math.max(0, -3) = 0
    expect(result.wasteCO2).toBe(0);
  });

  it('should map score to correct rating class', () => {
    // Let's craft an input that gives high emissions -> low score -> rating F
    const highEmissions = calculateCarbonMath({
      ...defaultInputs,
      travelDistance: 1000, // very high
    });
    expect(highEmissions.carbonScore).toBe(1);
    expect(highEmissions.rating).toBe('F');

    // Let's craft an input that gives low emissions -> high score -> rating A
    const lowEmissions = calculateCarbonMath({
      transportMode: 'walking',
      travelDistance: 0,
      electricity: 0,
      acUsage: 0,
      diet: 'vegetarian',
      shoppingOnline: 0,
      shoppingFashion: 0,
      recyclingHabit: 'always',
      plasticUsage: 'low',
    });
    // totalCO2 = 0 + 0 + 60 + 0 + 0 = 60
    // carbonScore = 100 - (60 / 7.5) = 100 - 8 = 92
    expect(lowEmissions.carbonScore).toBe(92);
    expect(lowEmissions.rating).toBe('A');
  });
});
