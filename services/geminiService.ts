
import { GoogleGenAI, Type } from "@google/genai";
import { ReportData, AIInsight } from "../types";

export const getAIInsights = async (data: ReportData): Promise<AIInsight> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    As a cafe business consultant, analyze this sales report data:
    Total Revenue: ${data.totalRevenue}
    Average Check: ${data.avgCheck}
    Total Transactions: ${data.totalTransactions}
    Top 3 Products: ${data.topProductsByRevenue.slice(0, 3).map(p => p.name).join(', ')}
    Busiest Hours: ${data.revenueByHour.sort((a, b) => b.value - a.value).slice(0, 3).map(h => h.hour).join(', ')}
    Busiest Days: ${data.revenueByDay.sort((a, b) => b.value - a.value).slice(0, 2).map(d => d.day).join(', ')}

    Provide a concise analysis in Russian for the cafe administrator.
    Include a summary, 3 key highlights, and 3 actionable recommendations.
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
    console.error("AI Insight Error:", error);
    return {
      summary: "Анализ временно недоступен. Проверьте подключение к API.",
      highlights: [],
      recommendations: []
    };
  }
};
