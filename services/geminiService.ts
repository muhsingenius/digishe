
import { GoogleGenAI } from "@google/genai";
import { Transaction, Business } from "../types";

// Always use the specified initialization pattern and assume API_KEY is available in process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getBusinessInsight(business: Business, transactions: Transaction[]): Promise<string> {
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
    // Generate content using gemini-3-flash-preview for basic text tasks with thinkingBudget set to 0 for lower latency
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    // Directly access the .text property from the response
    return response.text || "Keep up the great work! Your records are looking good.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Every entry brings you closer to your business goals. Keep going!";
  }
}
