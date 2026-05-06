import { GEMINI_API_KEY } from './config.js';

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Utility to make calls to the Gemini REST API
 */
async function callGemini(contents, systemInstruction, requireJson = true) {
  if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error("Gemini API key is not configured. Please add it to config.js.");
  }

  const payload = {
    contents: contents,
    generationConfig: {}
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (requireJson) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorData?.error?.message || ''}`);
  }

  const data = await response.json();
  const textResponse = data.candidates[0].content.parts[0].text;
  
  if (requireJson) {
    try {
      return JSON.parse(textResponse);
    } catch (e) {
      console.error("Failed to parse Gemini JSON response:", textResponse);
      throw new Error("Invalid structured data from AI.");
    }
  }
  
  return textResponse;
}

export const geminiAI = {
  /**
   * Use Case 1: Multimodal Meal Analysis
   */
  analyzeMeal: async (base64Image, mimeType, userProfile) => {
    const prompt = `Analyze this meal based on the user profile: 
    Goal: ${userProfile.goal}
    Restrictions: ${userProfile.restrictions?.join(', ') || 'None'}
    Age: ${userProfile.age}, Gender: ${userProfile.gender}`;

    const systemInstruction = `You are an expert nutritionist AI. Analyze the image and return a strictly valid JSON object matching this schema exactly:
    {
      "mealName": "Name of the dish",
      "confidence": "High|Medium|Low",
      "calories": integer,
      "macros": { "protein": integer, "carbs": integer, "fat": integer },
      "foodGroups": ["Array", "of", "groups"],
      "healthScore": integer from 1 to 10 based on user goal,
      "goalAlignment": "1 sentence on how it fits their goal",
      "improvements": ["suggestion 1", "suggestion 2"],
      "restrictionFlags": ["flag 1"] or empty array if safe
    }`;

    const contents = [{
      role: "user",
      parts: [
        { text: prompt },
        { inlineData: { data: base64Image, mimeType: mimeType } }
      ]
    }];

    return await callGemini(contents, systemInstruction, true);
  },

  /**
   * Use Case 2: Just-in-Time Nudge
   */
  generateNudge: async (contextData) => {
    const prompt = `Context: Time: ${contextData.timeOfDay}. 
    Goal: ${contextData.goal}. 
    Meals logged today: ${contextData.mealsCount}. 
    Avg Score: ${contextData.avgScore}.`;

    const systemInstruction = `You are a warm, motivating nutrition coach. Generate a personalized just-in-time nudge (max 2 short sentences). Do NOT wrap in quotes. Return a JSON object: {"text": "your nudge here", "emoji": "single emoji here"}`;

    const contents = [{
      role: "user",
      parts: [{ text: prompt }]
    }];

    return await callGemini(contents, systemInstruction, true);
  },

  /**
   * Use Case 3: Restaurant Verdict
   */
  evaluateRestaurant: async (restaurantName, cuisine, userProfile) => {
    const prompt = `Restaurant: ${restaurantName} (${cuisine}). 
    User Goal: ${userProfile.goal}. 
    Restrictions: ${userProfile.restrictions?.join(', ') || 'None'}.`;

    const systemInstruction = `Evaluate if this restaurant fits the user's dietary profile. Return JSON:
    {
      "verdict": "Good Choice" | "Proceed with Caution" | "Avoid",
      "tip": "One short sentence on what to order or avoid here"
    }`;

    const contents = [{
      role: "user",
      parts: [{ text: prompt }]
    }];

    return await callGemini(contents, systemInstruction, true);
  }
};
