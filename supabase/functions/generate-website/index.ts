import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are an expert web developer. Generate a SIMPLE, CONCISE website.

RESPOND WITH ONLY THIS JSON FORMAT (no markdown):
{"html":"<body content>","css":"<styles>","js":"<script>","description":"Brief description"}

RULES:
- Keep code MINIMAL and CLEAN - avoid excessive sections
- HTML: semantic, body content only (no html/head/body tags)
- CSS: modern with flexbox/grid, CSS variables, @import for Google Fonts
- JS: vanilla, minimal, functional
- Make it visually appealing but CONCISE
- Maximum 3-4 sections for any website
- Use placeholder images from picsum.photos`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating website for prompt:", prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a simple website: ${prompt}. Keep it concise with 3-4 sections max.` },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate website. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Raw AI response:", content.substring(0, 500));

    // Try to parse the JSON response
    let parsedContent;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      
      // Try to extract individual fields from truncated JSON
      const htmlMatch = content.match(/"html"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
      const cssMatch = content.match(/"css"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
      const jsMatch = content.match(/"js"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
      
      // Also try code block format
      const htmlBlockMatch = content.match(/```html\n?([\s\S]*?)```/);
      const cssBlockMatch = content.match(/```css\n?([\s\S]*?)```/);
      const jsBlockMatch = content.match(/```(?:javascript|js)\n?([\s\S]*?)```/);

      const extractedHtml = htmlMatch?.[1] || htmlBlockMatch?.[1] || "";
      const extractedCss = cssMatch?.[1] || cssBlockMatch?.[1] || "";
      const extractedJs = jsMatch?.[1] || jsBlockMatch?.[1] || "";

      if (extractedHtml || extractedCss) {
        // Unescape the JSON string content
        const unescape = (str: string) => str.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        parsedContent = {
          html: unescape(extractedHtml.trim()),
          css: unescape(extractedCss.trim()),
          js: unescape(extractedJs.trim()),
          description: "Generated website",
        };
      } else {
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const result = {
      html: parsedContent.html || "",
      css: parsedContent.css || "",
      js: parsedContent.js || "",
      description: parsedContent.description || "Website generated successfully",
    };

    console.log("Successfully generated website:", result.description);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-website function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
