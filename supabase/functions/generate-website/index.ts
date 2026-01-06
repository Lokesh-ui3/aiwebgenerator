import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are an expert web developer AI that generates beautiful, modern, responsive websites. When given a description, you MUST generate complete HTML, CSS, and JavaScript code.

CRITICAL: You MUST respond with ONLY valid JSON in this exact format:
{
  "html": "<your HTML body content here>",
  "css": "<your CSS styles here>",
  "js": "<your JavaScript code here>",
  "description": "Brief description of what you built"
}

Guidelines for generating code:
1. HTML should be semantic and accessible (use proper headings, alt text, ARIA labels)
2. CSS should be modern (use flexbox/grid, CSS variables, smooth transitions)
3. JavaScript should be vanilla JS, clean and well-commented
4. Make designs visually stunning with:
   - Beautiful color schemes (suggest modern palettes)
   - Smooth animations and hover effects
   - Proper spacing and typography
   - Mobile-first responsive design
5. Include realistic placeholder content
6. Use modern fonts from Google Fonts (add the link in CSS as @import)

IMPORTANT: 
- Return ONLY the JSON object, no markdown code blocks
- HTML should be the body content only (no <html>, <head>, or <body> tags)
- CSS should be complete styles
- JS should be functional and error-free
- All code must work together seamlessly`;

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
          { role: "user", content: `Create a website based on this description: ${prompt}` },
        ],
        temperature: 0.7,
        max_tokens: 8000,
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
      
      // Try to extract code blocks from the response
      const htmlMatch = content.match(/```html\n?([\s\S]*?)```/);
      const cssMatch = content.match(/```css\n?([\s\S]*?)```/);
      const jsMatch = content.match(/```(?:javascript|js)\n?([\s\S]*?)```/);

      if (htmlMatch || cssMatch || jsMatch) {
        parsedContent = {
          html: htmlMatch?.[1]?.trim() || "",
          css: cssMatch?.[1]?.trim() || "",
          js: jsMatch?.[1]?.trim() || "",
          description: "Generated website from code blocks",
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
