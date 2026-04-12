import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(req) {
    const { imageBase64 } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze this university canteen image for crowd density. 
    Consider both the number of people and the spatial distribution (queues, seating availability).
    
    Return ONLY a JSON object in this format:
    {
      "level": "Low" | "Medium" | "High",
      "confidence": 0.0 to 1.0,
      "reasoning": "short description of what you see"
    }
  `;

    const result = await model.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
    ]);

    const responseText = result.response.text();
    return new Response(responseText);
}