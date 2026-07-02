# Site images

Drop image files here — they are picked up automatically, no code or database
changes needed. Until a file exists, the site shows a styled placeholder.

## Hero background

- File: `public/hero.jpg` (also accepts `.png`, `.webp`, `.avif`)
- Used full-bleed behind the homepage headline, with a dark scrim on top for
  text legibility.
- Recommended: landscape, ~2000×1200 px or larger, subject slightly right of
  centre (the headline sits bottom-left).

## Barber portraits

- Folder: `public/barbers/`
- Filename = the barber's **English name**, lowercased, spaces → dashes:
  - Seney → `public/barbers/seney.jpg`
  - Andrey → `public/barbers/andrey.jpg`
- Accepts `.jpg`, `.png`, `.webp`, `.avif`.
- Recommended: portrait, **3:4** ratio (e.g. 900×1200 px). Images are
  centre-cropped to fill the card.
- Alternatively, set a photo URL (or `/barbers/…` path) per barber in the admin
  panel under **Barbers → edit → Photo URL**.
