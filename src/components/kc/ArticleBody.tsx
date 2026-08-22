import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugify } from "@/lib/kc/types";

interface ArticleBodyProps {
  body: string;
}

const headingId = (children: React.ReactNode) => {
  const text = Array.isArray(children) ? children.join(" ") : String(children ?? "");
  return slugify(text);
};

const ArticleBody = ({ body }: ArticleBodyProps) => (
  <div className="max-w-none text-[1.0625rem] leading-relaxed text-foreground/85">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2
            id={headingId(children)}
            className="mt-12 scroll-mt-28 font-display text-2xl font-semibold text-foreground lg:text-[1.75rem]"
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 id={headingId(children)} className="mt-8 scroll-mt-28 font-display text-xl font-semibold text-foreground">
            {children}
          </h3>
        ),
        p: ({ children }) => <p className="mt-5">{children}</p>,
        ul: ({ children }) => <ul className="mt-5 space-y-2 pl-5 [&>li]:list-disc">{children}</ul>,
        ol: ({ children }) => <ol className="mt-5 space-y-2 pl-5 [&>li]:list-decimal">{children}</ol>,
        li: ({ children }) => <li className="pl-1 marker:text-accent">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        blockquote: ({ children }) => (
          <blockquote className="mt-6 rounded-2xl border-l-2 border-accent bg-surface-subtle px-6 py-4 text-foreground/80">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            className="font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded-md bg-secondary px-1.5 py-0.5 text-[0.9em] text-foreground">{children}</code>
        ),
        pre: ({ children }) => (
          <pre className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface-subtle p-5 text-sm">
            {children}
          </pre>
        ),
        hr: () => <hr className="mt-10 border-border" />,
        table: ({ children }) => (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border-b border-border px-4 py-3 font-semibold">{children}</th>,
        td: ({ children }) => <td className="border-b border-border px-4 py-3">{children}</td>,
      }}
    >
      {body}
    </ReactMarkdown>
  </div>
);

export default ArticleBody;
