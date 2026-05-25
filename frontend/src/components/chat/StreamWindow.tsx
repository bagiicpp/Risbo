import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, FileText } from "lucide-react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StreamWindowProps {
  messages: Message[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  loading?: boolean;
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

const StreamWindow: React.FC<StreamWindowProps> = ({
  messages,
  scrollRef,
  loading,
}) => {
  if (messages.length === 0 && !loading) return null;

  const handleDownloadPDF = async (text: string) => {
    try {
      // We will build this endpoint in app-backend
      const response = await fetch("http://localhost:8080/generate-pdf", {
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
      {messages.map((msg, index) => {
        // Check for PDF trigger
        const hasPdfTrigger = msg.content.includes("[PDF_READY]");
        const displayContent = msg.content.replace("[PDF_READY]", "").trim();

        return (
          <div
            key={index}
            className={`flex w-full ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "user" ? (
              <div className="max-w-[80%] bg-primary text-primary-foreground px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm">
                <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                  {displayContent}
                </p>
              </div>
            ) : (
              <div className="max-w-full flex gap-4 w-full flex-col md:flex-row">
                <div className="flex gap-4 w-full">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 border border-primary/20 mt-1">
                    <span className="text-primary font-bold italic text-sm leading-none">
                      R
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none break-words leading-relaxed">
                      {displayContent ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({ node, ...props }) => (
                              <div className="w-full overflow-x-auto my-6 rounded-xl border border-border/50 shadow-sm">
                                <table className="w-full text-sm text-left border-collapse" {...props} />
                              </div>
                            ),
                            thead: ({ node, ...props }) => <thead className="bg-muted/50 border-b border-border/50 font-semibold text-muted-foreground" {...props} />,
                            tr: ({ node, ...props }) => <tr className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors" {...props} />,
                            th: ({ node, ...props }) => <th className="p-4 align-middle font-medium" {...props} />,
                            td: ({ node, ...props }) => <td className="p-4 align-middle text-foreground/80" {...props} />,
                          }}
                        >
                          {displayContent}
                        </ReactMarkdown>
                      ) : (
                        <ThinkingPlaceholder />
                      )}
                    </div>
                    
                    {/* Render button if tag detected and streaming finished (no placeholder) */}
                    {hasPdfTrigger && displayContent && !loading && (
                      <div className="mt-4 flex">
                        <button
                          onClick={() => handleDownloadPDF(displayContent)}
                          className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                          <FileText size={16} />
                          Download as PDF
                          <Download size={16} className="ml-1 opacity-70" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {loading &&
        (messages.length === 0 ||
          messages[messages.length - 1].role === "user") && (
          <div className="flex w-full justify-start">
            <div className="max-w-full flex gap-4 w-full">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 border border-primary/20 mt-1">
                <span className="text-primary font-bold italic text-sm leading-none">R</span>
              </div>
              <div className="flex-1 prose prose-sm md:prose-base dark:prose-invert max-w-none break-words leading-relaxed">
                <ThinkingPlaceholder />
              </div>
            </div>
          </div>
        )}

      <div ref={scrollRef} className="h-32 w-full shrink-0" />
    </div>
  );
};

export default StreamWindow;