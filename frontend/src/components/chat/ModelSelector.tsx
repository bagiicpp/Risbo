import { useState } from "react";
import { Sparkles, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModelSelector() {
  const [selectedModel, setSelectedModel] = useState("Risbo: Kinetic-v1");

  const availableModels = [
    { id: "kinetic-v1", name: "Risbo: Kinetic-v1" },
    { id: "lumina-pro", name: "Risbo: Lumina Pro" },
    { id: "nexus-lite", name: "Risbo: Nexus Lite" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Added focus:outline-none to prevent the focus ring issue from earlier */}
        <button className="flex items-center gap-2 px-3 py-1.5 ml-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors text-sm font-mono cursor-pointer focus:outline-none focus:ring-0">
          <Sparkles size={16} className="text-primary/70 shrink-0" />
          <span className="font-bricolage truncate">{selectedModel}</span>
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

        {availableModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => setSelectedModel(model.name)}
            className="flex items-center justify-between cursor-pointer hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100"
          >
            <span className="font-bricolage">{model.name}</span>
            {selectedModel === model.name && (
              <Check size={14} className="text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
