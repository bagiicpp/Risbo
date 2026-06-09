import { Sparkles, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
  className?: string;
}

export const AVAILABLE_MODELS = [
  { id: "gemma-4-26b-a4b-it", name: "Risbo Standard (26B)" },
  { id: "gemma-4-31b-it", name: "The Great Foča (31B)" },
  { id: "gemini-3.1-flash-lite", name: "Risbo Fast (Flash)" },
];

export function ModelSelector({
  selectedModelId,
  onModelSelect,
  className,
}: ModelSelectorProps) {
  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) ||
    AVAILABLE_MODELS[2];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors text-sm font-mono cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0",
            className,
          )}
        >
          <Sparkles size={14} className="text-primary/70 shrink-0" />
          {/* Responsive max-width restricts expansion and forces truncation */}
          <span className="font-bricolage truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[160px]">
            {currentModel.name}
          </span>
          <ChevronDown size={14} className="opacity-50 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-56 border-border shadow-lg"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Select Model
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border/50" />

        {AVAILABLE_MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelSelect(model.id)}
            className="flex items-center justify-between cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground"
          >
            <span className="font-bricolage text-sm">{model.name}</span>
            {selectedModelId === model.id && (
              <Check size={14} className="text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
