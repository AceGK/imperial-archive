# TODO

# ui 
- [ ] fix: initial opening of the account dropdown in nav will render "Dashboard" in its hovered state 
- [ ] implement: highlight the currently selected page in the account dropdown in nav
- [ ] fix: the "track" modal moves when scrolling the page, it should stay "locked" to its button/card 
- [ ] reconfigure: perhaps change primary nav to "browse", "resources", "about", and "support". With resources having more sub pages, such as "guides", and support having "donate", "contribute", "report issue", etc
  - [ ] make footer match, move legal to bottom bar
- [ ] implement: add icons to pages in nav (about, faq, etc)
- [ ] fix: account icon CLS on load 
- [ ] improve: hero scroll down button (perhaps ditch "scroll", or fade out gradually on scroll state rather than scroll thresold)
- [ ] improve: reading tracker image/example section on homepage 
- [ ] improve: change border/hover state of blog cards? 
- [ ] improve: combine theme, layout, and card controls as singular cog icon in nav? 
- [ ] improve: accordion body content overflows container due to height being calculated upon open. This should prevent overflow on open accordions when screensize changes 
- [x] improve: make login/signup a modal popup instead of just a page.
- [ ] improve login/signup page, perhaps as fullscreen with extra data? 
- [ ] improve: add hover 'click to copy' option for pages with TOC (e.g. blog posts, about, etc)
- [ ] improve: don't hide nav on scroll if modal is open
- [ ] improve: make +Track button on book cards controled with "Display" options to either be on-hover, inline, or hidden completely
- [ ] fix: book count limit for infinite loading (so there's always full rows)
- [ ] fix: catalog nav from resetting into place based on scroll threshold (perhaps see how I managed this on PL-next)
- [ ] fix: create my own header image for /books instead of the black library owned image
- [ ] improve: series cards should maybe say how many lists + works?
- [ ] improve: Perhaps change "works" to "publications"? 
- [ ] improve: update favicon to original artwork
- [ ] improve: add the "Book N in series, read after…" line to book pages, which gives each page original text that answers reading-order searches directly.

# seo 
- [ ] audit for keywords etc 

# ideas 
- [ ] book reviews from APIs, combined into aggregate review count + let users write IA book reviews
- [ ] include ISBNs and additional book images (different formats/editions)
 
## Auth (Convex Auth)

- [ ] remove unverified accounts after X amount of time
- [ ] captcha for signup/login? 

### Emails (Resend)
Emails (plain text, defined in `apps/web/convex/emails.ts`): password reset code and email verification code. Test with `npx convex run emails:sendTest '{"to": "delivered@resend.dev"}'`.
- [ ] Verify the sending domain (`imperialarchive.com`) in Resend, if not done yet (check Resend → Domains)
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
- [ ] Confirm the prod `AUTH_RESEND_KEY` is a separate prod key (`imperial-archive-convex-prod`, Sending access only, limited to `imperialarchive.com`), not the dev one
- [ ] Later: OAuth client IDs and secrets on prod (`AUTH_GOOGLE_ID`, etc.), using prod OAuth apps whose callback URLs point at the prod `.convex.site` domain

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
Convex Auth links sign-ins to an existing user **only when that user's email is verified** (`emailVerificationTime` set). The groundwork is done: email verification, lowercase emails, re-verification on email change, providers in `convex/oauth.ts` that only trust verified emails, and provider buttons on `/login`, `/signup` and `/account/security`, **hidden** until `AUTH_OAUTH_ENABLED=true` is set. Don't bulk-mark unverified users as verified (an unverified signup could be squatting someone else's email). If you import data into prod, dry-run `npx convex run migrations:lowercaseEmails --prod` first, then run it with `'{"dryRun": false}'`.

1. Create the provider apps and turn them on:
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
2. [ ] **Test linking both ways**: password signup → verify → Google sign-in lands in the same account, and Google first → password signup with the same email links too
3. [ ] (Only if duplicates ever appear) **Merge mutation**: move `authAccounts` rows and app data (favorites, tracking) from one user to the other, then delete the empty user

## Account Dashboard

New sections go in `apps/web/src/components/modules/Account/nav.ts` plus a page under `apps/web/src/app/account/`.

### Profile
- [ ] Display name (needed for reviews); add custom fields via a `users` table in `convex/schema.ts`
- [ ] Avatar upload with Convex file storage, or pick a faction icon from the existing set as a cheaper first version (replace the email-initial avatar in the sidebar)

### Library
- [ ] **Track, next steps** (tracking itself is built: the `tracked` table, want/reading/read plus owned, `/account/track`): series progress, reading stats by faction, era, and author, and achievements (previewed on `/track`); optional started/finished dates
- Favorites:
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
