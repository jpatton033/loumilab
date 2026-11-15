# Fix "new row violates row-level security" when creating a Spaces app

## What's happening
Creating the app itself is allowed. The error comes right after: the page asks for the new app back, and the "who can see this app" check looks the app up again by its id. At that moment the brand-new app isn't visible to that lookup yet, so the check fails and the whole create is rejected.

## Change
Rewrite the "who can see an app" rule so it checks the app's own details directly (workspace, creator, visibility) and no longer looks the app up again. Who can see what stays exactly the same:
- Workspace admins and owners: every app in the workspace.
- The creator: their own app, as long as they're still a member.
- Any member: apps shared with the workspace or by link.

## Verify
Signed in as jpatton033@icloud.com in the preview: create an app in Spaces, confirm it opens its page and shows in the Library. Then publish.

## Technical details
Migration: drop and recreate the `app_select` policy on `spaces_apps` with
`spaces_role_rank(workspace_id, auth.uid()) >= 3 OR (created_by = auth.uid() AND spaces_role_rank(workspace_id, auth.uid()) >= 1) OR (visibility IN ('workspace','link') AND spaces_role_rank(workspace_id, auth.uid()) >= 1)`.
`spaces_can_view_app` stays for other callers (serving, versions). No app code changes.
