import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Tablet, Smartphone, Code, Eye, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PreviewPanelProps {
  html: string;
  css: string;
  js: string;
  onExport: () => void;
}

type ViewportSize = "desktop" | "tablet" | "mobile";
type ViewMode = "preview" | "code";

const viewportSizes: Record<ViewportSize, { width: string; icon: React.ReactNode }> = {
  desktop: { width: "100%", icon: <Monitor className="w-4 h-4" /> },
  tablet: { width: "768px", icon: <Tablet className="w-4 h-4" /> },
  mobile: { width: "375px", icon: <Smartphone className="w-4 h-4" /> },
};

export function PreviewPanel({ html, css, js, onExport }: PreviewPanelProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}</script>
</body>
</html>
  `.trim();

  const handleCopy = async (code: string, tab: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedTab(tab);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const hasContent = html.trim() !== "" || css.trim() !== "" || js.trim() !== "";

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("preview")}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button
            variant={viewMode === "code" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("code")}
            className="gap-2"
          >
            <Code className="w-4 h-4" />
            Code
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "preview" && (
            <div className="flex items-center gap-1 glass rounded-lg p-1">
              {(Object.keys(viewportSizes) as ViewportSize[]).map((size) => (
                <Button
                  key={size}
                  variant={viewport === size ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewport(size)}
                >
                  {viewportSizes[size].icon}
                </Button>
              ))}
            </div>
          )}

          <Button
            variant="hero"
            size="sm"
            onClick={onExport}
            disabled={!hasContent}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden p-4">
        <AnimatePresence mode="wait">
          {!hasContent ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center"
            >
              <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                <Code className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Preview Yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Describe the website you want to create in the chat, and the preview will appear here.
              </p>
            </motion.div>
          ) : viewMode === "preview" ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex justify-center"
            >
              <div
                className={cn(
                  "h-full bg-background rounded-lg overflow-hidden border border-border shadow-card transition-all duration-300",
                  viewport === "desktop" && "w-full",
                  viewport === "tablet" && "w-[768px]",
                  viewport === "mobile" && "w-[375px]"
                )}
              >
                <iframe
                  srcDoc={fullHtml}
                  className="w-full h-full bg-background"
                  title="Website Preview"
                  sandbox="allow-scripts"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <Tabs defaultValue="html" className="h-full flex flex-col">
                <TabsList className="glass w-fit mb-4">
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="css">CSS</TabsTrigger>
                  <TabsTrigger value="js">JavaScript</TabsTrigger>
                </TabsList>

                {["html", "css", "js"].map((tab) => (
                  <TabsContent
                    key={tab}
                    value={tab}
                    className="flex-1 mt-0 overflow-hidden"
                  >
                    <div className="relative h-full">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 z-10 gap-2"
                        onClick={() => handleCopy(
                          tab === "html" ? html : tab === "css" ? css : js,
                          tab
                        )}
                      >
                        {copiedTab === tab ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                      <pre className="h-full overflow-auto p-4 bg-secondary rounded-lg border border-border text-sm font-mono">
                        <code className="text-foreground">
                          {tab === "html" ? html : tab === "css" ? css : js}
                        </code>
                      </pre>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
