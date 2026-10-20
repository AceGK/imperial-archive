// components/modules/Nav/nav.ts
import type { ComponentType, SVGProps } from "react";
import BookIcon from "@/components/icons/book-spine.svg";
import QuillPenIcon from "@/components/icons/quill-pen.svg";
import BooksIcon from "@/components/icons/books.svg";
import ShieldIcon from "@/components/icons/shield.svg";
import HourglassIcon from "@/components/icons/hourglass.svg";
import SwordsIcon from "@/components/icons/swords.svg";
import InfoIcon from "@/components/icons/square-info.svg";
import ScrollIcon from "@/components/icons/scroll.svg";
import NewspaperIcon from "@/components/icons/newspaper.svg";
import QuestionIcon from "@/components/icons/circle-question.svg";
import BookBookmarkIcon from "@/components/icons/book-bookmark.svg";
import CoinsIcon from "@/components/icons/coins.svg";
import BugIcon from "@/components/icons/bug.svg";
import BookQuestionIcon from "@/components/icons/book-question.svg";
import FeedbackIcon from "@/components/icons/feedback.svg";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;
export type NavLink = {
  href: string;
  label: string;
  description?: string;
  icon?: NavIcon;
  comingSoon?: boolean;
};
export type NavGroup = { label: string; links: NavLink[]; columns?: number };
export type NavPlain = { href: string; label: string; comingSoon?: boolean };
export type NavItem = NavGroup | NavPlain;

/** The desktop bar, left to right: groups open a dropdown, plain items are links */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Browse",
    columns: 2,
    links: [
      { href: "/books", label: "Books", description: "The full catalog, cover to cover", icon: BookIcon },
      { href: "/authors", label: "Authors", description: "Writers of the Black Library", icon: QuillPenIcon },
      { href: "/series", label: "Series", description: "Ongoing sagas and campaigns", icon: BooksIcon },
      { href: "/factions", label: "Factions", description: "Armies, legions, and chapters", icon: ShieldIcon },
      { href: "/eras", label: "Eras", description: "Epochs of the 41st millennium", icon: HourglassIcon },
      {
        href: "/characters",
        label: "Characters",
        description: "Heroes and villains across the books",
        icon: SwordsIcon,
        comingSoon: true,
      },
    ],
  },
  { href: "/track", label: "Track" },
  {
    label: "Info",
    links: [
      { href: "/about", label: "About", description: "The charter behind this archive", icon: InfoIcon },
      { href: "/resources", label: "Resources", description: "Reading orders and community guides", icon: ScrollIcon },
      { href: "/blog", label: "Blog", description: "News and dispatches from the Archive", icon: NewspaperIcon },
      { href: "/faq", label: "FAQ", description: "Common questions, answered", icon: QuestionIcon },
    ],
  },
  {
    label: "Support",
    links: [
      { href: "/donate", label: "Donate", description: "Help cover hosting and upkeep", icon: CoinsIcon },
      { href: "/feedback", label: "Feedback", description: "Ideas, requests, and suggestions", icon: FeedbackIcon },
      {
        href: "/report/site-issue",
        label: "Report Bug",
        description: "Something broken, confusing, or hard to use",
        icon: BugIcon,
      },
      {
        href: "/report/missing-book",
        label: "Report Missing Book",
        description: "A Black Library title the Archive doesn't have yet",
        icon: BookQuestionIcon,
      },
    ],
  },
];

/** The groups, in order; a dropdown's index here is its index everywhere in the menu */
export const dropdownItems = NAV_ITEMS.filter((item): item is NavGroup => !("href" in item));

/** Support's links, also listed on the /support hub page */
export const supportGroup = dropdownItems.find((g) => g.label === "Support")!;

// The mobile menu's sections are two-column grids: the single Track link joins
// Info there, second
const browseGroup = dropdownItems.find((g) => g.label === "Browse")!;
const infoGroup = dropdownItems.find((g) => g.label === "Info")!;
export const mobileItems: NavGroup[] = [
  browseGroup,
  {
    ...infoGroup,
    links: [
      infoGroup.links[0],
      { href: "/track", label: "Track", icon: BookBookmarkIcon },
      ...infoGroup.links.slice(1),
    ],
  },
  supportGroup,
];
