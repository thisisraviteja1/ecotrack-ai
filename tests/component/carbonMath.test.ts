import { calculateCarbonMath, FootprintInputs } from '../../src/lib/carbonMath';

describe('Carbon Calculation Math Utility', () => {
  it('correctly calculates high emission mixed footprint', () => {
    const inputs: FootprintInputs = {
      transportMode: 'car',
      travelDistance: 50,
      electricity: 300,
      acUsage: 8,
      diet: 'non-vegetarian',
      shoppingOnline: 10,
      shoppingFashion: 4,
      recyclingHabit: 'never',
      plasticUsage: 'high'
    };

    const results = calculateCarbonMath(inputs);

    // Transport: 50 * 30 * 0.18 = 270 kg CO2
    expect(results.transportCO2).toBe(270);

    // Energy: (300 * 0.4) + (8 * 30 * 0.8) = 120 + 192 = 312 kg CO2
    expect(results.energyCO2).toBe(312);

    // Food: 250 kg CO2
    expect(results.foodCO2).toBe(250);

    // Shopping: (10 * 3) + (4 * 15) = 30 + 60 = 90 kg CO2
    expect(results.shoppingCO2).toBe(90);

    // Waste: base 10 + high plastic 20 - 0 recycling = 30 kg CO2
    expect(results.wasteCO2).toBe(30);

    // Total: 270 + 312 + 250 + 90 + 30 = 952 kg CO2
    expect(results.totalCO2).toBe(952);

    // Score: Math.round(100 - (952 / 7.5)) = Math.round(100 - 126.93) = -27 -> Math.max(1, -27) = 1
    expect(results.carbonScore).toBe(1);
    expect(results.rating).toBe('F');
  });

  it('correctly calculates low eco-friendly footprint', () => {
    const inputs: FootprintInputs = {
      transportMode: 'cycling',
      travelDistance: 10,
      electricity: 50,
      acUsage: 0,
      diet: 'vegetarian',
      shoppingOnline: 0,
      shoppingFashion: 0,
      recyclingHabit: 'always',
      plasticUsage: 'low'
    };

    const results = calculateCarbonMath(inputs);

    // Transport: 0
    expect(results.transportCO2).toBe(0);

    // Energy: 50 * 0.4 = 20 kg CO2
    expect(results.energyCO2).toBe(20);

    // Food: vegetarian = 60 kg CO2
    expect(results.foodCO2).toBe(60);

    // Shopping: 0
    expect(results.shoppingCO2).toBe(0);

    // Waste: base 10 + low plastic 2 - always recycling 15 = Math.max(0, -3) = 0 kg CO2
    expect(results.wasteCO2).toBe(0);

    // Total: 0 + 20 + 60 + 0 + 0 = 80 kg CO2
    expect(results.totalCO2).toBe(80);

    // Score: Math.round(100 - (80 / 7.5)) = Math.round(100 - 10.66) = 89
    expect(results.carbonScore).toBe(89);
    expect(results.rating).toBe('A');
  });

  it('correctly maps all transport modes and factors', () => {
    const modes: Array<FootprintInputs['transportMode']> = [
      'bike', 'bus', 'train', 'metro', 'walking', 'cycling', 'flight'
    ];
    
    modes.forEach(mode => {
      const inputs: FootprintInputs = {
        transportMode: mode,
        travelDistance: 10,
        electricity: 100,
        acUsage: 2,
        diet: 'mixed',
        shoppingOnline: 1,
        shoppingFashion: 1,
        recyclingHabit: 'sometimes',
        plasticUsage: 'medium'
      };
      
      const results = calculateCarbonMath(inputs);
      expect(results.totalCO2).toBeGreaterThan(0);
      expect(results.carbonScore).toBeGreaterThanOrEqual(1);
      expect(results.carbonScore).toBeLessThanOrEqual(100);
    });
  });

  it('handles custom/falsy plasticUsage values', () => {
    const inputs: FootprintInputs = {
      transportMode: 'walking',
      travelDistance: 0,
      electricity: 0,
      acUsage: 0,
      diet: 'mixed',
      shoppingOnline: 0,
      shoppingFashion: 0,
      recyclingHabit: 'never',
      plasticUsage: 'none' as any
    };
    const results = calculateCarbonMath(inputs);
    // wasteBase = 10 (no change), wasteCO2 = 10
    expect(results.wasteCO2).toBe(10);
  });
});
