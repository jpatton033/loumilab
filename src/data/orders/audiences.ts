import audFood from "@/assets/orders/aud-food.jpg";
import audPopup from "@/assets/orders/aud-popup.jpg";
import audCreator from "@/assets/orders/aud-creator.jpg";
import audLocal from "@/assets/orders/aud-local.jpg";
import audService from "@/assets/orders/aud-service.jpg";
import audSide from "@/assets/orders/aud-side.jpg";

export interface Audience {
  id: string;
  title: string;
  desc: string;
  image: string;
}

export const audiences: Audience[] = [
  { id: "food", title: "Food Sellers", desc: "Plate sales, meal prep, home chefs, bakeries, caterers.", image: audFood },
  { id: "popups", title: "Pop-Ups", desc: "Temporary shops, events, farmers markets, and vendor markets.", image: audPopup },
  { id: "creators", title: "Creators", desc: "Merchandise and limited product drops.", image: audCreator },
  { id: "local", title: "Local Businesses", desc: "Simple ordering without complicated e-commerce infrastructure.", image: audLocal },
  { id: "service", title: "Service Businesses", desc: "Accept bookings, deposits, or service orders where applicable.", image: audService },
  { id: "side", title: "Side Hustles", desc: "Turn social followers into paying customers.", image: audSide },
];
