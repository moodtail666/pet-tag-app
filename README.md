# Tailvori Pet Tag Platform

Production MVP for unique-QR pet identification tags sold in the United States.

## Customer flow

1. Every physical tag receives a unique QR image, although every tag has the same visual design.
2. The first owner scans the QR, confirms an email account, and claims the tag.
3. The owner adds a pet photo, details, public contact choices, and a scan-alert email.
4. Later scans open the public pet profile immediately.
5. A finder may explicitly share precise browser location with the owner.
6. The owner receives scan alerts by email.

No visible serial number, packaging card, or activation code is required.

## Operations

- `/admin` provides customer, tag, pet, scan, batch, and site management.
- Production batches download as a ZIP containing one SVG per tag, a manifest, and factory instructions.
- Releasing a tag permanently removes its profile, photo, and scan history before reuse.
- Owners can export and delete their account data from `/account`.
- Security-attempt logs and old scan records are removed by the scheduled retention job.

## Required services

- Vercel for the Next.js application
- Supabase for authentication, PostgreSQL, and photo storage
- Resend for scan-alert email
- `tag.tailvori.com` as the permanent QR destination

## Environment

Copy `.env.example` to `.env.local` for local work. Production values belong in Vercel only.

## Database

Run `supabase/schema.sql` in the Supabase SQL editor after every schema change. The script is designed to be safe to run more than once.

## Release checks

Before ordering a production batch:

- Deploy the exact commit used to generate the batch.
- Verify `tag.tailvori.com` and never print a temporary Vercel URL.
- Verify the Resend sending domain and perform a real scan-alert test.
- Test first claim, sign-in, pet editing, finder view, location consent, email delivery, account export/deletion, and admin release on iPhone and Android.
- Scan-test samples from every factory batch.
- Keep a database backup and monitor Supabase, Vercel, and Resend usage.
