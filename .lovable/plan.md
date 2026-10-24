# Pass Google's privacy policy review

## Why it failed
- Google was given **loumilab.com/orders/terms**, which is the Terms of Service page, not the privacy policy. The privacy policy is at **loumilab.com/orders/privacy**.
- The privacy policy also never mentions Google or Microsoft calendar access. Google requires a specific section on how its user data is used, including its "Limited Use" statement.

## What you do (in Google Cloud)
- Google Auth Platform → Branding: set the Privacy policy link to `https://loumilab.com/orders/privacy` and the Terms link to `https://loumilab.com/orders/terms`.
- After the update below is published, click Retry / resubmit.

## What I add to the privacy policy
A new section, "Calendar Connections (Google and Microsoft)":
- **Optional:** only merchants who choose "Connect Your Calendar" on paid plans; customers never connect a calendar.
- **What we access:** permission to create, update and delete calendar events (Google `calendar.events`, Microsoft `Calendars.ReadWrite`), plus basic account name and email. We only touch events Loumilab created for bookings. Later, if a merchant turns on availability checks, we read only busy/free times, never event titles or details.
- **How it's used:** only to place, change and remove the merchant's own booking events and, if enabled, avoid double-booking. It is not used for ads, profiling, AI training or sale, and not shared except with the calendar provider.
- **Storage and security:** access is held encrypted on our servers and never sent to browsers. It's removed when the merchant disconnects or deletes their account.
- **Revoking access:** disconnect inside Loumilab, or remove access in Google or Microsoft account settings.
- **Google Limited Use:** the exact required sentence about meeting the Google API Services User Data Policy, including the Limited Use requirements, with a link to that policy.
- Add a line under Information We Collect pointing to this section, and update the "last updated" date.

## Technical details
- Edit `src/data/orders/legal.ts` (ORDERS_PRIVACY): insert the new section after "6. Communications" and renumber the later sections. Nothing else changes.
- The site must be published for Google to see the new text.
