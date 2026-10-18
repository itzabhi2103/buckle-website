// Shared storage helpers. The catalogue and shop details live in Vercel Blob
// (connected to this project, so BLOB_READ_WRITE_TOKEN is set automatically).
const crypto = require("crypto");
const { put, head, list, del, BlobNotFoundError } = require("@vercel/blob");
const seedProducts = require("../products.json");

const CATALOG_PREFIX = "data/catalog-";
const AUTH_PREFIX = "private/auth-";

const DEFAULT_SETTINGS = {
  whatsapp: "91957271XXXX",
  phone: "+91 95727 1XXXX",
  email: "sales@okshoe.in",
  address: "Plot No. 24, Industrial Area, Your City – 000000",
  landmark: "",
  mapsUrl: "https://maps.google.com/",
  // Monday..Sunday, "HH:MM" 24-hour, or null when closed
  hours: [["09:30", "19:00"], ["09:30", "19:00"], ["09:30", "19:00"], ["09:30", "19:00"], ["09:30", "19:00"], ["09:30", "19:00"], null],
};

function seedCatalog() {
  return {
    products: seedProducts.map(p => ({ ...p, id: p.code, price: null, inStock: true })),
    settings: { ...DEFAULT_SETTINGS },
  };
}

// Each save writes a new file (data/catalog-<time>-<random>.json), so a read can never
// get a cached older copy. The newest file is the live catalogue; old ones are cleaned up.
const LEGACY = "data/catalog.json";

async function catalogVersions() {
  const { blobs } = await list({ prefix: CATALOG_PREFIX, limit: 1000 });
  return blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

async function readCatalog() {
  const versions = await catalogVersions();
  let url = versions.length ? versions[0].url : null;
  if (!url) {
    try { const m = await head(LEGACY); url = m.url + "?v=" + new Date(m.uploadedAt).getTime(); }
    catch (e) { if (e instanceof BlobNotFoundError) return seedCatalog(); throw e; }
  }
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("Couldn't read the catalogue (" + r.status + ")");
  const data = await r.json();
  return { products: data.products || [], settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) } };
}

async function writeCatalog(catalog) {
  await put(`${CATALOG_PREFIX}${Date.now()}.json`, JSON.stringify(catalog), {
    access: "public", addRandomSuffix: true, contentType: "application/json", cacheControlMaxAge: 31536000,
  });
  // keep the 5 newest versions as a safety net, delete the rest
  const old = (await catalogVersions()).slice(5).map(b => b.url);
  try { if (old.length) await del(old); await del(LEGACY).catch(() => {}); } catch (e) { /* cleanup can wait */ }
}

async function saveImage(code, base64) {
  const buf = Buffer.from(base64, "base64");
  const blob = await put(`images/${code.toLowerCase()}.jpg`, buf, {
    access: "public", addRandomSuffix: true, contentType: "image/jpeg",
  });
  return blob.url;
}

// Delete a photo we uploaded earlier (photos bundled with the site are left alone)
async function deleteImage(url) {
  if (typeof url === "string" && url.includes(".blob.vercel-storage.com/")) {
    try { await del(url); } catch (e) { /* already gone */ }
  }
}

// ---- Password: starts as ADMIN_PASSWORD, the owner can change it from the admin page ----
const hash = (password, salt) => crypto.scryptSync(password, salt, 32).toString("hex");

async function readAuth() {
  const { blobs } = await list({ prefix: AUTH_PREFIX });
  if (!blobs.length) return null;
  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const r = await fetch(blobs[0].url + "?v=" + Date.now(), { cache: "no-store" });
  return r.ok ? { ...(await r.json()), blobs } : null;
}

async function checkPassword(given) {
  if (typeof given !== "string" || !given) return false;
  const auth = await readAuth();
  if (auth && auth.salt && auth.hash) {
    return crypto.timingSafeEqual(Buffer.from(hash(given, auth.salt), "hex"), Buffer.from(auth.hash, "hex"));
  }
  const want = process.env.ADMIN_PASSWORD || "";
  if (!want) return false;
  const h = s => crypto.createHash("sha256").update(s).digest();
  return crypto.timingSafeEqual(h(given), h(want));
}

async function setPassword(newPassword) {
  const old = await readAuth();
  const salt = crypto.randomBytes(16).toString("hex");
  // random suffix keeps this file's address unguessable
  await put(AUTH_PREFIX + "v1.json", JSON.stringify({ salt, hash: hash(newPassword, salt) }), {
    access: "public", addRandomSuffix: true, contentType: "application/json", cacheControlMaxAge: 60,
  });
  if (old) await del(old.blobs.map(b => b.url));
}

module.exports = { readCatalog, writeCatalog, saveImage, deleteImage, checkPassword, setPassword };
