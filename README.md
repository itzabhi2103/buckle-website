# Stride & Sole Footwear

A one-page website for a family shoe store in India. It works on phones and laptops and switches between English and Hindi.

- **Stock enquiry with no sign-up:** customers choose a shoe and size, and WhatsApp opens with the message already written.
- **Size finder:** converts foot length in cm to UK/India, EU and US sizes for men, women and kids.
- **Indian categories:** sports shoes, formal shoes, juttis, mojaris, Kolhapuris, chappals and school shoes.
- **Shop details:** opening hours with a live "Open now" badge, UPI payment options, and an address with a landmark and a Google Maps link.

## Editing

Everything is in `index.html`. Near the top of the `<script>` you'll find:

- `WHATSAPP`: the shop's WhatsApp number (country code + number, no spaces), e.g. `919876543210`
- `products`: name, style number, price, MRP, sizes, and sold-out sizes
- `hours`: opening hours for Monday to Sunday in 24-hour time (`null` = closed)
- `HI`: the Hindi translations

The shop name, address, phone and email are written in the HTML itself.

> The shop name, address, phone number, products and prices are placeholders. Replace them before going live.

## Publishing

Turn on **Settings → Pages → Deploy from branch → `main` / root**. You can also import the repo into Netlify or Vercel. There's no build step.
