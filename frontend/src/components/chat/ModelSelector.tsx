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
  { id: "gemma-4-31b-a4b-it", name: "Risbo Thinker (31B)" },
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
        <button className="flex items-center gap-2 px-3 py-1.5 ml-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors text-sm font-mono cursor-pointer focus:outline-none focus:ring-0">
          <Sparkles size={16} className="text-primary/70 shrink-0" />
          <span className="font-bricolage truncate">{currentModel.name}</span>
          <ChevronDown size={14} className="opacity-50 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-56 bg-zinc-950 border-zinc-800 text-zinc-300"
      >
        <DropdownMenuLabel className="text-xs text-zinc-500 font-normal">
          Select Model
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />

        {AVAILABLE_MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelSelect(model.id)}
            className="flex items-center justify-between cursor-pointer hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100"
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
