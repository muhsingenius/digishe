
import { GoogleGenAI } from "@google/genai";
import { Transaction, Business } from "../types";

const INSIGHT_CACHE_KEY = 'digishe_insight_cache';

interface InsightCache {
  text: string;
  txCount: number;
  timestamp: number;
}

/**
 * Generates a business insight using Gemini AI.
 * Includes caching and throttling to respect API rate limits and quotas.
 */
export async function getBusinessInsight(business: Business, transactions: Transaction[]): Promise<string> {
  // Ensure the API key is present
  if (!process.env.API_KEY) {
    return "Tracking your finances is the first step toward business growth. Keep it up!";
  }

  const txCount = transactions.length;
  const now = Date.now();
  
  // 1. Check Cache and Throttle to avoid redundant API calls
  try {
    const cached = localStorage.getItem(INSIGHT_CACHE_KEY);
    if (cached) {
      const parsed: InsightCache = JSON.parse(cached);
      const ageMinutes = (now - parsed.timestamp) / (1000 * 60);
      
      // If we have an insight for this exact transaction count, use it.
      // Or if the last insight is relatively fresh (less than 30 mins), don't bother the API.
      if (parsed.txCount === txCount || ageMinutes < 30) {
        return parsed.text;
      }
    }
  } catch (e) {
    console.warn("Insight cache read error", e);
  }

  const recentTransactions = transactions.slice(-10);
  const sales = recentTransactions.filter(t => t.type === 'sale').reduce((acc, curr) => acc + curr.amount, 0);
  const expenses = recentTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const prompt = `
    Business: ${business.name} (${business.type})
    Recent Stats: Total Sales $${sales}, Total Expenses $${expenses}
    Task: Give a very short, encouraging, and simple business tip (one sentence) for a woman business owner in Ghana. 
    Focus on growth and financial health. Keep it simple and helpful.
  `;

  try {
    // Initializing Gemini client with named parameter as required
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for basic text task as recommended
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    // Accessing .text property directly (not a method call)
    const insightText = response.text?.trim() || "Your dedication to record-keeping is setting your business up for success.";
    
    // 2. Update Cache for future use
    localStorage.setItem(INSIGHT_CACHE_KEY, JSON.stringify({
      text: insightText,
      txCount,
      timestamp: now
    }));

    return insightText;
  } catch (error: any) {
    console.warn("Gemini Insight Error (Rate Limit or Quota likely):", error);
    
    // Fallback to cache or generic message
    const cached = localStorage.getItem(INSIGHT_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached).text;
      } catch(e) { /* ignore */ }
    }
    
    return "Great job documenting your business journey! Every entry brings you closer to your goals.";
  }
}
