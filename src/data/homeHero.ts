// Homepage hero film "Human Potential — The Next Chapter": one ordered scene list.
// Swap, add or reorder scenes here only. `tall` is the portrait cut for phones; without it phones use `wide`.
import curiosityW from "@/assets/video/home/next/hero-curiosity.mp4.asset.json";
import curiosityT from "@/assets/video/home/next/hero-curiosity-tall.mp4.asset.json";
import imaginationW from "@/assets/video/home/next/hero-imagination.mp4.asset.json";
import imaginationT from "@/assets/video/home/next/hero-imagination-tall.mp4.asset.json";
import creationW from "@/assets/video/home/next/hero-creation.mp4.asset.json";
import creationT from "@/assets/video/home/next/hero-creation-tall.mp4.asset.json";
import impactW from "@/assets/video/home/next/hero-impact.mp4.asset.json";
import impactT from "@/assets/video/home/next/hero-impact-tall.mp4.asset.json";
import discoveryW from "@/assets/video/home/next/hero-discovery.mp4.asset.json";
import discoveryT from "@/assets/video/home/next/hero-discovery-tall.mp4.asset.json";
import tomorrowW from "@/assets/video/home/next/hero-tomorrow.mp4.asset.json";
import tomorrowT from "@/assets/video/home/next/hero-tomorrow-tall.mp4.asset.json";
import posterW from "@/assets/video/home/next/hero-poster.webp.asset.json";
import posterT from "@/assets/video/home/next/hero-poster-tall.webp.asset.json";

export type HeroScene = { id: string; wide: string; tall?: string };

export const HERO_POSTER = posterW.url;
export const HERO_POSTER_TALL = posterT.url;
export const HERO_SCENES: HeroScene[] = [
  { id: "curiosity", wide: curiosityW.url, tall: curiosityT.url },
  { id: "imagination", wide: imaginationW.url, tall: imaginationT.url },
  { id: "creation", wide: creationW.url, tall: creationT.url },
  { id: "impact", wide: impactW.url, tall: impactT.url },
  { id: "discovery", wide: discoveryW.url, tall: discoveryT.url },
  { id: "tomorrow", wide: tomorrowW.url, tall: tomorrowT.url },
];
