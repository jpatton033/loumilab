# Make Loumilab Mail visible where you're looking

## Diagnosis (confirmed)

- The Mail feature is fully built and present in the code: the sidebar has a "Mail" group with "Loumilab Mail" pointing to `/admin/mail`, the route exists, and the current build passes.
- So the link isn't missing from the app — you're almost certainly viewing the **published site** (loumilab.com), which still runs the version from before Mail was added. New admin features only appear on the live site after a publish.

## Plan

1. Verify in the live preview (signed in as your admin account) that the sidebar shows the "Mail" group with "Loumilab Mail", and that `/admin/mail` loads the composer.
2. Publish the site so loumilab.com and www.loumilab.com get the same version as the preview, including Loumilab Mail.
3. Confirm the published admin sidebar shows the Mail link.

## Technical notes

- No code changes needed — `adminNav.ts` already includes `{ title: "Loumilab Mail", url: "/admin/mail", icon: Send }` and `App.tsx` already routes `/admin/mail`; build log is clean.
- Publish via the standard publish action after preview verification.
