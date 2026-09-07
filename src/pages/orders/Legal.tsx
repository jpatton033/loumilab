import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import {
  AGREEMENT_EFFECTIVE_DATE,
  AGREEMENT_LAST_UPDATED,
  ORDERS_PRIVACY,
  ORDERS_TERMS,
  PRIVACY_PATH,
  TERMS_PATH,
  type LegalDocument,
} from "@/data/orders/legal";

interface Props {
  document: LegalDocument;
  path: string;
  seoDescription: string;
}

/** Renders one legal document: intro, numbered sections, bullet lists. */
const LegalPage = ({ document, path, seoDescription }: Props) => {
  const other = path === TERMS_PATH ? { label: "Privacy Policy", href: PRIVACY_PATH } : { label: "Terms & Conditions", href: TERMS_PATH };

  return (
    <Layout>
      <SEOHead title={`${document.title} — Loumilab`} description={seoDescription} path={path} />
      <section className="section-padding pt-32 lg:pt-40">
        <div className="section-container mx-auto max-w-3xl">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} /> Loumilab Orders
          </Link>

          <Eyebrow className="mt-8">Legal</Eyebrow>
          <h1 className="mt-3 font-hero text-4xl font-semibold tracking-tight sm:text-5xl">{document.title}</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Effective {AGREEMENT_EFFECTIVE_DATE} · Last updated {AGREEMENT_LAST_UPDATED}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Also read the{" "}
            <Link to={other.href} className="underline underline-offset-4 hover:text-foreground">
              {other.label}
            </Link>
            .
          </p>

          <div className="mt-10 space-y-4">
            {document.intro.map((paragraph, index) => (
              <p key={index} className="text-base leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>

          <nav aria-label="Sections" className="mt-10 rounded-3xl border border-border bg-card p-6">
            <p className="font-display text-sm font-semibold">Sections</p>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {document.sections.map((section) => (
                <li key={section.title}>
                  <a
                    href={`#${slug(section.title)}`}
                    className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-12 space-y-10 pb-10">
            {document.sections.map((section) => (
              <section key={section.title} id={slug(section.title)} className="scroll-mt-28">
                <h2 className="font-display text-xl font-semibold tracking-tight">{section.title}</h2>
                <div className="mt-3 space-y-3">{renderBlocks(section.blocks)}</div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Consecutive "- " blocks become one list; everything else is a paragraph. */
const renderBlocks = (blocks: string[]) => {
  const output: JSX.Element[] = [];
  let bullets: string[] = [];

  const flush = () => {
    if (bullets.length === 0) return;
    output.push(
      <ul key={`list-${output.length}`} className="list-disc space-y-1.5 pl-5 text-base leading-relaxed text-muted-foreground">
        {bullets.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  blocks.forEach((block) => {
    if (block.startsWith("- ")) {
      bullets.push(block.slice(2));
      return;
    }
    flush();
    output.push(
      <p key={`p-${output.length}`} className="text-base leading-relaxed text-muted-foreground">
        {block}
      </p>,
    );
  });
  flush();
  return output;
};

export const OrdersTerms = () => (
  <LegalPage
    document={ORDERS_TERMS}
    path={TERMS_PATH}
    seoDescription="The terms and conditions that govern use of Loumilab Orders by merchants and customers."
  />
);

export const OrdersPrivacy = () => (
  <LegalPage
    document={ORDERS_PRIVACY}
    path={PRIVACY_PATH}
    seoDescription="How Loumilab collects, uses, shares and protects personal information across Loumilab Orders."
  />
);

export default LegalPage;
