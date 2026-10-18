# Shubh Buckle Industries

A one-page website for a manufacturer and wholesaler of **buckles for shoes and sandals**. It works on phones and laptops and switches between English and Hindi.

- **Catalogue:** pin, roller, slider, D-ring, ladies' fancy and kids' buckles, filterable by type. Each shows its design code, rate per piece, strap widths (mm) and available finishes.
- **Finishes and materials:** 8 plating finishes, plus zinc alloy, iron, brass and stainless steel.
- **Order calculator:** pairs of footwear × buckles per shoe + wastage, rounded up to full gross (144 pcs), with an approximate cost.
- **Custom designs:** the process from design to dispatch, logo engraving, colour matching and labelled packing.
- **Quote enquiry with no sign-up:** buyers choose a buckle, width, finish and quantity (gross or pieces), and WhatsApp opens with the message already written.
- **Contact:** factory address with a landmark, live open/closed hours, GSTIN, payment terms (UPI, NEFT/RTGS, cheque) and dispatch options.

## Editing

Everything is in `index.html`. Near the top of the `<script>` you'll find:

- `WHATSAPP`: the WhatsApp number (country code + number, no spaces)
- `items`: design code, name (English, Hindi), type, strap widths, finishes, rate per piece
- `FIN`: finish names
- `hours`: Monday to Sunday in 24-hour time (`null` = closed)
- `HI`: the Hindi translations

The business name, address, phone, email and GSTIN are written in the HTML.

> The business name, address, phone, GSTIN, designs, rates and minimum order are placeholders. Replace them before going live.

## Publishing

Turn on **Settings → Pages → Deploy from branch → `main` / root**, or import the repo into Netlify or Vercel. There's no build step.
