import type { ComponentType, SVGProps } from "react";
import OverviewIcon from "@/components/icons/account/overview.svg";
import ProfileIcon from "@/components/icons/account/profile.svg";
import SecurityIcon from "@/components/icons/account/security.svg";
import TrackIcon from "@/components/icons/account/track.svg";
import ReadingListsIcon from "@/components/icons/account/reading-lists.svg";
import FavoritesIcon from "@/components/icons/account/favorites.svg";

export type AccountNavItem = {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  comingSoon?: boolean;
};

export const accountNav: { label?: string; items: AccountNavItem[] }[] = [
  {
    items: [
      {
        href: "/account",
        label: "Dashboard",
        description: "Your account at a glance",
        icon: OverviewIcon,
      },
      {
        href: "/account/profile",
        label: "Profile",
        description: "Your account details and email address",
        icon: ProfileIcon,
      },
      {
        href: "/account/security",
        label: "Security",
        description: "Change your password and manage signed-in devices",
        icon: SecurityIcon,
      },
    ],
  },
  {
    label: "Library",
    items: [
      {
        href: "/account/track",
        label: "Track",
        description: "Log what you've read, are reading, and want to read",
        icon: TrackIcon,
        comingSoon: true,
      },
      {
        href: "/account/reading-lists",
        label: "Reading Lists",
        description: "Curate your own reading lists and orders",
        icon: ReadingListsIcon,
        comingSoon: true,
      },
      {
        href: "/account/favorites",
        label: "Favorites",
        description: "Save the books, authors, and series you love",
        icon: FavoritesIcon,
      },
    ],
  },
];
