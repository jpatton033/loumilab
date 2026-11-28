// Orders hero film "The Business Behind the Business": one ordered scene list.
// kind "film" = footage (clip when available, otherwise still); "storefront"/"order" = coded demo screens over `backdrop`.
import dedication from "@/assets/video/orders/orders-hero-dedication.webp.asset.json";
import dedicationT from "@/assets/video/orders/orders-hero-dedication-tall.webp.asset.json";
import craft from "@/assets/video/orders/orders-hero-craft.webp.asset.json";
import craftT from "@/assets/video/orders/orders-hero-craft-tall.webp.asset.json";
import challenge from "@/assets/video/orders/orders-hero-challenge.webp.asset.json";
import challengeT from "@/assets/video/orders/orders-hero-challenge-tall.webp.asset.json";
import impact from "@/assets/video/orders/orders-hero-impact.webp.asset.json";
import impactT from "@/assets/video/orders/orders-hero-impact-tall.webp.asset.json";

import dedicationV from "@/assets/video/orders/orders-hero-dedication.mp4.asset.json";
import dedicationVT from "@/assets/video/orders/orders-hero-dedication-tall.mp4.asset.json";
import craftV from "@/assets/video/orders/orders-hero-craft.mp4.asset.json";
import craftVT from "@/assets/video/orders/orders-hero-craft-tall.mp4.asset.json";
import challengeV from "@/assets/video/orders/orders-hero-challenge.mp4.asset.json";
import challengeVT from "@/assets/video/orders/orders-hero-challenge-tall.mp4.asset.json";
import impactV from "@/assets/video/orders/orders-hero-impact.mp4.asset.json";
import impactVT from "@/assets/video/orders/orders-hero-impact-tall.mp4.asset.json";

export type OrdersHeroScene = {
  id: "dedication" | "craft" | "challenge" | "connection" | "simplicity" | "impact";
  kind: "film" | "storefront" | "order";
  still: string; stillTall: string;
  clip?: string; clipTall?: string;
};

export const ORDERS_SCENE_SECONDS = 5;

export const ORDERS_HERO_SCENES: OrdersHeroScene[] = [
  { id: "dedication", kind: "film", still: dedication.url, stillTall: dedicationT.url, clip: dedicationV.url, clipTall: dedicationVT.url },
  { id: "craft", kind: "film", still: craft.url, stillTall: craftT.url, clip: craftV.url, clipTall: craftVT.url },
  { id: "challenge", kind: "film", still: challenge.url, stillTall: challengeT.url, clip: challengeV.url, clipTall: challengeVT.url },
  { id: "connection", kind: "storefront", still: craft.url, stillTall: craftT.url },
  { id: "simplicity", kind: "order", still: challenge.url, stillTall: challengeT.url },
  { id: "impact", kind: "film", still: impact.url, stillTall: impactT.url, clip: impactV.url, clipTall: impactVT.url },
];

export const ORDERS_HERO_POSTER = { wide: dedication.url, tall: dedicationT.url };

/** Isolated demo data shown in the hero; never sent anywhere. */
export const DEMO_ORDER = { number: "1042", item: "Celebration Cake", total: "$48.00", payment: "Paid", pickup: "Saturday, 10:00 AM", status: "New" } as const;
