
import { GoogleGenAI } from "@google/genai";
import { Transaction, Business } from "../types";

/**
 * Generates a business insight using Gemini AI.
 * Follows Google GenAI SDK best practices for browser environments.
 */
export async function getBusinessInsight(business: Business, transactions: Transaction[]): Promise<string> {
  // Obtain API key exclusively from process.env.API_KEY as per environment requirements
  const apiKey = process.env.API_KEY;

  // Graceful fallback if the key is missing to prevent the app from crashing on load
  if (!apiKey) {
    console.warn("Gemini API Key is not set in environment variables.");
    return "Tracking your finances is the first step toward business growth. Keep it up!";
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
    // Initialize AI instance inside the function to ensure the environment is ready 
    // and to avoid top-level initialization errors.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for basic text tasks like tips and summarization.
    // Set thinkingBudget to 0 for low-latency responses.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    // Access the .text property directly as it is a getter, not a method.
    return response.text || "Your dedication to record-keeping is setting your business up for success.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Great job documenting your business journey! Every entry counts towards your success.";
  }
}
