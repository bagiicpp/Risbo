import ReactMarkdown from "react-markdown";
import type { RefObject } from "react";

interface Props {
  output: string;
  scrollRef: RefObject<HTMLDivElement | null>;
}

export default function StreamWindow({ output, scrollRef }: Props) {
  if (!output) return null;

  return (
    <div className="w-full max-w-3xl mx-auto py-6">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <article className="prose prose-zinc dark:prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:text-zinc-100 max-w-none">
          <ReactMarkdown>{output}</ReactMarkdown>
        </article>
        <div ref={scrollRef} className="h-4" />
      </div>
    </div>
  );
}
