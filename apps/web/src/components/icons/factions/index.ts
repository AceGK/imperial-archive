// /components/icons/factions/index.ts
import type { ComponentType, SVGProps } from "react";

// === Group icons ===
import SpaceMarines from "./space-marines.svg";
import Aquila from "./aquila.svg";
import Chaos from "./chaos.svg";
import Xenos from "./xenos.svg";

// === Faction icons ===
import BlackLegion from "./black-legion.svg";
import GenestealerCults from "./genestealer-cults.svg";
import ImperialFists from "./imperial-fists.svg";
import ImperialKnights from "./imperial-knights.svg";
import IronWarriors from "./iron-warriors.svg";
import Necrons from "./necrons.svg";
import Orks from "./orks.svg";
import RavenGuard from "./raven-guard.svg";
import SpaceWolves from "./space-wolves.svg";
import Tau from "./tau.svg";
import AdeptusTitanicus from "./adeptus-titanicus.svg";
import WhiteScars from "./white-scars.svg";
import BlackTemplars from "./black-templars.svg";
import BloodAngels from "./blood-angels.svg";
import DarkAngels from "./dark-angels.svg";
import Deathwatch from "./deathwatch.svg";
import GreyKnights from "./grey-knights.svg";
import Ultramarines from "./ultramarines.svg";
import Salamanders from "./salamanders.svg";
import IronHands from "./iron-hands.svg";
import AdeptaSororitas from "./adepta-sororitas.svg";
import AdeptusCustodes from "./adeptus-custodes.svg";
import AdeptusMechanicus from "./adeptus-mechanicus.svg";
import AstraMilitarum from "./astra-militarum.svg";
import Inquisition from "./inquisition.svg";
import DeathGuard from "./death-guard.svg";
import ThousandSons from "./thousand-sons.svg";
import WorldEaters from "./world-eaters.svg";
import ChaosDaemons from "./chaos-daemons.svg";
import NightLords from "./night-lords.svg";
import Aeldari from "./aeldari.svg";
import Drukhari from "./drukhari.svg";
import Tyranids from "./tyranids.svg";
import LeaguesOfVotann from "./leagues-of-votann.svg";
import EmperorsChildren from "./emperors-children.svg";
import WordBearers from "./word-bearers.svg";
import AlphaLegion from "./alpha-legion.svg";
import DeathKorps from "./death-korps-of-krieg.svg";
import CatachanJungleFighters from "./catachan-jungle-fighters.svg";
import TitanicusTraitoris from "./titanicus-traitoris.svg";
import RogueTraders from "./rogue-traders.svg";
import OfficioAssassinorum from "./officio-assassinorum.svg";
import AdeptusArbites from "./adeptus-arbites.svg";
import AdeptusMinistorum from "./adeptus-ministorum.svg";
import DarkMechanicum from "./dark-mechanicum.svg";
import ChaosSpaceMarines from "./chaos-space-marines.svg";
import Khorne from "./khorne.svg";
import Nurgle from "./nurgle.svg";
import Tzeentch from "./tzeentch.svg";
import Slaanesh from "./slaanesh.svg";
import Carcharodons from "./carcharodons.svg";
import CrimsonFists from "./crimson-fists.svg";
import Scythes from "./scythes-of-the-emperor.svg";
import SoulDrinkers from "./soul-drinkers.svg";
import FleshTearers from "./flesh-tearers.svg";
import BloodRavens from "./blood-ravens.svg";
import SistersofSilence from "./sisters-of-silence.svg";
import Skitarii from "./skitarii.svg";
import SonsOfHorus from "./sons-of-horus.svg";
import ChaosKnights from "./chaos-knights.svg";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const iconRegistry = {
  // === Groups ===
  "space-marines": SpaceMarines,
  "aquila": Aquila,
  "chaos": Chaos,
  "xenos": Xenos,

  // === Factions ===
  "black-legion": BlackLegion,
  "genestealer-cults": GenestealerCults,
  "imperial-fists": ImperialFists,
  "imperial-knights": ImperialKnights,
  "iron-warriors": IronWarriors,
  "necrons": Necrons,
  "orks": Orks,
  "raven-guard": RavenGuard,
  "space-wolves": SpaceWolves,
  "tau-empire": Tau,
  "adeptus-titanicus": AdeptusTitanicus,
  "white-scars": WhiteScars,
  "black-templars": BlackTemplars,
  "blood-angels": BloodAngels,
  "dark-angels": DarkAngels,
  "deathwatch": Deathwatch,
  "grey-knights": GreyKnights,
  "ultramarines": Ultramarines,
  "salamanders": Salamanders,
  "iron-hands": IronHands,
  "adepta-sororitas": AdeptaSororitas,
  "adeptus-custodes": AdeptusCustodes,
  "adeptus-mechanicus": AdeptusMechanicus,
  "astra-militarum": AstraMilitarum,
  "inquisition": Inquisition,
  "chaos-space-marines": ChaosSpaceMarines,
  "death-guard": DeathGuard,
  "thousand-sons": ThousandSons,
  "world-eaters": WorldEaters,
  "chaos-daemons": ChaosDaemons,
  "night-lords": NightLords,
  "aeldari": Aeldari,
  "drukhari": Drukhari,
  "tyranids": Tyranids,
  "leagues-of-votann": LeaguesOfVotann,
  "emperors-children": EmperorsChildren,
  "word-bearers": WordBearers,
  "alpha-legion": AlphaLegion,
  "death-korps-of-krieg": DeathKorps,
  "catachan-jungle-fighters": CatachanJungleFighters,
  "titanicus-traitoris": TitanicusTraitoris,
  "rogue-traders": RogueTraders,
  "officio-assassinorum": OfficioAssassinorum,
  "adeptus-arbites": AdeptusArbites,
  "adeptus-ministorum": AdeptusMinistorum,
  "dark-mechanicum": DarkMechanicum,
  "khorne": Khorne,
  "nurgle": Nurgle,
  "tzeentch": Tzeentch,
  "slaanesh": Slaanesh,
  "carcharodons": Carcharodons,
  "crimson-fists": CrimsonFists,
  "scythes-of-the-emperor": Scythes,
  "soul-drinkers": SoulDrinkers,
  "flesh-tearers": FleshTearers,
  "blood-ravens": BloodRavens,
  "sisters-of-silence": SistersofSilence,
  "skitarii": Skitarii,
  "sons-of-horus": SonsOfHorus,
  "chaos-knights": ChaosKnights,
} as const;

export type IconId = keyof typeof iconRegistry;
