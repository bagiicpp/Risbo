import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StreamWindowProps {
  messages: Message[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
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

const StreamWindow: React.FC<StreamWindowProps> = ({ messages, scrollRef }) => {
  if (messages.length === 0) return null;

  return (
    <div className="flex flex-col space-y-6">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex w-full ${
            msg.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {msg.role === "user" ? (
            <div className="max-w-[80%] bg-primary text-primary-foreground px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm">
              <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </p>
            </div>
          ) : (
            <div className="max-w-full flex gap-4 w-full">
              {/* AI Avatar */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 border border-primary/20 mt-1">
                <span className="text-primary font-bold italic text-sm leading-none">
                  R
                </span>
              </div>

              {/* Message Content Container */}
              <div className="flex-1 prose prose-sm md:prose-base dark:prose-invert max-w-none break-words leading-relaxed">
                {msg.content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="w-full overflow-x-auto my-6 rounded-xl border border-border/50 shadow-sm">
                          <table
                            className="w-full text-sm text-left border-collapse"
                            {...props}
                          />
                        </div>
                      ),
                      thead: ({ node, ...props }) => (
                        <thead
                          className="bg-muted/50 border-b border-border/50 font-semibold text-muted-foreground"
                          {...props}
                        />
                      ),
                      tr: ({ node, ...props }) => (
                        <tr
                          className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                          {...props}
                        />
                      ),
                      th: ({ node, ...props }) => (
                        <th
                          className="p-4 align-middle font-medium"
                          {...props}
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td
                          className="p-4 align-middle text-foreground/80"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  // 3. INJECTED HERE
                  // This entirely replaces the old static blinking span
                  <ThinkingPlaceholder />
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      <div ref={scrollRef} className="h-32 w-full shrink-0" />
    </div>
  );
};

export default StreamWindow;
