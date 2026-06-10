export interface FootprintInputs {
  transportMode: 'car' | 'bike' | 'bus' | 'train' | 'metro' | 'walking' | 'cycling' | 'flight';
  travelDistance: number;
  electricity: number;
  acUsage: number;
  diet: 'vegetarian' | 'mixed' | 'non-vegetarian';
  shoppingOnline: number;
  shoppingFashion: number;
  recyclingHabit: 'always' | 'sometimes' | 'never';
  plasticUsage: 'high' | 'medium' | 'low';
}

export interface FootprintOutputs {
  transportCO2: number;
  energyCO2: number;
  foodCO2: number;
  shoppingCO2: number;
  wasteCO2: number;
  totalCO2: number;
  carbonScore: number;
  rating: string;
}

export function calculateCarbonMath(inputs: FootprintInputs): FootprintOutputs {
  const {
    transportMode,
    travelDistance,
    electricity,
    acUsage,
    diet,
    shoppingOnline,
    shoppingFashion,
    recyclingHabit,
    plasticUsage
  } = inputs;

  // Transport emissions (Monthly = Daily * 30 * Factor)
  let transportFactor = 0.18; // car default
  if (transportMode === 'bike') transportFactor = 0.08;
  else if (transportMode === 'bus') transportFactor = 0.06;
  else if (transportMode === 'train' || transportMode === 'metro') transportFactor = 0.04;
  else if (transportMode === 'walking' || transportMode === 'cycling') transportFactor = 0.0;
  else if (transportMode === 'flight') transportFactor = 0.25;

  const transportCO2 = travelDistance * 30 * transportFactor;

  // Energy emissions
  const energyElectricityCO2 = electricity * 0.4;
  const energyACCO2 = acUsage * 30 * 0.8;
  const energyCO2 = energyElectricityCO2 + energyACCO2;

  // Food emissions
  let foodCO2 = 150; // mixed
  if (diet === 'vegetarian') foodCO2 = 60;
  else if (diet === 'non-vegetarian') foodCO2 = 250;

  // Shopping emissions
  const shoppingCO2 = (shoppingOnline * 3) + (shoppingFashion * 15);

  // Waste emissions
  let wasteBase = 10;
  if (plasticUsage === 'high') wasteBase += 20;
  else if (plasticUsage === 'medium') wasteBase += 10;
  else if (plasticUsage === 'low') wasteBase += 2;

  let recyclingDeduction = 0;
  if (recyclingHabit === 'always') recyclingDeduction = -15;
  else if (recyclingHabit === 'sometimes') recyclingDeduction = -5;

  const wasteCO2 = Math.max(0, wasteBase + recyclingDeduction);

  const totalCO2 = transportCO2 + energyCO2 + foodCO2 + shoppingCO2 + wasteCO2;

  // Carbon Score calculation: 100 is excellent (low emissions), 0 is poor (high emissions)
  const carbonScore = Math.max(1, Math.min(100, Math.round(100 - (totalCO2 / 7.5))));

  // Rating
  let rating = 'F';
  if (carbonScore >= 85) rating = 'A';
  else if (carbonScore >= 70) rating = 'B';
  else if (carbonScore >= 55) rating = 'C';
  else if (carbonScore >= 40) rating = 'D';
  else if (carbonScore >= 25) rating = 'E';

  return {
    transportCO2,
    energyCO2,
    foodCO2,
    shoppingCO2,
    wasteCO2,
    totalCO2,
    carbonScore,
    rating
  };
}
