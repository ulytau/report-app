
import { GoogleGenAI, Type } from "@google/genai";
import { AIInsight, ReportData } from "../types";

export const getAIInsights = async (data: ReportData): Promise<AIInsight | null> => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  // Create copies before sorting to avoid mutating the original data object
  const sortedHours = [...data.revenueByHour].sort((a, b) => b.value - a.value);
  const sortedDays = [...data.revenueByDay].sort((a, b) => b.value - a.value);

  const prompt = `
    As a cafe business consultant, analyze this sales report data. 
    IMPORTANT: All currency values are in Kazakhstani Tenge (KZT / ₸). Do not use or mention Rubles or any other currency.
    
    Total Revenue: ${data.totalRevenue} KZT
    Average Check: ${data.avgCheck} KZT
    Total Transactions: ${data.totalTransactions}
    Top 3 Products: ${data.topProductsByRevenue.slice(0, 3).map(p => p.name).join(', ')}
    Busiest Hours: ${sortedHours.slice(0, 3).map(h => h.hour).join(', ')}
    Busiest Days: ${sortedDays.slice(0, 2).map(d => d.day).join(', ')}

    Provide a concise analysis in Russian for the cafe administrator.
    Include a summary, 3 key highlights, and 3 actionable recommendations. 
    Make sure to use '₸' or 'тенге' when referring to money.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            highlights: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "highlights", "recommendations"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      summary: result.summary || "Не удалось загрузить анализ.",
      highlights: result.highlights || [],
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.warn("AI Insight Error (suppressed):", error);
    return null;
  }
};
