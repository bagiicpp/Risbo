import { Sparkles, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModelSelectorProps {
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
}

export const AVAILABLE_MODELS = [
  { id: "gemma-4-26b-a4b-it", name: "Risbo Standard (26B)" },
  { id: "gemma-4-31b-a4b-it", name: "The Great Foča(31B)" },
  { id: "gemini-3.1-flash-lite", name: "Risbo Fast (Flash)" },
];

export function ModelSelector({
  selectedModelId,
  onModelSelect,
}: ModelSelectorProps) {
  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) ||
    AVAILABLE_MODELS[2];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Replaced fixed zinc colors with semantic foreground/accent classes */}
        <button className="flex items-center gap-2 px-3 py-1.5 ml-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors text-sm font-mono cursor-pointer focus:outline-none focus:ring-0">
          <Sparkles size={16} className="text-primary/70 shrink-0" />
          <span className="font-bricolage truncate">{currentModel.name}</span>
          <ChevronDown size={14} className="opacity-50 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        // Removed hardcoded bg-zinc-950 and border-zinc-800.
        // shadcn's base components handle their own theme backgrounds natively.
        className="w-56 border-border shadow-lg"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Select Model
        </DropdownMenuLabel>

        {/* Replaced bg-zinc-800 with standard border color */}
        <DropdownMenuSeparator className="bg-border/50" />

        {AVAILABLE_MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelSelect(model.id)}
            // Standardized hover/focus states to use semantic accent variables
            className="flex items-center justify-between cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground"
          >
            <span className="font-bricolage">{model.name}</span>
            {selectedModelId === model.id && (
              <Check size={14} className="text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
