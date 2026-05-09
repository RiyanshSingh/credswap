/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, history, context } = await req.json()

    const queryText = typeof query === "string" ? query.trim() : "";
    const normalizedQuery = queryText.toLowerCase();
    const contextPath = typeof context?.path === "string" ? context.path : "";

    const containsAny = (text: string, keywords: string[]) =>
      keywords.some((keyword) => text.includes(keyword));

    const noteKeywords = [
      "note",
      "notes",
      "pyq",
      "previous year",
      "previous-year",
      "question paper",
      "question papers",
      "pdf",
      "download",
      "material",
      "study",
    ];

    const eventKeywords = [
      "event",
      "events",
      "workshop",
      "hackathon",
      "seminar",
      "festival",
      "fest",
      "competition",
      "meetup",
      "webinar",
    ];

    const marketplaceKeywords = [
      "marketplace",
      "buy",
      "sell",
      "listing",
      "offer",
      "price",
      "item",
      "items",
      "product",
    ];

    const lostFoundKeywords = [
      "lost",
      "found",
      "lost and found",
      "lost & found",
      "missing",
    ];

    const roadmapKeywords = [
      "roadmap",
      "roadmaps",
      "path",
      "career path",
      "learning path",
      "learn",
      "course",
    ];

    const profileKeywords = [
      "profile",
      "name",
      "full name",
      "bio",
      "skills",
      "linkedin",
      "github",
      "portfolio",
      "resume",
      "avatar",
    ];

    const helpKeywords = [
      "help",
      "guide",
      "how",
      "how to",
      "steps",
      "process",
      "kaise",
      "kya",
      "batao",
      "samjhao",
      "explain",
    ];

    const greetingKeywords = [
      "hi",
      "hello",
      "hey",
      "hii",
      "hey there",
      "good morning",
      "good afternoon",
      "good evening",
    ];

    const getModuleFromText = (text: string) => {
      if (text.includes("upload") && containsAny(text, ["note", "notes", "pyq"])) return "notes";
      if (text.includes("post") && containsAny(text, ["event", "events"])) return "events";
      if (text.includes("post") && containsAny(text, ["lost", "found", "missing"])) return "lost_found";
      if (text.includes("report") && containsAny(text, ["lost", "found", "missing"])) return "lost_found";
      if (text.includes("post") && containsAny(text, ["item", "items", "listing", "sell"])) return "marketplace";
      if (containsAny(text, noteKeywords)) return "notes";
      if (containsAny(text, eventKeywords)) return "events";
      if (containsAny(text, marketplaceKeywords)) return "marketplace";
      if (containsAny(text, lostFoundKeywords)) return "lost_found";
      if (containsAny(text, roadmapKeywords)) return "roadmaps";
      if (containsAny(text, ["earn", "task", "tasks", "reward"])) return "earn";
      if (containsAny(text, ["community", "feed", "post", "discussion"])) return "community";
      if (containsAny(text, ["inbox", "chat", "message", "dm", "conversation"])) return "inbox";
      if (containsAny(text, ["room", "rooms", "hostel", "rent", "room finder"])) return "rooms";
      if (containsAny(text, ["profile", "settings", "account"])) return "profile";
      return null;
    };

    const getModuleFromPath = (path: string) => {
      if (!path) return null;
      if (path.startsWith("/notes")) return "notes";
      if (path.startsWith("/events")) return "events";
      if (path.startsWith("/marketplace")) return "marketplace";
      if (path.startsWith("/lost-and-found")) return "lost_found";
      if (path.startsWith("/roadmaps") || path.startsWith("/roadmap")) return "roadmaps";
      if (path.startsWith("/earn")) return "earn";
      if (path.startsWith("/community")) return "community";
      if (path.startsWith("/inbox")) return "inbox";
      if (path.startsWith("/rooms")) return "rooms";
      if (path.startsWith("/settings") || path.startsWith("/profile")) return "profile";
      if (path.startsWith("/upload")) return "notes";
      if (path.startsWith("/dashboard")) return "marketplace";
      return null;
    };

    const isGreeting = containsAny(normalizedQuery, greetingKeywords)
      && normalizedQuery.split(" ").length <= 3
      && !containsAny(normalizedQuery, [
        ...noteKeywords,
        ...eventKeywords,
        ...marketplaceKeywords,
        ...lostFoundKeywords,
        ...roadmapKeywords,
        "profile",
        "settings",
        "task",
        "tasks",
        "room",
        "community",
        "inbox",
      ]);
    const helpIntent = containsAny(normalizedQuery, helpKeywords);
    const moduleIntent = getModuleFromText(normalizedQuery);
    const contextModule = getModuleFromPath(contextPath);

    const moduleHelpText = (module: string) => {
      switch (module) {
        case "notes":
          return [
            "Notes Hub quick help:",
            "- Open Notes: /notes",
            "- Search by subject or topic.",
            "- Filter by semester or type (Notes/PYQ).",
            "- Open a note to preview and download.",
            "- To upload a PDF: /upload",
            "Tell me the subject/topic and I’ll fetch links.",
          ].join("\n");
        case "events":
          return [
            "Events quick help:",
            "- Open Events: /events",
            "- Search by title, venue, organizer, or category.",
            "- Open an event to view details and register.",
            "- Post your event using the “Post Event” button (login required).",
            "Tell me a keyword and I’ll find events.",
          ].join("\n");
        case "marketplace":
          return [
            "Marketplace quick help:",
            "- Open Marketplace: /marketplace",
            "- Search by item name or category.",
            "- Open a listing to view details.",
            "- Use “Make Offer” to negotiate or message the seller.",
            "- To sell, click “Add Item” in Marketplace.",
            "Tell me what you want to buy or sell and I’ll find listings.",
          ].join("\n");
        case "roadmaps":
          return [
            "Roadmaps quick help:",
            "- Open Roadmaps: /roadmaps",
            "- Browse structured paths for learning.",
            "- Tracks include Frontend, Backend, AI, Data Science, etc.",
            "- Each roadmap shows difficulty and estimated time.",
            "Tell me what skill you want a roadmap for.",
          ].join("\n");
        case "lost_found":
          return [
            "Lost & Found quick help:",
            "- Open Lost & Found: /lost-and-found",
            "- Search by item name, location, or category.",
            "- Post a Lost/Found report with contact info.",
            "- Mark as resolved once recovered.",
            "Tell me the item or location and I’ll search.",
          ].join("\n");
        case "earn":
          return [
            "Earn/Tasks quick help:",
            "- Open Earn: /earn",
            "- Pick a task and read the requirements.",
            "- Submit proof from the task detail page.",
          ].join("\n");
        case "community":
          return [
            "Community quick help:",
            "- Open Community: /community",
            "- Browse posts or search by keywords.",
            "- Create a post using the “New Post” button.",
          ].join("\n");
        case "inbox":
          return [
            "Inbox/Chat quick help:",
            "- Open Inbox: /inbox",
            "- Open a conversation to chat.",
            "- Start chats from listings or profiles.",
          ].join("\n");
        case "rooms":
          return [
            "Room Finder quick help:",
            "- Open Room Finder: /rooms",
            "- Filter by location, price, or type.",
            "- Open a room to view details and inquire.",
          ].join("\n");
        case "profile":
          return [
            "Profile & Settings quick help:",
            "- Open Settings: /settings",
            "- Update name, bio, skills, links, and avatar.",
            "- View your profile at /profile/<your-id>",
            "Tell me what you want to change and I can update it.",
          ].join("\n");
        default:
          return [
            "Here’s what I can help with:",
            "- Notes",
            "- Events",
            "- Marketplace",
            "- Lost & Found",
            "- Earn/Tasks",
            "- Community",
            "- Inbox/Chat",
            "- Room Finder",
            "- Profile/Settings",
            "Tell me what you need help with.",
          ].join("\n");
      }
    };

    const contextualHelpText = (path: string) => {
      if (!path) return null;
      if (path.startsWith("/marketplace/") && path !== "/marketplace") {
        return [
          "You’re viewing a listing.",
          "- Review details, images, and price.",
          "- Use “Make Offer” to negotiate.",
          "- Message the seller from the listing.",
        ].join("\n");
      }
      if (path.startsWith("/events/") && path !== "/events") {
        return [
          "You’re viewing an event.",
          "- Check date, time, venue, and organizer.",
          "- Use the Register/Interested action.",
        ].join("\n");
      }
      if (path.startsWith("/lost-and-found/") && path !== "/lost-and-found") {
        return [
          "You’re viewing a Lost & Found post.",
          "- Check the location/date details.",
          "- Message the poster to coordinate recovery.",
        ].join("\n");
      }
      if (path.startsWith("/notes/") && path !== "/notes") {
        return [
          "You’re viewing a note.",
          "- Preview the PDF and download it.",
          "- Check subject/semester details.",
        ].join("\n");
      }
      if (path.startsWith("/rooms/") && path !== "/rooms") {
        return [
          "You’re viewing a room listing.",
          "- Review rent, amenities, and location.",
          "- Contact the owner or inquire from the page.",
        ].join("\n");
      }
      if (path.startsWith("/upload")) {
        return [
          "You’re on the upload page.",
          "- Upload a PDF file.",
          "- Add title, subject, semester, and branch.",
          "- Submit to publish.",
        ].join("\n");
      }
      return null;
    };

    const baseStopWords = new Set([
      "i", "me", "my", "we", "us", "you", "your", "please", "help", "need", "want", "give", "get",
      "can", "could", "would", "should", "may", "might",
      "for", "to", "of", "the", "a", "an", "is", "are", "with", "on", "in", "and", "about",
      "show", "find", "search", "tell", "batao", "kaise", "kya",
    ]);

    const shorthandMap: Record<string, string> = {
      toc: "theory of computation",
      dbms: "database management systems",
      dsa: "data structures and algorithms",
      os: "operating systems",
      cn: "computer networks",
      oop: "object oriented programming",
      oops: "object oriented programming",
    };

    const normalizeText = (text: string) =>
      text.replace(/[^a-z0-9\s]/gi, " ").replace(/\s+/g, " ").trim().toLowerCase();

    const extractTopic = (text: string, stopWords: Set<string>) => {
      const cleaned = normalizeText(text);
      if (!cleaned) return null;
      const tokens = cleaned.split(" ").filter((token) => token && !stopWords.has(token));
      if (tokens.length === 0) return null;
      const phrase = tokens.join(" ").trim();
      if (shorthandMap[phrase]) return shorthandMap[phrase];
      if (tokens.length === 1 && phrase.length < 3) return null;
      return phrase;
    };

    const notesStopWords = new Set([
      ...baseStopWords,
      "notes",
      "note",
      "pdf",
      "pyq",
      "material",
      "materials",
      "download",
      "link",
      "links",
      "subject",
      "topic",
    ]);

    const eventsStopWords = new Set([
      ...baseStopWords,
      "event",
      "events",
      "register",
      "registration",
      "rsvp",
      "join",
    ]);

    const marketplaceStopWords = new Set([
      ...baseStopWords,
      "marketplace",
      "buy",
      "sell",
      "listing",
      "offer",
      "price",
      "item",
      "items",
      "product",
    ]);

    const lostFoundStopWords = new Set([
      ...baseStopWords,
      "lost",
      "found",
      "missing",
      "report",
      "item",
      "items",
    ]);

    const roadmapStopWords = new Set([
      ...baseStopWords,
      "roadmap",
      "roadmaps",
      "path",
      "career path",
      "learning path",
      "learn",
      "course",
    ]);

    const extractNoteTopic = (text: string) => extractTopic(text, notesStopWords);
    const extractEventTopic = (text: string) => extractTopic(text, eventsStopWords);
    const extractMarketplaceTopic = (text: string) => extractTopic(text, marketplaceStopWords);
    const extractLostFoundTopic = (text: string) => extractTopic(text, lostFoundStopWords);
    const extractRoadmapTopic = (text: string) => extractTopic(text, roadmapStopWords);

    const isGenericQuery = (extractor: (text: string) => string | null) => (text: string) => {
      const topic = extractor(text);
      if (!topic) return true;
      if (topic.length <= 2) return true;
      return false;
    };

    const isGenericNotesQuery = isGenericQuery(extractNoteTopic);
    const isGenericEventsQuery = isGenericQuery(extractEventTopic);
    const isGenericMarketplaceQuery = isGenericQuery(extractMarketplaceTopic);
    const isGenericLostFoundQuery = isGenericQuery(extractLostFoundTopic);
    const isGenericRoadmapQuery = isGenericQuery(extractRoadmapTopic);

    const sanitizeSearchTerm = (term: string) =>
      term.replace(/[%_]/g, " ").replace(/,/g, " ").replace(/\s+/g, " ").trim();

    const getSearchTerm = (
      extractor: (text: string) => string | null,
      isGeneric: (text: string) => boolean,
    ) => {
      const topic = extractor(queryText);
      if (topic && !isGeneric(queryText)) return sanitizeSearchTerm(topic);
      
      return null;
    };

    const extractProfileName = (text: string) => {
      const match = text.match(/(?:profile\s+)?(?:full\s+)?name\s*(?:to|as|=)\s*(.+)$/i);
      if (!match) return null;
      const value = match[1]?.trim();
      if (!value) return null;
      return value;
    };

    const profileIntent =
      containsAny(normalizedQuery, profileKeywords) &&
      containsAny(normalizedQuery, ["change", "update", "edit", "set"]);

    const lastAssistantMessage = Array.isArray(history)
      ? [...history].reverse().find((msg) => msg?.role === "assistant" && typeof msg?.content === "string")
      : null;
    const awaitingProfileName = lastAssistantMessage?.content
      ? /what name should i set|profile name/i.test(lastAssistantMessage.content)
      : false;

    const profileName = profileIntent ? extractProfileName(queryText) : null;
    if (awaitingProfileName && queryText) {
      return new Response(
        JSON.stringify({
          response: `Got it. I can update your profile name to "${queryText}". Please confirm.`,
          action: {
            type: "profile_update",
            data: {
              full_name: queryText,
            },
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (profileIntent) {
      if (!profileName) {
        return new Response(
          JSON.stringify({
            response: "Sure — what name should I set for your profile?",
            action: null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          response: `Got it. I can update your profile name to "${profileName}". Please confirm.`,
          action: {
            type: "profile_update",
            data: {
              full_name: profileName,
            },
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const queryAndHistoryText = history && Array.isArray(history) 
      ? history.slice(-3).map((m: any) => String(m.content || "")).join(" ").toLowerCase() + " " + normalizedQuery
      : normalizedQuery;

    const noteIntent = containsAny(queryAndHistoryText, noteKeywords);
    const eventIntent = containsAny(queryAndHistoryText, eventKeywords);
    const marketplaceIntent = containsAny(queryAndHistoryText, marketplaceKeywords);
    const lostFoundIntent = containsAny(queryAndHistoryText, lostFoundKeywords);
    const roadmapIntent = containsAny(queryAndHistoryText, roadmapKeywords);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const canSearch = !!supabaseUrl && !!supabaseAnonKey;
    const supabase = canSearch
      ? createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      : null;

    let ragaContext = "";

    if (noteIntent) {
      const searchTerm = getSearchTerm(extractNoteTopic, isGenericNotesQuery);
      if (searchTerm && canSearch && supabase) {
        const { data: notes, error } = await supabase
          .from("notes")
          .select("id,title,subject,semester,type,file_url,author")
          .or(`title.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!error && notes && notes.length > 0) {
          ragaContext += `[Knowledge Database: NOTES matching "${searchTerm}"]\n${notes.map(n => `- Title: ${n.title} (Subject: ${n.subject}, Sem: ${n.semester}, Type: ${n.type}). Link: ${n.file_url}`).join("\n")}\n\n`;
        } else {
          ragaContext += `[Knowledge Database: Attempted to search NOTES for "${searchTerm}" but no results were found. Inform the user gracefully.]\n\n`;
        }
      } else if (!ragaContext.includes("Notes Hub quick help")) {
        ragaContext += `[Knowledge System: The user is making a general inquiry about Notes. Use this info to guide them: \n${moduleHelpText("notes")}]\n\n`;
      }
    }

    if (eventIntent) {
      const searchTerm = getSearchTerm(extractEventTopic, isGenericEventsQuery);
      if (searchTerm && canSearch && supabase) {
        const { data: events, error } = await supabase
          .from("events")
          .select("id,title,date,time,venue,category,status")
          .eq("status", "approved")
          .or(`title.ilike.%${searchTerm}%,venue.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
          .order("date", { ascending: true })
          .limit(5);

        if (!error && events && events.length > 0) {
          ragaContext += `[Knowledge Database: EVENTS matching "${searchTerm}"]\n${events.map(e => `- Title: ${e.title} (At: ${e.venue} on ${e.date} ${e.time}). Open URL: /events/${e.id}`).join("\n")}\n\n`;
        } else {
          ragaContext += `[Knowledge Database: Attempted to search EVENTS for "${searchTerm}" but no results were found.]\n\n`;
        }
      } else if (!ragaContext.includes("Events quick help")) {
        ragaContext += `[Knowledge System: The user is making a general inquiry about Events. Use this info to guide them: \n${moduleHelpText("events")}]\n\n`;
      }
    }

    if (marketplaceIntent) {
      const searchTerm = getSearchTerm(extractMarketplaceTopic, isGenericMarketplaceQuery);
      if (searchTerm && canSearch && supabase) {
        const { data: items, error } = await supabase
          .from("marketplace_items")
          .select("id,title,price,category,status")
          .eq("status", "approved")
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
          .order("created_at", { ascending: false })
          .limit(5);
        
        if (!error && items && items.length > 0) {
          ragaContext += `[Knowledge Database: MARKETPLACE listings matching "${searchTerm}"]\n${items.map(i => `- Title: ${i.title} for ${i.price} (Category: ${i.category}). Open URL: /marketplace/${i.id}`).join("\n")}\n\n`;
        } else {
          ragaContext += `[Knowledge Database: Attempted to search MARKETPLACE for "${searchTerm}" but no results were found.]\n\n`;
        }
      } else if (!ragaContext.includes("Marketplace quick help")) {
        ragaContext += `[Knowledge System: The user is making a general inquiry about Marketplace. Use this info to guide them: \n${moduleHelpText("marketplace")}]\n\n`;
      }
    }

    if (lostFoundIntent) {
      const searchTerm = getSearchTerm(extractLostFoundTopic, isGenericLostFoundQuery);
      if (searchTerm && canSearch && supabase) {
        const { data: items, error } = await supabase
          .from("lost_found_items")
          .select("id,title,type,category,location,status")
          .eq("status", "open")
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
          .order("created_at", { ascending: false })
          .limit(5);
          
        if (!error && items && items.length > 0) {
          ragaContext += `[Knowledge Database: LOST&FOUND matching "${searchTerm}"]\n${items.map(i => `- Title: ${i.title} (${i.type} at ${i.location}). Open URL: /lost-and-found/${i.id}`).join("\n")}\n\n`;
        } else {
          ragaContext += `[Knowledge Database: Attempted to search LOST&FOUND for "${searchTerm}" but no results were found.]\n\n`;
        }
      } else if (!ragaContext.includes("Lost & Found quick help")) {
        ragaContext += `[Knowledge System: The user is making a general inquiry about Lost & Found. Use this info to guide them: \n${moduleHelpText("lost_found")}]\n\n`;
      }
    }

    if (roadmapIntent) {
      const searchTerm = getSearchTerm(extractRoadmapTopic, isGenericRoadmapQuery);
      if (searchTerm && canSearch && supabase) {
        const { data: roadmaps, error } = await supabase
          .from("roadmaps")
          .select("id,title,slug,difficulty,estimated_time")
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .order("created_at", { ascending: false })
          .limit(5);
          
        if (!error && roadmaps && roadmaps.length > 0) {
          ragaContext += `[Knowledge Database: ROADMAPS matching "${searchTerm}"]\n${roadmaps.map(r => `- Title: ${r.title} (Difficulty: ${r.difficulty}, Time: ${r.estimated_time}). Open URL: /roadmap/${r.slug}`).join("\n")}\n\n`;
        } else {
          ragaContext += `[Knowledge Database: Attempted to search ROADMAPS for "${searchTerm}" but no results were found.]\n\n`;
        }
      } else if (!ragaContext.includes("Roadmaps quick help")) {
        ragaContext += `[Knowledge System: The user is making a general inquiry about Roadmaps. Use this info to guide them: \n${moduleHelpText("roadmaps")}]\n\n`;
      }
    }

    if (helpIntent && !ragaContext) {
      const contextual = contextualHelpText(contextPath);
      if (contextual) {
        ragaContext += `[Knowledge System: The user is asking for help while currently viewing: ${contextual}]\n\n`;
      } else {
        const helpModule = moduleIntent || contextModule;
        ragaContext += `[Knowledge System: Quick Help Guide: \n${moduleHelpText(helpModule || "general")}]\n\n`;
      }
    }

    // We securely retrieve the HuggingFace API Key stored in Supabase secrets
    const HUGGINGFACE_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY')
    if (!HUGGINGFACE_API_KEY) {
      throw new Error("Missing HUGGINGFACE_API_KEY environment variable")
    }

    // Format history for the HF Chat Completions API
    const messages = [
      {
        role: "system",
        content: `You are "Campus AI", the professional assistant for "Campulsy", a modern student platform. 
${ragaContext ? `\n--- KNOWLEDGE BASE ---\nI have securely searched the database on behalf of the user. Use the following context to answer their query. \n${ragaContext}\n--- END KNOWLEDGE BASE ---\n\nIMPORTANT: ALWAYS use markdown formatting to provide the Open URLs or links exactly as they appear in the Knowledge Base above.` : ""}
You ONLY know and support the features listed below. Do not invent features, policies, or services.

Campulsy features:
1. Notes Hub: share and access notes and PYQs.
2. Events: discover campus events and RSVP/register.
3. Marketplace: buy/sell items, make offers, manage listings.
4. Lost & Found: report and recover lost items.
5. Roadmaps: discover structured learning and career paths for different skills.
6. Earn/Tasks: complete tasks to earn rewards.
7. Community: campus posts and discussions.
8. Inbox/Chat: direct messaging for coordination and negotiations.
9. Room Finder: browse rooms and view details.
10. Profile & Settings: manage personal details, academic info, professional links, avatar, and bio.

Safety & behavior rules:
- Never claim external services (healthcare, tutoring, library, payments, real money transfers) unless explicitly supported above.
- Never use the name "Campus Connect Hub". Always use "Campulsy".
- If a Knowledge Base is provided above, use it to accurately present data to the user conversationally.
- Do NOT invent file names, sizes, or availability. Only share links if they were provided in the Knowledge Base or by the system/user.
- If asked about unsupported features, politely redirect to what Campulsy does offer.
- Do NOT ask the user to respond with numbers or select from menus. Ask plain-language questions.
- Do NOT instruct users to respond with JSON or any special format. Ask normally.
- Be concise, professional, and user-friendly. Use short paragraphs and plain language.
- If a context path is provided, use it to give page-specific help.

Action format (IMPORTANT):
- If the user asks to EDIT THEIR PROFILE, return a JSON object ONLY, with this shape:
{
  "message": "text to show the user",
  "action": {
    "type": "profile_update",
    "data": {
      "full_name": "...",
      "college": "...",
      "branch": "...",
      "semester": "...",
      "avatar_url": "...",
      "bio": "...",
      "skills": "...",
      "linkedin": "...",
      "github": "...",
      "portfolio": "...",
      "resume_link": "..."
    }
  }
}

Rules for profile updates:
- Only include fields the user explicitly asked to change.
- If the user wants to clear a field, set it to an empty string.
- Never guess or fabricate values.
- If you need clarification, ask a follow-up question (without an action).
`
      }
    ];

    if (history && Array.isArray(history)) {
      history.forEach((msg) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          // Don't push intro to avoid HF strict pattern errors, we use system prompt instead
          if (msg.id !== 'intro') {
            messages.push({ role: msg.role, content: msg.content });
          }
        }
      });
    }

    const MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

    // Using the NEW HuggingFace Inference provider endpoint
    const response = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HF Error:", errorText);
      throw new Error(`HuggingFace API Error: ${response.status}`);
    }

    const result = await response.json();
    let generatedText = result.choices?.[0]?.message?.content || "I'm not sure how to respond to that.";

    const allowedProfileFields = new Set([
      "full_name",
      "college",
      "branch",
      "semester",
      "avatar_url",
      "bio",
      "skills",
      "linkedin",
      "github",
      "portfolio",
      "resume_link",
    ]);

    const sanitizeProfileAction = (action: any) => {
      if (!action || action.type !== "profile_update" || typeof action.data !== "object") {
        return null;
      }

      const cleaned: Record<string, string> = {};
      for (const [key, value] of Object.entries(action.data)) {
        if (!allowedProfileFields.has(key)) continue;
        if (typeof value !== "string") continue;
        cleaned[key] = value.trim();
      }

      if (Object.keys(cleaned).length === 0) return null;
      return { type: "profile_update", data: cleaned };
    };

    let responseText = generatedText.trim();
    let action: any = null;

    try {
      const parsed = JSON.parse(generatedText);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.message === "string") {
          responseText = parsed.message.trim();
        }
        action = sanitizeProfileAction(parsed.action);
      }
    } catch (_e) {
      const codeBlockMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (codeBlockMatch) {
        try {
          const parsed = JSON.parse(codeBlockMatch[1]);
          if (parsed && typeof parsed === "object") {
            if (typeof parsed.message === "string") {
              responseText = parsed.message.trim();
            }
            action = sanitizeProfileAction(parsed.action);
          }
        } catch (_err) {
          // Ignore parse errors; fall back to plain text response
        }
      }
    }

    return new Response(
      JSON.stringify({ response: responseText, action }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
