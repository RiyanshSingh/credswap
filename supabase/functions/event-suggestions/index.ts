/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, category, field } = await req.json()

    if ((!title && field !== 'title') || !category || !field) {
      return new Response(
        JSON.stringify({ error: "Required fields missing for AI suggestion." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')?.trim().replace(/^["']|["']$/g, '');
    
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY not set in project secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const fieldPrompts: Record<string, string> = {
      title: `Generate a catchy, professional, and unique title for a campus event in the "${category}" category. The title should be short, memorable, and appeal to college students. Max 5 words.`,
      subtitle: `Generate a catchy, vibrant 1-sentence tagline/subtitle for a college campus event titled "${title || 'Unnamed ' + category + ' Event'}" in the "${category}" category. The tagline should evoke excitement and match the event's theme. Max 10-12 words. NO markdown bolding (**).`,
      description: `Generate a professional and structured event description for "${title || 'our ' + category + ' event'}" (${category}). 
      Include:
      1. A high-energy opening hook.
      2. Key highlights or what to expect (bullet points style but in plain text).
      3. Who should attend and why it's a "must-attend" event.
      Maintain a professional yet engaging campus tone. Word count: 60-80 words. NO markdown bolding (**).`,
      target_audience: `Suggest a target audience for a campus event titled "${title}" (${category}). Example: "1st & 2nd Year Computer Science Students" or "All university members interested in entrepreneurship". Max 8 words.`,
      hashtags_string: `Generate 5 relevant trending hashtags for a campus event titled "${title}" (${category}). Format: #tag1, #tag2, #tag3, #tag4, #tag5.`
    }

    const instruction = fieldPrompts[field] || `Generate professional content for "${field}" for event "${title}" in category "${category}". NO markdown bolding (**).`

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
            content: "You are a creative event organizer and copywriter for Campulsy. Your goal is to generate high-engagement, professional copy for campus events. Generate ONLY the requested content—no preamble, no bolding (**), no explanations. Strictly follow word count limits."
          },
          {
            role: "user",
            content: `Task: ${instruction}`
          }
        ],
        max_tokens: 300,
        temperature: 0.7, // Slightly higher temperature for creative event copy
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
