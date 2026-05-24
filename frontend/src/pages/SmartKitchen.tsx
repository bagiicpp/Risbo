import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Plus,
  X,
  Target,
  ArrowLeft,
  UploadCloud,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Flame,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import api from "@/lib/api";

// --- Types ---
interface PantryItem {
  _id: string;
  item_name: string;
  quantity?: string;
}

interface RecipeOutput {
  title: string;
  prep_time_minutes: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
  ingredients: string[];
  instructions: string[];
}

export default function SmartKitchen() {
  const navigate = useNavigate();

  // --- Pantry State ---
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [isPantryLoading, setIsPantryLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // --- Generator State ---
  const [targetProtein, setTargetProtein] = useState("");
  const [targetCarbs, setTargetCarbs] = useState("");
  const [specificIngredients, setSpecificIngredients] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState<RecipeOutput | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPantry = async () => {
    try {
      const response = await api.get("/kitchen/pantry");
      setPantry(response.data);
    } catch (error) {
      toast.error("Failed to load inventory");
    } finally {
      setIsPantryLoading(false);
    }
  };

  useEffect(() => {
    fetchPantry();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setIsAdding(true);
    try {
      await api.post("/kitchen/pantry", { item_name: newItem.trim() });
      setNewItem("");
      await fetchPantry();
    } catch (error) {
      toast.error("Failed to add item");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    const previousPantry = [...pantry];
    setPantry((prev) => prev.filter((item) => item._id !== id));
    try {
      await api.delete(`/kitchen/pantry/${id}`);
      toast.success(`${name} removed`);
    } catch (error) {
      setPantry(previousPantry);
      toast.error(`Failed to remove ${name}`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setRecipe(null);

    try {
      // Must use FormData because we are sending a file alongside text
      const formData = new FormData();
      if (imageFile) formData.append("image", imageFile);
      if (specificIngredients)
        formData.append("text_ingredients", specificIngredients);
      if (targetProtein) formData.append("target_protein", targetProtein);
      if (targetCarbs) formData.append("target_carbs", targetCarbs);

      const response = await api.post("/kitchen/generate", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setRecipe(response.data);
      toast.success("Protocol generated successfully!");
    } catch (error) {
      console.error("Generation failed:", error);
      toast.error(
        "Failed to generate protocol. Please check your AI backend connection.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-dmsans">
      <main className="flex-1 flex flex-col p-6 lg:p-10 h-full overflow-hidden">
        {/* Navigation Button */}
        <button
          onClick={() => navigate("/chat")}
          className="flex items-center cursor-pointer gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 px-2 py-1.5 -ml-2 rounded-md transition-colors w-fit mb-6 outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
        >
          <ArrowLeft size={16} />
          Home
        </button>

        {/* Header */}
        <header className="mb-8 shrink-0">
          <h1 className="text-3xl font-bold font-bricolage tracking-tight">
            Smart Kitchen
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
            Manage your active inventory and generate macro-optimized protocols
            based on your physical constraints.
          </p>
        </header>

        {/* Core Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* ==========================================
              LEFT COLUMN: PANTRY MANAGER (4/12)
              ========================================== */}
          <section className="lg:col-span-4 flex flex-col bg-accent/20 border border-border/50 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border/50 bg-background/50 shrink-0">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-4">
                Active Inventory
              </h2>
              <form onSubmit={handleAddItem} className="relative">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add staple (e.g., Rice, Whey)..."
                  disabled={isAdding}
                  className="w-full bg-background border border-border/60 rounded-lg pl-3 pr-10 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isAdding || !newItem.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isAdding ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isPantryLoading ? (
                <div className="flex justify-center py-10 text-muted-foreground">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : pantry.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  No items in your inventory. Add staples above.
                </div>
              ) : (
                pantry.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between group bg-background border border-border/40 px-3 py-2 rounded-md hover:border-border transition-colors"
                  >
                    <span className="text-sm font-medium">
                      {item.item_name}
                    </span>
                    <button
                      onClick={() => handleDeleteItem(item._id, item.item_name)}
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all cursor-pointer p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ==========================================
              RIGHT COLUMN: GENERATOR ENGINE (8/12)
              ========================================== */}
          <section className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-2">
            {/* --- CONFIGURATION FORM --- */}
            <div className="bg-accent/20 border border-border/50 rounded-xl p-6 shadow-sm shrink-0">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-6 flex items-center gap-2">
                <Target size={16} />
                Protocol Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Macros */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Target Protein (g)
                    </label>
                    <input
                      type="number"
                      value={targetProtein}
                      onChange={(e) => setTargetProtein(e.target.value)}
                      placeholder="e.g., 50"
                      className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Target Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={targetCarbs}
                      onChange={(e) => setTargetCarbs(e.target.value)}
                      placeholder="e.g., 60"
                      className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Specific Ingredients / Cravings
                    </label>
                    <input
                      type="text"
                      value={specificIngredients}
                      onChange={(e) => setSpecificIngredients(e.target.value)}
                      placeholder="e.g., Use the leftover salmon"
                      className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                {/* Fridge Dropzone */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Fridge / Ingredient Scan
                  </label>
                  <div
                    className="relative w-full h-[188px] bg-background border-2 border-dashed border-border/60 hover:border-primary/50 rounded-lg flex flex-col items-center justify-center transition-colors overflow-hidden group cursor-pointer"
                    onClick={() =>
                      !imagePreview && fileInputRef.current?.click()
                    }
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Fridge scan"
                          className="absolute inset-0 w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearImage();
                            }}
                            className="bg-destructive/90 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 hover:bg-destructive transition-colors cursor-pointer"
                          >
                            <X size={14} /> Clear Image
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2 group-hover:text-primary transition-colors" />
                        <span className="text-sm font-medium text-foreground block">
                          Upload Photo
                        </span>
                        <span className="text-xs text-muted-foreground block mt-1">
                          PNG, JPG up to 5MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={
                  isGenerating ||
                  (!targetProtein && !specificIngredients && !imageFile)
                }
                className="w-full bg-primary text-primary-foreground font-medium rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {isGenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Zap size={16} />
                )}
                {isGenerating
                  ? "Analyzing constraints & compiling protocol..."
                  : "Generate Protocol"}
              </button>
            </div>

            {/* --- OUTPUT CONSOLE --- */}
            {isGenerating && (
              <div className="bg-background border border-border/50 rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground animate-pulse shadow-sm h-64">
                <Loader2 size={32} className="animate-spin mb-4 text-primary" />
                <p className="font-mono text-xs tracking-wider uppercase">
                  Executing AI Backend Routing...
                </p>
                <p className="font-mono text-xs tracking-wider uppercase opacity-50 mt-1">
                  Cross-referencing active inventory...
                </p>
              </div>
            )}

            {recipe && !isGenerating && (
              <div className="bg-background border border-border/50 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-start mb-6 border-b border-border/50 pb-4">
                  <div>
                    <h3 className="text-2xl font-bold font-bricolage text-foreground">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} /> {recipe.prep_time_minutes} min prep
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Flame size={14} /> {recipe.macros.calories} kcal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Ingredients & Macros */}
                  <div className="md:col-span-5 space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-3 flex items-center gap-2">
                        <Target size={14} /> Macronutrient Profile
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-accent/30 border border-border/50 rounded-md py-2">
                          <div className="text-lg font-mono font-bold text-foreground">
                            {recipe.macros.protein}g
                          </div>
                          <div className="text-[10px] uppercase text-muted-foreground">
                            Protein
                          </div>
                        </div>
                        <div className="bg-accent/30 border border-border/50 rounded-md py-2">
                          <div className="text-lg font-mono font-bold text-foreground">
                            {recipe.macros.carbs}g
                          </div>
                          <div className="text-[10px] uppercase text-muted-foreground">
                            Carbs
                          </div>
                        </div>
                        <div className="bg-accent/30 border border-border/50 rounded-md py-2">
                          <div className="text-lg font-mono font-bold text-foreground">
                            {recipe.macros.fats}g
                          </div>
                          <div className="text-[10px] uppercase text-muted-foreground">
                            Fats
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-3">
                        Required Materials
                      </h4>
                      <ul className="space-y-2">
                        {recipe.ingredients.map((ing, idx) => (
                          <li
                            key={idx}
                            className="text-sm flex items-start gap-2"
                          >
                            <CheckCircle2
                              size={14}
                              className="text-primary shrink-0 mt-0.5"
                            />
                            <span className="text-foreground/90">{ing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Execution Steps */}
                  <div className="md:col-span-7">
                    <h4 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-3">
                      Execution Protocol
                    </h4>
                    <ol className="space-y-4">
                      {recipe.instructions.map((step, idx) => (
                        <li
                          key={idx}
                          className="text-sm flex items-start gap-3"
                        >
                          <span className="flex items-center justify-center bg-accent text-muted-foreground font-mono font-bold text-xs rounded-full min-w-6 h-6 shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-foreground/90 leading-relaxed">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
