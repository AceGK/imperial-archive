// components/modules/Nav/nav.ts
import type { ComponentType, SVGProps } from "react";
import BookIcon from "@/components/icons/book-spine.svg";
import QuillPenIcon from "@/components/icons/quill-pen.svg";
import BooksIcon from "@/components/icons/books.svg";
import ShieldIcon from "@/components/icons/shield.svg";
import HourglassIcon from "@/components/icons/hourglass.svg";
import SwordsIcon from "@/components/icons/swords.svg";
import SignpostIcon from "@/components/icons/signpost.svg";
import RouteIcon from "@/components/icons/route.svg";
import TimelineIcon from "@/components/icons/timeline.svg";
import ScrollIcon from "@/components/icons/scroll.svg";
import ShoppingBagIcon from "@/components/icons/shopping-bag.svg";
import InfoIcon from "@/components/icons/square-info.svg";
import BookBookmarkIcon from "@/components/icons/book-bookmark.svg";
import NewspaperIcon from "@/components/icons/newspaper.svg";
import QuestionIcon from "@/components/icons/circle-question.svg";
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

/**
 * The desktop bar, left to right: groups open a dropdown, plain items are links.
 * The phone menu and the footer list the same groups.
 */
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
  {
    label: "Resources",
    links: [
      {
        href: "/where-to-buy",
        label: "Where to Buy",
        description: "Print, ebook, and audiobooks",
        icon: ShoppingBagIcon,
      },
      {
        href: "/where-to-start",
        label: "Where to Start",
        description: "First books for new readers",
        icon: SignpostIcon,
        comingSoon: true,
      },
      {
        href: "/guides",
        label: "Reading Guides",
        description: "Reading orders and paths",
        icon: RouteIcon,
        comingSoon: true,
      },
      {
        href: "/timeline",
        label: "Timeline",
        description: "Key events of the 41st millennium",
        icon: TimelineIcon,
      },
      {
        href: "/glossary",
        label: "Glossary",
        description: "Terms of the 41st millennium",
        icon: ScrollIcon,
        comingSoon: true,
      },
    ],
  },
  {
    label: "Info",
    links: [
      { href: "/about", label: "About", description: "The charter behind this archive", icon: InfoIcon },
      { href: "/track", label: "Tracking", description: "How to track your reading", icon: BookBookmarkIcon },
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
        href: "/report/missing",
        label: "Report Missing",
        description: "A book, author, or series the Archive doesn't have yet",
        icon: BookQuestionIcon,
      },
    ],
  },
];

/** The groups, in order; a dropdown's index here is its index everywhere in the menu */
export const dropdownItems = NAV_ITEMS.filter((item): item is NavGroup => !("href" in item));

/** One of the groups above by its label, e.g. for the footer's columns */
export const navGroup = (label: string) => dropdownItems.find((g) => g.label === label)!;

/** Support's links, also listed on the /support hub page */
export const supportGroup = navGroup("Support");

/** The phone menu's sections, each a two-column grid: the same groups as the bar */
export const mobileItems: NavGroup[] = dropdownItems;
