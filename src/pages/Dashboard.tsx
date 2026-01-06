import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportWebsite } from "@/lib/exportWebsite";
import {
  Sparkles,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  Calendar,
  ArrowLeft,
} from "lucide-react";

interface SavedWebsite {
  id: string;
  name: string;
  prompt: string;
  html: string;
  css: string;
  js: string;
  created_at: string;
}

export default function Dashboard() {
  const [websites, setWebsites] = useState<SavedWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchWebsites();
    }
  }, [user]);

  const fetchWebsites = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_websites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWebsites(data || []);
    } catch (error) {
      console.error("Error fetching websites:", error);
      toast.error("Failed to load websites");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("saved_websites")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setWebsites((prev) => prev.filter((w) => w.id !== id));
      toast.success("Website deleted");
    } catch (error) {
      console.error("Error deleting website:", error);
      toast.error("Failed to delete website");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async (website: SavedWebsite) => {
    try {
      await exportWebsite({
        html: website.html,
        css: website.css,
        js: website.js,
        name: website.name.toLowerCase().replace(/\s+/g, "-"),
      });
      toast.success("Website exported!");
    } catch (error) {
      console.error("Error exporting website:", error);
      toast.error("Failed to export website");
    }
  };

  const handlePreview = (website: SavedWebsite) => {
    // Open preview in new window
    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${website.name}</title>
  <style>${website.css}</style>
</head>
<body>
  ${website.html}
  <script>${website.js}</script>
</body>
</html>`;
      previewWindow.document.write(fullHtml);
      previewWindow.document.close();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                My Websites
              </span>
            </div>
          </div>

          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {websites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No websites yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Create your first AI-generated website to get started
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Website
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((website, index) => (
              <motion.div
                key={website.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group"
              >
                {/* Preview thumbnail */}
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <iframe
                    srcDoc={`<!DOCTYPE html><html><head><style>body{margin:0;transform:scale(0.25);transform-origin:0 0;width:400%;height:400%;}${website.css}</style></head><body>${website.html}</body></html>`}
                    className="w-full h-full pointer-events-none"
                    title={website.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePreview(website)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 truncate">
                    {website.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {website.prompt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(website.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExport(website)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(website.id)}
                        disabled={deletingId === website.id}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {deletingId === website.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
