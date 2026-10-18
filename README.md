# OKSHOE Material

A one-page website for a manufacturer and wholesaler of **buckles for shoes and sandals**. It works on phones and laptops and switches between English and Hindi.

- **Catalogue:** 24 real product photos in 6 groups (shoe, sandal, plastic, decorative, ring & loop, special design), each with its code (e.g. SBM-001), size and finish. Photos are in `images/`, cropped from the OKSHOE catalogue.
- **Finishes:** gold, silver, black, rose gold (plastic: black, clear, white).
- **Application:** men's formal shoes, women's sandals, casual & sports footwear.
- **Order calculator:** pairs of footwear × buckles per shoe + wastage, rounded up to full gross (144 pcs), with an approximate cost.
- **Quote enquiry with no sign-up:** buyers choose a buckle, width, finish and quantity (gross or pieces), and WhatsApp opens with the message already written.
- **Contact:** factory address with a landmark, live open/closed hours, GSTIN, payment terms (UPI, NEFT/RTGS, cheque) and dispatch options.

## Admin page (no coding)

Open **https://okshoe-material.vercel.app/admin.html** and log in with the admin password.

- **Buckles:** add a buckle with a photo, edit any buckle (name, size, finish, price, photo), change prices and stock straight from the list, reorder, or remove.
- **Shop details:** WhatsApp number, phone, email, address, landmark, Google Maps link and opening hours.
- **Password:** change the admin password.

Changes show on the website within about a minute.

### How it works

- `admin.html` talks to `api/admin.js` (a Vercel serverless function) which checks the password.
- The catalogue, shop details and uploaded photos are stored in **Vercel Blob** (store `okshoe-catalog`, connected to the project). No GitHub key or database setup is needed.
- `api/catalog.js` serves the catalogue to the public site. Before the first save it falls back to `products.json`.
- The first password is the `ADMIN_PASSWORD` environment variable in Vercel. Once the owner changes it in the admin page, the new one is stored (hashed) in Blob.

## Editing by hand

`products.json` is only the starting catalogue; live data is edited through the admin page. The page itself is `index.html`. Near the top of its `<script>` you'll find:

- `WHATSAPP`: the WhatsApp number (country code + number, no spaces)
- `FIN` / `GROUPS`: finish and group names
- `hours`: Monday to Sunday in 24-hour time (`null` = closed)
- `HI`: the Hindi translations

The address, phone and email are written in the HTML.

> The address, phone/WhatsApp, email and opening hours are still placeholders. Replace them before going live.

**Live site:** https://okshoe-material.vercel.app (Vercel, deploys automatically on every push to `main`, including changes made through the admin page)

## Publishing

Turn on **Settings → Pages → Deploy from branch → `main` / root**, or import the repo into Netlify or Vercel. There's no build step.
