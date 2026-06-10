import { Send, Square, Plus, FileText, X, Mic, Globe } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { ModelSelector } from "./ModelSelector";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const originalInputRef = useRef<string>("");

  // Speech Recognition Initializer
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

  // Deterministic Object URL Lifecycle Management
  useEffect(() => {
    if (!uploadedFile || !uploadedFile.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(uploadedFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [uploadedFile]);

  // Declarative Height Calculations (Batched via React render cycle)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

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
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-0 antialiased font-sans">
      {/* Main Input Card Wrapper */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full bg-card/80 backdrop-blur-md border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 flex flex-col focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/40 ${
          isDragging
            ? "border-primary bg-primary/5 ring-2 ring-primary/10"
            : "border-border/60"
        }`}
      >
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.pdf,.docx,.md,.csv,image/jpeg,image/png,image/gif,image/webp"
        />

        {/* Text Area Input Viewport */}
        <div className="p-4 pb-2">
          {isDragging ? (
            <div className="h-28 flex flex-col items-center justify-center text-primary border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 transition-colors">
              <FileText size={26} className="mb-2 animate-pulse" />
              <span className="font-medium text-xs tracking-wide">
                Drop file to analyze
              </span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query the system or detail your workout parameters..."
              className="w-full bg-transparent border-0 resize-none outline-none text-foreground placeholder:text-muted-foreground/50 text-[15px] sm:text-base leading-relaxed min-h-[44px] sm:min-h-[56px] p-0 focus:ring-0"
              rows={1}
            />
          )}
        </div>

        {/* Dynamic File Upload Preview Node */}
        {uploadedFile && !isDragging && (
          <div className="px-4 pb-3 flex items-center animate-in fade-in-50 slide-in-from-bottom-1 duration-200">
            {previewUrl ? (
              <div className="relative inline-block group">
                <img
                  src={previewUrl}
                  alt={uploadedFile.name}
                  className="h-16 w-16 object-cover rounded-xl border border-border/80 shadow-sm transition-transform group-hover:scale-[1.01]"
                />
                {onClearFile && (
                  <button
                    type="button"
                    onClick={onClearFile}
                    className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-1 hover:bg-muted shadow-md transition-all touch-manipulation cursor-pointer"
                  >
                    <X size={10} className="text-foreground" />
                  </button>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-secondary/50 border border-border/60 text-secondary-foreground rounded-xl px-3 py-1.5 text-xs font-medium shadow-sm max-w-xs backdrop-blur-sm">
                <FileText size={14} className="text-primary shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-[220px]">
                  {uploadedFile.name}
                </span>
                {onClearFile && (
                  <button
                    type="button"
                    onClick={onClearFile}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-md transition-colors ml-1 touch-manipulation cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lower Toolbar Tray Layout */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/20 border-t border-border/40 rounded-b-2xl">
          {/* Action Modalities (Left) */}
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 touch-manipulation cursor-pointer"
              title="Upload File"
            >
              <Plus size={20} />
            </button>

            <button
              type="button"
              onClick={() => setEnableSearch(!enableSearch)}
              className={`h-10 px-3 flex items-center gap-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 touch-manipulation cursor-pointer ${
                enableSearch
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-inner"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
              }`}
              title={enableSearch ? "Web search enabled" : "Enable web search"}
            >
              <Globe
                size={15}
                className={
                  enableSearch ? "text-primary" : "text-muted-foreground"
                }
              />
              <span className="hidden sm:inline">Web Search</span>
            </button>
          </div>

          {/* Submission and Hardware Controls (Right) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleRecording}
              className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-300 outline-none touch-manipulation cursor-pointer ${
                isRecording
                  ? "bg-destructive/10 text-destructive shadow-[0_0_12px_rgba(239,68,68,0.15)] animate-pulse"
                  : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title="Voice Typing"
            >
              <Mic size={18} />
            </button>

            <button
              type="button"
              onClick={loading ? stopStream : onSend}
              disabled={!loading && !input.trim() && !uploadedFile}
              className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-300 touch-manipulation cursor-pointer ${
                loading
                  ? "bg-transparent text-destructive border border-destructive/30 hover:bg-destructive/10"
                  : input.trim() || uploadedFile
                    ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(var(--primary),0.15)] hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-muted/40 text-muted-foreground/20 border border-transparent cursor-not-allowed"
              }`}
              title={loading ? "Stop generating" : "Send message"}
            >
              {loading ? (
                <Square size={13} className="fill-current" />
              ) : (
                <Send
                  size={15}
                  className="translate-x-[0.5px] -translate-y-[0.5px]"
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown position: Completely outside and below the main input card wrapper div */}
      <div className="mt-2.5 flex justify-start px-1.5 animate-in fade-in duration-300">
        <div className="transition-transform duration-200 active:scale-[0.98]">
          <ModelSelector
            selectedModelId={selectedModel}
            onModelSelect={setSelectedModel}
          />
        </div>
      </div>
    </div>
  );
}
