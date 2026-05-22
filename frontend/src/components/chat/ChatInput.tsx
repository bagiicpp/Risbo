import {
  Send,
  Paperclip,
  Loader2,
  Plus,
  Sparkles,
  ChevronDown,
  FileText,
  X,
  Mic,
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
// NEW: Import the UI dropdown components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// NEW: Define the available models and their friendly names
const AVAILABLE_MODELS = [
  { id: "gemma-4-26b-a4b-it", name: "Risbo Standard (26B)" },
  { id: "gemma-4-31b-a4b-it", name: "Risbo Thinker (31B)" },
  { id: "gemini-2.5-flash", name: "Risbo Fast (Flash)" },
];

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
  selectedModel: string; // NEW: Accept state
  setSelectedModel: (model: string) => void; // NEW: Accept setter
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

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

  // Find the friendly name of the currently selected model
  const currentModelName = AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || "Select Model";

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex gap-2 mb-3 px-2 overflow-x-auto pb-1 no-scrollbar">
        {/* We will populate this in Phase 2 */}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative w-full bg-zinc-900 rounded-2xl shadow-lg transition-all duration-300 flex flex-col"
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query the system or detail your workout parameters..."
              className="w-full bg-transparent border-0 resize-none outline-none text-zinc-100 placeholder:text-zinc-400 font-dmsans text-base leading-relaxed min-h-[60px]"
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
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload File"
            >
              <Plus size={20} />
            </button>

            {/* NEW: Dropdown Menu for Model Selection */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 ml-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors text-sm font-mono cursor-pointer outline-none">
                  <Sparkles size={16} className="text-primary/70" />
                  <span className="font-bricolage">{currentModelName}</span>
                  <ChevronDown size={14} className="opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-xl shadow-xl min-w-[220px]"
              >
                {AVAILABLE_MODELS.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 rounded-lg py-2.5 px-3 transition-colors ${
                      selectedModel === model.id ? "text-primary bg-primary/10" : ""
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-zinc-500 mt-0.5">{model.id}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2.5 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 outline-none ${
                isRecording
                  ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(34,197,94,0.2)] animate-pulse"
                  : "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
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
                  ? "bg-primary text-zinc-950 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:scale-105"
                  : "bg-transparent text-zinc-500 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send
                  size={18}
                  className={input.trim() || uploadedFile ? "ml-0.5" : ""}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}