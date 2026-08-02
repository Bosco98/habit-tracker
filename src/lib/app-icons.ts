import {
  Activity,
  Apple,
  Ban,
  BookOpen,
  Boxes,
  Brain,
  BicepsFlexed,
  Clover,
  Compass,
  Droplets,
  Dumbbell,
  Earth,
  Flame,
  Hand,
  HeartHandshake,
  House,
  LifeBuoy,
  type LucideIcon,
  Moon,
  Mountain,
  Music2,
  Orbit,
  PartyPopper,
  PenLine,
  PhoneCall,
  PiggyBank,
  Puzzle,
  Rocket,
  Shell,
  Snowflake,
  Sparkles,
  Sprout,
  Target,
  TentTree,
  ThumbsUp,
  Timer,
  UserRound,
  Users,
  Waves,
} from "lucide-react";

type IconDefinition = {
  label: string;
  icon: LucideIcon;
};

const ICONS: Record<string, IconDefinition> = {
  sprout: { label: "Growth", icon: Sprout },
  activity: { label: "Movement", icon: Activity },
  brain: { label: "Mind", icon: Brain },
  dumbbell: { label: "Strength", icon: Dumbbell },
  "book-open": { label: "Reading", icon: BookOpen },
  timer: { label: "Focus", icon: Timer },
  droplets: { label: "Hydration", icon: Droplets },
  apple: { label: "Nutrition", icon: Apple },
  moon: { label: "Sleep", icon: Moon },
  sparkles: { label: "Care", icon: Sparkles },
  music: { label: "Music", icon: Music2 },
  pen: { label: "Writing", icon: PenLine },
  house: { label: "Home", icon: House },
  "piggy-bank": { label: "Money", icon: PiggyBank },
  phone: { label: "Call", icon: PhoneCall },
  ban: { label: "Avoid", icon: Ban },
  snowflake: { label: "Cold", icon: Snowflake },
  target: { label: "Goal", icon: Target },
  users: { label: "People", icon: Users },
  person: { label: "Person", icon: UserRound },
  boxes: { label: "Community", icon: Boxes },
  rocket: { label: "Launch", icon: Rocket },
  waves: { label: "Flow", icon: Waves },
  flame: { label: "Energy", icon: Flame },
  earth: { label: "World", icon: Earth },
  tent: { label: "Gathering", icon: TentTree },
  puzzle: { label: "Connection", icon: Puzzle },
  mountain: { label: "Challenge", icon: Mountain },
  "life-buoy": { label: "Support", icon: LifeBuoy },
  clover: { label: "Good fortune", icon: Clover },
  orbit: { label: "Orbit", icon: Orbit },
  celebration: { label: "Celebration", icon: PartyPopper },
  shell: { label: "Nature", icon: Shell },
  compass: { label: "Direction", icon: Compass },
  "heart-handshake": { label: "Together", icon: HeartHandshake },
  support: { label: "Support", icon: ThumbsUp },
  energy: { label: "Energy", icon: Flame },
  effort: { label: "Strong effort", icon: BicepsFlexed },
  hand: { label: "Acknowledged", icon: Hand },
};

export const HABIT_ICON_OPTIONS = [
  "sprout",
  "activity",
  "brain",
  "dumbbell",
  "book-open",
  "timer",
  "droplets",
  "apple",
  "moon",
  "sparkles",
  "music",
  "pen",
  "house",
  "piggy-bank",
  "phone",
  "ban",
  "snowflake",
  "target",
] as const;

export const CIRCLE_ICON_OPTIONS = [
  "heart-handshake",
  "house",
  "users",
  "boxes",
  "rocket",
  "waves",
  "flame",
  "earth",
  "tent",
  "puzzle",
  "mountain",
  "life-buoy",
  "clover",
  "orbit",
  "celebration",
  "shell",
  "compass",
  "person",
] as const;

export const REACTION_ICON_OPTIONS = ["support", "energy", "effort"] as const;

export type AppIconKind = "habit" | "circle" | "reaction";

const LEGACY_ICONS: Record<string, string> = {
  "\u{1F331}": "sprout",
  "\u{1F3C3}": "activity",
  "\u{1F9E0}": "brain",
  "\u{1F4AA}": "dumbbell",
  "\u{1F4DA}": "book-open",
  "\u{1F9D8}": "timer",
  "\u{1F4A7}": "droplets",
  "\u{1F957}": "apple",
  "\u{1F634}": "moon",
  "\u{1FAA5}": "sparkles",
  "\u{1F3B8}": "music",
  "\u{270D}\u{FE0F}": "pen",
  "\u{1F9F9}": "house",
  "\u{1F4B8}": "piggy-bank",
  "\u{260E}\u{FE0F}": "phone",
  "\u{1F6AD}": "ban",
  "\u{1F9CA}": "snowflake",
  "\u{1F3AF}": "target",
  "\u{1F91D}": "heart-handshake",
  "\u{1F3E1}": "house",
  "\u{1F46F}": "users",
  "\u{1F41D}": "boxes",
  "\u{1F680}": "rocket",
  "\u{1F30A}": "waves",
  "\u{1F525}": "flame",
  "\u{1F30D}": "earth",
  "\u{1F3AA}": "tent",
  "\u{1F9E9}": "puzzle",
  "\u{26F0}\u{FE0F}": "mountain",
  "\u{1F6DF}": "life-buoy",
  "\u{1F340}": "clover",
  "\u{1FA90}": "orbit",
  "\u{1F388}": "celebration",
  "\u{1F419}": "shell",
  "\u{1F9ED}": "compass",
  "\u{1FAC2}": "heart-handshake",
  "\u{1F44F}": "support",
  "\u{1F624}": "effort",
};

const DEFAULT_ICON: Record<AppIconKind, string> = {
  habit: HABIT_ICON_OPTIONS[0],
  circle: CIRCLE_ICON_OPTIONS[0],
  reaction: REACTION_ICON_OPTIONS[0],
};

const OPTIONS: Record<AppIconKind, readonly string[]> = {
  habit: HABIT_ICON_OPTIONS,
  circle: CIRCLE_ICON_OPTIONS,
  reaction: REACTION_ICON_OPTIONS,
};

export function normalizeAppIcon(value: string | undefined, kind: AppIconKind): string {
  const reactionOverride =
    kind === "reaction" && value === "\u{1F525}" ? "energy" : undefined;
  const normalized = value
    ? (reactionOverride ?? LEGACY_ICONS[value] ?? value)
    : DEFAULT_ICON[kind];
  return OPTIONS[kind].includes(normalized) ? normalized : DEFAULT_ICON[kind];
}

export function appIconLabel(value: string, kind: AppIconKind): string {
  return ICONS[normalizeAppIcon(value, kind)].label;
}

export function appIconDefinition(value: string | undefined, kind: AppIconKind) {
  return ICONS[normalizeAppIcon(value, kind)];
}
