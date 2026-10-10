import type { ComponentType, SVGProps } from "react";
import RedditIcon from "@/components/icons/brands/reddit.svg";
import FacebookIcon from "@/components/icons/brands/facebook.svg";
import XIcon from "@/components/icons/brands/x-twitter.svg";
import BlueskyIcon from "@/components/icons/brands/bluesky.svg";
import WhatsAppIcon from "@/components/icons/brands/whatsapp.svg";
import EnvelopeIcon from "@/components/icons/envelope.svg";

export type ShareTarget = {
  /** absolute URL of the page being shared */
  url: string;
  /** page title, used as the post title (Reddit) or email subject */
  title: string;
  /** message that goes with the link where a platform supports one */
  text: string;
};

type Platform = {
  id: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: (target: ShareTarget) => string;
};

const e = encodeURIComponent;

/** Share pages ("intents") that each platform accepts without an SDK or API key */
export const PLATFORMS: Platform[] = [
  {
    id: "reddit",
    label: "Reddit",
    icon: RedditIcon,
    href: ({ url, title }) => `https://www.reddit.com/submit?url=${e(url)}&title=${e(title)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: FacebookIcon,
    href: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`,
  },
  {
    id: "x",
    label: "X",
    icon: XIcon,
    href: ({ url, text }) => `https://x.com/intent/tweet?url=${e(url)}&text=${e(text)}`,
  },
  {
    id: "bluesky",
    label: "Bluesky",
    icon: BlueskyIcon,
    href: ({ url, text }) => `https://bsky.app/intent/compose?text=${e(`${text} ${url}`)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: WhatsAppIcon,
    href: ({ url, text }) => `https://wa.me/?text=${e(`${text} ${url}`)}`,
  },
  {
    id: "email",
    label: "Email",
    icon: EnvelopeIcon,
    href: ({ url, title, text }) => `mailto:?subject=${e(title)}&body=${e(`${text}\n\n${url}`)}`,
  },
];
