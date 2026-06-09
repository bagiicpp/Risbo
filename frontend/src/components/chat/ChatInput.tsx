import { Send, Square, Plus, FileText, X, Mic, Globe } from "lucide-react";
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
  enableSearch: boolean;
  setEnableSearch: (v: boolean) => void;
  stopStream: () => void;
}

export default function ChatInput({
  input,
  setInput,
  onSend,
  loading,
  onUpload,
  isUploading,
  uploadedFile,
  onClearFile,
  selectedModel,
  setSelectedModel,
  enableSearch,
  setEnableSearch,
  stopStream,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const originalInputRef = useRef<string>("");

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
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-0">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative w-full bg-card border border-border/50 rounded-2xl shadow-lg transition-all duration-300 flex flex-col focus-within:border-border"
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.pdf,.docx,.md,.csv,image/jpeg,image/png,image/gif,image/webp"
        />

        <div className="p-3 sm:p-4 pb-1">
          {isDragging ? (
            <div className="h-24 flex flex-col items-center justify-center text-primary font-dmsans border-2 border-dashed border-primary/30 rounded-xl bg-primary/10">
              <FileText size={24} className="mb-2 opacity-80" />
              <span className="font-medium text-sm">Drop file to analyze</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Query the system or detail your workout parameters..."
              className="w-full bg-transparent border-0 resize-none outline-none text-foreground placeholder:text-muted-foreground font-dmsans text-base leading-relaxed min-h-[44px] sm:min-h-[56px]"
              rows={1}
            />
          )}
        </div>

        {uploadedFile && !isDragging && (
          <div className="px-3 sm:px-4 pb-2">
            {uploadedFile.type.startsWith("image/") ? (
              <div className="relative inline-block">
                <img
                  src={URL.createObjectURL(uploadedFile)}
                  alt={uploadedFile.name}
                  className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg border border-border/50"
                />
                {onClearFile && (
                  <button
                    onClick={onClearFile}
                    className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary rounded-lg px-2.5 py-1.5 text-sm font-dmsans">
                <FileText size={14} className="shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-[200px]">
                  {uploadedFile.name}
                </span>
                {onClearFile && (
                  <button
                    onClick={onClearFile}
                    className="hover:text-primary-foreground hover:bg-primary rounded-full p-0.5 transition-colors ml-1 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lower Toolbar Tray Layout */}
        <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 bg-muted/10 border-t border-border/30 rounded-b-2xl">
          {/* Actions Left Side */}
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title="Upload File"
            >
              <Plus size={18} />
            </button>

            <ModelSelector
              selectedModelId={selectedModel}
              onModelSelect={setSelectedModel}
            />

            <button
              type="button"
              onClick={() => setEnableSearch(!enableSearch)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer shrink-0 ${
                enableSearch
                  ? "bg-primary/15 text-primary border border-primary/20 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={enableSearch ? "Web search enabled" : "Enable web search"}
            >
              <Globe size={13} />
              <span className="hidden xs:inline">Web</span>
            </button>
          </div>

          {/* Execution Controls Right Side */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 outline-none ${
                isRecording
                  ? "bg-primary/20 text-primary shadow-[0_0_12px_rgba(34,197,94,0.15)] animate-pulse"
                  : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Voice Typing"
            >
              <Mic size={16} />
            </button>

            <button
              type="button"
              onClick={loading ? stopStream : onSend}
              disabled={!loading && !input.trim() && !uploadedFile}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer ${
                loading
                  ? "bg-transparent text-emerald-600 dark:text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/60"
                  : input.trim() || uploadedFile
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.25)] hover:scale-[1.02]"
                    : "bg-transparent text-muted-foreground/40 cursor-not-allowed border border-transparent"
              }`}
              title={loading ? "Stop generating" : "Send message"}
            >
              {loading ? (
                <Square size={14} className="fill-current opacity-90" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
