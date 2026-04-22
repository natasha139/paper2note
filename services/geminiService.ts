import { PaperNoteData } from "../types";

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

export const polishNoteContent = async (data: PaperNoteData): Promise<Partial<PaperNoteData>> => {
  const prompt = `
    You are an expert content creator for Xiaohongshu (Little Red Book). 
    Help me polish this academic paper summary into a viral, high-value post.
    Keep the tone professional yet engaging, use emojis appropriately, and make it concise.

    Input Data:
    - Catchy Title Recommendation: ${data.catchyTitle}
    - Paper Title: ${data.paperTitle}
    - Research Question: ${data.researchQuestion}
    - Key Contribution: ${data.keyContribution}
    - Value Highlight: ${data.oneSentenceValue}
    
    Tasks:
    1. Create a "Catchy Title" (Max 15 chars) that would attract attention on Xiaohongshu.
    2. Refine the "One Sentence Value" to be extremely punchy.
    3. Generate 3-4 "Key Takeaways" (核心要点) that summarize the most important lessons.
    4. Generate 3-5 trending hashtags based on the content.

    Return the result in JSON format with keys: catchyTitle, oneSentenceValue, takeaways (array), tags (array).
  `;

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    const json = await response.json();
    const result = JSON.parse(json.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error("Qwen Polishing Error:", error);
    return {};
  }
};
