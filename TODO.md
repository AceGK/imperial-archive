# TODO

## Auth (Convex Auth)

### Deploy the new auth functions
- [x] Delete the stray `convex/` folder at the repo root (it holds only generated files, created by running `convex dev` from the wrong directory)
- [x] Run `npx convex dev` from `apps/web`, **not** the repo root
- [x] Confirm `users:viewer`, `users:updateEmail`, and `users:updatePassword` show under Functions in the Convex dashboard

### Password reset emails (Resend)
- [x] Create a [Resend](https://resend.com) account
- [x] Create an API key and set `AUTH_RESEND_KEY` on the dev deployment (also saved in `apps/web/.env.local` for reference; Convex only reads its own env)
- [ ] Verify the sending domain (e.g. `imperialarchive.com`) in Resend
- [ ] Set the sender on the dev deployment (run from `apps/web`):
  ```sh
  npx convex env set AUTH_EMAIL_FROM "Imperial Archive <noreply@imperialarchive.com>"
  ```
  Before the domain is verified, `"Imperial Archive <onboarding@resend.dev>"` works for testing, but it only delivers to your Resend account's own email
- [x] Set `SITE_URL=http://localhost:3000` on dev (Convex Auth requires it for any email codes, not just OAuth)
- [x] Test `/reset-password` end to end

### Email testing tools
Emails (plain text, defined in `apps/web/convex/emails.ts`): password reset code and email verification code.
- [x] Move the Resend `fetch` call into a shared `sendEmail` helper (`convex/emails.ts`) used by the reset and verification emails
- [x] Add an internal `emails:sendTest` action that sends a code email with a dummy code (`"type": "verification"` for the verification email). Run it from the Convex dashboard (Functions → Run) or `npx convex run emails:sendTest '{"to": "you@example.com"}'`. It's internal, so clients can't call it
- [x] Use Resend's test addresses to check delivery without a real inbox: `delivered@resend.dev`, `bounced@resend.dev`, `complained@resend.dev` (results show in Resend's Emails log)
- [ ] Later, once emails are styled: switch to [React Email](https://react.email) templates and preview them locally with its dev server

### Manual test checklist
- [ ] Sign up at `/signup` → lands on `/account`
- [ ] Sign out → sign back in at `/login`
- [ ] Visiting `/account` while signed out redirects to `/login`
- [ ] Sign up with a new email → code email arrives → enter code → lands on `/account` (also try a wrong code and "Send a new code")
- [ ] Sign in with an existing (unverified) account → asked for a code → verified afterwards
- [ ] Signed-in unverified user: "Verify Your Email" card on `/account/profile` → Send Code → Confirm → badge shows Verified
- [ ] Change email on `/account/profile` → code sent to the new address → confirm → sign out → sign in with the new email
- [ ] Sign in with different capitalization (e.g. `You@Example.com`) works for an account created in lowercase
- [ ] Change password on `/account/security` → sign in with the new password
- [ ] Favorite and unfavorite a book, series, author, faction, and era; check they appear on `/account/favorites`; signed out, the button goes to `/login`
- [ ] Add, change, and remove a phone number on `/account/profile` (try `(201) 555-0123`, a non-US number via the flag picker, and an invalid number like `(555) 123-4567`)
- [ ] "Sign out other devices" on `/account/security` signs out a second browser
- [ ] Forgot password flow at `/reset-password` (signed out, and signed in via the Security page link)
- [ ] Account dashboard looks right in light and dark theme, desktop and mobile

### Production
Same Convex project, separate **production deployment**: its own data, functions, and env vars. Prod starts with an empty database. After setup, pushing to `main` deploys the site and the prod Convex functions together; local dev keeps using `npx convex dev` against dev.

**Before launch: check the existing signups**
- [ ] In Vercel, check which `NEXT_PUBLIC_CONVEX_URL` the live site uses. If it's `oceanic-crow-954` (dev), the current real signups live in the dev database
- [ ] Review those dev `users` / `authAccounts` rows for bots or junk accounts
- [ ] Decide: copy them to prod (`npx convex export` from dev, then `npx convex import --prod <file>`), or start prod fresh and let them sign up again

**Convex prod deployment** (run from `apps/web`)
- [ ] Create the prod deployment and its auth keys: `npx @convex-dev/auth --prod` (sets `JWT_PRIVATE_KEY` and `JWKS` on prod)
- [ ] Create a separate prod Resend key (`imperial-archive-convex-prod`, Sending access only, limited to `imperialarchive.com`)
- [ ] Set prod env vars in the dashboard (switch to Production → Settings → Environment Variables) or with `npx convex env set --prod`:
  - `SITE_URL` = `https://imperialarchive.com` (without it, reset and verification emails fail)
  - `AUTH_RESEND_KEY` = the prod Resend key
  - `AUTH_EMAIL_FROM` = `noreply@imperialarchive.com`
  - Later: OAuth client IDs and secrets (`AUTH_GOOGLE_ID`, etc.), using prod OAuth apps whose callback URLs point at the prod `.convex.site` domain

**Vercel**
- [ ] Root directory: `apps/web`
- [ ] In the Convex dashboard (Production → Settings), generate a **production deploy key** and add it in Vercel as `CONVEX_DEPLOY_KEY`, scoped to the Production environment only
- [ ] Build command: `npx convex deploy --cmd 'npm run build'` (pushes Convex functions to prod and sets `NEXT_PUBLIC_CONVEX_URL` for the build automatically)
- [ ] Remove any manually set `NEXT_PUBLIC_CONVEX_URL` / `CONVEX_DEPLOYMENT` pointing at dev from Vercel's Production env
- [ ] Optional: preview deploy key for Vercel Preview builds, so each PR gets its own throwaway Convex backend instead of touching prod or dev

**After the first prod deploy**
- [ ] Sign up, sign in, and run `/reset-password` on the live site
- [ ] Confirm the new user appears in the **prod** deployment's `users` table, not dev

### Cleanup
- [ ] Remove `SITE_PASSWORD` from `apps/web/.env.local` and from hosting env vars (the password gate was deleted)
- [ ] Remove the "access the site using the password **emperorprotects**" line from `README.md`

### Future improvements
- [ ] Bot protection on signup (e.g. Cloudflare Turnstile)
- [ ] Two-factor auth: authenticator app (TOTP) as the main method, SMS as an optional backup (verify the phone first by setting `phoneVerificationTime`, e.g. with a Twilio-backed Phone provider)
- [ ] **SMS reset codes (later, only if the site grows and it's worth paying for)**. Decided to stay email-only for now: Resend only sends email, and SMS costs money and adds fraud risk. Requirements when revisiting:
  - SMS provider (Twilio, Vonage, AWS SNS, or Plivo). Rough US costs: about $0.01/text (much more internationally), or about $0.05/code with Twilio Verify, plus about $1–2/month for a number
  - US A2P 10DLC carrier registration (business and use-case registration with one-time and monthly fees; approval takes days to weeks), or a verified toll-free number
  - SMS pumping protection from day one: per-IP and per-number rate limits, and allow only the countries you serve
  - Verify phone numbers first (set `phoneVerificationTime`); never text reset codes to an unverified number
  - Custom reset flow: Convex Auth's built-in reset is email-based, so phone reset needs a lookup by phone plus a Phone provider to send the code
  - Reset form accepts email or phone (libphonenumber-js is already installed for parsing)

### Federated login (Google, GitHub, Discord) with account linking
Convex Auth links sign-ins to an existing user **only when that user's email is verified** (`emailVerificationTime` set). OAuth emails count as verified, but password signups currently don't verify, so enabling OAuth now would create duplicate users for the same email. Do these in order, **before** turning on any provider:

1. [x] **Resend working** (see above); verification codes use the same email setup
2. [x] **Normalize emails to lowercase**: done in the Password provider's `profile` and the email-change flow. Dev data was already all lowercase. If you import data into prod, dry-run `npx convex run migrations:lowercaseEmails --prod` first, then run it with `'{"dryRun": false}'`
3. [x] **Email verification on password signup**: add `verify` to the `Password` provider (8-digit code via Resend, like `passwordResetEmail.ts`), and add the verification step to `AuthForm`
4. [x] **Existing unverified password users**: prompt for verification on next sign-in, or add a "Verify your email" button on `/account/profile`. Don't bulk-mark them as verified (an unverified signup could be squatting someone else's email, and their Google sign-in would then link into the squatter's account)
5. [x] **Email change re-verifies**: the new address gets a code and the email only changes after it's confirmed
6. [x] **Accounts without a password**: `/account/security` shows connected sign-in methods and "Set a Password" for OAuth-only users; Profile points them there before changing email or phone
7. [x] **Set `SITE_URL`** on the dev deployment (`http://localhost:3000`); prod is covered in the Production section
8. [x] **Providers in code** (`convex/oauth.ts`): Google, GitHub, Discord, with profile overrides so only **verified** emails link (Discord and GitHub's defaults would trust unverified emails)
9. [x] **Provider buttons** on `/login` and `/signup`, plus the Sign-in Methods card on `/account/security`. **Hidden** until `AUTH_OAUTH_ENABLED=true` is set on the deployment; then each provider appears once its credentials are set
   - [ ] **Google OAuth app** at [console.cloud.google.com](https://console.cloud.google.com):
     1. Create or select a project (e.g. "Imperial Archive")
     2. **Google Auth Platform** (formerly "OAuth consent screen"): app name, support email, audience "External"
     3. **Clients → Create client**, type **Web application**
     4. Authorized redirect URI: `https://oceanic-crow-954.convex.site/api/auth/callback/google`
     5. Copy the Client ID and secret. While the app is in "Testing", only listed test users can sign in; publish it at launch
   - [ ] **GitHub OAuth app** at [github.com/settings/developers](https://github.com/settings/developers):
     1. **OAuth Apps → New OAuth App**
     2. Homepage URL `http://localhost:3000`; callback URL `https://oceanic-crow-954.convex.site/api/auth/callback/github`
     3. Copy the Client ID, then **Generate a new client secret** (shown only once)
   - [ ] **Discord app** at [discord.com/developers/applications](https://discord.com/developers/applications):
     1. **New Application**
     2. **OAuth2**: copy the Client ID, **Reset Secret** to get the secret
     3. **Redirects**: add `https://oceanic-crow-954.convex.site/api/auth/callback/discord`
   - [ ] **Set credentials** in the Convex dashboard (dev → Settings → Environment Variables): `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`, `AUTH_DISCORD_ID`/`AUTH_DISCORD_SECRET`
   - [ ] **Turn on the buttons**: set `AUTH_OAUTH_ENABLED=true` on dev (delete it or set anything else to hide them again; no redeploy needed)
   - [ ] **Prod**: separate OAuth apps (or extra callback URLs) pointing at the prod `.convex.site` domain, the same credential env vars on the prod deployment, and `AUTH_OAUTH_ENABLED=true` on prod when ready to launch
10. [ ] **Test linking both ways**: password signup → verify → Google sign-in lands in the same account, and Google first → password signup with the same email links too
11. [ ] (Only if duplicates ever appear) **Merge mutation**: move `authAccounts` rows and app data (favorites, tracking) from one user to the other, then delete the empty user

## Account Dashboard

New sections go in `apps/web/src/components/modules/Account/nav.ts` plus a page under `apps/web/src/app/account/`.

### Profile
- [ ] Display name (needed for reviews); add custom fields via a `users` table in `convex/schema.ts`
- [ ] Avatar upload with Convex file storage, or pick a faction icon from the existing set as a cheaper first version (replace the email-initial avatar in the sidebar)

### Library
- [ ] **Track**: mark books as Read / Reading / Want to Read, series progress, reading stats by faction, era, and author (replace the coming-soon page at `/account/track`)
  - Planned design: `libraryEntries` table (userId, Sanity bookId, `owned` boolean and reading `status` want/reading/read as separate fields, optional started/finished dates), indexes by_user_book, by_user_status, by_book. No row = untracked
- [x] **Favorites**: `favorites` table in Convex keyed by Sanity `_id`, Favorite button on book, series, author, faction, and era pages, and `/account/favorites` grouped by type
  - [ ] Wishlist ("want to buy") as a separate list, or fold into Track's ownership
  - [ ] Show "Favorited by N readers" on detail pages (`by_item` index already exists)
- [ ] **My Reviews** page once reviews and ratings exist
- [ ] Reading stats on the `/account` overview (books read this year, series progress)

### Preferences
- [ ] Save theme and site width to the account instead of only a cookie
- [ ] Favorite factions to personalize the home page

### Notifications
- [ ] Emails about new releases from favorited authors and series (uses the Resend setup)
- [ ] Notification settings page to opt in or out

### Danger zone
- [ ] Delete account (remove the user, auth accounts, sessions, and their library data)
- [ ] Export my data (download tracked books, favorites, and reviews as JSON/CSV)
