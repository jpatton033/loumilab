# Show full article preview images in "Ideas worth reading"

The homepage "Ideas worth reading" cards crop article images: the small side cards use a near-square 96x80 box and the featured card a 16:10 box, both filling with crop.

## Changes (src/pages/Index.tsx only)
- Featured card: keep the wide frame but show the whole image (fit inside, no crop) on the dark card background.
- Small cards: change the thumbnail box to a wide 16:9 shape (about 128x72, slightly larger) and show the whole image without cropping.
- Keep the grayscale-to-color hover, rounded corners and layout as is.

## Check
Open the homepage at desktop and phone size and confirm each preview image is fully visible.
