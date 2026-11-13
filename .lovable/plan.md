# Spaces Library: four software demos

Replace the four example projects in the "Library · Studio workspace" panel on the Spaces homepage (chapter 07) with real software applications.

## New cards
| Name | Category | Description | Preview look |
|---|---|---|---|
| Analytics Dashboard | Analytics | Track business performance, visualize key metrics, and monitor trends. | KPI row, line and bar charts, date filter; charcoal, steel blue, subtle teal |
| Project Tracker | Productivity | Manage projects, organize tasks, assign responsibilities, and monitor progress. | Kanban columns, priority tags, status chips; restrained accents |
| Booking Manager | Scheduling | Manage appointments, availability, customer bookings, and schedules. | Weekly calendar, booking detail panel, availability marks; charcoal, muted forest green |
| Inventory Manager | Operations | Track inventory levels, monitor stock movement, and manage product records. | Product table, stock bars, summary tiles, activity list; neutrals, subtle amber |

Each card shows its image (4:3), name, category and description, plus a small "Demo" label. A short line under the panel reads "Demonstration applications." No version numbers, "Live" status, usage figures or links.

## Images
Four AI-made app screens: flat interfaces with no devices, people, logos or watermarks, and minimal gradients, readable at card size. They use the Spaces deep black and charcoal look, with each app's accent color.

## Kept as is
The panel's layout, its four columns on desktop and two on phone, the rest of the page, navigation and permissions. The signed-in Library dashboard is not touched; it only shows a workspace's real apps.

## Technical details
- Generate `src/assets/spaces/library-{analytics,projects,booking,inventory}.jpg` at 1536x1152, premium quality for legible UI text.
- In `src/pages/spaces/Home.tsx`, replace the inline array and gradient boxes with a typed `demos` array and `<img>` (aspect-[4/3], object-cover, lazy, alt text).
