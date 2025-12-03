import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeImage = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    const ai = getClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this image. If it's a document, summarize it key points. If it's a photo, describe the mood and aesthetics in one elegant sentence.",
          },
        ],
      },
    });
    return response.text || "Could not analyze image.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Analysis unavailable.";
  }
};

export const summarizeText = async (text: string): Promise<string> => {
  try {
    const ai = getClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following text in 3 crisp bullet points. Keep it professional and concise:\n\n${text.substring(0, 10000)}`,
    });
    return response.text || "Could not summarize text.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Analysis unavailable.";
  }
};

export const generateSmartReply = async (context: string): Promise<string> => {
  try {
    const ai = getClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a helpful, witty assistant in a file transfer app. The user just received a file named "${context}". Give a very short (max 10 words), fun, or interesting remark about it.`,
    });
    return response.text?.trim() || "Transfer complete!";
  } catch (error) {
    return "Transfer complete!";
  }
};