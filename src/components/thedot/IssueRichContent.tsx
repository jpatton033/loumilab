import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { safeResourceUrl } from "@/lib/thedot/editorial";

const schema = { ...defaultSchema, tagNames: [...(defaultSchema.tagNames ?? []), "u", "sup", "sub"] };
/** Rich issues are explicitly marked. Legacy plain text never enters the HTML parser. */
export default function IssueRichContent({ body, className = "" }: { body: string; className?: string }) {
  return <div className={`max-w-none [&_p]:mb-3 [&_h1]:text-2xl [&_h2]:text-2xl [&_h3]:text-xl [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:mt-6 [&_h2]:mt-6 [&_h3]:mt-5 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_table]:w-full [&_td]:border [&_th]:border [&_td]:border-border [&_th]:border-border [&_td]:p-2 [&_th]:p-2 overflow-x-auto ${className}`}>
    <ReactMarkdown rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]} components={{
      a: ({ href, children }) => href && safeResourceUrl(href) ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-accent underline underline-offset-4">{children}</a> : <span>{children}</span>,
      img: ({ src, alt }) => src && /^https:\/\//i.test(src) ? <img src={src} alt={alt ?? ""} loading="lazy" className="my-5 h-auto max-w-full rounded-xl" /> : null,
    }}>{body}</ReactMarkdown>
  </div>;
}