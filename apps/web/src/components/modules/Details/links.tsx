// /components/modules/ProfileCard/Links.tsx
import Button from "@/components/ui/Button";
import styles from "./styles.module.scss";

// centralize your label + icon registry here
import FacebookIcon from "@/components/icons/brands/facebook.svg";
import XIcon from "@/components/icons/brands/x-twitter.svg";
import InstagramIcon from "@/components/icons/brands/instagram.svg";
import BlackLibraryIcon from "@/components/icons/brands/black-library.svg";
import LexicanumIcon from "@/components/icons/brands/lexicanum.svg";
import WikipediaIcon from "@/components/icons/brands/wikipedia.svg";
import WebsiteIcon from "@/components/icons/link.svg";

const LABELS: Record<string, string> = {
  website: "Official site",
  black_library: "Black Library",
  lexicanum: "Lexicanum",
  wikipedia: "Wikipedia",
  x: "X / Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
};

const ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  website: WebsiteIcon,
  black_library: BlackLibraryIcon,
  lexicanum: LexicanumIcon,
  wikipedia: WikipediaIcon,
  x: XIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
};

export type LinkItem = { type: string; url: string };

export default function ProfileLinks({ items }: { items: LinkItem[] }) {
  const links = (items ?? []).filter((l) => l?.url);
  if (!links.length) return null;

  return (
    <ul className={styles.links}>
      {links.map((link) => {
        const Icon = ICONS[link.type];
        const label = LABELS[link.type] ?? link.type;
        return (
          <li key={`${link.type}-${link.url}`}>
            <Button
              href={link.url}
              variant="ghost"
              size="icon"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              type="button"
            >
              {Icon ? <Icon className={styles.icon} /> : null}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
