import { Send, Paperclip, Loader2 } from "lucide-react";
import React, { useRef } from "react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  onUpload: (file: File) => void;
  isUploading: boolean;
  activeConversationId: string | null;
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  loading,
  onUpload,
  isUploading,
  activeConversationId,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative flex items-end w-full bg-card border border-border/50 rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-primary/50 transition-all p-1">
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.pdf,.docx,.md"
      />

      <button
        type="button"
        disabled={isUploading || !activeConversationId}
        onClick={() => fileInputRef.current?.click()}
        className={`p-3 text-muted-foreground hover:text-foreground transition-colors rounded-xl ${
          !activeConversationId || isUploading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        }`}
        title={
          !activeConversationId
            ? "Send a message to start a chat first"
            : "Attach a document"
        }
      >
        {isUploading ? (
          <Loader2 size={20} className="animate-spin text-primary" />
        ) : (
          <Paperclip size={20} />
        )}
      </button>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about hypertrophy, or attach your macro sheet..."
        className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 resize-none outline-none py-3 px-2 text-sm text-foreground placeholder:text-muted-foreground"
        rows={1}
      />

      <button
        type="button"
        onClick={onSend}
        disabled={!input.trim() || loading}
        className="p-3 m-1 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Send size={18} />
        )}
      </button>
    </div>
  );
}
