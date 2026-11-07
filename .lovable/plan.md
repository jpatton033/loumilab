# Reply bounce on the test inquiry: no fix needed

## What happened
The test inquiry used a made-up email address, `qa-test@loumilab.com`. When an inquiry comes in, the alert email sets Reply to the visitor's own address. So when you replied, your message went to that made-up address. No inbox exists there, so the mail server sent it back as undeliverable. That return notice is the mailer-daemon message you saw.

## Why real inquiries are fine
A real visitor types in their own email address. Replying to their alert reaches them. Nothing in the form or the email setup needs to change.

## To confirm it yourself (optional)
1. Fill in the Workflow Optimization form using an email address you can check.
2. Reply to the alert that arrives at hello@loumilab.com.
3. Your reply should arrive at that address.

No changes to the site.
