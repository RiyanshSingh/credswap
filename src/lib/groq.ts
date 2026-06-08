
import { Groq } from "groq-sdk";

function getGroqClient() {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;

  return new Groq({
    apiKey,
    dangerouslyAllowBrowser: true, // Required for frontend-only integration
  });
}

export const getSmartRecommendationReasoning = async (userProfile: any, items: any[]) => {
  const groq = getGroqClient();
  if (!groq) {
    return "Handpicked recommendations just for you.";
  }

  try {
    const prompt = `
      You are a smart campus assistant. We have a student with the following profile:
      Major/Branch: ${userProfile?.branch || 'General'}
      Semester: ${userProfile?.semester || 'Unknown'}
      
      We are recommending these 4 products from our marketplace:
      ${items.map(i => `- ${i.title} (${i.category}): ${i.description}`).join('\n')}
      
      Write a VERY SHORT (1 sentence, max 15 words) catchy personalized headline for why these products are recommended for them. 
      Example: "Based on your CS major, these tech essentials will boost your productivity."
      Do not use any markdown. Just the text.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 50,
    });

    return chatCompletion.choices[0]?.message?.content || "AI-powered suggestions based on your interests.";
  } catch (error) {
    console.error("Groq AI Error:", error);
    return "Handpicked recommendations just for you.";
  }
};
