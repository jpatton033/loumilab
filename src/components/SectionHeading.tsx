interface SectionHeadingProps {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

const SectionHeading = ({ label, title, description, align = "center" }: SectionHeadingProps) => (
  <div className={`mb-16 ${align === "center" ? "text-center max-w-3xl mx-auto" : "max-w-xl"}`}>
    {label && (
      <span className="inline-block text-accent font-display text-sm font-medium uppercase tracking-[0.2em] mb-4">
        {label}
      </span>
    )}
    <h2 className="text-3xl lg:text-5xl font-semibold leading-tight mb-4">{title}</h2>
    {description && (
      <p className="text-lg text-muted-foreground leading-relaxed">{description}</p>
    )}
  </div>
);

export default SectionHeading;
