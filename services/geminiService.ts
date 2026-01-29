import { GoogleGenAI } from "@google/genai";
import { Transaction, Business } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.warn("Gemini API Key missing. Tips will use fallback messages.");
}

// Initialize if API key exists
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getBusinessInsight(business: Business, transactions: Transaction[]): Promise<string> {
  if (!ai) {
    return "Every entry brings you closer to your business goals. Keep going!";
  }

  const recentTransactions = transactions.slice(-10);
  const sales = recentTransactions.filter(t => t.type === 'sale').reduce((acc, curr) => acc + curr.amount, 0);
  const expenses = recentTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const prompt = `
    Business: ${business.name} (${business.type})
    Recent Stats: Total Sales $${sales}, Total Expenses $${expenses}
    Task: Give a very short, encouraging, and simple business tip (one sentence) for a woman business owner. 
    Focus on growth and financial health. Keep the language simple and friendly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "Keep up the great work! Your records are looking good.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Every entry brings you closer to your business goals. Keep going!";
  }
}
