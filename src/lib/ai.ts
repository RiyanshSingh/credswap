// Multi-provider AI service: Google Gemini (Primary) with seamless Groq fallback

interface MessagePayload {
  role: "user" | "assistant" | "system";
  content: string;
}

interface GenerateOptions {
  systemPrompt?: string;
  messages?: MessagePayload[];
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;



// Primary: Gemini 3.6 Flash (high performance, reasoning support)
const GEMINI_MODEL = "gemini-3.6-flash";
// Fallback: Groq Llama 3.3 70B
const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Call Google Gemini API
 */
async function callGemini(options: GenerateOptions): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  if (options.messages && options.messages.length > 0) {
    for (const msg of options.messages) {
      if (msg.role === "system") continue; // Handled in systemInstruction
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  } else if (options.prompt) {
    contents.push({
      role: "user",
      parts: [{ text: options.prompt }],
    });
  }

  const body: Record<string, any> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxTokens ?? 1024,
    },
  };

  if (options.systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: options.systemPrompt }],
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini Error ${response.status}: ${errData?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error("Empty response from Gemini API");
  }
  const text = parts.map((p: any) => p.text || "").join("").trim();
  if (!text) {
    throw new Error("Empty text content from Gemini API");
  }
  return text;
}

/**
 * Call Groq API (Fallback)
 */
async function callGroq(options: GenerateOptions): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const messages: MessagePayload[] = [];

  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }

  if (options.messages && options.messages.length > 0) {
    messages.push(...options.messages);
  } else if (options.prompt) {
    messages.push({ role: "user", content: options.prompt });
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      `Groq Error ${response.status}: ${errData?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Groq API");
  }
  return content;
}

/**
 * Robust AI execution with primary Gemini and automatic fallback to Groq
 */
export async function generateAIResponse(options: GenerateOptions): Promise<{
  text: string;
  provider: "gemini" | "groq";
}> {
  // 1. Try Gemini first (Primary)
  if (GEMINI_API_KEY) {
    try {
      const text = await callGemini(options);
      return { text, provider: "gemini" };
    } catch (geminiError: any) {
      console.warn("Primary AI (Gemini) encountered an issue, falling back to Groq:", geminiError?.message || geminiError);
    }
  }

  // 2. Fallback to Groq
  if (GROQ_API_KEY) {
    try {
      const text = await callGroq(options);
      return { text, provider: "groq" };
    } catch (groqError: any) {
      console.error("Secondary AI (Groq) also failed:", groqError?.message || groqError);
      throw groqError;
    }
  }

  throw new Error("No valid AI API keys configured (checked Gemini & Groq).");
}

/**
 * Smart recommendation reasoning for student marketplace
 */
export const getSmartRecommendationReasoning = async (
  userProfile: any,
  items: any[]
): Promise<string> => {
  if (!items || items.length === 0) {
    return "Handpicked recommendations just for you.";
  }

  const prompt = `
    You are a smart campus assistant. We have a student with the following profile:
    Major/Branch: ${userProfile?.branch || "General"}
    Semester: ${userProfile?.semester || "Unknown"}
    
    We are recommending these 4 products from our marketplace:
    ${items.map((i) => `- ${i.title} (${i.category}): ${i.description}`).join("\n")}
    
    Write a VERY SHORT (1 sentence, max 15 words) catchy personalized headline for why these products are recommended for them. 
    Example: "Based on your CS major, these tech essentials will boost your productivity."
    Do not use any markdown. Just the text.
  `;

  try {
    const res = await generateAIResponse({
      prompt,
      temperature: 0.7,
      maxTokens: 50,
    });
    return res.text.trim();
  } catch (error) {
    console.error("AI recommendation error:", error);
    return "Handpicked recommendations just for you.";
  }
};

/**
 * Price estimation for marketplace items
 */
export const getPriceSuggestion = async (
  title: string,
  category: string
): Promise<number> => {
  const prompt = `You are a campus marketplace price expert. A student is selling an item: "${title}" in the category "${category}". 
  Suggest a fair, competitive USED (pre-owned) price in Indian Rupees (₹) for a student-to-student marketplace. 
  Only return the numerical value, no text. e.g. 450`;

  try {
    const res = await generateAIResponse({
      prompt,
      temperature: 0.2,
      maxTokens: 20,
    });
    const parsed = parseInt(res.text.replace(/[^0-9]/g, ""), 10);
    return isNaN(parsed) ? 500 : parsed;
  } catch (error) {
    console.error("AI price suggestion error:", error);
    throw error;
  }
};
