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
    const { title, field } = await req.json()

    if (!title || !field) {
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
      description: `Generate a professional and structured roadmap description for "${title}". 
      I don't want title in description. Word count: 10-20 words. NO markdown bolding (**).`,
      prerequisites: `Generate a list of exact 3 essential prerequisites for a learning roadmap titled "${title}". 
      Format: Each prerequisite on a new line. Don't use commas in paragraph,NO bullet points, NO numbers.`,
      skills_gained: `Generate a list of exact 3 key skills a student will gain after completing a roadmap titled "${title}". 
      Format: Each skill on a new line. NO bullet points, NO numbers.`,
      duration: `Generate a list of exact 3 key skills a student will gain after completing a roadmap titled "${title}". 
      Format: Each skill on a new line. NO bullet points, NO numbers.`,
      semesters: `Identify which semesters (from 1 to 8) or categories (like 'GATE') are most suitable for a student to follow a roadmap titled "${title}". 
      For foundational topics, use semesters 1-6. For competitive prep or advanced core subjects, you can also suggest 'GATE'.
      Return ONLY a comma-separated list of values. Example: 1, 2, GATE`
    }

    const instruction = fieldPrompts[field] || `Generate professional content for "${field}" for roadmap "${title}". NO markdown bolding (**).`

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
            content: "You are a professional educational curriculum designer and expert in various technological fields. Your goal is to generate high-quality, professional descriptions and requirements for learning roadmaps. Generate ONLY the requested content—no preamble, no bolding (**), no explanations. Strictly follow word count and formatting limits."
          },
          {
            role: "user",
            content: `Task: ${instruction}`
          }
        ],
        max_tokens: 400,
        temperature: 0.7,
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
