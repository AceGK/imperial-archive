// The timeline's content. Summaries are written for the Archive from the
// sources listed in SOURCES; each entry cites them by key.

export type SourceKey = "lexicanum" | "fandom" | "rb6" | "rb5" | "rb8" | "cosm8";

export type Source = {
  title: string;
  detail?: string;
  href?: string;
};

/** Numbered in this order on the page */
export const SOURCES: Record<SourceKey, Source> = {
  lexicanum: {
    title: "Lexicanum: Timeline",
    href: "https://wh40k.lexicanum.com/wiki/Timeline",
  },
  fandom: {
    title: "Warhammer 40k Wiki: Timeline of the Warhammer 40,000 Universe",
    detail: "Text under CC BY-SA",
    href: "https://warhammer40k.fandom.com/wiki/Timeline_of_the_Warhammer_40,000_Universe",
  },
  rb6: { title: "Warhammer 40,000 Rulebook, 6th Edition", detail: "pp. 166–167, as cited by Lexicanum" },
  rb5: { title: "Warhammer 40,000 Rulebook, 5th Edition", detail: "pp. 122–125, as cited by Lexicanum" },
  rb8: { title: "Warhammer 40,000 Rulebook, 8th Edition", detail: "pp. 46–47, as cited by Lexicanum" },
  cosm8: { title: "Codex: Space Marines, 8th Edition", detail: "pp. 20–21, as cited by Lexicanum" },
};

export const SOURCE_ORDER = Object.keys(SOURCES) as SourceKey[];

export type Era = {
  id: string;
  name: string;
  /** First and last millennium the era spans, for the jump links */
  from: number;
  to: number;
};

/** The broad eras, oldest first; an entry belongs to the last era that starts at or before it */
export const ERAS: Era[] = [
  { id: "ancient", name: "Ancient History", from: 0, to: 0 },
  { id: "terra", name: "Age of Terra", from: 1, to: 14 },
  { id: "technology", name: "Dark Age of Technology", from: 15, to: 24 },
  { id: "strife", name: "Age of Strife", from: 25, to: 29 },
  { id: "crusade", name: "Great Crusade & Horus Heresy", from: 30, to: 31 },
  { id: "imperium", name: "Age of the Imperium", from: 32, to: 40 },
  { id: "dark-imperium", name: "Age of the Dark Imperium", from: 41, to: 42 },
];

export type TimelineEvent = { date: string; text: string };

export type Entry = {
  /** 0 is everything before M1 */
  millennium: number;
  title: string;
  blurb: string;
  events?: TimelineEvent[];
  /** Where the sources disagree */
  note?: string;
  /** A fuller account of this millennium elsewhere, shown when the card is open */
  more?: { label: string; href: string };
  sources: SourceKey[];
};

export const ENTRIES: Entry[] = [
  {
    millennium: 0,
    title: "The War in Heaven",
    blurb:
      "Millions of years before humanity, the Old Ones and the Necrontyr fight the War in Heaven. The Necrontyr trade their flesh for undying machine bodies and become the Necrons, then sink into the Great Sleep in their tomb worlds. In time the Aeldari rise to rule the galaxy.",
    events: [
      { date: "Ancient", text: "The Necrontyr war on the Old Ones and lose" },
      { date: "Ancient", text: "Biotransference: the Necrontyr become the Necrons" },
      { date: "Ancient", text: "The Great Sleep begins in the tomb worlds" },
    ],
    sources: ["fandom", "lexicanum"],
  },
  {
    millennium: 1,
    title: "The Age of Terra (AKA the Golden Age) begins",
    blurb:
      "Humanity rises on Terra, the world once called Earth. In the Age of Terra, also called the Golden Age or Age of Progress, it leaves its pre-industrial past behind, reaches space, and settles its own solar system.",
    sources: ["lexicanum", "rb5", "fandom"],
  },
  {
    millennium: 3,
    title: "The Stellar Exodus",
    blurb:
      "From some point in the third millennium, humanity reaches for the stars. Without the Warp, settlers cross the void in vast sublight generation ships or frozen in cryogenic sleep, founding the oldest human colonies.",
    sources: ["fandom"],
  },
  {
    millennium: 15,
    title: "The Dark Age of Technology begins",
    blurb:
      "The Age of Terra gives way to the Age of Technology, remembered as the Dark Age of Technology: the height of human science, whose records are now almost entirely lost.",
    sources: ["lexicanum", "rb6", "fandom"],
  },
  {
    millennium: 18,
    title: "The Warp-Drive",
    blurb:
      "Humanity discovers the Warp-Drive. With Navigators, psychic mutants able to steer through the Warp, it spreads across the galaxy far faster than before. The first Knight Worlds, settled by scouts from Old Earth, already predate it.",
    sources: ["fandom"],
  },
  {
    millennium: 25,
    title: "The Age of Strife begins",
    blurb:
      "The Dark Age of Technology ends in the Age of Strife, or Old Night. Warp storms cut humanity's worlds off from one another for some five thousand years. Far away, the bored and decadent Aeldari begin forming pleasure cults.",
    sources: ["lexicanum", "rb6", "fandom"],
  },
  {
    millennium: 30,
    title: "The Fall of the Aeldari and the Great Crusade",
    blurb:
      "The Aeldari's excesses give birth to Slaanesh. Its creation shatters their empire and tears open the Eye of Terror, and the warp storms of Old Night clear. On Terra the Emperor ends the Unification Wars, allies with Mars, and launches the Great Crusade to reunite humanity.",
    events: [
      { date: "712.M30", text: "The Unification Wars end with Terra united" },
      { date: "739.M30", text: "The Treaty of Mars binds the Mechanicum to the Emperor" },
      { date: "c. 798.M30", text: "The Great Crusade begins" },
    ],
    sources: ["lexicanum", "rb6", "fandom"],
  },
  {
    millennium: 31,
    title: "The Horus Heresy",
    blurb:
      "The Great Crusade ends in civil war when Warmaster Horus turns half the Space Marine Legions to Chaos. The Heresy ends at the Siege of Terra, with Horus dead and the Emperor bound to the Golden Throne. In the Great Scouring that follows, the Traitors are driven into the Eye of Terror and the Legions are broken into Chapters.",
    events: [
      { date: "005.M31", text: "The Horus Heresy begins" },
      { date: "c. 006.M31", text: "Betrayal at Isstvan V" },
      { date: "014.M31", text: "The Siege of Terra; the Great Scouring begins" },
      { date: "c. 021.M31", text: "The Second Founding divides the Legions into Chapters" },
    ],
    sources: ["lexicanum", "rb6", "fandom"],
    more: {
      label: "The Horus Heresy, year by year, on Lexicanum",
      href: "https://wh40k.lexicanum.com/wiki/Timeline_of_the_Horus_Heresy",
    },
  },
  {
    millennium: 32,
    title: "The War of the Beast and the Forging",
    blurb:
      "The Imperium's age of rebuilding ends when Orks rampage across it in the War of the Beast. The crisis that follows, the Beheading, shakes the High Lords of Terra, and the Imperium enters the long expansion known as the Forging.",
    events: [
      { date: "544–546.M32", text: "The War of the Beast" },
      { date: "546.M32", text: "The Beheading" },
      { date: "888.M32", text: "The Astropath Wars" },
    ],
    sources: ["lexicanum", "rb5", "fandom"],
  },
  {
    millennium: 33,
    title: "The Forging",
    blurb:
      "The Imperium grows and hardens. The Ecclesiarchy flexes its new political strength in the War of the Confessor, and relics of the distant past begin to resurface.",
    events: [
      { date: "313.M33", text: "The Siege of Eternity's Gate" },
      { date: "615.M33", text: "The pre-Heresy cruiser Blade of Infinity returns from the Warp" },
    ],
    sources: ["fandom"],
  },
  {
    millennium: 34,
    title: "Warp Stars and a rival Terra",
    blurb:
      "Strange Warp Stars appear after a storm bursts from the Eye of Terror, and Nova Terra rises to challenge the authority of Terra itself.",
    events: [
      { date: "401.M34", text: "The Howling" },
      { date: "666.M34", text: "The first Warp Stars are sighted" },
      { date: "934.M34", text: "Craftworld Ulthwé warns the Imperium" },
    ],
    sources: ["fandom", "lexicanum"],
  },
  {
    millennium: 35,
    title: "The Nova Terra Interregnum",
    blurb:
      "The Forging ends as the Imperium splits between Terra and Nova Terra, the Time of the Twin Empires, for some nine centuries of cold civil war. It closes with the Cataclysm of Souls, and with the Cursed Founding of Space Marines.",
    events: [
      { date: "975.M35", text: "The Cataclysm of Souls reunites the Imperium" },
      { date: "980.M35", text: "The Hrud Rising" },
      { date: "991.M35", text: "The 21st, or Cursed, Founding" },
    ],
    sources: ["lexicanum", "rb5", "fandom"],
  },
  {
    millennium: 36,
    title: "The Age of Apostasy",
    blurb:
      "One of the bloodiest eras since the Heresy. High Lord Goge Vandire seizes both the Ecclesiarchy and the Administratum and begins the Reign of Blood, until the preacher Sebastian Thor brings him down and takes the Ecclesiarch's seat.",
    events: [
      { date: "c. 200.M36", text: "The Reign of Blood begins" },
      { date: "310.M36", text: "The Plague of Unbelief" },
    ],
    sources: ["lexicanum", "rb5", "fandom"],
  },
  {
    millennium: 37,
    title: "The Age of Redemption",
    blurb:
      "Determined never to repeat the Reign of Blood, the High Lords purge their own ranks, and the Imperium launches great crusades of faith. On the Eastern Fringe, the T'au begin their rise.",
    events: [
      { date: "010.M37", text: "The Wrath of the Chaos Sun" },
      { date: "321.M37", text: "The Abyssal Crusade begins" },
      { date: "555.M37", text: "The Occlusiad War" },
    ],
    sources: ["lexicanum", "rb5", "fandom"],
  },
  {
    millennium: 38,
    title: "The Age of Redemption ends",
    blurb:
      "The crusading fervour fades. Survivors of the Abyssal Crusade return from the Eye of Terror, and the Imperium begins its long, slow decline.",
    events: [
      { date: "112.M38", text: "The Abyssal Crusade's survivors return" },
      { date: "666.M38", text: "The Grim Harvest" },
    ],
    sources: ["lexicanum", "rb5", "fandom"],
  },
  {
    millennium: 39,
    title: "The Waning",
    blurb:
      "The Imperium's strength ebbs. Wars and cataclysms chip away at its borders, and the Redemption Crusades begin.",
    events: [
      { date: "001.M39", text: "The Conflict of Helica" },
      { date: "103.M39", text: "The Mausolean Cataclysm" },
      { date: "131.M39", text: "The Redemption Crusades begin" },
    ],
    sources: ["lexicanum", "rb5", "fandom"],
  },
  {
    millennium: 41,
    title: "The Time of Ending",
    blurb:
      "The Waning gives way to the Time of Ending. Tyranid hive fleets arrive from beyond the galaxy, the Necrons wake, and Abaddon's Black Crusades batter the Imperium. In the final year, Cadia falls, the Great Rift splits the galaxy, and Roboute Guilliman returns.",
    events: [
      { date: "139.M41", text: "The Gothic War, the 12th Black Crusade" },
      { date: "745.M41", text: "Hive Fleet Behemoth: first contact with the Tyranids" },
      { date: "941.M41", text: "The Second War for Armageddon" },
      { date: "963.M41", text: "The Imperium first meets the T'au" },
      { date: "993.M41", text: "Hive Fleet Kraken" },
      { date: "997.M41", text: "Hive Fleet Leviathan" },
      { date: "998.M41", text: "The Third War for Armageddon" },
      { date: "999.M41", text: "The 13th Black Crusade, the fall of Cadia, and the Great Rift" },
      { date: "c. 999.M41", text: "Roboute Guilliman awakens" },
    ],
    sources: ["lexicanum", "rb8", "fandom"],
  },
  {
    millennium: 42,
    title: "The Era Indomitus",
    blurb:
      "The Great Rift has cut the Imperium in two. Guilliman, Lord Commander once more, leads the Indomitus Crusade, the largest Imperial war host since the Great Crusade, to relieve worlds on the brink.",
    events: [
      { date: "c. 999.M41 onward", text: "The Indomitus Crusade" },
      { date: "001–025.M42", text: "The War of Beasts on Vigilus" },
      { date: "c. 012.M42", text: "The Plague Wars end" },
    ],
    note: "The Great Rift scrambled the Imperial calendar, so dates from this era are uncertain; the original count of years is used here.",
    sources: ["lexicanum", "cosm8", "fandom"],
  },
];

/** The era an entry belongs to */
export function eraOf(millennium: number): Era {
  return [...ERAS].reverse().find((e) => e.from <= millennium) ?? ERAS[0];
}

/** "M41", or "Before M1" for the ancient entry */
export function millenniumLabel(millennium: number): string {
  return millennium === 0 ? "Before M1" : `M${millennium}`;
}

export type TimelineItem =
  | { kind: "entry"; entry: Entry }
  | { kind: "gap"; from: number; to: number };

/** Entries in order, with each run of millennia that have nothing recorded collapsed into one gap */
export function timelineItems(last = 42): TimelineItem[] {
  const byMillennium = new Map(ENTRIES.map((e) => [e.millennium, e]));
  const items: TimelineItem[] = [];
  for (let m = 0; m <= last; m++) {
    const entry = byMillennium.get(m);
    if (entry) {
      items.push({ kind: "entry", entry });
      continue;
    }
    const prev = items[items.length - 1];
    if (prev?.kind === "gap" && prev.to === m - 1) prev.to = m;
    else items.push({ kind: "gap", from: m, to: m });
  }
  return items;
}
