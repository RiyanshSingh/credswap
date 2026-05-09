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
    const { title, type, category, field } = await req.json()

    if (!title || !field) {
      return new Response(
        JSON.stringify({ error: "Title and field are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log(`Suggestion requested for field: ${field} (title: ${title})`);

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')?.trim().replace(/^["']|["']$/g, '');
    
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is missing from environment variables.");
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY not set in project secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const safeType = type || "blog"
    const safeCategory = category || "General"

    const fieldPrompts: Record<string, string> = {
      excerpt: `Write a concise 1-2 sentence excerpt for a ${safeType} post titled "${title}" in the "${safeCategory}" category. 30-45 words. No markdown.`,
      content: `You are an expert SEO blog writer.
Your task is to generate a high-quality, SEO optimized blog article for a student-focused platform called "Campulsy".
Target audience: College students, beginners, and early career learners interested in internships, hackathons, events, career growth, technology, and opportunities.

Topic: "${title}" (${safeCategory})

Follow these strict rules when generating content:
1. Create an engaging SEO optimized title.
2. Write a short introduction that clearly explains the topic and why it is important.
3. Add a table of contents.
4. Structure the article using proper headings (H2 for main sections, H3 for subtopics).
5. The blog must contain clear explanations, practical tips, examples when possible, and lists or bullet points for readability.
6. The article length should be comprehensive and detailed (aim for depth).
7. Use simple English that college students can easily understand.
8. Include the following sections if relevant: Benefits, Step-by-step guide, Common mistakes, Pro tips.
9. Include an FAQ section with at least 4 questions.
10. Write a short conclusion summarizing the key ideas.
11. Add a call-to-action encouraging students to explore opportunities on Campulsy.
12. Follow SEO best practices: Use the main keyword naturally, keep paragraphs short, avoid keyword stuffing.
13. Format in clean HTML (use <h2>, <h3>, <p>, <ul>, <li> tags). Do NOT use markdown block formatting (\`\`\`html) or wrap the output in any code fences. Output raw HTML only.

Output structure:
Title (H2)
Introduction
Table of Contents
Main Sections (H2 / H3)
Tips / Examples
FAQ Section
Conclusion
Call to Action mentioning Campulsy.`,
      tags: `Generate 6 relevant tags for "${title}" (${safeCategory}) as a comma-separated list. No hashtags.`,
      seo_title: `Generate an SEO-friendly title for "${title}" (${safeCategory}). Max 60 characters.`,
      seo_description: `Generate an SEO meta description for "${title}" (${safeCategory}). Max 155 characters.`
    }

    const instruction = fieldPrompts[field] || `Generate professional content for "${field}" for "${title}" (${safeCategory}).`
    console.log("Sending prompt to Groq:", instruction);

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
            content: "You are a professional editor for a student platform blog. Generate ONLY the requested content. No preamble, no markdown bolding (**), no explanations."
          },
          {
            role: "user",
            content: `Task: ${instruction}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.5,
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

    suggestion = suggestion.replace(/\*\*/g, '');
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
