# Relationship step for Local registration and claims

## What visitors will see
A first step on "List your business — free", and in the "Claim it for free" dialog, styled as three large tappable cards with the same rounded cards and fonts as the rest of the site.

**"What's your connection to this business?"**
"This helps us guide you to the right next step."

1. **I own this business.** "Create or claim your free business listing."
2. **I help manage this business.** "I'm a manager, team member, or authorized representative."
3. **I'd like to recommend this business.** "Help others discover a local food business."

There's a small Back link at each step so people can change their answer.

## What happens next
- **Owner:** goes straight to today's free listing form. Signed-in owners get the editable listing with photos, and owners who aren't signed in use the form that goes to review. In the claim dialog, owners continue to today's claim form.
- **Manager:** sees one follow-up question, "Are you authorized to manage this business's listing?", with Yes or No.
  - **Yes:** continues exactly like an owner. Claims still go through your manual review.
  - **No:** sees "No problem — you can still recommend it." and moves to the Suggest a Business form.
- **Recommend:** opens a short **Suggest a Business** form:
  - Business name
  - City/state or service area
  - Website or public social profile
  - Category, if known
  - Optional note
  - Your email, kept private, so you can be thanked or asked a question

  No sign-in is needed. It goes into the same Review queue, marked "Suggested by visitor".
- **On an existing listing**, choosing Recommend in the claim dialog simply closes it with a thank-you note, because the business is already listed.

## Technical details
- Rework `VisitorListingForm.tsx`: replace the 5-option picker with a `RelationshipStep` component that offers 3 options plus the authorization follow-up and returns `owner` / `manager` / `recommend`.
- Add a new `SuggestBusinessForm` that calls the existing `submit_local_listing` RPC with affiliation `customer`, the note in `affiliation_note`, and the website or social link in `_website_url`. No database change is needed.
- `Join.tsx`: step state `relationship → form`. Owners and authorized managers get the current flows, and everyone else gets `SuggestBusinessForm`.
- `UnclaimedPanel.tsx`: the claim dialog shows `RelationshipStep` first, and `role` is stored as owner or manager.
