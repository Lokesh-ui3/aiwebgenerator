import { motion } from "framer-motion";
import { Sparkles, Github, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-button">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold gradient-text">WebGen AI</h1>
          <p className="text-xs text-muted-foreground">AI Website Generator</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <FileText className="w-4 h-4" />
          Docs
        </Button>
        <Button variant="glass" size="sm" className="gap-2">
          <Github className="w-4 h-4" />
          Source
        </Button>
      </div>
    </motion.header>
  );
}
