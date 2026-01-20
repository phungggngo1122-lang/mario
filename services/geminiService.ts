
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getLevelHint(score: number): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Oracle in a Super Mario-like game. The player currently has a score of ${score}. 
      Give them a very short, funny, 8-bit style piece of advice or a hint (max 15 words). 
      Example: 'Watch out for the Goombas, they have no lunch money!' or 'Jump higher than your bills!'`,
      config: {
        temperature: 0.9,
      }
    });
    return response.text?.trim() || "Stay curious, plumber!";
  } catch (error) {
    console.error("Gemini Hint Error:", error);
    return "The stars are silent today...";
  }
}
