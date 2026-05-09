/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function searchWeb(query: string, apiKey: string) {
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        max_results: 3,
      }),
    });

    if (!response.ok) {
      console.error("Tavily Error:", await response.text());
      return "";
    }

    const data = await response.json();
    return data.results.map((r: any) => `${r.title}: ${r.content}`).join("\n\n");
  } catch (e) {
    console.error("Search failed:", e);
    return "";
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, company, field } = await req.json()

    if (!title || !company || !field) {
      return new Response(
        JSON.stringify({ error: "Title, Company, and Field are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')?.trim().replace(/^["']|["']$/g, '');
    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY')?.trim().replace(/^["']|["']$/g, '');
    
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY not set in project secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Perform research if Tavily is available
    let searchContext = "";
    if (TAVILY_API_KEY) {
      searchContext = await searchWeb(`${title} role at ${company} requirements and description`, TAVILY_API_KEY);
    }

    const fieldPrompts: Record<string, string> = {
      description: `Generate a professional job description for "${title}" at "${company}". Context: ${searchContext.substring(0, 1000)}. Max 20-30 words. NO markdown bolding (**). It should only contain a brief description about the job.`,
      introduction: `Generate a professional 1-2 sentence introduction for "${title}" at "${company}" for college students. Word count: 30-40 words. NO markdown bolding (**).`,
      program_overview: `Generate a concise, professional overview for "${title}" internship at "${company}". Max 50 words. NO markdown bolding (**).`,
      eligibility: `Explain who can apply for "${title}" at "${company}" in a professional tone. Use context if available: ${searchContext.substring(0, 500)}. Word count: 40-60 words. NO markdown bolding (**).`,
      eligibility_criteria: `List exactly 4 key eligibility requirements for "${title}" at "${company}" based on search data, separated by commas and comma should not be in sentance, No numbering.`,
      required_skills: `List exactly 5 most important technical/soft skills for "${title}" based on search data, separated by commas. No numbering or bullets.`,
      duration: `Suggest one word duration for "${title}" at "${company}" (e.g. 3 Months).`,
      location: `Suggest a realistic work location for "${title}" at "${company}". use your mind what type of location should be or use search data.`,
      category: `Suggest one word job category for "${title}".`,
      industry: `Suggest the primary industry for "${company}".`,
      how_to_apply: `List all required steps to apply for "${title}" at "${company}" based on search data, separated by commas and comma should not be in sentance`,
      branches_allowed: `List engineering/academic branches suitable for "${title}", separated by commas and comma should not be in sentance.`,
      domains: `Suggest 3-4 professional project domains for "${title}" at "${company}", separated by commas and comma should not be in sentance.`,
      faqs: `Generate 3 professional FAQs for "${title}" at "${company}" as a JSON array of objects with "question" and "answer" fields. Use search data context for accuracy.`
    }

    const instruction = fieldPrompts[field] || `Generate professional content for "${field}" for role "${title}" at "${company}". NO markdown bolding (**).`

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a professional hiring assistant for Campulsy. Use the provided search context to generate accurate, real-world information. Generate ONLY the requested content—no preamble, no bolding (**), no explanations. Maintain a professional tone and strictly follow word count limits."
          },
          {
            role: "user",
            content: `Search Context:\n${searchContext}\n\nTask: ${instruction}`
          }
        ],
        max_tokens: 350,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
        const text = await response.text();
        return new Response(
          JSON.stringify({ error: `AI API Error: ${response.status}`, details: text }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }

    const result = await response.json();
    let suggestion = result.choices?.[0]?.message?.content?.trim() || "";

    // Formatting Cleanup: Remove markdown bolding (**)
    suggestion = suggestion.replace(/\*\*/g, '');
    
    // Basic cleanup of surrounding quotes
    suggestion = suggestion.replace(/^["']|["']$/g, '').trim();

    // If it's FAQ, try to parse JSON
    if (field === 'faqs') {
      try {
        const jsonMatch = suggestion.match(/\[.*\]/s);
        if (jsonMatch) {
          suggestion = JSON.parse(jsonMatch[0]);
        } else {
          suggestion = JSON.parse(suggestion);
        }
      } catch (e) {
        console.error("JSON Parse Error for FAQ:", e);
      }
    }

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: `Function Error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
