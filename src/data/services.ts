import designer from "@/assets/people/studio/designer.jpg";
import engineer from "@/assets/people/studio/engineer.jpg";
import collaboration from "@/assets/people/studio/collaboration.jpg";
import studioTeam from "@/assets/people/studio-team.jpg";
import officeReview from "@/assets/people/email/office-review.jpg";
import domainSetup from "@/assets/people/email/domain-setup.jpg";

export interface ServicePage {
  slug: string;
  group: "Technology Studio" | "Managed Business Technology";
  name: string;
  seoTitle: string;
  seoDescription: string;
  title: string;
  lede: string;
  image: string;
  imageAlt: string;
  delivers: { title: string; body: string }[];
  problems: { problem: string; solution: string }[];
  process: { step: string; body: string }[];
  capabilities: string[];
  faqs: { q: string; a: string }[];
  cta: { label: string; to: string };
  closing: string;
}

const project = { label: "Start a Project", to: "/contact" };

const studioProcess = [
  { step: "Discover", body: "We learn the business, the people using it and what success looks like." },
  { step: "Design", body: "Clear structure and interface, reviewed with you before anything is built." },
  { step: "Build", body: "Built in short, visible stages so you can see progress and give feedback." },
  { step: "Launch and support", body: "Tested, secured and launched, with support once it's live." },
];

export const servicePages: ServicePage[] = [
  {
    slug: "website-development",
    group: "Technology Studio",
    name: "Website Development",
    seoTitle: "Website Development for Businesses | Loumilab",
    seoDescription: "Loumilab designs and builds fast, accessible business websites that explain what you do clearly and turn visitors into inquiries and customers.",
    title: "Websites that explain, and convert.",
    lede: "A clear, fast website that tells people what you do and makes the next step obvious.",
    image: designer,
    imageAlt: "A designer sketching website layouts on a tablet",
    delivers: [
      { title: "Clear message", body: "Structure and wording built around what your customers need to know." },
      { title: "Fast and accessible", body: "Quick on every phone and usable by everyone, including keyboard and screen-reader users." },
      { title: "Found in search", body: "Page titles, descriptions and structure set up so search engines understand you." },
    ],
    problems: [
      { problem: "Visitors can't tell what you offer.", solution: "A focused homepage with one clear path for each type of customer." },
      { problem: "The site is slow or breaks on phones.", solution: "A rebuilt, lightweight site designed for phones first." },
      { problem: "Inquiries arrive in too many places.", solution: "One simple inquiry form that sends everything to one inbox." },
    ],
    process: studioProcess,
    capabilities: ["Brand-led design", "Responsive layouts", "Content structure", "Search basics and structured data", "Contact and booking forms", "Analytics with consent"],
    faqs: [
      { q: "Can you work with my existing brand?", a: "Yes. We build around your current logo, colors and voice, or help refine them." },
      { q: "Will I be able to update it?", a: "Yes. We set up the site so routine updates don't need a developer." },
      { q: "How much does a website cost?", a: "It depends on size and features. Tell us what you need and we'll send a clear estimate." },
    ],
    cta: project,
    closing: "Ready for a website that works as hard as you do?",
  },
  {
    slug: "custom-software",
    group: "Technology Studio",
    name: "Custom Software",
    seoTitle: "Custom Software & Web App Development | Loumilab",
    seoDescription: "Loumilab builds custom web applications, portals and internal tools around how your business actually works — designed, built and secured by one team.",
    title: "Software built around how you work.",
    lede: "Web apps, portals and internal tools that replace spreadsheets, workarounds and juggling.",
    image: engineer,
    imageAlt: "An engineer reviewing code on two monitors",
    delivers: [
      { title: "Fits your process", body: "Built around your real workflow instead of forcing you into someone else's." },
      { title: "Ready to grow", body: "Solid foundations so new features don't mean starting over." },
      { title: "Secure by default", body: "Access controls and data protection planned from the first day." },
    ],
    problems: [
      { problem: "Work lives in spreadsheets and email threads.", solution: "One shared app where everyone sees the same, current information." },
      { problem: "Off-the-shelf tools almost fit.", solution: "A focused tool that does exactly what your team needs, and nothing it doesn't." },
      { problem: "Customers need to log in and see their status.", solution: "A secure customer portal connected to your existing systems." },
    ],
    process: studioProcess,
    capabilities: ["Web applications", "Customer portals", "Internal dashboards", "Payments and integrations", "Roles and permissions", "Ongoing maintenance"],
    faqs: [
      { q: "Do I own the software?", a: "Yes. What we build for you is yours, and we document it so it can be maintained." },
      { q: "Can you connect it to tools we already use?", a: "Usually, yes. We review your current tools early and plan the connections." },
      { q: "Can we start small?", a: "Yes. We often begin with the most valuable part and build from there." },
    ],
    cta: project,
    closing: "Have a process that deserves better software?",
  },
  {
    slug: "ai-automation",
    group: "Technology Studio",
    name: "AI & Automation",
    seoTitle: "AI & Workflow Automation for Businesses | Loumilab",
    seoDescription: "Loumilab adds practical AI and workflow automation that removes repetitive work — sorting requests, drafting replies, moving data between tools — with people in control.",
    title: "Less busywork. More real work.",
    lede: "Practical AI and automation that removes repetitive tasks, with your team still in control.",
    image: collaboration,
    imageAlt: "A founder and designer working through ideas at a laptop",
    delivers: [
      { title: "Hours back", body: "Automate the copying, sorting and follow-ups that eat the week." },
      { title: "People in control", body: "AI drafts and suggests; your team reviews and decides." },
      { title: "Measured, not hyped", body: "We start where automation clearly saves time, then expand what works." },
    ],
    problems: [
      { problem: "The same questions arrive every day.", solution: "Drafted replies from your own information, reviewed before sending." },
      { problem: "Data is retyped between tools.", solution: "Automatic hand-offs between the tools you already use." },
      { problem: "Requests pile up unsorted.", solution: "Incoming requests sorted and routed to the right person." },
    ],
    process: studioProcess,
    capabilities: ["Workflow automation", "AI-assisted drafting", "Document and request sorting", "Tool-to-tool integrations", "Usage and cost controls", "Privacy-aware design"],
    faqs: [
      { q: "Is our data used to train AI models?", a: "We design automations so your data is used only for your tasks, and explain each provider's terms." },
      { q: "Will this replace my team?", a: "No. The goal is removing repetitive work so people can focus on what matters." },
      { q: "What does it cost to run?", a: "We estimate running costs up front and add limits so there are no surprises." },
    ],
    cta: project,
    closing: "What would your team do with the time back?",
  },
  {
    slug: "cybersecurity",
    group: "Technology Studio",
    name: "Cybersecurity",
    seoTitle: "Cybersecurity Reviews & Secure Development | Loumilab",
    seoDescription: "Loumilab helps businesses find and fix security gaps: application reviews, account and access hardening, secure configuration and secure-by-default development.",
    title: "Security from day one.",
    lede: "Find the gaps, fix what matters most and build new work securely from the start.",
    image: studioTeam,
    imageAlt: "The Loumilab team reviewing work together",
    delivers: [
      { title: "Know where you stand", body: "A plain-language review of your apps, accounts and settings." },
      { title: "Fix what matters", body: "Prioritized fixes, starting with the risks most likely to hurt." },
      { title: "Stay protected", body: "Secure defaults built into everything we design and build." },
    ],
    problems: [
      { problem: "Nobody is sure who has access to what.", solution: "An access review with clear roles and two-step sign-in." },
      { problem: "An app handles customer data.", solution: "An application review with prioritized, practical fixes." },
      { problem: "Email is spoofed or lands in junk.", solution: "Correct email security records and sender settings." },
    ],
    process: [
      { step: "Review", body: "We look at your apps, accounts and configuration." },
      { step: "Prioritize", body: "A short report ranking what to fix first, in plain language." },
      { step: "Fix", body: "We fix issues with you, or alongside your team." },
      { step: "Maintain", body: "Optional check-ins so settings stay correct over time." },
    ],
    capabilities: ["Application security reviews", "Access and account hardening", "Email security records", "Secure configuration", "Secure development", "Incident readiness basics"],
    faqs: [
      { q: "Are you a certified auditor?", a: "We provide practical security reviews and fixes, not formal certification audits." },
      { q: "Do you need our passwords?", a: "No. We work through proper access you grant and can revoke at any time." },
      { q: "Can you review software someone else built?", a: "Yes. We review it and give you a clear, prioritized list of fixes." },
    ],
    cta: project,
    closing: "Want to know where you stand?",
  },
  {
    slug: "domains",
    group: "Managed Business Technology",
    name: "Domain Setup & Management",
    seoTitle: "Domain Setup & DNS Management | Loumilab",
    seoDescription: "Loumilab sets up and manages your business domain with established registrars: purchase guidance, DNS records, email records and website connections, done properly.",
    title: "Your domain, set up properly.",
    lede: "We help you get the right domain through an established registrar and configure it for your website and email.",
    image: domainSetup,
    imageAlt: "A shop owner setting up her business website at a laptop near the storefront window",
    delivers: [
      { title: "The right name", body: "Help choosing and securing a domain through an established registrar in your name." },
      { title: "Correct records", body: "Website, email and security records configured and tested." },
      { title: "You stay the owner", body: "Accounts are in your name, with a clear handoff of every login you need." },
    ],
    problems: [
      { problem: "Email lands in junk.", solution: "Correct sender and security records for your email provider." },
      { problem: "The website and domain won't connect.", solution: "Records set and checked so your site loads on your own name." },
      { problem: "Nobody remembers where the domain lives.", solution: "A documented setup with renewal dates you can see." },
    ],
    process: [
      { step: "Tell us what you have", body: "A short questionnaire about your domain, website and email." },
      { step: "Clear price", body: "You see Loumilab's setup fee and any registrar costs separately." },
      { step: "Setup", body: "We configure and test every record." },
      { step: "Handoff", body: "You receive ownership details, renewal dates and optional ongoing support." },
    ],
    capabilities: ["Domain purchase guidance", "DNS records", "Email authentication records", "Website connection", "Renewal tracking", "Optional ongoing management"],
    faqs: [
      { q: "Does Loumilab register domains itself?", a: "No. Domains are registered through established registrars, in your name. We handle setup and configuration." },
      { q: "How is this priced?", a: "Domain setup is part of our Business Email & Domain Setup packages. Registrar fees are shown separately." },
      { q: "Can you fix a domain I already own?", a: "Yes. Choose that option in the questionnaire and we'll review your current records." },
    ],
    cta: { label: "Get started", to: "/services/business-email/start" },
    closing: "Get your domain working the way it should.",
  },
];

export const getServicePage = (slug?: string) => servicePages.find((s) => s.slug === slug);
