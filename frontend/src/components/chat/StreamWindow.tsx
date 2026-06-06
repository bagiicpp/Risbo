import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Download,
  FileText,
  Edit2,
  RefreshCw,
  Check,
  X,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { API_URL } from "@/lib/api";

export interface Message {
  message_id?: string;
  role: "user" | "assistant";
  content: string | any; // Explicitly acknowledging runtime reality
}

interface StreamWindowProps {
  messages: Message[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  loading?: boolean;
  user?: { username?: string; name?: string; role?: string } | null;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRegenerate: () => void;
}

const LOADING_STATES = [
  "Thinking...",
  "Evaluating context...",
  "Formulating response...",
];

const ThinkingPlaceholder = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % LOADING_STATES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 h-6 mt-1">
      <span className="text-sm font-medium italic text-muted-foreground animate-pulse">
        {LOADING_STATES[index]}
      </span>
    </div>
  );
};

const MessageBubble = React.memo(
  ({
    msg,
    isLast,
    loading,
    user,
    handleDownloadPDF,
    onEdit,
    onRegenerate,
  }: {
    msg: Message;
    isLast: boolean;
    loading?: boolean;
    user?: any;
    handleDownloadPDF: (text: string) => void;
    onEdit: (id: string, text: string) => void;
    onRegenerate: () => void;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editDraft, setEditDraft] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

    // =========================================================================
    // DEFENSIVE DATA PARSING: Force content into a guaranteed string format
    // =========================================================================
    const safeContent =
      typeof msg.content === "string"
        ? msg.content
        : msg.content !== null && msg.content !== undefined
          ? JSON.stringify(msg.content)
          : "";

    const hasPdfTrigger = safeContent.includes("[PDF_READY]");
    let displayContent = safeContent.replace("[PDF_READY]", "").trim();

    let attachedFileName = null;
    if (msg.role === "user") {
      const fileMatch = displayContent.match(/^\[FILE:\s*(.*?)\]/);
      if (fileMatch) {
        attachedFileName = fileMatch[1];
        displayContent = displayContent.replace(fileMatch[0], "").trim();
      }
    }

    const userInitial = user?.username
      ? user.username.charAt(0).toUpperCase()
      : user?.name
        ? user.name.charAt(0).toUpperCase()
        : "U";

    const startEdit = () => {
      setEditDraft(displayContent);
      setIsEditing(true);
    };

    useEffect(() => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        textareaRef.current.focus();
      }
    }, [isEditing, editDraft]);

    const handleSaveEdit = () => {
      if (editDraft.trim() && editDraft !== displayContent && msg.message_id) {
        onEdit(msg.message_id, editDraft.trim());
      }
      setIsEditing(false);
    };

    const handleCopy = () => {
      navigator.clipboard.writeText(displayContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div
        className={`flex w-full group ${msg.role === "user" ? "justify-end" : "justify-start"}`}
      >
        {msg.role === "user" ? (
          <div className="max-w-full flex gap-4 w-full justify-end flex-row">
            <div className="flex flex-col items-end gap-2 max-w-[80%]">
              {attachedFileName && (
                <div className="flex items-center gap-2 bg-muted/50 border border-border text-muted-foreground px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
                  <FileText size={16} className="text-primary/80" />
                  <span className="truncate max-w-[220px] tracking-tight">
                    {attachedFileName}
                  </span>
                </div>
              )}

              {isEditing ? (
                <div className="bg-card border border-primary/30 text-card-foreground p-3 rounded-2xl rounded-tr-sm shadow-sm w-full min-w-[300px]">
                  <textarea
                    ref={textareaRef}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    className="w-full bg-transparent border-none outline-none resize-none text-sm font-medium leading-relaxed"
                    rows={1}
                  />
                  <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-border/50">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded cursor-pointer"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editDraft.trim() || loading}
                      className="flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-3 py-1 rounded disabled:opacity-50 cursor-pointer"
                    >
                      <Check size={14} /> Save & Submit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group/bubble flex items-center gap-2">
                  {!loading && msg.message_id && (
                    <button
                      onClick={startEdit}
                      className="opacity-0 group-hover/bubble:opacity-100 p-1.5 text-muted-foreground hover:text-primary transition-all rounded-md hover:bg-muted cursor-pointer"
                      title="Edit message"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {displayContent && (
                    <div className="bg-card text-card-foreground px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm">
                      <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                        {displayContent}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 border border-border/50 mt-1">
              <span className="text-foreground/70 font-bricolage font-bold text-sm">
                {userInitial}
              </span>
            </div>
          </div>
        ) : (
          <div className="max-w-full flex gap-4 w-full flex-col md:flex-row group/ai">
            <div className="flex gap-4 w-full">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 border border-primary/20 mt-1">
                <span className="text-primary font-bold italic text-sm leading-none">
                  R
                </span>
              </div>
              <div className="flex-1 min-w-0">
                {displayContent ? (
                  <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none break-words leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ node, ...props }) => (
                          // Reduced outer margin (my-3 instead of my-6) and forced zero padding
                          <div className="my-3 w-full overflow-hidden rounded-xl border border-border/50 shadow-sm bg-card !p-0">
                            <div className="w-full overflow-x-auto !m-0 !p-0">
                              <table
                                className="!m-0 !p-0 w-full text-sm text-left border-collapse whitespace-nowrap"
                                {...props}
                              />
                            </div>
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead
                            className="bg-muted/40 border-b border-border/50 !m-0 !p-0"
                            {...props}
                          />
                        ),
                        tr: ({ node, ...props }) => (
                          <tr
                            className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors !m-0 !p-0"
                            {...props}
                          />
                        ),
                        th: ({ node, ...props }) => (
                          <th
                            className="px-4 py-3.5 align-middle text-xs font-semibold text-muted-foreground uppercase tracking-wider first:pl-6 last:pr-6 !mt-0 !mb-0"
                            {...props}
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <td
                            className="px-4 py-4 align-middle text-foreground/80 font-medium first:pl-6 last:pr-6 !mt-0 !mb-0"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {displayContent}
                    </ReactMarkdown>
                  </div>
                ) : isLast && loading ? (
                  <ThinkingPlaceholder />
                ) : null}

                {displayContent && !loading && (
                  <div className="mt-2 flex items-center gap-1 opacity-0 group-hover/ai:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                      title={copied ? "Copied!" : "Copy"}
                    >
                      {copied ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    {isLast && (
                      <button
                        onClick={onRegenerate}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                        title="Regenerate response"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setFeedback(feedback === "up" ? null : "up")
                      }
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${feedback === "up" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                      title="Good response"
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setFeedback(feedback === "down" ? null : "down")
                      }
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${feedback === "down" ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                      title="Bad response"
                    >
                      <ThumbsDown size={16} />
                    </button>
                    {hasPdfTrigger && (
                      <button
                        onClick={() => handleDownloadPDF(displayContent)}
                        className="p-1.5 text-primary hover:text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer ml-1"
                        title="Download as PDF"
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.msg.content === nextProps.msg.content &&
      !nextProps.isLast &&
      prevProps.loading === nextProps.loading
    );
  },
);

const StreamWindow: React.FC<StreamWindowProps> = ({
  messages,
  scrollRef,
  user,
  loading,
  onEditMessage,
  onRegenerate,
}) => {
  if (messages.length === 0 && !loading) return null;

  const handleDownloadPDF = async (text: string) => {
    try {
      const response = await fetch(`${API_URL}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Improved_Document.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("PDF Download Error:", error);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {messages.map((msg, index) => (
        <MessageBubble
          key={msg.message_id || index}
          msg={msg}
          isLast={index === messages.length - 1}
          loading={loading}
          user={user}
          handleDownloadPDF={handleDownloadPDF}
          onEdit={onEditMessage}
          onRegenerate={onRegenerate}
        />
      ))}
      <div ref={scrollRef} className="h-32 w-full shrink-0" />
    </div>
  );
};

export default StreamWindow;
