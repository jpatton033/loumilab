

## Strengthen Email Validation on Contact Form

### What's Changing

The email field already has basic validation (`type="email"` on the input and Zod's `.email()` check), but these can accept technically valid but practically useless addresses (e.g., `user@localhost`). We'll add a stricter regex to ensure the email has a real domain with a proper extension (e.g., `.com`, `.org`).

### Changes

**File: `src/pages/Contact.tsx`** (line 14)

Update the Zod email validation to include a `.regex()` refinement that requires:
- Characters before the `@`
- A domain name after the `@`
- A top-level domain of at least 2 characters (e.g., `.com`, `.io`)

The updated schema line will use `.regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please enter a valid email address")` chained after `.email()` for a two-layer check.

### User Experience

- If someone types an invalid email like `test@test` or `hello@.com`, they'll see a clear error message: "Please enter a valid email address"
- Valid emails like `name@company.com` pass through as before

