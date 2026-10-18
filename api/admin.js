// Admin actions for the owner. Every request carries the admin password.
const { readCatalog, writeCatalog, saveImage, deleteImage, checkPassword, setPassword } = require("./_store");

const GROUPS = ["shoe", "sandal", "plastic", "deco", "ring", "special"];
const FINISHES = ["gold", "silver", "black", "rose", "clear", "white"];
const fail = (res, status, error) => res.status(status).json({ error });
const text = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const isPhoto = s => typeof s === "string" && s.length > 100 && s.length < 3_000_000 && /^[A-Za-z0-9+/]+=*$/.test(s);
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Check and tidy one product from the form; returns [product, error]
function cleanProduct(p) {
  const code = text(p.code, 12).toUpperCase();
  const name = text(p.name, 80);
  const size = parseInt(p.size, 10);
  const price = p.price === "" || p.price == null ? null : Math.round(Number(p.price) * 100) / 100;
  if (!/^[A-Z]{1,5}-\d{1,4}$/.test(code)) return [null, "Design code should look like SBM-005."];
  if (!GROUPS.includes(p.group)) return [null, "Choose a category."];
  if (!FINISHES.includes(p.finish)) return [null, "Choose a finish."];
  if (!name) return [null, "Type a name for the buckle in English."];
  if (!(size > 0 && size < 200)) return [null, "Enter the size in mm."];
  if (price !== null && !(price >= 0 && price < 100000)) return [null, "Enter the price as a number, like 2.50, or leave it empty."];
  return [{ code, group: p.group, name, name_hi: text(p.name_hi, 80) || name, size, finish: p.finish, price, inStock: p.inStock !== false }, null];
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return fail(res, 405, "Use POST.");
  const b = req.body || {};

  try {
    if (!(await checkPassword(b.password))) {
      await new Promise(r => setTimeout(r, 1000)); // slow down password guessing
      return fail(res, 401, "Wrong password.");
    }
    const cat = await readCatalog();
    const done = async () => { await writeCatalog(cat); return res.json(cat); };

    switch (b.action) {
      case "list":
        return res.json(cat);

      case "add": {
        const [p, err] = cleanProduct(b.product || {});
        if (err) return fail(res, 400, err);
        if (cat.products.some(x => x.code === p.code)) return fail(res, 409, `${p.code} is already on the website. Use a different code.`);
        if (!isPhoto(b.image)) return fail(res, 400, "Choose a photo of the buckle.");
        p.id = p.code + "-" + Date.now().toString(36);
        p.image = await saveImage(p.code, b.image);
        cat.products.push(p);
        return done();
      }

      case "update": {
        const i = cat.products.findIndex(x => x.id === b.id);
        if (i < 0) return fail(res, 404, "That buckle isn't on the website any more. Reload the page.");
        const [p, err] = cleanProduct(b.product || {});
        if (err) return fail(res, 400, err);
        if (cat.products.some((x, j) => j !== i && x.code === p.code)) return fail(res, 409, `${p.code} is already used by another buckle.`);
        p.id = cat.products[i].id;
        p.image = cat.products[i].image;
        if (b.image) {
          if (!isPhoto(b.image)) return fail(res, 400, "That photo couldn't be used. Choose a JPG or PNG.");
          const old = p.image;
          p.image = await saveImage(p.code, b.image);
          await deleteImage(old);
        }
        cat.products[i] = p;
        return done();
      }

      case "prices": { // quick edits from the list: [{id, price, inStock}]
        for (const ch of Array.isArray(b.changes) ? b.changes : []) {
          const p = cat.products.find(x => x.id === ch.id);
          if (!p) continue;
          if ("price" in ch) {
            const v = ch.price === "" || ch.price == null ? null : Math.round(Number(ch.price) * 100) / 100;
            if (v !== null && !(v >= 0 && v < 100000)) return fail(res, 400, `Price for ${p.code} should be a number, like 2.50.`);
            p.price = v;
          }
          if ("inStock" in ch) p.inStock = !!ch.inStock;
        }
        return done();
      }

      case "remove": {
        const p = cat.products.find(x => x.id === b.id);
        if (!p) return res.json(cat);
        cat.products = cat.products.filter(x => x.id !== b.id);
        await writeCatalog(cat);
        await deleteImage(p.image);
        return res.json(cat);
      }

      case "move": { // reorder within the catalogue: dir -1 (up) or 1 (down)
        const i = cat.products.findIndex(x => x.id === b.id), j = i + (b.dir < 0 ? -1 : 1);
        if (i < 0 || j < 0 || j >= cat.products.length) return res.json(cat);
        [cat.products[i], cat.products[j]] = [cat.products[j], cat.products[i]];
        return done();
      }

      case "settings": {
        const s = b.settings || {};
        const whatsapp = text(s.whatsapp, 20).replace(/\D/g, "");
        if (whatsapp.length < 10) return fail(res, 400, "WhatsApp number should have at least 10 digits, with 91 in front, like 919572712345.");
        const hours = Array.isArray(s.hours) && s.hours.length === 7 ? s.hours.map(d => (Array.isArray(d) && TIME.test(d[0]) && TIME.test(d[1]) ? [d[0], d[1]] : null)) : cat.settings.hours;
        const mapsUrl = text(s.mapsUrl, 500);
        cat.settings = {
          whatsapp,
          phone: text(s.phone, 30),
          email: text(s.email, 100),
          address: text(s.address, 200),
          landmark: text(s.landmark, 150),
          mapsUrl: /^https:\/\//.test(mapsUrl) ? mapsUrl : "https://maps.google.com/",
          hours,
        };
        return done();
      }

      case "password": {
        const np = String(b.newPassword || "");
        if (np.length < 6) return fail(res, 400, "The new password needs at least 6 characters.");
        await setPassword(np);
        return res.json({ ok: true });
      }

      default:
        return fail(res, 400, "Unknown action.");
    }
  } catch (e) {
    console.error(e);
    return fail(res, 502, "Saving failed. Check your internet and try again in a minute.");
  }
};
