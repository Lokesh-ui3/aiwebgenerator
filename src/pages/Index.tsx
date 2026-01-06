import { useState } from "react";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { ChatInterface } from "@/components/ChatInterface";
import { PreviewPanel } from "@/components/PreviewPanel";
import { exportWebsite } from "@/lib/exportWebsite";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface GeneratedCode {
  html: string;
  css: string;
  js: string;
}

interface CurrentPrompt {
  text: string;
}

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>({
    html: "",
    css: "",
    js: "",
  });
  const [currentPrompt, setCurrentPrompt] = useState<CurrentPrompt | null>(null);
  const { user } = useAuth();

  const handleGenerate = async (prompt: string) => {
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentPrompt({ text: prompt });

    try {
      const { data, error } = await supabase.functions.invoke("generate-website", {
        body: { prompt },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Failed to generate website");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Update generated code
      setGeneratedCode({
        html: data.html || "",
        css: data.css || "",
        js: data.js || "",
      });

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.description || "I've generated your website! Check out the preview on the right. You can switch between the live preview and code view, test different screen sizes, and export the files when you're ready.",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      toast.success("Website generated successfully!");
    } catch (error) {
      console.error("Error generating website:", error);
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: error instanceof Error 
          ? `Sorry, I encountered an error: ${error.message}. Please try again.`
          : "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);

      toast.error(error instanceof Error ? error.message : "Failed to generate website");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportWebsite({
        html: generatedCode.html,
        css: generatedCode.css,
        js: generatedCode.js,
        name: "my-website",
      });
      toast.success("Website exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export website");
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save websites");
      return;
    }

    if (!generatedCode.html && !generatedCode.css) {
      toast.error("No website to save");
      return;
    }

    try {
      const websiteName = currentPrompt?.text.slice(0, 50) || "My Website";
      
      const { error } = await supabase.from("saved_websites").insert({
        user_id: user.id,
        name: websiteName,
        prompt: currentPrompt?.text || "",
        html: generatedCode.html,
        css: generatedCode.css,
        js: generatedCode.js,
      });

      if (error) throw error;

      toast.success("Website saved to dashboard!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save website");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Toaster position="top-center" theme="dark" />
      <Header />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full md:w-[400px] lg:w-[450px] border-r border-border flex-shrink-0"
        >
          <ChatInterface
            onGenerate={handleGenerate}
            isLoading={isLoading}
            messages={messages}
          />
        </motion.div>

        {/* Preview Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 hidden md:block"
        >
          <PreviewPanel
            html={generatedCode.html}
            css={generatedCode.css}
            js={generatedCode.js}
            onExport={handleExport}
            onSave={handleSave}
            canSave={!!user && !!(generatedCode.html || generatedCode.css)}
          />
        </motion.div>
      </main>

      {/* Mobile Preview Toggle (visible on small screens) */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Mobile preview would go here - keeping it simple for now */}
        </motion.div>
      </div>
    </div>
  );
}
