import { useState, useEffect } from "react";
import {
  Loader2,
  Flame,
  Clock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Archive,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface SavedRecipe {
  _id: string;
  title: string;
  prep_time_minutes: number;
  macros: { protein: number; carbs: number; fats: number; calories: number };
  ingredients: string[];
  instructions: string[];
}

export default function VaultView() {
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [isVaultLoading, setIsVaultLoading] = useState(true);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const fetchSavedRecipes = async () => {
    setIsVaultLoading(true);
    try {
      const response = await api.get("/recipes");
      setSavedRecipes(response.data);
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
      toast.error("Failed to load saved protocols.");
    } finally {
      setIsVaultLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  const handleDeleteSavedRecipe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const previousRecipes = [...savedRecipes];
    setSavedRecipes((prev) => prev.filter((r) => r._id !== id));
    try {
      await api.delete(`/recipes/${id}`);
      toast.success("Protocol deleted.");
    } catch (error) {
      setSavedRecipes(previousRecipes);
      toast.error("Failed to delete protocol.");
    }
  };

  const toggleExpandRecipe = (id: string) => {
    setExpandedRecipeId(expandedRecipeId === id ? null : id);
  };

  if (isVaultLoading) {
    return (
      <section className="flex-1 overflow-y-auto bg-accent/10 border border-border/50 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-muted-foreground space-y-4">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm">Decrypting vault protocols...</p>
      </section>
    );
  }

  if (savedRecipes.length === 0) {
    return (
      <section className="flex-1 overflow-y-auto bg-accent/10 border border-border/50 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-muted-foreground space-y-4 animate-in fade-in duration-300">
        <Archive size={48} className="opacity-20" />
        <p className="text-sm font-medium">No saved protocols found.</p>
      </section>
    );
  }

  return (
    <section className="flex-1 overflow-y-auto bg-accent/10 border border-border/50 rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <div className="grid grid-cols-1 gap-4">
        {savedRecipes.map((r) => {
          const isExpanded = expandedRecipeId === r._id;
          return (
            <div
              key={r._id}
              className={`bg-background border border-border/60 rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? "shadow-md border-primary/30" : "shadow-sm hover:border-border"}`}
            >
              <div
                onClick={() => toggleExpandRecipe(r._id)}
                className="p-5 flex items-center justify-between cursor-pointer group hover:bg-accent/20 transition-colors"
              >
                <div className="flex-1 pr-4">
                  <h3 className="font-bricolage font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {r.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Flame size={14} /> {r.macros.calories} kcal
                    </span>
                    <span>•</span>
                    <span className="text-foreground/80">
                      P: {r.macros.protein}g
                    </span>
                    <span className="text-foreground/80">
                      C: {r.macros.carbs}g
                    </span>
                    <span className="text-foreground/80">
                      F: {r.macros.fats}g
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {r.prep_time_minutes}m
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={(e) => handleDeleteSavedRecipe(r._id, e)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="w-8 h-8 flex items-center justify-center bg-accent rounded-full text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 border-t border-border/50 bg-accent/5 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-4">
                      <h4 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-3">
                        Required Materials
                      </h4>
                      <ul className="space-y-2">
                        {r.ingredients.map((ing, idx) => (
                          <li
                            key={idx}
                            className="text-sm flex items-start gap-2"
                          >
                            <CheckCircle2
                              size={14}
                              className="text-primary shrink-0 mt-0.5"
                            />
                            <span className="text-foreground/80">{ing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="md:col-span-8">
                      <h4 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-3">
                        Execution Protocol
                      </h4>
                      <ol className="space-y-4">
                        {r.instructions.map((step, idx) => (
                          <li
                            key={idx}
                            className="text-sm flex items-start gap-3"
                          >
                            <span className="flex items-center justify-center bg-background border border-border text-muted-foreground font-mono font-bold text-xs rounded-full min-w-6 h-6 shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-foreground/80 leading-relaxed">
                              {step}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
