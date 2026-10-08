import type { ComponentType, SVGProps } from "react";
import DiscordIcon from "@/components/icons/brands/discord.svg";
import GitHubIcon from "@/components/icons/brands/github.svg";
import GoogleIcon from "@/components/icons/brands/google.svg";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/** Display info for sign-in methods, keyed by Convex Auth provider id. */
export const providerMeta: Record<string, { label: string; icon?: Icon }> = {
  password: { label: "Email & password" },
  google: { label: "Google", icon: GoogleIcon },
  github: { label: "GitHub", icon: GitHubIcon },
  discord: { label: "Discord", icon: DiscordIcon },
};
