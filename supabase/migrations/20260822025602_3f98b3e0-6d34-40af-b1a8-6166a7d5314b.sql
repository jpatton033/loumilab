INSERT INTO public.kc_sections (slug, title, description, icon, sort_order) VALUES
('business-growth','Business Growth','Selling online, social commerce, customer acquisition, pricing, and turning first-time buyers into regulars.','TrendingUp',1),
('orders-commerce','Orders & Commerce','Order management, payments, storefronts, pickup workflows, and menus — the operational side of selling.','ShoppingBag',2),
('technology-ai','Technology & AI','Automation, practical AI for small businesses, choosing software, and running digital operations.','Sparkles',3),
('web-digital','Web & Digital','Websites, SEO, conversion, e-commerce, and building a digital presence that earns trust.','Globe',4),
('security-privacy','Security & Privacy','Payment security, customer information, account security, and small-business cybersecurity.','ShieldCheck',5),
('templates-tools','Templates & Tools','Editable resources, checklists, and templates you can put to work immediately.','FileText',6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.kc_tags (slug, name) VALUES
('getting-started','Getting Started'),
('checklist','Checklist'),
('template','Template'),
('automation','Automation'),
('payments','Payments'),
('seo','SEO'),
('security','Security'),
('social-commerce','Social Commerce')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.kc_articles (section_id, slug, title, summary, body, author, read_minutes, status, published_at, is_featured, related_link_label, related_link_href)
SELECT s.id, v.slug, v.title, v.summary, v.body, 'Loumilab Team', v.read_minutes, 'published', now(), v.is_featured, v.rl_label, v.rl_href
FROM (VALUES
  ('business-growth','turn-first-time-buyers-into-regulars','Turn First-Time Buyers Into Regulars','A practical framework for repeat business: capture the contact, earn the second order, then make the third one automatic.',
'## Why repeat customers decide your growth

Acquiring a new customer costs money and attention. Keeping one costs a message at the right moment. Most small businesses obsess over the first sale and leave the second one to chance.

## The three-order rule

1. **First order** — make it effortless. One clear price, one clear next step, no account required.
2. **Second order** — earn it within 30 days with a reason to return: a small thank-you, a new item, or a reminder tied to how the product is used.
3. **Third order** — automate it. A short, predictable rhythm beats a clever campaign.

## What to capture on order one

- Name and a contact channel the customer actually reads
- What they bought and when
- Permission to follow up

That is enough to build a returning-customer program without a large marketing stack.

## A simple weekly routine

- Monday: review last week''s orders and flag first-time buyers
- Wednesday: send one useful message to that group
- Friday: review what came back and adjust the offer

## Measure two numbers

Repeat rate (share of customers with more than one order) and time to second order. Improving those two moves revenue more reliably than raising ad spend.', 6, true, 'See how Loumilab Orders handles repeat customers','/orders'),

  ('orders-commerce','order-management-that-scales','Order Management That Scales With You','How to run every channel — DMs, phone, walk-ins, online — through one queue without dropping an order.',
'## The multi-channel problem

Orders arrive from Instagram DMs, text messages, phone calls, and your website. Each channel has its own screen, and none of them talk to each other. That is where mistakes happen.

## One queue, one status language

Adopt a single set of statuses and use them everywhere:

- **New** — received, not yet confirmed
- **Confirmed** — accepted, promised time set
- **In progress** — being prepared
- **Ready** — awaiting pickup or handoff
- **Completed** — delivered and paid

## Rules that prevent chaos

1. Every order gets written down within 60 seconds of arriving.
2. Nothing moves forward without a promised time.
3. One person owns the queue during each shift.
4. Cancellations and refunds get logged, not remembered.

## Payments and pickup

Collect payment at the moment of confirmation whenever possible. Unpaid orders create follow-up work and no-shows. For pickup, send a single message when the order moves to **Ready** — not before.

## When to move off paper

If you handle more than roughly 20 orders a week across two or more channels, a shared system pays for itself in avoided errors alone.', 7, true, 'Explore Loumilab Orders','/orders'),

  ('technology-ai','practical-ai-for-small-businesses','Practical AI for Small Businesses','Where AI actually saves time this quarter — and where it quietly creates more work.',
'## Start with the boring wins

AI earns its place when it removes a repeated, low-judgment task. The best first candidates:

- Drafting replies to common customer questions
- Turning notes into clean product descriptions
- Summarising a week of orders or reviews
- Extracting data from invoices and receipts

## Where it goes wrong

- **Unreviewed output on customer-facing channels.** Always keep a human approval step.
- **Automating a broken process.** Fix the workflow first, then automate it.
- **Feeding customer data into tools you have not vetted.** Check what a vendor stores and trains on.

## A four-week rollout

1. Week 1 — list your ten most repeated tasks
2. Week 2 — pick the two with clear inputs and low risk
3. Week 3 — pilot with a human review step and track time saved
4. Week 4 — keep what saved real hours, drop the rest

## The honest test

If you cannot describe the task in two sentences, AI will not do it reliably yet. Automate clarity, not confusion.', 6, false, 'Talk to us about automation','/services'),

  ('web-digital','website-that-converts','The Small-Business Website That Actually Converts','Five sections, in order, that do more for revenue than a redesign.',
'## Structure beats decoration

Most small-business sites fail on clarity, not aesthetics. A visitor should know what you sell, who it is for, and what to do next within five seconds.

## The five sections, in order

1. **A plain-language headline.** What you do, for whom.
2. **Proof.** Photos of real work, real reviews, real names.
3. **The offer.** What it costs, or how pricing works.
4. **The path.** One primary action, repeated.
5. **The details.** Hours, location, delivery, contact.

## Technical basics that move rankings

- Fast first load on mobile — compress images, keep scripts light
- One clear H1 per page, descriptive titles under 60 characters
- Real content per service or location, not thin duplicate pages
- Structured data so search engines can read your business details

## What to remove

Carousels nobody clicks, stock photography, and vague mission copy. Every element should either build trust or move the visitor toward the action.', 6, false, 'See our web and product work','/work'),

  ('security-privacy','small-business-security-baseline','The Small-Business Security Baseline','Ten controls that stop the attacks that actually target businesses your size.',
'## Attackers go for the easy path

Small businesses are rarely targeted by sophisticated intrusions. They are targeted by password reuse, invoice fraud, and unpatched software.

## The baseline

1. Multi-factor authentication on email, banking, and your store admin
2. A password manager — no shared or reused passwords
3. Separate admin accounts from day-to-day accounts
4. Automatic updates on every device and plugin
5. Verified backups you have actually restored once
6. Payment changes confirmed by phone, never by email alone
7. Least-privilege access for staff, revoked the day they leave
8. Card data handled only by your payment processor, never stored by you
9. Customer data kept only as long as you need it
10. A one-page incident plan: who to call, what to shut off, what to say

## Payment fraud in particular

The most common loss is a fake invoice or a changed bank detail. Add a mandatory verbal confirmation step for any payment detail change over a set amount.

## Review quarterly

Security drifts. Put a 30-minute quarterly review on the calendar and walk the ten items.', 7, true, 'Request a security review','/contact'),

  ('templates-tools','order-intake-template','Order Intake Template','A ready-to-use intake sheet for capturing every order the same way, on any channel.',
'## What this template covers

A single intake record you can use whether the order arrives by DM, phone, or in person.

## Fields included

- Customer name and contact channel
- Items, quantities, and modifiers
- Promised time and fulfilment method
- Payment status and method
- Notes and allergy or special handling flags
- Order status

## How to use it

Keep one copy per shift, fill it in as orders arrive, and review at close. Once your volume grows past what a sheet can hold, move the same fields into a system so nothing has to be re-learned.

## Adapting it

Add only fields you will actually use every shift. Extra fields go unfilled, and unfilled fields make the record untrustworthy.', 4, false, 'Take orders in one place with Loumilab Orders','/orders')
) AS v(section_slug, slug, title, summary, body, read_minutes, is_featured, rl_label, rl_href)
JOIN public.kc_sections s ON s.slug = v.section_slug
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.kc_article_tags (article_id, tag_id)
SELECT a.id, t.id
FROM (VALUES
  ('turn-first-time-buyers-into-regulars','getting-started'),
  ('turn-first-time-buyers-into-regulars','social-commerce'),
  ('order-management-that-scales','payments'),
  ('order-management-that-scales','checklist'),
  ('practical-ai-for-small-businesses','automation'),
  ('website-that-converts','seo'),
  ('small-business-security-baseline','security'),
  ('small-business-security-baseline','checklist'),
  ('order-intake-template','template')
) AS m(article_slug, tag_slug)
JOIN public.kc_articles a ON a.slug = m.article_slug
JOIN public.kc_tags t ON t.slug = m.tag_slug
ON CONFLICT DO NOTHING;