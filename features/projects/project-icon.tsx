import {
  BookOpen,
  Briefcase,
  Camera,
  Code,
  Coffee,
  FlaskConical,
  Folder,
  Gamepad2,
  GraduationCap,
  Globe,
  Heart,
  Leaf,
  Music,
  PenTool,
  Pill,
  Rocket,
  ShoppingBag,
  Store,
  Video,
  type LucideIcon,
} from "lucide-react";
import { createElement } from "react";

/** Curated icon set. The stored value is the key, so renaming a key breaks saved projects. */
export const PROJECT_ICONS = {
  folder: Folder,
  pill: Pill,
  "shopping-bag": ShoppingBag,
  store: Store,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  code: Code,
  globe: Globe,
  video: Video,
  "pen-tool": PenTool,
  rocket: Rocket,
  camera: Camera,
  music: Music,
  heart: Heart,
  briefcase: Briefcase,
  "flask-conical": FlaskConical,
  leaf: Leaf,
  coffee: Coffee,
  "gamepad-2": Gamepad2,
} satisfies Record<string, LucideIcon>;

export type ProjectIconName = keyof typeof PROJECT_ICONS;

export const PROJECT_ICON_NAMES = Object.keys(PROJECT_ICONS) as ProjectIconName[];

function resolve(name: string): LucideIcon {
  return name in PROJECT_ICONS ? PROJECT_ICONS[name as ProjectIconName] : Folder;
}

export function ProjectIcon({ name, className }: { name: string; className?: string }) {
  return createElement(resolve(name), { "aria-hidden": true, className });
}
