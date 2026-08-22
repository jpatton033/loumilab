import { Link } from "react-router-dom";
import { ArrowRight, Clock, Eye } from "lucide-react";
import type { KcArticleWithRelations } from "@/lib/kc/types";

const ArticleCard = ({ article }: { article: KcArticleWithRelations }) => {
  const sectionSlug = article.kc_sections?.slug ?? "";
  const tags = (article.kc_article_tags ?? []).map((t) => t.kc_tags).filter(Boolean).slice(0, 2);

  return (
    <Link
      to={`/resources/${sectionSlug}/${article.slug}`}
      className="group flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[var(--shadow-lift)]"
    >
      {article.kc_sections?.title && (
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {article.kc_sections.title}
        </span>
      )}
      <h3 className="mt-3 font-display text-lg font-semibold leading-snug transition-colors group-hover:text-accent">
        {article.title}
      </h3>
      {article.summary && <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{article.summary}</p>}

      <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={13} /> {article.read_minutes} min read
        </span>
        {article.view_count > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Eye size={13} /> {article.view_count}
          </span>
        )}
        <ArrowRight size={15} className="ml-auto text-accent transition-transform group-hover:translate-x-1" />
      </div>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag!.id} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
              {tag!.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
};

export default ArticleCard;
