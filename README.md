# OKSHOE Material

A one-page website for a manufacturer and wholesaler of **buckles for shoes and sandals**. It works on phones and laptops and switches between English and Hindi.

- **Catalogue:** 24 real product photos in 6 groups (shoe, sandal, plastic, decorative, ring & loop, special design), each with its code (e.g. SBM-001), size and finish. Photos are in `images/`, cropped from the OKSHOE catalogue.
- **Finishes:** gold, silver, black, rose gold (plastic: black, clear, white).
- **Application:** men's formal shoes, women's sandals, casual & sports footwear.
- **Order calculator:** pairs of footwear × buckles per shoe + wastage, rounded up to full gross (144 pcs), with an approximate cost.
- **Quote enquiry with no sign-up:** buyers choose a buckle, width, finish and quantity (gross or pieces), and WhatsApp opens with the message already written.
- **Contact:** factory address with a landmark, live open/closed hours, GSTIN, payment terms (UPI, NEFT/RTGS, cheque) and dispatch options.

## Editing

Everything is in `index.html`. Near the top of the `<script>` you'll find:

- `WHATSAPP`: the WhatsApp number (country code + number, no spaces)
- `items`: code, group, name (English, Hindi), size in mm, finish. The photo file is `images/<code>.jpg`
- `FIN` / `GROUPS`: finish and group names
- `hours`: Monday to Sunday in 24-hour time (`null` = closed)
- `HI`: the Hindi translations

The address, phone and email are written in the HTML.

> The address, phone/WhatsApp, email and opening hours are still placeholders. Replace them before going live.

## Publishing

Turn on **Settings → Pages → Deploy from branch → `main` / root**, or import the repo into Netlify or Vercel. There's no build step.
