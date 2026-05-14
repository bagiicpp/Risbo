import { Plus, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface Props {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  loading: boolean;
}

export default function ChatInput({ input, setInput, onSend, loading }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea based on content length
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="w-full flex flex-col bg-card rounded-2xl border border-border shadow-sm focus-within:ring-1 focus-within:ring-primary transition-all p-3">
      {/* Tall Text Area */}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="Message Risbo... Try asking for code, writing, or training advice."
        className="w-full min-h-[80px] max-h-[200px] resize-none bg-transparent border-none outline-none focus:ring-0 text-base placeholder:text-muted-foreground p-1 leading-relaxed"
      />

      {/* Bottom Tool Row */}
      <div className="flex items-center justify-between mt-2 pt-2">
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted">
          <span>Risbo v1.0</span>
          <span className="text-[10px] opacity-70">▼</span>
        </div>
      </div>
    </div>
  );
}
