import { Send, Loader2, Plus, FileText, X, Mic } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { ModelSelector } from "./ModelSelector";

interface ChatInputProps {
  input: string;
  setInput: (value: React.SetStateAction<string>) => void;
  onSend: () => void;
  loading: boolean;
  onUpload: (file: File) => void;
  isUploading: boolean;
  activeConversationId: string | null;
  uploadedFile?: File | null;
  onClearFile?: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  loading,
  onUpload,
  isUploading,
  activeConversationId,
  uploadedFile,
  onClearFile,
  selectedModel,
  setSelectedModel,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const originalInputRef = useRef<string>("");

  // FIX: Removed the layout-thrashing useEffect for auto-resize.
  // It is now handled directly in the onChange event below.

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }

          const base = originalInputRef.current;
          const separator = base && !base.endsWith(" ") ? " " : "";

          setInput(base + separator + currentTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, [setInput]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      originalInputRef.current = input;
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || uploadedFile) {
        onSend();

        // Reset height on send
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex gap-2 mb-3 px-2 overflow-x-auto pb-1 no-scrollbar">
        {/* We will populate this in Phase 2 */}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative w-full bg-card border border-border/50 rounded-2xl shadow-lg transition-all duration-300 flex flex-col"
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.pdf,.docx,.md,.csv"
        />

        <div className="p-4 pb-2">
          {isDragging ? (
            <div className="h-24 flex flex-col items-center justify-center text-primary font-dmsans border-2 border-dashed border-primary/30 rounded-xl bg-primary/10">
              <FileText size={24} className="mb-2 opacity-80" />
              <span className="font-medium">Drop file to analyze</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // FIX: Performant auto-resize directly in the DOM event handler
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Query the system or detail your workout parameters..."
              className="w-full bg-transparent border-0 resize-none outline-none text-foreground placeholder:text-muted-foreground font-dmsans text-base leading-relaxed min-h-[60px]"
              rows={1}
            />
          )}
        </div>

        {uploadedFile && !isDragging && (
          <div className="px-4 pb-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary rounded-lg px-3 py-1.5 text-sm font-dmsans">
              <FileText size={14} />
              <span className="truncate max-w-[200px]">
                {uploadedFile.name}
              </span>
              {onClearFile && (
                <button
                  onClick={onClearFile}
                  className="hover:text-primary-foreground hover:bg-primary rounded-full p-0.5 transition-colors ml-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-2 pl-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload File"
            >
              <Plus size={20} />
            </button>

            <ModelSelector
              selectedModelId={selectedModel}
              onModelSelect={setSelectedModel}
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2.5 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 outline-none ${
                isRecording
                  ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(34,197,94,0.2)] animate-pulse"
                  : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Voice Typing"
            >
              <Mic size={18} />
            </button>

            <button
              type="button"
              onClick={onSend}
              disabled={(!input.trim() && !uploadedFile) || loading}
              className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center shrink-0 ${
                input.trim() || uploadedFile
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:scale-105"
                  : "bg-transparent text-muted-foreground/50 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
