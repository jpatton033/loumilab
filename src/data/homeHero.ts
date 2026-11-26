// Homepage hero film: one ordered scene list. Swap, add or reorder scenes here only.
// `tall` is an optional portrait cut for phones; scenes without it fall back to `wide`.
import heroCeramic from "@/assets/video/home/hero-ceramic.mp4.asset.json";
import heroArchitect from "@/assets/video/home/hero-architect.mp4.asset.json";
import heroFlorist from "@/assets/video/home/hero-florist.mp4.asset.json";
import heroPoster from "@/assets/story/home/arch-light.jpg";

export type HeroScene = { id: string; wide: string; tall?: string };

export const HERO_POSTER = heroPoster;
export const HERO_SCENES: HeroScene[] = [
  { id: "ceramic", wide: heroCeramic.url },
  { id: "architect", wide: heroArchitect.url },
  { id: "florist", wide: heroFlorist.url },
];
