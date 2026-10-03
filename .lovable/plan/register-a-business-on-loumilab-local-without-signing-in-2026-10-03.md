# Register a business on Loumilab Local without signing in

## What visitors will see
- "List your business — free" at /orders/local/join opens a form right away, with no sign-in screen first.
- The first question: **"What's your connection to this business?"**
  - Owner
  - Manager or staff
  - Family member or partner of the owner
  - Customer or fan, recommending it
  - Other (short text)
- Then the same short form as today: business name, category, cuisine, city + ZIP or service area, description, website and social links, pickup and delivery, and an optional public phone or email. It also asks for the submitter's name and a private contact email that only Loumilab sees.
- Photo uploads stay for signed-in owners only, because anonymous uploads are an abuse risk. Anonymous listings show initials until the business claims them.
- After sending, the visitor sees: "Thanks. We'll review it and publish it soon."
  - If they chose Owner or Manager, they also see: "Want to manage this listing? Sign in to claim it. It's free." This links to sign-in, which returns them to the claim step.
- Signed-in visitors who choose Owner or Manager keep today's flow. Their listing is created under their account and they can edit it right away.

## How it goes live
- Anonymous submissions don't go live straight away. They go into the Local Importer Review queue as **Submitted by visitor**, showing the person's connection and contact email. You approve, edit or reject them like any other entry.
- Once published, the listing shows as **Unclaimed** until the owner signs in and claims it. Sign-in is still needed only for claiming.
- The claim form also asks the same connection question, with Owner and Manager as the choices.

## Protection against spam
- Limits: 3 submissions per hour per email, and an overall hourly cap.
- A hidden trap field catches spam bots, and every field has a length limit.
- Submissions are checked for duplicates against existing listings and the business's own requests to be left off Local.

## Technical details
- Migration: add `submitter_affiliation` (owner, manager, family, customer, other), `submitter_name`, `submitter_email` and `affiliation_note` to `local_candidates`, and add `'visitor'` as a candidate source. Add `affiliation` to `local_claims`.
- New security-definer RPC `submit_local_listing(...)`, granted to anon and authenticated. It validates every field, rate-limits with `check_and_increment_rate_limit`, rejects suppressed businesses and writes one candidate. It never publishes. Existing `publish_local_candidate` publishes it as an unclaimed listing.
- `submit_local_claim` takes an `_affiliation` value.
- Frontend:
  - `Join.tsx`: remove the sign-in gate and add the connection question. Signed-in owners and managers go to the existing `LocalProfileCard` flow; everyone else uses the new RPC.
  - `UnclaimedPanel.tsx`: claim dialog gets the connection question.
  - `importer.ts` and `LocalImporter.tsx`: add a "Submitted by visitor" badge and show the connection and contact details in the review queue.
- Update the AGENTS.md Local rule: visitor submissions only enter staging, and publishing still requires approval.
