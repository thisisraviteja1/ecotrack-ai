import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the SDK. If the key is not present, we will run in mock mode.
const apiKey = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (err) {
    console.error('Failed to initialize GoogleGenerativeAI with provided API Key:', err);
  }
} else {
  console.warn('GEMINI_API_KEY is not defined. Running EcoTrack AI in mock/fallback mode.');
}

/**
 * AI Sustainability Coach chat completion.
 */
export async function chatCoach(
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string
): Promise<string> {
  if (!genAI) {
    return getMockCoachResponse(message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const systemInstruction = 
      "You are the EcoTrack AI Sustainability Coach, a helpful expert in climate science, carbon footprint reduction, and sustainable living. " +
      "Provide specific, actionable, encouraging, and localized advice. Keep responses relatively brief (2-4 paragraphs max) and format with clear markdown, bullet points, and highlight key reduction figures.";

    // Convert history format to match GoogleGenerativeAI expectation
    // In @google/generative-ai 0.x, history contains role 'user' | 'model' and parts: { text: string }[]
    const chatHistory = history.map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: h.parts.map(p => ({ text: p.text }))
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemInstruction }] },
        { role: 'model', parts: [{ text: "Understood. I am your EcoTrack AI Coach. How can I help you reduce your carbon footprint today?" }] },
        ...chatHistory
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    const result = await chat.sendMessage(message);
    return result.response.text() || "I'm having trouble analyzing that request. Let's try again.";
  } catch (error: any) {
    console.error('Gemini AI Coach Error:', error);
    return `[Mock Mode Enabled due to Error: ${error.message}]\n\n${getMockCoachResponse(message)}`;
  }
}

/**
 * AI Receipt Scanner. Parses electricity bills or fuel receipts.
 */
export async function scanReceipt(
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ amount: number; co2Estimate: number; rawText: string }> {
  if (!genAI) {
    return getMockReceiptScan();
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = 
      "Analyze this receipt or utility bill. " +
      "Extract the following values and format as a raw JSON object with keys: " +
      "'type' (either 'electricity' or 'fuel'), 'amount' (numerical consumption in kWh or liters), " +
      "'cost' (total cost paid in local currency), and 'co2Estimate' (estimated CO2 emitted in kg, " +
      "using standard conversion rates: ~0.4 kg CO2 per kWh of electricity, ~2.3 kg CO2 per liter of gasoline). " +
      "Also provide a 'rawText' summary detailing vendor, date, and key items. Output ONLY valid JSON inside a code block.";

    // Convert Buffer to Generative Part
    const filePart = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([filePart, prompt]);
    const text = result.response.text() || '';
    
    // Strip markdown code block wrappers if any
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        amount: data.amount || 0,
        co2Estimate: data.co2Estimate || (data.amount ? (data.type === 'electricity' ? data.amount * 0.4 : data.amount * 2.3) : 0),
        rawText: data.rawText || text
      };
    }

    throw new Error('Failed to parse JSON response from Gemini');
  } catch (error: any) {
    console.error('Gemini Receipt Scan Error:', error);
    return getMockReceiptScan();
  }
}

/**
 * AI Prediction Engine simulator.
 */
export async function predictEmissions(
  calc: any,
  habits: any[]
): Promise<{
  forecastAnnualWithoutChange: number;
  forecastAnnualWithChange: number;
  reductionPercent: number;
  explanation: string;
}> {
  const baseMonthly = calc ? calc.totalCO2 : 350; // kg CO2 / month
  const annualWithoutChange = baseMonthly * 12;

  // Let's compute a dynamic habit completion rate
  let activeHabitsCount = 0;
  if (habits.length > 0) {
    const lastHabit = habits[0];
    if (lastHabit.usedBicycle) activeHabitsCount++;
    if (lastHabit.avoidedPlastic) activeHabitsCount++;
    if (lastHabit.usedPublicTransport) activeHabitsCount++;
    if (lastHabit.savedElectricity) activeHabitsCount++;
    if (lastHabit.recycledWaste) activeHabitsCount++;
    if (lastHabit.carpooled) activeHabitsCount++;
  }

  const reductionFactors = {
    usedBicycle: 0.08,
    usedPublicTransport: 0.15,
    savedElectricity: 0.12,
    recycledWaste: 0.05,
    avoidedPlastic: 0.03,
    carpooled: 0.07
  };

  let totalReductionRate = 0;
  if (habits.length > 0) {
    const avg = habits.reduce((acc, h) => {
      let r = 0;
      if (h.usedBicycle) r += reductionFactors.usedBicycle;
      if (h.usedPublicTransport) r += reductionFactors.usedPublicTransport;
      if (h.savedElectricity) r += reductionFactors.savedElectricity;
      if (h.recycledWaste) r += reductionFactors.recycledWaste;
      if (h.avoidedPlastic) r += reductionFactors.avoidedPlastic;
      if (h.carpooled) r += reductionFactors.carpooled;
      return acc + r;
    }, 0) / habits.length;
    totalReductionRate = Math.min(avg, 0.45); // Max 45% reduction from daily habits
  } else {
    // If no daily habits tracked, baseline recommendation reduction is 25%
    totalReductionRate = 0.25;
  }

  const annualWithChange = annualWithoutChange * (1 - totalReductionRate);
  const reductionPercent = Math.round(totalReductionRate * 100);

  if (!genAI) {
    return {
      forecastAnnualWithoutChange: Math.round(annualWithoutChange),
      forecastAnnualWithChange: Math.round(annualWithChange),
      reductionPercent,
      explanation: `Based on your daily active habits (tracking ${activeHabitsCount} eco-actions), you are on track to reduce your yearly carbon footprint from ${Math.round(annualWithoutChange)} kg to ${Math.round(annualWithChange)} kg CO₂. Switch to walking/cycling and reduce appliance usage further to achieve an extra 10% reduction.`
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = 
      `Analyze the user's carbon footprint profile and habits. ` +
      `Current monthly emissions: ${baseMonthly} kg CO2. ` +
      `Daily habits checked: ${activeHabitsCount} active habits out of 6. ` +
      `Simulated annual reduction: ${reductionPercent}%. ` +
      `Draft a concise, 2-sentence prediction explaining what the impact will be if they continue current habits vs if they adopt the recommended strategies.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text() || '';

    return {
      forecastAnnualWithoutChange: Math.round(annualWithoutChange),
      forecastAnnualWithChange: Math.round(annualWithChange),
      reductionPercent,
      explanation: text || `If you continue with your current lifestyle, your annual carbon footprint will be ${Math.round(annualWithoutChange)} kg CO₂. By keeping up with your eco-friendly habits, you can reduce this by ${reductionPercent}%, offsetting ${Math.round(annualWithoutChange - annualWithChange)} kg CO₂ per year.`
    };
  } catch (error) {
    console.error('Gemini Predict Error:', error);
    return {
      forecastAnnualWithoutChange: Math.round(annualWithoutChange),
      forecastAnnualWithChange: Math.round(annualWithChange),
      reductionPercent,
      explanation: `Based on your daily active habits (tracking ${activeHabitsCount} eco-actions), you are on track to reduce your yearly carbon footprint from ${Math.round(annualWithoutChange)} kg to ${Math.round(annualWithChange)} kg CO₂. Switch to walking/cycling and reduce appliance usage further to achieve an extra 10% reduction.`
    };
  }
}

// --- Fallback Mock Responses ---

function getMockCoachResponse(message: string): string {
  const query = message.toLowerCase();
  if (query.includes('car') || query.includes('travel') || query.includes('transport')) {
    return "### 🚗 Eco-Coach Travel Advice\n\nTravelling by car is one of the highest individual sources of emissions. Since you mentioned car travel, here are high-impact changes you can make:\n\n* **Switch to Public Transit**: Using buses, metros, or trains 3 days per week instead of driving can reduce your annual footprint by approximately **350 kg CO₂**.\n* **Try Carpooling**: Sharing rides cuts individual transport emissions in half.\n* **Bicycle for Short Trips**: For distances under 5 km, walking or cycling produces **zero emissions** and offers great health benefits.";
  }
  if (query.includes('electricity') || query.includes('ac') || query.includes('energy')) {
    return "### ⚡ Eco-Coach Energy Advice\n\nHome energy use represents about 30% of average carbon footprints. Try these adjustments:\n\n* **Adjust the AC**: Raising your air conditioner setpoint by just 2°C (e.g. from 22°C to 24°C) can lower your monthly cooling power consumption by **15%**.\n* **Unplug Standby Devices**: Many appliances draw 'vampire load' when plugged in but turned off. Using power strips can save up to **100 kg CO₂** annually.\n* **Switch to LED Bulbs**: LEDs consume 80% less energy than incandescent lightbulbs and last 25 times longer.";
  }
  if (query.includes('diet') || query.includes('meat') || query.includes('food')) {
    return "### 🥗 Eco-Coach Food Advice\n\nThe global food production system accounts for nearly a quarter of greenhouse gas emissions. You can make a major impact through your meals:\n\n* **Incorporate Meatless Days**: Shifting to a vegetarian diet for just 3 days a week saves roughly **400 kg CO₂** annually per person.\n* **Reduce Food Waste**: Decaying food in landfills produces methane, a potent greenhouse gas. Plan meals carefully and compost organic waste to save **120 kg CO₂** per year.";
  }
  return "### 🌱 Welcome to EcoTrack AI Coach!\n\nI can help you build simple habits to lower your environmental impact. Ask me anything about:\n\n1. Reducing your travel footprint\n2. Optimizing home electricity and water usage\n3. Making eco-friendly food and shopping choices\n\n*Eco-Tip of the Day*: Switch off appliances at the wall socket when not in use to eliminate standby energy loss.";
}

function getMockReceiptScan(): { amount: number; co2Estimate: number; rawText: string } {
  const randomValue = Math.floor(Math.random() * 2) === 0;
  if (randomValue) {
    return {
      amount: 185, // kWh
      co2Estimate: 74, // kg CO2
      rawText: "MOCK RECEIPT EXTRACTED:\nVendor: City Power & Light Co.\nBilling Period: May 1 - May 31\nUsage: 185 kWh Electricity\nTotal Amount Due: $42.50\nEstimated CO2: 74.00 kg"
    };
  } else {
    return {
      amount: 45, // Liters of Fuel
      co2Estimate: 103.5, // kg CO2
      rawText: "MOCK RECEIPT EXTRACTED:\nVendor: EcoFuel Gas Station\nDate: 2026-06-07\nProduct: Unleaded gasoline\nVolume: 45.00 Liters\nTotal Paid: $67.50\nEstimated CO2: 103.50 kg"
    };
  }
}
