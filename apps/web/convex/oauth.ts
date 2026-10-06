import Discord from "@auth/core/providers/discord";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { query } from "./_generated/server";

// OAuth providers. Each reads AUTH_<ID>_ID / AUTH_<ID>_SECRET from the Convex env when used;
// a provider without credentials only fails when someone tries it (its button stays hidden).
//
// Convex Auth links a sign-in to an existing user by verified email, and treats OAuth emails as
// verified unless the profile says otherwise. So every profile below reports `emailVerified`
// honestly; otherwise an unverified Discord/GitHub email could attach to someone else's account.

const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() || undefined;

const GoogleProvider = Google({
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: normalizeEmail(profile.email),
      image: profile.picture,
      emailVerified: profile.email_verified === true,
    };
  },
});

const GitHubProvider = GitHub({
  userinfo: {
    url: "https://api.github.com/user",
    // The default falls back to the primary email without checking it's verified
    async request({ tokens }: { tokens: { access_token?: string } }) {
      const headers = { Authorization: `Bearer ${tokens.access_token}`, "User-Agent": "authjs" };
      const profile = await fetch("https://api.github.com/user", { headers }).then((r) => r.json());
      const emails: { email: string; primary: boolean; verified: boolean }[] = await fetch(
        "https://api.github.com/user/emails",
        { headers },
      ).then((r) => (r.ok ? r.json() : []));
      const verified = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
      return { ...profile, email: verified?.email ?? null, email_verified: verified !== undefined };
    },
  },
  profile(profile) {
    return {
      id: String(profile.id),
      name: profile.name ?? profile.login,
      email: normalizeEmail(profile.email),
      image: profile.avatar_url,
      emailVerified: (profile as { email_verified?: boolean }).email_verified === true,
    };
  },
});

const DiscordProvider = Discord({
  profile(profile) {
    return {
      id: profile.id,
      name: profile.global_name ?? profile.username,
      email: normalizeEmail(profile.email),
      image: profile.avatar
        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
        : undefined,
      // Discord allows unverified emails
      emailVerified: profile.verified === true,
    };
  },
});

export const oauthProviders = [GoogleProvider, GitHubProvider, DiscordProvider];

export const OAUTH_PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
  { id: "discord", label: "Discord" },
] as const;

/**
 * OAuth providers to show in the UI. Off unless AUTH_OAUTH_ENABLED=true on this deployment,
 * then only providers whose credentials are set.
 */
export const enabledProviders = query({
  args: {},
  handler: async () =>
    process.env.AUTH_OAUTH_ENABLED !== "true"
      ? []
      : OAUTH_PROVIDERS.filter(
          ({ id }) =>
            process.env[`AUTH_${id.toUpperCase()}_ID`] &&
            process.env[`AUTH_${id.toUpperCase()}_SECRET`],
        ),
});
